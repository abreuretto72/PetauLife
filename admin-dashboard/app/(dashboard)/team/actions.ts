'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { AdminRole } from '@/lib/types';

interface InviteResult {
  ok: boolean;
  error?: string;
  accept_url?: string;
  emailed?: boolean;
}

interface CreateDirectResult {
  ok: boolean;
  error?: string;
  user_id?: string;
  email?: string;
  role?: AdminRole;
  full_name?: string;
}

/** Convida nova pessoa pro painel via EF admin-team-invite. */
export async function inviteAdmin(opts: {
  email: string;
  role: AdminRole;
}): Promise<InviteResult> {
  if (!opts.email?.trim()) return { ok: false, error: 'email obrigatório' };
  if (!opts.role) return { ok: false, error: 'role obrigatório' };

  const supabase = await createSupabaseServerClient();
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) return { ok: false, error: 'sem sessão' };

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/admin-team-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email: opts.email.trim().toLowerCase(), role: opts.role }),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) return { ok: false, error: json.error ?? `HTTP ${resp.status}` };

    revalidatePath('/team');
    return {
      ok: true,
      accept_url: json.accept_url,
      emailed:    json.emailed ?? false,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Cria membro do painel direto, com senha temporária — sem fluxo de convite.
 * Super-admin entrega a credencial pessoalmente; usuário troca a senha depois.
 * Backed por EF admin-team-create.
 */
export async function createAdminDirect(opts: {
  email: string;
  password: string;
  full_name?: string;
  role: AdminRole;
}): Promise<CreateDirectResult> {
  if (!opts.email?.trim())    return { ok: false, error: 'e-mail obrigatório' };
  if (!opts.password)         return { ok: false, error: 'senha obrigatória' };
  if (opts.password.length < 8) return { ok: false, error: 'senha mínima de 8 caracteres' };
  if (!opts.role)             return { ok: false, error: 'perfil obrigatório' };

  const supabase = await createSupabaseServerClient();
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) return { ok: false, error: 'sem sessão' };

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/admin-team-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email:     opts.email.trim().toLowerCase(),
        password:  opts.password,
        full_name: opts.full_name?.trim() || undefined,
        role:      opts.role,
      }),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return {
        ok: false,
        error: json.details || json.error || `HTTP ${resp.status}`,
      };
    }

    revalidatePath('/team');
    return {
      ok:        true,
      user_id:   json.user_id,
      email:     json.email,
      role:      json.role,
      full_name: json.full_name,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function changeRole(targetUserId: string, newRole: AdminRole) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('update_admin_role', {
    p_target_user_id: targetUserId,
    p_new_role: newRole,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/team');
  return { ok: true };
}

export async function revokeAdminAccess(targetUserId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('revoke_admin_access', {
    p_target_user_id: targetUserId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/team');
  return { ok: true };
}

export async function revokeInvite(inviteId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('revoke_admin_invite', {
    p_invite_id: inviteId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/team');
  return { ok: true };
}
