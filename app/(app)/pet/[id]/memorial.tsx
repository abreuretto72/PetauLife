/**
 * app/(app)/pet/[id]/memorial.tsx
 *
 * Tela memorial — read-only, exibida apenas para pets com deceased_at != null.
 *
 * Composição:
 *   - Header com nome, datas (nascimento → partida), idade
 *   - Carta memorial (insight memorial_mode da camada 8)
 *   - Livro de memórias: top entries do diário com narração, ordenadas por mood
 *   - Linha do tempo de eventos (pet_lifecycle_events)
 *   - Atalho pra exportar PDF
 *
 * Tom Elite. Sem CTA agressivo, sem emoji, sem onomatopeia.
 */

import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, BookOpen, Download, Calendar } from 'lucide-react-native';
import { colors } from '../../../../constants/colors';
import { rs, fs } from '../../../../hooks/useResponsive';
import { supabase } from '../../../../lib/supabase';

interface PetMemorial {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  deceased_at: string | null;
  deceased_cause: string | null;
  avatar_url: string | null;
}

interface MemorialEntry {
  id: string;
  entry_date: string;
  content: string | null;
  narration: string | null;
  mood_score: number | null;
  primary_type: string | null;
}

interface LifecycleEvent {
  id: string;
  event_type: string;
  event_date: string;
  notes: string | null;
}

interface MemorialInsight {
  id: string;
  title: string;
  body: string;
  evidence: any;
}

function fmtDate(d: string | null, t: any): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

function ageInYears(birth: string | null, deceased: string | null): string | null {
  if (!birth || !deceased) return null;
  const ms = new Date(deceased).getTime() - new Date(birth).getTime();
  const years = ms / (365.25 * 24 * 3600 * 1000);
  if (years < 1) {
    const months = Math.floor(years * 12);
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
  return `${years.toFixed(1).replace('.', ',')} anos`;
}

export default function PetMemorialScreen() {
  const { id: petId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  // Query do pet
  const petQuery = useQuery({
    queryKey: ['pet-memorial', petId],
    enabled: !!petId,
    queryFn: async (): Promise<PetMemorial | null> => {
      const { data } = await supabase
        .from('pets')
        .select('id, name, species, breed, birth_date, deceased_at, deceased_cause, avatar_url')
        .eq('id', petId).maybeSingle();
      return (data ?? null) as PetMemorial | null;
    },
  });

  // Top entries (livro de memórias)
  const entriesQuery = useQuery({
    queryKey: ['pet-memorial-entries', petId],
    enabled: !!petId,
    queryFn: async (): Promise<MemorialEntry[]> => {
      const { data } = await supabase
        .from('diary_entries')
        .select('id, entry_date, content, narration, mood_score, primary_type')
        .eq('pet_id', petId).eq('is_active', true)
        .not('narration', 'is', null)
        .order('mood_score', { ascending: false, nullsFirst: false })
        .limit(20);
      return (data ?? []) as MemorialEntry[];
    },
  });

  // Linha do tempo de eventos
  const eventsQuery = useQuery({
    queryKey: ['pet-memorial-events', petId],
    enabled: !!petId,
    queryFn: async (): Promise<LifecycleEvent[]> => {
      const { data } = await supabase
        .from('pet_lifecycle_events')
        .select('id, event_type, event_date, notes')
        .eq('pet_id', petId).eq('is_active', true)
        .order('event_date', { ascending: false });
      return (data ?? []) as LifecycleEvent[];
    },
  });

  // Carta memorial (memorial_mode insight)
  const memorialInsightQuery = useQuery({
    queryKey: ['pet-memorial-insight', petId],
    enabled: !!petId,
    queryFn: async (): Promise<MemorialInsight | null> => {
      const { data } = await supabase
        .from('pet_insights')
        .select('id, title, body, evidence')
        .eq('pet_id', petId)
        .eq('layer', 8)
        .eq('subcategory', 'memorial_mode')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data ?? null) as MemorialInsight | null;
    },
  });

  const pet = petQuery.data;
  const isLoading = petQuery.isLoading;

  const ageText = useMemo(
    () => (pet ? ageInYears(pet.birth_date, pet.deceased_at) : null),
    [pet],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loading}>
          <ActivityIndicator size="large" color={colors.click} />
        </View>
      </SafeAreaView>
    );
  }

  if (!pet) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.empty}>
          <Text style={s.emptyText}>
            {t('memorial.not_found', { defaultValue: 'Pet não encontrado.' })}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pet.deceased_at) {
    // Pet ainda ativo — não exibe memorial
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.empty}>
          <Text style={s.emptyText}>
            {t('memorial.not_yet', { defaultValue: 'Esta tela aparece apenas quando o pet entra em modo memorial.' })}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.backLink}>
              {t('common.back', { defaultValue: 'Voltar' })}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={rs(22)} color={colors.click} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {t('memorial.title', { defaultValue: 'Memorial' })}
        </Text>
        <View style={{ width: rs(22) }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Cabeçalho com avatar + nome + datas */}
        <View style={s.heroCard}>
          {pet.avatar_url ? (
            <Image source={{ uri: pet.avatar_url }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarPlaceholder]} />
          )}
          <Text style={s.petName}>{pet.name}</Text>
          {pet.breed ? <Text style={s.petBreed}>{pet.breed}</Text> : null}
          <View style={s.datesRow}>
            <Text style={s.dateText}>
              {fmtDate(pet.birth_date, t)}
            </Text>
            <Text style={s.dateSeparator}>—</Text>
            <Text style={s.dateText}>
              {fmtDate(pet.deceased_at, t)}
            </Text>
          </View>
          {ageText ? (
            <Text style={s.ageText}>
              {t('memorial.age_lived', { defaultValue: '{{age}} de vida juntos.', age: ageText })}
            </Text>
          ) : null}
        </View>

        {/* Carta memorial (Opus 4.7) */}
        {memorialInsightQuery.data ? (
          <View style={s.memorialCard}>
            <Text style={s.memorialTitle}>{memorialInsightQuery.data.title}</Text>
            <Text style={s.memorialBody}>{memorialInsightQuery.data.body}</Text>
          </View>
        ) : null}

        {/* Livro de memórias */}
        <View style={s.sectionHeader}>
          <BookOpen size={rs(18)} color={colors.click} strokeWidth={1.8} />
          <Text style={s.sectionTitle}>
            {t('memorial.book_title', { defaultValue: 'Livro de memórias' })}
          </Text>
        </View>

        {(entriesQuery.data ?? []).length === 0 ? (
          <Text style={s.emptySection}>
            {t('memorial.book_empty', { defaultValue: 'Sem narrações guardadas no diário.' })}
          </Text>
        ) : (
          (entriesQuery.data ?? []).map((entry) => (
            <View key={entry.id} style={s.entryCard}>
              <Text style={s.entryDate}>{fmtDate(entry.entry_date, t)}</Text>
              {entry.narration ? (
                <Text style={s.entryNarration}>{entry.narration}</Text>
              ) : null}
              {entry.content ? (
                <Text style={s.entryContent}>{entry.content}</Text>
              ) : null}
            </View>
          ))
        )}

        {/* Linha do tempo */}
        <View style={s.sectionHeader}>
          <Calendar size={rs(18)} color={colors.click} strokeWidth={1.8} />
          <Text style={s.sectionTitle}>
            {t('memorial.timeline_title', { defaultValue: 'Linha do tempo' })}
          </Text>
        </View>

        {(eventsQuery.data ?? []).length === 0 ? (
          <Text style={s.emptySection}>
            {t('memorial.timeline_empty', { defaultValue: 'Sem eventos registrados.' })}
          </Text>
        ) : (
          <View style={s.timelineList}>
            {(eventsQuery.data ?? []).map((ev) => (
              <View key={ev.id} style={s.timelineItem}>
                <View style={s.timelineDot} />
                <View style={{ flex: 1 }}>
                  <Text style={s.timelineDate}>{fmtDate(ev.event_date, t)}</Text>
                  <Text style={s.timelineEvent}>
                    {t(`memorial.event_type.${ev.event_type}`, { defaultValue: ev.event_type.replace(/_/g, ' ') })}
                  </Text>
                  {ev.notes ? <Text style={s.timelineNotes}>{ev.notes}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer — exportar PDF (placeholder) */}
        <Text style={s.footer}>
          {t('memorial.footer', {
            defaultValue: 'Este memorial fica guardado aqui. Quando quiser, exporte como PDF para preservar fora do app.',
          })}
        </Text>

        <View style={{ height: rs(40) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: rs(40), gap: rs(12) },
  emptyText: { color: colors.textDim, fontSize: fs(13), textAlign: 'center' },
  backLink: { color: colors.click, fontSize: fs(13), fontWeight: '700', marginTop: rs(16) },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingVertical: rs(10),
  },
  headerTitle: { color: colors.text, fontSize: fs(15), fontWeight: '700' },

  content: { padding: rs(16) },

  heroCard: {
    backgroundColor: colors.card,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: colors.border,
    padding: rs(20),
    alignItems: 'center',
    marginBottom: rs(20),
  },
  avatar: { width: rs(80), height: rs(80), borderRadius: rs(40) },
  avatarPlaceholder: { backgroundColor: colors.bgCard ?? colors.bg, borderWidth: 1, borderColor: colors.border },
  petName: { fontSize: fs(20), color: colors.text, fontWeight: '700', marginTop: rs(12) },
  petBreed: { fontSize: fs(12), color: colors.textDim, marginTop: rs(4) },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginTop: rs(10) },
  dateText: { fontSize: fs(13), color: colors.textSec },
  dateSeparator: { fontSize: fs(13), color: colors.textDim },
  ageText: { fontSize: fs(11), color: colors.textDim, fontStyle: 'italic', marginTop: rs(8) },

  memorialCard: {
    backgroundColor: colors.click + '10',
    borderColor: colors.click + '30',
    borderWidth: 1,
    borderRadius: rs(14),
    padding: rs(16),
    marginBottom: rs(20),
  },
  memorialTitle: { fontSize: fs(15), color: colors.text, fontWeight: '700', marginBottom: rs(8) },
  memorialBody: { fontSize: fs(13), color: colors.text, lineHeight: fs(20) },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginTop: rs(8),
    marginBottom: rs(10),
  },
  sectionTitle: { fontSize: fs(11), color: colors.textDim, fontWeight: '700', letterSpacing: 1 },

  emptySection: {
    fontSize: fs(12),
    color: colors.textDim,
    fontStyle: 'italic',
    marginBottom: rs(20),
  },

  entryCard: {
    backgroundColor: colors.card,
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: colors.border,
    padding: rs(14),
    marginBottom: rs(8),
  },
  entryDate: { fontSize: fs(11), color: colors.textDim, fontWeight: '700', marginBottom: rs(6) },
  entryNarration: { fontSize: fs(13), color: colors.text, lineHeight: fs(20), fontStyle: 'italic' },
  entryContent: { fontSize: fs(11), color: colors.textDim, marginTop: rs(4) },

  timelineList: { marginBottom: rs(20) },
  timelineItem: { flexDirection: 'row', gap: rs(10), marginBottom: rs(12) },
  timelineDot: {
    width: rs(8), height: rs(8),
    borderRadius: rs(4),
    backgroundColor: colors.click,
    marginTop: rs(6),
  },
  timelineDate: { fontSize: fs(11), color: colors.textDim, fontWeight: '700' },
  timelineEvent: { fontSize: fs(13), color: colors.text, textTransform: 'capitalize', marginTop: rs(2) },
  timelineNotes: { fontSize: fs(11), color: colors.textSec, marginTop: rs(2) },

  footer: {
    fontSize: fs(11),
    color: colors.textDim,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: rs(20),
    lineHeight: fs(16),
  },
});
