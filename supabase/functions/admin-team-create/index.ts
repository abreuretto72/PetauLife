/**
 * admin-team-create — super-admin cria membro com email + senha temporária.
 *
 * Diferente de admin-team-invite: NÃO gera token, NÃO envia email.
 * O super-admin entrega a credencial direto pra pessoa, que troca a senha
 * depois (via "Esqueci minha senha" ou tela de perfil).
 *
 * POST body: { email: string, password: string, full_name?: string, role: AdminRole }
 * Auth: Bearer JWT obrigatório, role='admin' (super-admin)
 *
 * Resp:
 *   {
 *     ok: true,
 *     user_id: uuid,
 *     email: string,
 *     role: AdminRole,
 *     full_name: string,
 *     must_change_password: true        // dica pra UI mostrar aviso
 *   }
 *
 * Erros:
 *   401 sem JWT / JWT inválido
 *   403 caller não é super-admin
 *   400 email/senha/role inválidos
 *   409 usuário com este email já existe (ativo) ou tem convite pendente
 *   500 falha ao criar no auth ou atualizar public.users
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_ROLES = new Set(['admin', 'admin_financial', 'admin_support']);
const MIN_PASSWORD_LEN = 8;

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/** Política mínima — só 8 caracteres. Sem exigência de maiúscula/número/especial. */
function validatePassword(pwd: string): { ok: boolean; reason?: string } {
  if (typeof pwd !== 'string' || pwd.length < MIN_PASSWORD_LEN) {
    return { ok: false, reason: `senha precisa ter no mínimo ${MIN_PASSWORD_LEN} caracteres` };
  }
  return { ok: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST')   return jsonResp({ error: 'method not allowed' }, 405);

  try {
    // ── Auth ───────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return jsonResp({ error: 'unauthorized' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user } } = await anon.auth.getUser(token);
    if (!user) return jsonResp({ error: 'unauthorized' }, 401);

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: caller } = await sb
      .from('users')
      .select('id, role, is_active, email')
      .eq('id', user.id)
      .single();
    if (!caller || caller.role !== 'admin' || !caller.is_active) {
      return jsonResp({ error: 'forbidden — super-admin only' }, 403);
    }

    // ── Body ──────────────────────────────────────────────────────────────
    const body     = await req.json().catch(() => ({}));
    const email    = (body.email ?? '').toString().trim().toLowerCase();
    const password = (body.password ?? '').toString();
    const fullName = (body.full_name ?? '').toString().trim();
    const role     = (body.role ?? '').toString();

    if (!email || !email.includes('@')) return jsonResp({ error: 'invalid email' }, 400);
    if (!VALID_ROLES.has(role))         return jsonResp({ error: 'invalid role' }, 400);

    const pwd = validatePassword(password);
    if (!pwd.ok) return jsonResp({ error: 'invalid password', details: pwd.reason }, 400);

    // ── Idempotência: já existe alguém com esse email? ───────────────────
    const { data: existingUser } = await sb
      .from('users')
      .select('id, email, role, is_active')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      // Usuário existente — caminho diferente (ele já tem conta, só falta role).
      // Pra evitar surpresa, recusamos e instruímos a usar o fluxo de elevação.
      return jsonResp({
        error: 'user already exists',
        details: existingUser.role === 'tutor_owner'
          ? 'Esse e-mail já tem conta de tutor. Use o convite (admin-team-invite) para promover.'
          : `Já existe admin com este e-mail (role atual: ${existingUser.role}).`,
        existing_user_id: existingUser.id,
        existing_role:    existingUser.role,
      }, 409);
    }

    const { data: pendingInvite } = await sb
      .from('admin_invites')
      .select('id')
      .eq('email', email)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (pendingInvite) {
      return jsonResp({
        error: 'pending invite already exists for this email',
        invite_id: pendingInvite.id,
        details:   'Já existe convite pendente. Cancele-o antes de criar com senha direta.',
      }, 409);
    }

    // ── Cria no auth.users com email já confirmado ───────────────────────
    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,                  // pula confirmação por email
      user_metadata: {
        full_name: fullName || email.split('@')[0],
        created_via:           'admin-team-create',
        password_set_by_admin: true,        // hint pra UI sugerir troca
        invited_by:            caller.id,
      },
    });
    if (createErr || !created.user) {
      console.error('[admin-team-create] createUser failed:', createErr);
      return jsonResp({
        error:   'failed to create auth account',
        details: createErr?.message,
      }, 500);
    }

    const newUserId = created.user.id;

    // ── Atualiza public.users — trigger trg_on_auth_user_created já criou
    //    a linha com role default 'tutor_owner'. Sobrescrevemos com role admin.
    const { error: updErr } = await sb
      .from('users')
      .update({
        role,
        full_name: fullName || email.split('@')[0],
        is_active: true,
      })
      .eq('id', newUserId);

    if (updErr) {
      console.error('[admin-team-create] users update failed:', updErr);
      // Tenta rollback do auth pra não deixar lixo
      await sb.auth.admin.deleteUser(newUserId).catch((e) =>
        console.warn('[admin-team-create] rollback deleteUser failed:', e),
      );
      return jsonResp({
        error:   'failed to assign role',
        details: updErr.message,
      }, 500);
    }

    console.log(`[admin-team-create] user ${newUserId} (${email}) created as ${role} by ${caller.email}`);

    return jsonResp({
      ok:                   true,
      user_id:              newUserId,
      email,
      role,
      full_name:            fullName || email.split('@')[0],
      must_change_password: true,
    });
  } catch (err) {
    console.error('[admin-team-create] unhandled error:', err);
    return jsonResp({ error: 'internal error', message: String(err) }, 500);
  }
});
