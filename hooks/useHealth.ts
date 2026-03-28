import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import * as api from '../lib/api';
import type { Vaccine } from '../types/database';

export function useVaccines(petId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['pets', petId, 'vaccines'],
    queryFn: () => api.fetchVaccines(petId),
    enabled: isAuthenticated && !!petId,
  });

  const addMutation = useMutation({
    mutationFn: (vaccine: Omit<Vaccine, 'id' | 'created_at' | 'is_active'>) =>
      api.createVaccine(vaccine),
    onSuccess: (newVaccine) => {
      qc.setQueryData<Vaccine[]>(['pets', petId, 'vaccines'], (old) =>
        old ? [newVaccine, ...old] : [newVaccine],
      );
    },
  });

  const vaccines = query.data ?? [];
  const overdueCount = vaccines.filter(
    (v) => v.next_due_date && new Date(v.next_due_date) < new Date(),
  ).length;
  const upcomingCount = vaccines.filter((v) => {
    if (!v.next_due_date) return false;
    const due = new Date(v.next_due_date);
    const now = new Date();
    const inWeek = new Date(now.getTime() + 7 * 86_400_000);
    return due >= now && due <= inWeek;
  }).length;

  return {
    vaccines,
    overdueCount,
    upcomingCount,
    isLoading: query.isLoading,
    refetch: query.refetch,
    addVaccine: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
  };
}

export function useExams(petId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['pets', petId, 'exams'], queryFn: () => api.fetchExams(petId), enabled: isAuthenticated && !!petId });
  const addMutation = useMutation({
    mutationFn: (exam: Record<string, unknown>) => api.createExam(exam),
    onSuccess: (newExam) => { qc.setQueryData(['pets', petId, 'exams'], (old: unknown[]) => old ? [newExam, ...old] : [newExam]); },
  });
  return { exams: (query.data ?? []) as Record<string, unknown>[], isLoading: query.isLoading, refetch: query.refetch, addExam: addMutation.mutateAsync, isAdding: addMutation.isPending };
}

export function useMedications(petId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['pets', petId, 'medications'], queryFn: () => api.fetchMedications(petId), enabled: isAuthenticated && !!petId });
  const addMutation = useMutation({
    mutationFn: (med: Record<string, unknown>) => api.createMedication(med),
    onSuccess: (newMed) => { qc.setQueryData(['pets', petId, 'medications'], (old: unknown[]) => old ? [newMed, ...old] : [newMed]); },
  });
  return { medications: (query.data ?? []) as Record<string, unknown>[], isLoading: query.isLoading, refetch: query.refetch, addMedication: addMutation.mutateAsync, isAdding: addMutation.isPending };
}

export function useConsultations(petId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['pets', petId, 'consultations'], queryFn: () => api.fetchConsultations(petId), enabled: isAuthenticated && !!petId });
  const addMutation = useMutation({
    mutationFn: (cons: Record<string, unknown>) => api.createConsultation(cons),
    onSuccess: (newCons) => { qc.setQueryData(['pets', petId, 'consultations'], (old: unknown[]) => old ? [newCons, ...old] : [newCons]); },
  });
  return { consultations: (query.data ?? []) as Record<string, unknown>[], isLoading: query.isLoading, refetch: query.refetch, addConsultation: addMutation.mutateAsync, isAdding: addMutation.isPending };
}

export function useSurgeries(petId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['pets', petId, 'surgeries'], queryFn: () => api.fetchSurgeries(petId), enabled: isAuthenticated && !!petId });
  const addMutation = useMutation({
    mutationFn: (surg: Record<string, unknown>) => api.createSurgery(surg),
    onSuccess: (newSurg) => { qc.setQueryData(['pets', petId, 'surgeries'], (old: unknown[]) => old ? [newSurg, ...old] : [newSurg]); },
  });
  return { surgeries: (query.data ?? []) as Record<string, unknown>[], isLoading: query.isLoading, refetch: query.refetch, addSurgery: addMutation.mutateAsync, isAdding: addMutation.isPending };
}

export function useAllergies(petId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery({
    queryKey: ['pets', petId, 'allergies'],
    queryFn: () => api.fetchAllergies(petId),
    enabled: isAuthenticated && !!petId,
  });

  return {
    allergies: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useMoodLogs(petId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery({
    queryKey: ['pets', petId, 'moods'],
    queryFn: () => api.fetchMoodLogs(petId),
    enabled: isAuthenticated && !!petId,
  });

  return {
    moodLogs: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
