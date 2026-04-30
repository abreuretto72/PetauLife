'use client';

import { useState, useTransition } from 'react';
import { Trash2, UserPlus, Copy, Check, X, Eye, EyeOff } from 'lucide-react';
import { ADMIN_ROLE_LABELS, type AdminRole, type AdminTeamMember, type AdminInviteRow } from '@/lib/types';
import { fmtDate } from '@/lib/utils';
import { createAdminDirect, changeRole, revokeAdminAccess, revokeInvite } from './actions';

interface Props {
  members: AdminTeamMember[];
  pendingInvites: AdminInviteRow[];
}

interface DirectResult {
  email: string;
  password: string;     // mantido em memória só pra exibir uma vez ao super-admin
  full_name: string;
  role: AdminRole;
}

export function TeamManager({ members, pendingInvites }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [result, setResult] = useState<DirectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AdminRole>('admin_support');

  function resetForm() {
    setEmail('');
    setPassword('');
    setFullName('');
    setShowPassword(false);
  }

  function closeForm() {
    setShowForm(false);
    setError(null);
    setResult(null);
    resetForm();
  }

  function handleCreate() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const r = await createAdminDirect({
        email:     email.trim(),
        password,
        full_name: fullName.trim() || undefined,
        role,
      });
      if (!r.ok) {
        setError(r.error ?? 'Erro desconhecido');
        return;
      }
      setResult({
        email:     r.email!,
        password,
        full_name: r.full_name ?? '',
        role:      r.role!,
      });
      resetForm();
    });
  }

  /** Sugere uma senha aleatória de 10 chars (alfanumérica, sem regra rígida). */
  function suggestPassword() {
    const all = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += all[Math.floor(Math.random() * all.length)];
    setPassword(pwd);
    setShowPassword(true);
  }

  function handleChangeRole(userId: string, newRole: AdminRole) {
    startTransition(async () => {
      const r = await changeRole(userId, newRole);
      if (!r.ok) alert(r.error ?? 'Erro ao alterar perfil');
    });
  }

  function handleRevoke(userId: string, label: string) {
    if (!confirm(`Revogar acesso de ${label}? A pessoa vira tutor comum.`)) return;
    startTransition(async () => {
      const r = await revokeAdminAccess(userId);
      if (!r.ok) alert(r.error ?? 'Erro ao revogar');
    });
  }

  function handleRevokeInvite(inviteId: string, email: string) {
    if (!confirm(`Cancelar convite para ${email}?`)) return;
    startTransition(async () => {
      const r = await revokeInvite(inviteId);
      if (!r.ok) alert(r.error ?? 'Erro ao cancelar');
    });
  }

  return (
    <>
      {/* Form de criação direta */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-ametista text-xs uppercase tracking-wider font-medium">
            Membros ativos ({members.length})
          </h2>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setResult(null); setError(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-jade/10 border border-jade/30 text-jade rounded-lg text-sm font-medium hover:bg-jade/20 transition"
            >
              <UserPlus size={16} strokeWidth={2} />
              Adicionar pessoa
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-bg-card border border-jade/30 rounded-xl p-5 mb-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-jade text-sm font-medium">Adicionar pessoa</h3>
              <button
                onClick={closeForm}
                className="text-text-muted hover:text-text"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-text-muted text-xs uppercase tracking-wider font-medium block mb-1.5">
                  E-mail *
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="pessoa@empresa.com"
                  className="input"
                  disabled={pending}
                />
              </label>
              <label className="block">
                <span className="text-text-muted text-xs uppercase tracking-wider font-medium block mb-1.5">
                  Nome (opcional)
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Maria da Silva"
                  className="input"
                  disabled={pending}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-text-muted text-xs uppercase tracking-wider font-medium flex items-center justify-between mb-1.5">
                  <span>Senha *</span>
                  <button
                    type="button"
                    onClick={suggestPassword}
                    disabled={pending}
                    className="text-jade hover:text-jade/80 text-[10px] font-mono lowercase"
                  >
                    gerar
                  </button>
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="input pr-10"
                    disabled={pending}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="text-text-muted text-xs uppercase tracking-wider font-medium block mb-1.5">
                  Perfil *
                </span>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as AdminRole)}
                  className="input"
                  disabled={pending}
                >
                  <option value="admin_support">{ADMIN_ROLE_LABELS.admin_support}</option>
                  <option value="admin_financial">{ADMIN_ROLE_LABELS.admin_financial}</option>
                  <option value="admin">{ADMIN_ROLE_LABELS.admin}</option>
                </select>
              </label>
            </div>

            <div className="text-text-dim text-xs italic">
              A pessoa entra com essa senha e pode trocá-la depois pelo perfil ou
              por &quot;Esqueci minha senha&quot;.
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <button
                onClick={closeForm}
                disabled={pending}
                className="px-4 py-2 text-sm text-text-muted hover:text-text rounded-lg disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={pending || !email.trim() || password.length < 8}
                className="flex items-center gap-2 px-4 py-2 bg-jade text-bg-deep rounded-lg text-sm font-medium hover:bg-jade/80 disabled:opacity-40"
              >
                <UserPlus size={16} strokeWidth={2.5} />
                {pending ? 'Criando…' : 'Criar conta'}
              </button>
            </div>

            {error && <div className="text-danger text-sm border-t border-danger/30 pt-2">{error}</div>}

            {result && (
              <div className="bg-jade/5 border border-jade/30 rounded-lg p-4 mt-3 space-y-3">
                <div className="text-jade text-sm font-medium flex items-center gap-2">
                  <Check size={16} /> Conta criada
                </div>
                <div className="text-text-muted text-xs">
                  Entregue estas credenciais à pessoa. A senha aparece apenas
                  uma vez nesta tela.
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2 bg-bg-deep border border-border rounded p-2">
                    <span className="text-text-dim text-[10px] uppercase tracking-wider w-16 shrink-0">E-mail</span>
                    <code className="text-jade text-xs font-mono truncate flex-1">{result.email}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.email)}
                      className="text-jade hover:text-jade/80"
                      title="Copiar e-mail"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-bg-deep border border-border rounded p-2">
                    <span className="text-text-dim text-[10px] uppercase tracking-wider w-16 shrink-0">Senha</span>
                    <code className="text-jade text-xs font-mono truncate flex-1">{result.password}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.password)}
                      className="text-jade hover:text-jade/80"
                      title="Copiar senha"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const block = `E-mail: ${result.email}\nSenha: ${result.password}\nPerfil: ${ADMIN_ROLE_LABELS[result.role]}\nAcesso: https://admin.auexpert.com.br`;
                    navigator.clipboard.writeText(block);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-jade/10 border border-jade/30 text-jade rounded text-xs font-medium hover:bg-jade/20"
                >
                  <Copy size={12} /> Copiar bloco completo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tabela de membros */}
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-deep text-text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left p-3 font-medium">Nome</th>
                <th className="text-left p-3 font-medium">E-mail</th>
                <th className="text-left p-3 font-medium">Perfil</th>
                <th className="text-left p-3 font-medium">Cadastrado em</th>
                <th className="text-left p-3 font-medium">Último acesso</th>
                <th className="text-right p-3 font-medium w-[180px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map(m => (
                <tr key={m.id} className="hover:bg-bg-deep/40">
                  <td className="p-3 font-medium">{m.full_name ?? '—'}</td>
                  <td className="p-3 font-mono text-xs">{m.email}</td>
                  <td className="p-3">
                    <select
                      value={m.role}
                      onChange={e => handleChangeRole(m.id, e.target.value as AdminRole)}
                      disabled={pending}
                      className="input text-xs py-1"
                    >
                      <option value="admin_support">{ADMIN_ROLE_LABELS.admin_support}</option>
                      <option value="admin_financial">{ADMIN_ROLE_LABELS.admin_financial}</option>
                      <option value="admin">{ADMIN_ROLE_LABELS.admin}</option>
                    </select>
                  </td>
                  <td className="p-3 text-text-dim text-xs">{fmtDate(m.created_at)}</td>
                  <td className="p-3 text-text-dim text-xs">
                    {m.last_login_at ? fmtDate(m.last_login_at) : 'nunca'}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleRevoke(m.id, m.full_name ?? m.email)}
                      disabled={pending}
                      className="p-2 rounded hover:bg-danger/20 text-danger transition disabled:opacity-40"
                      title="Revogar acesso (vira tutor)"
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-text-dim italic">Nenhum admin além de você ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Convites pendentes — só aparece se houver legado do fluxo de convite */}
      {pendingInvites.length > 0 && (
        <section>
          <h2 className="text-ametista text-xs uppercase tracking-wider font-medium mb-3">
            Convites pendentes ({pendingInvites.length})
          </h2>
          <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg-deep text-text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3 font-medium">E-mail</th>
                  <th className="text-left p-3 font-medium">Perfil</th>
                  <th className="text-left p-3 font-medium">Convidado por</th>
                  <th className="text-left p-3 font-medium">Convidado em</th>
                  <th className="text-left p-3 font-medium">Expira</th>
                  <th className="text-right p-3 font-medium w-[120px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingInvites.map(inv => (
                  <tr key={inv.id} className="hover:bg-bg-deep/40">
                    <td className="p-3 font-mono text-xs">{inv.email}</td>
                    <td className="p-3 text-text-muted">{ADMIN_ROLE_LABELS[inv.role]}</td>
                    <td className="p-3 text-text-dim text-xs">{inv.invited_by_email ?? '—'}</td>
                    <td className="p-3 text-text-dim text-xs">{fmtDate(inv.created_at)}</td>
                    <td className="p-3 text-text-dim text-xs">{fmtDate(inv.expires_at)}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRevokeInvite(inv.id, inv.email)}
                        disabled={pending}
                        className="p-2 rounded hover:bg-danger/20 text-danger transition disabled:opacity-40"
                        title="Cancelar convite"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
