/**
 * /trips/new — Criacao de viagem com fluxo conversacional voz-first.
 *
 * 4 passos: destino → datas → transporte → motivo → confirmacao.
 * Cada passo tem 3 caminhos por prioridade:
 *   1. Voz (primario) → STT → parse-travel-intent → preencher campo
 *   2. Tap em card (alternativo) → preencher direto
 *   3. Date picker nativo (datas, ultimo recurso)
 *
 * Sem <TextInput> em nenhum lugar — regra do PR.
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
  ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  X, ChevronRight, ChevronLeft, Plane, Car, Ship, Train, Bus, MoreHorizontal,
  Map as MapIcon, Heart, Trophy, Stethoscope, Briefcase, Calendar,
  Dog, Cat, Check,
} from 'lucide-react-native';

import { colors } from '../../../constants/colors';
import { radii, spacing } from '../../../constants/spacing';
import { rs, fs } from '../../../hooks/useResponsive';
import { useToast } from '../../../components/Toast';
import { VoiceInputButton } from '../../../components/VoiceInputButton';
import { DatePickerSheet } from '../../../components/DatePickerSheet';
import { supabase } from '../../../lib/supabase';
import { TRAVEL_RULES } from '../../../data/travelRules';
import { useCreateTrip } from '../../../hooks/useTrips';
import { usePets } from '../../../hooks/usePets';
import { getErrorMessage } from '../../../utils/errorMessages';
import type { TransportMode, TripPurpose } from '../../../types/trip';

// ── Tipos locais ────────────────────────────────────────────────────────────

type Step = 'pets' | 'destination' | 'dates' | 'transport' | 'purpose' | 'confirm';

interface DraftState {
  petIds: string[];
  countryCode: string | null;
  countryName: string | null;
  city: string | null;
  originAirport: string | null;
  destinationAirport: string | null;
  startDate: string | null;
  endDate: string | null;
  transport: TransportMode | null;
  purpose: TripPurpose | null;
  partySize: number;          // default 1 (so o tutor)
  partyNames: string[];
}

const TRANSPORT_OPTIONS: { id: TransportMode; Icon: typeof Plane; key: string }[] = [
  { id: 'plane', Icon: Plane, key: 'travel.transport.plane' },
  { id: 'car', Icon: Car, key: 'travel.transport.car' },
  { id: 'bus', Icon: Bus, key: 'travel.transport.bus' },
  { id: 'train', Icon: Train, key: 'travel.transport.train' },
  { id: 'ship', Icon: Ship, key: 'travel.transport.ship' },
  { id: 'other', Icon: MoreHorizontal, key: 'travel.transport.other' },
];

const PURPOSE_OPTIONS: { id: TripPurpose; Icon: typeof MapIcon; key: string }[] = [
  { id: 'tourism', Icon: MapIcon, key: 'travel.purpose.tourism' },
  { id: 'relocation', Icon: Briefcase, key: 'travel.purpose.relocation' },
  { id: 'competition', Icon: Trophy, key: 'travel.purpose.competition' },
  { id: 'treatment', Icon: Stethoscope, key: 'travel.purpose.treatment' },
  { id: 'other', Icon: Heart, key: 'travel.purpose.other' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

async function parseIntent(transcript: string, currentStep: Step, locale: string) {
  console.log('[trips/new] parse-travel-intent:', currentStep, '|', transcript.slice(0, 80));
  const { data, error } = await supabase.functions.invoke('parse-travel-intent', {
    body: {
      transcript,
      locale,
      current_step: currentStep === 'confirm' ? 'free_form' : currentStep,
      today: new Date().toISOString().slice(0, 10),
    },
  });
  if (error) throw error;
  return data as {
    destination_country_code: string | null;
    destination_country_name: string | null;
    destination_city: string | null;
    origin_airport: string | null;
    destination_airport: string | null;
    start_date: string | null;
    end_date: string | null;
    transport_mode: TransportMode | null;
    purpose: TripPurpose | null;
    party_size: number | null;
    party_names: string[] | null;
    pet_names: string[] | null;
    confidence: number;
  };
}

// ── Tela ────────────────────────────────────────────────────────────────────

export default function NewTripScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const params = useLocalSearchParams<{ petId?: string; country?: string }>();
  const createTrip = useCreateTrip();
  const { pets: userPets } = usePets();

  // Country pre-selecionado vindo do empty state de /trips (atalho de bandeiras).
  const initialCountry = params.country?.toUpperCase();
  const initialRule = initialCountry ? TRAVEL_RULES[initialCountry] : undefined;

  // Step inicial:
  // - Veio com petId (deep-link de PetCard) → ja tem pet, comeca destino/datas
  // - Senao → comeca em "pets" pra escolher quais viajam
  const initialStep: Step = params.petId
    ? (initialRule ? 'dates' : 'destination')
    : 'pets';

  const [step, setStep] = useState<Step>(initialStep);
  const [transcript, setTranscript] = useState('');
  const [parsing, setParsing] = useState(false);
  const [draft, setDraft] = useState<DraftState>({
    petIds: params.petId ? [params.petId] : [],
    countryCode: initialRule ? initialCountry! : null,
    countryName: initialRule
      ? (initialRule.countryNameKey ? t(initialRule.countryNameKey, { defaultValue: initialCountry! }) : initialCountry!)
      : null,
    city: null,
    originAirport: null, destinationAirport: null,
    startDate: null, endDate: null,
    transport: null, purpose: null,
    partySize: 1, partyNames: [],
  });

  // Auto-selecao quando o tutor so tem 1 pet — pula step "pets"
  React.useEffect(() => {
    if (step !== 'pets' || draft.petIds.length > 0) return;
    if (userPets.length === 1) {
      setDraft((d) => ({ ...d, petIds: [userPets[0].id] }));
      // Avanca pro proximo step (destination ou dates se ja tem country)
      setStep(initialRule ? 'dates' : 'destination');
    }
  }, [step, userPets, initialRule, draft.petIds.length]);

  const stepIndex = useMemo(() => {
    const order: Step[] = ['pets', 'destination', 'dates', 'transport', 'purpose', 'confirm'];
    return order.indexOf(step);
  }, [step]);

  // ── Voice handlers ──────────────────────────────────────────────────────
  const handleTranscript = async (text: string, isFinal: boolean) => {
    setTranscript(text);
    if (!isFinal) return;
    setParsing(true);
    try {
      const intent = await parseIntent(text, step, i18n.language);
      console.log('[trips/new] intent:', JSON.stringify(intent));

      // Auto-match: se a voz mencionou nomes de pets ("vou com Mana e Pico"),
      // procura pets do tutor por substring case-insensitive e seleciona-os.
      const matchedPetIds: string[] = [];
      if (intent.pet_names && intent.pet_names.length > 0) {
        for (const spokenName of intent.pet_names) {
          const norm = spokenName.toLowerCase().trim();
          const match = userPets.find((p) => p.name.toLowerCase() === norm
            || p.name.toLowerCase().includes(norm)
            || norm.includes(p.name.toLowerCase()));
          if (match && !matchedPetIds.includes(match.id)) matchedPetIds.push(match.id);
        }
      }

      setDraft((d) => ({
        ...d,
        petIds: matchedPetIds.length > 0 ? matchedPetIds : d.petIds,
        countryCode: intent.destination_country_code ?? d.countryCode,
        countryName: intent.destination_country_name ?? d.countryName,
        city: intent.destination_city ?? d.city,
        originAirport: intent.origin_airport ?? d.originAirport,
        destinationAirport: intent.destination_airport ?? d.destinationAirport,
        startDate: intent.start_date ?? d.startDate,
        endDate: intent.end_date ?? d.endDate,
        transport: intent.transport_mode ?? d.transport,
        purpose: intent.purpose ?? d.purpose,
        partySize: typeof intent.party_size === 'number' && intent.party_size > 0 ? intent.party_size : d.partySize,
        partyNames: (intent.party_names && intent.party_names.length > 0) ? intent.party_names : d.partyNames,
      }));
      // Se a fala revelou tudo do passo atual com alta confianca, ja avanca
      if (intent.confidence >= 0.8) {
        if (step === 'destination' && intent.destination_country_code) goNext();
        else if (step === 'dates' && intent.start_date && intent.end_date) goNext();
        else if (step === 'transport' && intent.transport_mode) goNext();
        else if (step === 'purpose' && intent.purpose) goNext();
      }
    } catch (e) {
      console.warn('[trips/new] parse failed:', e);
      toast(getErrorMessage(e), 'warning');
    } finally {
      setParsing(false);
      setTranscript('');
    }
  };

  // ── Step navigation ─────────────────────────────────────────────────────
  const canGoNext = (): boolean => {
    switch (step) {
      case 'pets':        return draft.petIds.length > 0;
      case 'destination': return !!draft.countryCode;
      case 'dates':       return !!draft.startDate && !!draft.endDate;
      case 'transport':   return !!draft.transport;
      case 'purpose':     return !!draft.purpose;
      default:            return true;
    }
  };

  const goNext = () => {
    if (!canGoNext()) return;
    const order: Step[] = ['pets', 'destination', 'dates', 'transport', 'purpose', 'confirm'];
    const next = order[order.indexOf(step) + 1];
    if (next) setStep(next);
  };
  const goBack = () => {
    const order: Step[] = ['pets', 'destination', 'dates', 'transport', 'purpose', 'confirm'];
    const prev = order[order.indexOf(step) - 1];
    if (prev) setStep(prev);
    else router.back();
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!draft.countryCode || !draft.startDate || !draft.endDate || !draft.transport || !draft.purpose) {
      toast(t('errors.validation', { defaultValue: 'Algo esta faltando.' }), 'warning');
      return;
    }
    if (draft.petIds.length === 0) {
      toast(t('agents.errors.missingPet', { defaultValue: 'Selecione um pet.' }), 'warning');
      return;
    }
    try {
      const trip = await createTrip.mutateAsync({
        destination_country_code: draft.countryCode,
        destination_city: draft.city ?? null,
        origin_airport: draft.originAirport,
        destination_airport: draft.destinationAirport,
        start_date: draft.startDate,
        end_date: draft.endDate,
        transport_mode: draft.transport,
        purpose: draft.purpose,
        pet_ids: draft.petIds,
        party_size: draft.partySize,
        party_names: draft.partyNames,
        status: 'planning',
      });
      console.log('[trips/new] created', trip.id);
      router.replace(`/(app)/trips/${trip.id}` as never);
    } catch (e) {
      console.warn('[trips/new] create failed:', e);
      toast(getErrorMessage(e), 'error');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={goBack} hitSlop={12}>
          {step === 'destination'
            ? <X size={rs(22)} color={colors.click} strokeWidth={1.8} />
            : <ChevronLeft size={rs(22)} color={colors.click} strokeWidth={1.8} />}
        </TouchableOpacity>
        <Text style={s.title}>{t('travel.new.title')}</Text>
        <View style={{ width: rs(22) }} />
      </View>

      {/* Progress */}
      <View style={s.progress}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[s.progressDot, i <= stepIndex && s.progressDotActive]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {step === 'pets' && (
          <PetsStep draft={draft} setDraft={setDraft} pets={userPets} />
        )}
        {step === 'destination' && (
          <DestinationStep draft={draft} setDraft={setDraft} />
        )}
        {step === 'dates' && (
          <DatesStep draft={draft} setDraft={setDraft} />
        )}
        {step === 'transport' && (
          <TransportStep draft={draft} setDraft={setDraft} />
        )}
        {step === 'purpose' && (
          <PurposeStep draft={draft} setDraft={setDraft} />
        )}
        {step === 'confirm' && (
          <ConfirmStep draft={draft} pets={userPets} />
        )}

        {/* Voice section — sempre disponivel exceto na confirmacao e na escolha de pets */}
        {step !== 'confirm' && step !== 'pets' && (
          <View style={s.voiceWrap}>
            {transcript ? (
              <Text style={s.transcript}>{transcript}</Text>
            ) : (
              <Text style={s.question}>{t(`travel.new.step.${step}.question`)}</Text>
            )}
            <VoiceInputButton
              onTranscript={handleTranscript}
              onError={(m) => toast(m, 'warning')}
              size="large"
              lang={i18n.language}
              disabled={parsing}
            />
            {parsing && (
              <View style={s.parsing}>
                <ActivityIndicator size="small" color={colors.click} />
                <Text style={s.parsingTxt}>{t('travel.document.extracting')}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        {step === 'confirm' ? (
          <TouchableOpacity
            style={[s.cta, createTrip.isPending && s.ctaDisabled]}
            onPress={handleCreate}
            disabled={createTrip.isPending}
            activeOpacity={0.8}
          >
            {createTrip.isPending
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={s.ctaTxt}>{t('travel.new.confirm.create')}</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.cta, !canGoNext() && s.ctaDisabled]}
            onPress={goNext}
            disabled={!canGoNext()}
            activeOpacity={0.8}
          >
            <Text style={s.ctaTxt}>{t('common.next')}</Text>
            <ChevronRight size={rs(18)} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Sub-componentes por step ────────────────────────────────────────────────

interface UserPet {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  avatar_url?: string | null;
  breed?: string | null;
}

function PetsStep({
  draft, setDraft, pets,
}: {
  draft: DraftState;
  setDraft: (d: any) => void;
  pets: UserPet[];
}) {
  const { t } = useTranslation();

  const togglePet = (id: string) => {
    setDraft((d: DraftState) => {
      const next = d.petIds.includes(id)
        ? d.petIds.filter((x) => x !== id)
        : [...d.petIds, id];
      return { ...d, petIds: next };
    });
  };

  if (pets.length === 0) {
    return (
      <View style={s.petsEmpty}>
        <Text style={s.petsEmptyTitle}>
          {t('travel.pets.empty', { defaultValue: 'Nenhum pet cadastrado.' })}
        </Text>
        <Text style={s.petsEmptyDesc}>
          {t('travel.pets.empty_desc', { defaultValue: 'Cadastre um pet primeiro pra planejar a viagem.' })}
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={s.petsTitle}>
        {t('travel.pets.question', { defaultValue: 'Quais pets vão viajar?' })}
      </Text>
      <Text style={s.petsHint}>
        {t('travel.pets.hint', { defaultValue: 'Toque pra selecionar (um ou mais).' })}
      </Text>
      <View style={s.petsGrid}>
        {pets.map((pet) => {
          const selected = draft.petIds.includes(pet.id);
          const Icon = pet.species === 'cat' ? Cat : Dog;
          return (
            <TouchableOpacity
              key={pet.id}
              style={[s.petCard, selected && s.petCardSelected]}
              onPress={() => togglePet(pet.id)}
              activeOpacity={0.75}
            >
              <View style={[s.petAvatar, { borderColor: selected ? colors.click : colors.border }]}>
                {pet.avatar_url ? (
                  <Image source={{ uri: pet.avatar_url }} style={s.petAvatarImg} resizeMode="cover" />
                ) : (
                  <Icon size={rs(28)} color={colors.click} strokeWidth={1.8} />
                )}
              </View>
              <Text style={[s.petName, selected && s.petNameSelected]} numberOfLines={1}>
                {pet.name}
              </Text>
              {pet.breed ? (
                <Text style={s.petBreed} numberOfLines={1}>{pet.breed}</Text>
              ) : null}
              {selected ? (
                <View style={s.petCheck}>
                  <Check size={rs(12)} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function DestinationStep({ draft, setDraft }: { draft: DraftState; setDraft: (d: any) => void }) {
  const { t } = useTranslation();
  const codes = Object.keys(TRAVEL_RULES);
  return (
    <View>
      {draft.countryCode && (
        <View style={s.selectedCard}>
          <Text style={s.selectedFlag}>{TRAVEL_RULES[draft.countryCode]?.flag ?? '🌍'}</Text>
          <Text style={s.selectedName}>
            {draft.countryName ?? t(TRAVEL_RULES[draft.countryCode]?.countryNameKey ?? '', { defaultValue: draft.countryCode })}
          </Text>
          {draft.city ? <Text style={s.selectedCity}>{draft.city}</Text> : null}
        </View>
      )}
      <Text style={s.gridLabel}>{t('common.search')}</Text>
      <View style={s.grid}>
        {codes.map((code) => {
          const rule = TRAVEL_RULES[code];
          const selected = draft.countryCode === code;
          return (
            <TouchableOpacity
              key={code}
              style={[s.flagBtn, selected && s.flagBtnActive]}
              onPress={() => setDraft((d: DraftState) => ({
                ...d, countryCode: code,
                countryName: t(rule.countryNameKey, { defaultValue: code }),
              }))}
              activeOpacity={0.7}
            >
              <Text style={s.flagEmoji}>{rule.flag}</Text>
              <Text style={[s.flagCode, selected && s.flagCodeActive]}>{code}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/** Soma `days` a uma data ISO 'YYYY-MM-DD' em horario LOCAL. Retorna null se input invalido. */
function addDaysISO(iso: string | null, days: number): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear().toString().padStart(4, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function DatesStep({ draft, setDraft }: { draft: DraftState; setDraft: (d: any) => void }) {
  const { t, i18n } = useTranslation();
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const fmt = (d: string | null) => {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString(
      i18n.language === 'pt-BR' ? 'pt-BR' : i18n.language,
      { day: '2-digit', month: 'short', year: 'numeric' }
    );
  };
  return (
    <View>
      <View style={s.dateRow}>
        <TouchableOpacity
          style={[s.dateCard, !!draft.startDate && s.dateCardFilled]}
          onPress={() => setShowStart(true)}
          activeOpacity={0.7}
        >
          <Calendar size={rs(20)} color={colors.click} strokeWidth={1.8} />
          <Text style={s.dateLabel}>
            {t('travel.dates.start', { defaultValue: 'Ida' })}
          </Text>
          <Text style={s.dateValue}>{fmt(draft.startDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.dateCard, !!draft.endDate && s.dateCardFilled]}
          onPress={() => setShowEnd(true)}
          activeOpacity={0.7}
        >
          <Calendar size={rs(20)} color={colors.click} strokeWidth={1.8} />
          <Text style={s.dateLabel}>
            {t('travel.dates.end', { defaultValue: 'Volta' })}
          </Text>
          <Text style={s.dateValue}>{fmt(draft.endDate)}</Text>
        </TouchableOpacity>
      </View>

      <DatePickerSheet
        visible={showStart}
        title={t('travel.dates.start', { defaultValue: 'Ida' })}
        initialDate={draft.startDate}
        maxDate={draft.endDate}
        onClose={() => setShowStart(false)}
        onPick={(iso) => {
          setDraft((d: DraftState) => {
            // Se a nova data de ida e DEPOIS da volta atual, limpa a volta
            const next: Partial<DraftState> = { startDate: iso };
            if (d.endDate && iso > d.endDate) next.endDate = null;
            return { ...d, ...next };
          });
        }}
      />

      <DatePickerSheet
        visible={showEnd}
        title={t('travel.dates.end', { defaultValue: 'Volta' })}
        // Se ainda nao tem volta selecionada, posiciona no dia da ida + 2
        // (default conservador: viagem curta de 2 dias). Se ja tem volta,
        // respeita o que o tutor escolheu.
        initialDate={draft.endDate ?? addDaysISO(draft.startDate, 2)}
        minDate={draft.startDate}
        onClose={() => setShowEnd(false)}
        onPick={(iso) => setDraft((d: DraftState) => ({ ...d, endDate: iso }))}
      />
    </View>
  );
}

function TransportStep({ draft, setDraft }: { draft: DraftState; setDraft: (d: any) => void }) {
  const { t } = useTranslation();
  return (
    <View style={s.cardsGrid}>
      {TRANSPORT_OPTIONS.map(({ id, Icon, key }) => {
        const selected = draft.transport === id;
        return (
          <TouchableOpacity
            key={id}
            style={[s.optionCard, selected && s.optionCardActive]}
            onPress={() => setDraft((d: DraftState) => ({ ...d, transport: id }))}
            activeOpacity={0.7}
          >
            <Icon size={rs(28)} color={selected ? '#FFFFFF' : colors.click} strokeWidth={1.8} />
            <Text style={[s.optionTxt, selected && s.optionTxtActive]}>{t(key)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PurposeStep({ draft, setDraft }: { draft: DraftState; setDraft: (d: any) => void }) {
  const { t } = useTranslation();
  return (
    <View style={s.cardsGrid}>
      {PURPOSE_OPTIONS.map(({ id, Icon, key }) => {
        const selected = draft.purpose === id;
        return (
          <TouchableOpacity
            key={id}
            style={[s.optionCard, selected && s.optionCardActive]}
            onPress={() => setDraft((d: DraftState) => ({ ...d, purpose: id }))}
            activeOpacity={0.7}
          >
            <Icon size={rs(28)} color={selected ? '#FFFFFF' : colors.click} strokeWidth={1.8} />
            <Text style={[s.optionTxt, selected && s.optionTxtActive]}>{t(key)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ConfirmStep({ draft, pets }: { draft: DraftState; pets: UserPet[] }) {
  const { t, i18n } = useTranslation();
  const rule = draft.countryCode ? TRAVEL_RULES[draft.countryCode] : undefined;
  const fmt = (d: string | null) => d ? new Date(d + 'T00:00:00').toLocaleDateString(
    i18n.language === 'pt-BR' ? 'pt-BR' : i18n.language,
    { day: '2-digit', month: 'short', year: 'numeric' }
  ) : '—';
  const partyLabel = (() => {
    if (draft.partySize <= 1) return null;
    const names = draft.partyNames.length > 0 ? ` (${draft.partyNames.join(', ')})` : '';
    return `${draft.partySize} ${t('travel.confirm.people', { defaultValue: 'pessoas' })}${names}`;
  })();
  const airportsLabel = (() => {
    if (!draft.originAirport && !draft.destinationAirport) return null;
    return `${draft.originAirport ?? '—'} → ${draft.destinationAirport ?? '—'}`;
  })();
  const petNames = draft.petIds
    .map((id) => pets.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(', ');
  return (
    <View style={s.confirmCard}>
      <Text style={s.confirmTitle}>{t('travel.new.confirm.title')}</Text>
      <View style={s.confirmRow}>
        <Text style={s.confirmFlag}>{rule?.flag ?? '🌍'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.confirmCountry}>
            {draft.countryName ?? (rule ? t(rule.countryNameKey, { defaultValue: draft.countryCode ?? '' }) : draft.countryCode)}
          </Text>
          {draft.city ? <Text style={s.confirmCity}>{draft.city}</Text> : null}
        </View>
      </View>
      <View style={s.confirmDivider} />
      <Text style={s.confirmField}>{fmt(draft.startDate)} → {fmt(draft.endDate)}</Text>
      {draft.transport ? <Text style={s.confirmField}>{t(`travel.transport.${draft.transport}`)}</Text> : null}
      {airportsLabel ? <Text style={s.confirmField}>✈️ {airportsLabel}</Text> : null}
      {draft.purpose ? <Text style={s.confirmField}>{t(`travel.purpose.${draft.purpose}`)}</Text> : null}
      {partyLabel ? <Text style={s.confirmField}>👥 {partyLabel}</Text> : null}
      {petNames ? (
        <Text style={s.confirmField}>🐾 {petNames}</Text>
      ) : null}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  title: { color: colors.text, fontSize: fs(17), fontWeight: '700' },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: rs(6), paddingVertical: spacing.sm },
  progressDot: {
    width: rs(36), height: rs(4), borderRadius: rs(2),
    backgroundColor: colors.border,
  },
  progressDotActive: { backgroundColor: colors.click },
  body: { padding: spacing.md, paddingBottom: rs(40) },
  question: { color: colors.text, fontSize: fs(20), fontWeight: '700', textAlign: 'center', marginBottom: rs(12) },
  transcript: { color: colors.click, fontSize: fs(16), textAlign: 'center', marginBottom: rs(12), fontStyle: 'italic' },
  voiceWrap: { alignItems: 'center', marginTop: rs(24), gap: rs(12) },
  parsing: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  parsingTxt: { color: colors.textSec, fontSize: fs(12) },
  selectedCard: {
    alignItems: 'center', padding: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.clickSoft, borderRadius: radii.card,
    borderWidth: 1, borderColor: colors.click + '40',
  },
  selectedFlag: { fontSize: fs(56) },
  selectedName: { color: colors.text, fontSize: fs(20), fontWeight: '700', marginTop: rs(8) },
  selectedCity: { color: colors.textSec, fontSize: fs(13), marginTop: rs(2) },
  gridLabel: { color: colors.textDim, fontSize: fs(11), fontWeight: '700', letterSpacing: 1.2, marginBottom: rs(8) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  flagBtn: {
    width: rs(64), height: rs(64), borderRadius: radii.lg,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', gap: rs(2),
  },
  flagBtnActive: { backgroundColor: colors.click, borderColor: colors.click },
  flagEmoji: { fontSize: fs(24) },
  flagCode: { color: colors.textSec, fontSize: fs(10), fontWeight: '700' },
  flagCodeActive: { color: '#FFFFFF' },
  dateRow: { flexDirection: 'row', gap: rs(12) },
  dateCard: {
    flex: 1, padding: spacing.md, alignItems: 'center', gap: rs(6),
    backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border,
  },
  dateCardFilled: { borderColor: colors.click + '60', backgroundColor: colors.click + '08' },
  dateLabel: { color: colors.textDim, fontSize: fs(11), fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  dateValue: { color: colors.text, fontSize: fs(14), fontWeight: '700' },
  // Pets step
  petsTitle: { color: colors.text, fontSize: fs(20), fontWeight: '700', marginBottom: rs(6), textAlign: 'center' },
  petsHint: { color: colors.textSec, fontSize: fs(13), textAlign: 'center', marginBottom: rs(20) },
  petsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), justifyContent: 'center' },
  petCard: {
    width: '30%', minWidth: rs(96),
    padding: spacing.sm,
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', gap: rs(8),
    position: 'relative',
  },
  petCardSelected: { borderColor: colors.click, backgroundColor: colors.click + '10' },
  petAvatar: {
    width: rs(64), height: rs(64), borderRadius: rs(20),
    borderWidth: 2,
    backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  petAvatarImg: { width: '100%', height: '100%' },
  petName: { color: colors.text, fontSize: fs(13), fontWeight: '700', textAlign: 'center' },
  petNameSelected: { color: colors.click },
  petBreed: { color: colors.textDim, fontSize: fs(10), textAlign: 'center', marginTop: rs(-2) },
  petCheck: {
    position: 'absolute', top: rs(6), right: rs(6),
    width: rs(20), height: rs(20), borderRadius: rs(10),
    backgroundColor: colors.click,
    alignItems: 'center', justifyContent: 'center',
  },
  petsEmpty: { padding: spacing.lg, alignItems: 'center', gap: rs(10) },
  petsEmptyTitle: { color: colors.text, fontSize: fs(16), fontWeight: '700', textAlign: 'center' },
  petsEmptyDesc: { color: colors.textSec, fontSize: fs(13), textAlign: 'center' },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), justifyContent: 'center' },
  optionCard: {
    width: '30%', minWidth: rs(96),
    aspectRatio: 1, padding: spacing.sm,
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', gap: rs(8),
  },
  optionCardActive: { backgroundColor: colors.click, borderColor: colors.click },
  optionTxt: { color: colors.text, fontSize: fs(12), fontWeight: '600' },
  optionTxtActive: { color: '#FFFFFF' },
  confirmCard: {
    padding: spacing.lg, backgroundColor: colors.card,
    borderRadius: radii.card, borderWidth: 1, borderColor: colors.border,
    gap: rs(10),
  },
  confirmTitle: { color: colors.textDim, fontSize: fs(11), fontWeight: '700', letterSpacing: 1.2, marginBottom: rs(8) },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: rs(14) },
  confirmFlag: { fontSize: fs(40) },
  confirmCountry: { color: colors.text, fontSize: fs(20), fontWeight: '700' },
  confirmCity: { color: colors.textSec, fontSize: fs(13), marginTop: rs(2) },
  confirmDivider: { height: 1, backgroundColor: colors.border, marginVertical: rs(6) },
  confirmField: { color: colors.text, fontSize: fs(14) },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  cta: {
    backgroundColor: colors.click, padding: rs(14), borderRadius: radii.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8),
  },
  ctaDisabled: { opacity: 0.5 },
  ctaTxt: { color: '#FFFFFF', fontSize: fs(15), fontWeight: '700' },
});
