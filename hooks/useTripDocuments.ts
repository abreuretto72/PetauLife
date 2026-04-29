/**
 * hooks/useTripDocuments.ts
 *
 * Documentos anexados a uma viagem: upload pra Supabase Storage + linha
 * em trip_documents com extracted_data preenchido pela EF
 * `extract-travel-document`.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { TripDocument, DocumentStatus, DocumentType } from '../types/trip';

export const tripDocsKeys = {
  byTrip: (tripId: string) => ['trip_documents', tripId] as const,
};

export function useTripDocuments(tripId: string | undefined) {
  return useQuery({
    queryKey: tripId ? tripDocsKeys.byTrip(tripId) : ['trip_documents', 'noop'],
    queryFn: async (): Promise<TripDocument[]> => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('trip_documents')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      console.log('[useTripDocuments] list', tripId, '| count:', data?.length ?? 0,
        '| err:', error?.message ?? 'ok');
      if (error) throw error;
      return (data ?? []) as TripDocument[];
    },
    enabled: !!tripId,
    staleTime: 60 * 1000,
  });
}

export interface CreateTripDocumentInput {
  trip_id: string;
  pet_id?: string | null;
  document_type: DocumentType | string;
  storage_path: string;
  extracted_data?: Record<string, unknown>;
  issued_date?: string | null;
  expires_at?: string | null;
  status?: DocumentStatus;
}

export function useCreateTripDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTripDocumentInput): Promise<TripDocument> => {
      const { data, error } = await supabase
        .from('trip_documents')
        .insert({
          trip_id: input.trip_id,
          pet_id: input.pet_id ?? null,
          document_type: input.document_type,
          storage_path: input.storage_path,
          extracted_data: input.extracted_data ?? {},
          issued_date: input.issued_date ?? null,
          expires_at: input.expires_at ?? null,
          status: input.status ?? 'pending_review',
        })
        .select('*')
        .single();
      console.log('[useTripDocuments] create:', error?.message ?? `id=${data?.id}`);
      if (error) throw error;
      return data as TripDocument;
    },
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: tripDocsKeys.byTrip(doc.trip_id) });
    },
  });
}

export interface UpdateTripDocumentInput {
  id: string;
  trip_id: string;  // pra invalidacao
  document_type?: DocumentType | string;
  extracted_data?: Record<string, unknown>;
  issued_date?: string | null;
  expires_at?: string | null;
  status?: DocumentStatus;
}

export function useUpdateTripDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateTripDocumentInput): Promise<TripDocument> => {
      const { id, trip_id, ...patch } = input;
      const { data, error } = await supabase
        .from('trip_documents')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      console.log('[useTripDocuments] update', id, ':', error?.message ?? 'ok');
      if (error) throw error;
      return data as TripDocument;
    },
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: tripDocsKeys.byTrip(doc.trip_id) });
    },
  });
}

export function useDeleteTripDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; trip_id: string }): Promise<void> => {
      const { error } = await supabase.from('trip_documents').delete().eq('id', input.id);
      console.log('[useTripDocuments] delete', input.id, ':', error?.message ?? 'ok');
      if (error) throw error;
    },
    onSuccess: (_v, input) => {
      qc.invalidateQueries({ queryKey: tripDocsKeys.byTrip(input.trip_id) });
    },
  });
}
