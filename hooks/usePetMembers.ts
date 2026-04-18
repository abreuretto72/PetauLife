/**
 * usePetMembers — gerencia co-tutores de um pet.
 * useMyPetRole — retorna o papel do usuário autenticado em um pet.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

// ── Types ──────────────────────────────────────────────────────────────────────

export type MemberRole = 'owner' | 'co_parent' | 'caregiver' | 'viewer';

export interface PetMember {
  id: string;
  pet_id: string;
  user_id: string | null;
  role: MemberRole;
  nickname: string | null;
  email: string | null;
  can_see_finances: boolean;
  accepted_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  users: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
}

export interface InviteParams {
  email?: string;
  role: MemberRole;          // includes 'owner' — only existing owners can grant this
  nickname?: string;
  can_see_finances?: boolean;
  expires_days?: number;
}

// Gerar token único sem crypto (compatível com React Native)
function generateToken(): string {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

// ── usePetMembers ──────────────────────────────────────────────────────────────

export function usePetMembers(petId: string) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: members = [], isLoading, refetch } = useQuery<PetMember[]>({
    queryKey: ['pets', petId, 'members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pet_members')
        .select(`
          id, pet_id, user_id, role, nickname, email,
          can_see_finances, accepted_at, expires_at, is_active, created_at,
          users:user_id(id, full_name, avatar_url, email)
        `)
        .eq('pet_id', petId)
        .eq('is_active', true)
        .order('created_at');
      if (error) throw error;
      return (data ?? []) as unknown as PetMember[];
    },
    enabled: !!petId,
  });

  const inviteMember = async (params: InviteParams): Promise<string> => {
    const { email, role, nickname, can_see_finances, expires_days } = params;

    if ((role === 'co_parent' || role === 'owner') && !email?.trim()) {
      throw new Error('email_required_for_co_parent');
    }

    // Permission check: only root can grant owner; any owner can invite co-parents
    if (role === 'owner' || role === 'co_parent') {
      const [petResult, memberResult] = await Promise.all([
        supabase.from('pets').select('user_id').eq('id', petId).single(),
        supabase.from('pet_members')
          .select('role')
          .eq('pet_id', petId)
          .eq('user_id', user!.id)
          .eq('is_active', true)
          .not('accepted_at', 'is', null)
          .maybeSingle(),
      ]);
      const isRoot  = petResult.data?.user_id === user?.id;
      const isOwner = isRoot || memberResult.data?.role === 'owner';

      if (role === 'owner' && !isRoot) {
        // Only the founding owner (root) can promote others to owner
        throw new Error('only_root_can_invite_owner');
      }
      if (role === 'co_parent' && !isOwner) {
        throw new Error('only_owner_can_invite_coparent');
      }
    }

    const { count } = await supabase
      .from('pet_members')
      .select('id', { count: 'exact', head: true })
      .eq('pet_id', petId)
      .eq('is_active', true)
      .is('accepted_at', null);
    if ((count ?? 0) >= 10) throw new Error('max_invites_reached');

    const token = generateToken();

    const expires_at = expires_days
      ? new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000).toISOString()
      : null; // null = sem expiração

    const [petResult, sessionResult] = await Promise.all([
      supabase.from('pets').select('name').eq('id', petId).single(),
      supabase.auth.getSession(),
    ]);
    const petName = petResult.data?.name ?? 'seu pet';
    const session = sessionResult.data?.session;
    const inviterName =
      session?.user?.user_metadata?.full_name ??
      session?.user?.email?.split('@')[0] ??
      'Tutor';

    const { error } = await supabase.from('pet_members').insert({
      pet_id:           petId,
      email:            email?.trim() || null,
      role,
      nickname:         nickname?.trim() || null,
      can_see_finances: can_see_finances ?? (role === 'co_parent'),
      invited_by:       session?.user?.id ?? null,
      invite_token:     token,
      invite_sent_at:   new Date().toISOString(),
      expires_at,
      is_active:        true,
    });
    if (error) throw error;

    // Try immediate delegation: if the invitee already has an account, link now
    let immediatelyGranted = false;
    if (email?.trim()) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (existingUser?.id) {
        const { error: grantErr } = await supabase
          .from('pet_members')
          .update({
            user_id:      existingUser.id,
            accepted_at:  new Date().toISOString(),
            invite_token: null,
          })
          .eq('pet_id', petId)
          .eq('email', email.trim())
          .is('accepted_at', null)
          .eq('is_active', true);

        if (!grantErr) immediatelyGranted = true;
      }
    }

    qc.invalidateQueries({ queryKey: ['pets', petId, 'members'] });
    return immediatelyGranted ? 'granted' : 'pending';
  };

  const removeMember = async (memberId: string): Promise<void> => {
    const { error } = await supabase
      .from('pet_members')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', memberId);
    if (error) throw error;
    qc.setQueryData<PetMember[]>(['pets', petId, 'members'], (old) =>
      (old ?? []).filter((m) => m.id !== memberId),
    );
  };

  const activeMembers = members.filter((m) => m.accepted_at !== null);
  const pendingMembers = members.filter((m) => m.accepted_at === null);

  return {
    members,
    activeMembers,
    pendingMembers,
    isLoading,
    refetch,
    inviteMember,
    removeMember,
  };
}

// ── useMyPetRole ───────────────────────────────────────────────────────────────

export interface MyPetRole {
  /**
   * role = 'owner' for both root and co-owners.
   * Use isRoot to distinguish: root = pets.user_id (founding owner).
   */
  role: MemberRole;
  /**
   * True when this user is the ROOT of the pet (pets.user_id).
   * Root is the founding owner. Only root can promote/demote other owners.
   * Scoped to this specific pet — being root of pet A grants no privilege on pet B.
   */
  isRoot: boolean;
  /**
   * True when this user has owner-level access to this pet
   * (either root OR a designated co-owner via pet_members.role = 'owner').
   * Scoped to this specific pet.
   */
  isOwner: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSeeFinances: boolean;
  canManageMembers: boolean;
  /** Only root can invite/promote other owners. */
  canInviteOwner: boolean;
  canInviteCoParent: boolean;
  canInviteCaregiver: boolean;
  canInviteViewer: boolean;
  /** Only root can remove owners. */
  canRemoveOwner: boolean;
  canRemoveCoParent: boolean;
  canRemoveCaregiver: boolean;
  canRemoveViewer: boolean;
}

export function useMyPetRole(petId: string): MyPetRole {
  const userId = useAuthStore((s) => s.user?.id);

  const { data: pet } = useQuery({
    queryKey: ['pets', petId],
    queryFn: async () => {
      const { data } = await supabase
        .from('pets')
        .select('user_id')
        .eq('id', petId)
        .maybeSingle();
      return data;
    },
    enabled: !!petId && !!userId,
  });

  const { data: member } = useQuery({
    queryKey: ['pets', petId, 'my-role', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('pet_members')
        .select('role, can_see_finances')
        .eq('pet_id', petId)
        .eq('user_id', userId!)
        .eq('is_active', true)
        .not('accepted_at', 'is', null)
        .maybeSingle();
      return data;
    },
    enabled: !!petId && !!userId,
  });

  // ROOT = founding owner (pets.user_id). Immovable. Only root promotes/demotes owners.
  // Scoped to this specific pet — being root of pet A grants zero privilege on pet B.
  const isRoot  = pet?.user_id === userId;
  // CO-OWNER = designated by root via pet_members.role = 'owner'. Same operational powers,
  // but cannot promote/demote other owners.
  const isOwner = isRoot || member?.role === 'owner';
  const role: MemberRole = isOwner ? 'owner' : (member?.role as MemberRole) ?? 'viewer';

  return {
    role,
    isRoot,
    isOwner,
    canEdit:             isOwner || ['co_parent', 'caregiver'].includes(role),
    canDelete:           isOwner || role === 'co_parent',
    canSeeFinances:      isOwner || (member?.can_see_finances === true),
    canManageMembers:    isOwner,
    canInviteOwner:      isRoot,           // ONLY root can grant owner role
    canInviteCoParent:   isOwner,
    canInviteCaregiver:  isOwner || role === 'co_parent',
    canInviteViewer:     isOwner || role === 'co_parent',
    canRemoveOwner:      isRoot,           // ONLY root can remove owners
    canRemoveCoParent:   isOwner,
    canRemoveCaregiver:  isOwner || role === 'co_parent',
    canRemoveViewer:     isOwner || role === 'co_parent',
  };
}
