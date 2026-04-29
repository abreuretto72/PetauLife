/**
 * components/lenses/AddTravelSheet.tsx
 *
 * Bottom sheet pro tutor adicionar uma viagem do pet diretamente do painel.
 * Persiste em `pet_travels` — trigger automático manda pro RAG.
 */
import React, { useCallback, useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView,
  TextInput, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  X, Camera, ImagePlus, Mic, Square, Save, Trash2,
  Car, Plane, MapPin, Globe, Tent, Navigation,
} from 'lucide-react-native';

import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { rs, fs } from '../../hooks/useResponsive';
import { useToast } from '../Toast';
import { useSimpleSTT } from '../../hooks/useSimpleSTT';
import { supabase } from '../../lib/supabase';
import { getErrorMessage } from '../../utils/errorMessages';

const MAX_PHOTOS = 4;

type TravelType = 'road_trip' | 'flight' | 'local' | 'international' | 'camping' | 'other';
type TravelStatus = 'planned' | 'active' | 'completed';

const TYPE_OPTIONS: Array<{ value: TravelType; icon: React.ElementType; labelKey: string }> = [
  { value: 'road_trip',     icon: Car,        labelKey: 'travels.typeRoadTrip' },
  { value: 'flight',        icon: Plane,      labelKey: 'travels.typeFlight' },
  { value: 'local',         icon: MapPin,     labelKey: 'travels.typeLocal' },
  { value: 'international', icon: Globe,      labelKey: 'travels.typeInternational' },
  { value: 'camping',       icon: Tent,       labelKey: 'travels.typeCamping' },
  { value: 'other',         icon: Navigation, labelKey: 'travels.typeOther' },
];

const STATUS_OPTIONS: TravelStatus[] = ['completed', 'active', 'planned'];

interface Props {
  visible: boolean;
  onClose: () => void;
  petId: string;
}

export function AddTravelSheet({ visible, onClose, petId }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [destination, setDestination] = useState('');
  const [region, setRegion] = useState('');
  const [travelType, setTravelType] = useState<TravelType>('road_trip');
  const [status, setStatus] = useState<TravelStatus>('completed');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const destSTT = useSimpleSTT({
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        setDestination((prev) => prev + (prev ? ' ' : '') + text.trim());
      }
    },
  });
  const notesSTT = useSimpleSTT({
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        setNotes((prev) => prev + (prev ? ' ' : '') + text.trim());
      }
    },
  });

  const reset = useCallback(() => {
    setDestination(''); setRegion(''); setTravelType('road_trip');
    setStatus('completed'); setStartDate(''); setEndDate('');
    setNotes(''); setPhotos([]);
    destSTT.stop(); notesSTT.stop();
  }, [destSTT, notesSTT]);

  const handleClose = useCallback(() => {
    reset(); onClose();
  }, [reset, onClose]);

  const uploadPhoto = useCallback(async (uri: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast(t('errors.sessionExpired'), 'error');
        return null;
      }
      const filename = `${user.id}/travels/${petId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const { error } = await supabase.storage.from('pet-photos').upload(filename, bytes, {
        contentType: 'image/jpeg', upsert: false,
      });
      if (error) throw error;
      const { data: pub } = supabase.storage.from('pet-photos').getPublicUrl(filename);
      return pub.publicUrl;
    } catch (e) {
      console.warn('[AddTravelSheet] upload error:', e);
      toast(getErrorMessage(e), 'error');
      return null;
    }
  }, [petId, t, toast]);

  const addFromCamera = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) {
      toast(t('addFriend.maxPhotosReached', { defaultValue: `Máximo ${MAX_PHOTOS} fotos.` }), 'warning');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], allowsEditing: false, quality: 0.88,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    const url = await uploadPhoto(result.assets[0].uri);
    setUploading(false);
    if (url) setPhotos((prev) => [...prev, url]);
  }, [photos.length, uploadPhoto, t, toast]);

  const addFromGallery = useCallback(async () => {
    const slotsLeft = MAX_PHOTOS - photos.length;
    if (slotsLeft <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: false, quality: 0.88,
      allowsMultipleSelection: true, selectionLimit: slotsLeft,
    });
    if (result.canceled) return;
    setUploading(true);
    const uploads = await Promise.all(result.assets.map((a) => uploadPhoto(a.uri)));
    setUploading(false);
    const ok = uploads.filter((u): u is string => !!u);
    setPhotos((prev) => [...prev, ...ok]);
  }, [photos.length, uploadPhoto]);

  const removePhoto = useCallback((idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSave = useCallback(async () => {
    if (destination.trim().length < 1) {
      toast(t('addTravel.destinationRequired', { defaultValue: 'Informe o destino.' }), 'warning');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast(t('errors.sessionExpired'), 'error');
        return;
      }
      const { error } = await supabase.from('pet_travels').insert({
        pet_id: petId,
        user_id: user.id,
        destination: destination.trim(),
        region: region.trim() || null,
        travel_type: travelType,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        notes: notes.trim() || null,
        photos: photos.length > 0 ? photos : null,
        cover_url: photos[0] ?? null,
        source: 'manual',
      });
      if (error) throw error;

      // Trigger AFTER INSERT em pet_travels já dispara reembed-pet-multi.
      await qc.invalidateQueries({ queryKey: ['pets', petId, 'lens', 'travels'] });

      toast(t('addTravel.saved', { defaultValue: 'Viagem registrada.' }), 'success');
      handleClose();
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  }, [destination, region, travelType, status, startDate, endDate, notes, photos, petId, qc, t, toast, handleClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={s.backdrop} onPress={handleClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.handleBar} />

          <View style={s.header}>
            <Text style={s.title}>{t('addTravel.title', { defaultValue: 'Adicionar viagem' })}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <X size={rs(22)} color={colors.textSec} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Destino */}
            <Text style={s.label}>{t('addTravel.destinationLabel', { defaultValue: 'Destino' })}</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                value={destination}
                onChangeText={setDestination}
                placeholder={t('addTravel.destinationPlaceholder', { defaultValue: 'Ex: Campos do Jordão, Floripa, Roma...' })}
                placeholderTextColor={colors.textDim}
              />
              {destSTT.isAvailable && (
                <TouchableOpacity
                  onPress={destSTT.toggle}
                  style={[s.micBtn, destSTT.isListening && s.micBtnActive]}
                  hitSlop={8}
                >
                  {destSTT.isListening
                    ? <Square size={rs(16)} color="#fff" fill="#fff" />
                    : <Mic size={rs(18)} color={colors.click} strokeWidth={1.8} />}
                </TouchableOpacity>
              )}
            </View>

            {/* Região */}
            <Text style={s.label}>{t('addTravel.regionLabel', { defaultValue: 'Estado/País (opcional)' })}</Text>
            <TextInput
              style={s.input}
              value={region}
              onChangeText={setRegion}
              placeholder={t('addTravel.regionPlaceholder', { defaultValue: 'SP · Brasil · Itália...' })}
              placeholderTextColor={colors.textDim}
            />

            {/* Tipo */}
            <Text style={s.label}>{t('addTravel.typeLabel', { defaultValue: 'Tipo de viagem' })}</Text>
            <View style={s.chipsRow}>
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = travelType === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => setTravelType(opt.value)}
                  >
                    <Icon size={rs(13)} color={active ? '#fff' : colors.textSec} strokeWidth={1.8} />
                    <Text style={[s.chipText, active && s.chipTextActive]}>
                      {t(opt.labelKey, { defaultValue: opt.value })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Status */}
            <Text style={s.label}>{t('addTravel.statusLabel', { defaultValue: 'Status' })}</Text>
            <View style={s.chipsRow}>
              {STATUS_OPTIONS.map((st) => {
                const active = status === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => setStatus(st)}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>
                      {t(`travels.status_${st}`, { defaultValue: st })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Datas */}
            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>{t('addTravel.startDateLabel', { defaultValue: 'Saída' })}</Text>
                <TextInput
                  style={s.input}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={colors.textDim}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>{t('addTravel.endDateLabel', { defaultValue: 'Retorno' })}</Text>
                <TextInput
                  style={s.input}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            </View>

            {/* Fotos */}
            <Text style={s.label}>
              {t('addTravel.photosLabel', { defaultValue: 'Fotos' })} ({photos.length}/{MAX_PHOTOS})
            </Text>
            <View style={s.photosRow}>
              {photos.map((uri, idx) => (
                <View key={idx} style={s.photoBox}>
                  <Image source={{ uri }} style={s.photo} resizeMode="cover" />
                  <TouchableOpacity style={s.photoRemove} onPress={() => removePhoto(idx)} hitSlop={6}>
                    <Trash2 size={rs(12)} color="#fff" strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <>
                  <TouchableOpacity style={s.photoAdd} onPress={addFromCamera} disabled={uploading}>
                    <Camera size={rs(18)} color={colors.click} strokeWidth={1.8} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.photoAdd} onPress={addFromGallery} disabled={uploading}>
                    <ImagePlus size={rs(18)} color={colors.click} strokeWidth={1.8} />
                  </TouchableOpacity>
                </>
              )}
              {uploading && (
                <View style={s.photoBox}>
                  <ActivityIndicator size="small" color={colors.click} />
                </View>
              )}
            </View>

            {/* Notas */}
            <Text style={s.label}>{t('addTravel.notesLabel', { defaultValue: 'Como foi a viagem?' })}</Text>
            <View style={s.textareaWrap}>
              <TextInput
                style={s.textarea}
                value={notes}
                onChangeText={setNotes}
                placeholder={t('addTravel.notesPlaceholder', { defaultValue: 'Conte os melhores momentos, paradas, descobertas...' })}
                placeholderTextColor={colors.textDim}
                multiline
                textAlignVertical="top"
              />
              {notesSTT.isAvailable && (
                <TouchableOpacity
                  onPress={notesSTT.toggle}
                  style={[s.micBtnFloat, notesSTT.isListening && s.micBtnActive]}
                  hitSlop={8}
                >
                  {notesSTT.isListening
                    ? <Square size={rs(14)} color="#fff" fill="#fff" />
                    : <Mic size={rs(16)} color={colors.click} strokeWidth={1.8} />}
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[s.saveBtn, saving && s.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving || uploading}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Save size={rs(16)} color="#fff" strokeWidth={2} />
                  <Text style={s.saveBtnText}>{t('common.save', { defaultValue: 'Salvar' })}</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11, 18, 25, 0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24),
    maxHeight: '92%', minHeight: '70%',
  },
  handleBar: {
    width: rs(40), height: rs(4),
    backgroundColor: colors.textGhost, borderRadius: rs(2),
    alignSelf: 'center', marginTop: rs(10), marginBottom: rs(8),
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: fs(17), fontWeight: '700', color: colors.text },
  scrollBody: { padding: spacing.lg, paddingBottom: rs(36) },

  label: {
    fontSize: fs(11), fontWeight: '700',
    color: colors.textDim, letterSpacing: 0.6, textTransform: 'uppercase',
    marginTop: rs(14), marginBottom: rs(6),
  },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  input: {
    flex: 1, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg,
    padding: rs(12), color: colors.text, fontSize: fs(14),
  },
  micBtn: {
    width: rs(44), height: rs(44), borderRadius: rs(22),
    borderWidth: 1.5, borderColor: colors.click,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.clickSoft,
  },
  micBtnFloat: {
    position: 'absolute', right: rs(8), top: rs(8),
    width: rs(34), height: rs(34), borderRadius: rs(17),
    borderWidth: 1.5, borderColor: colors.click,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.clickSoft,
  },
  micBtnActive: { backgroundColor: colors.danger, borderColor: colors.danger },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(6) },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    paddingHorizontal: rs(12), paddingVertical: rs(8),
    borderRadius: rs(20), borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.click, borderColor: colors.click },
  chipText: { fontSize: fs(12), color: colors.textSec, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  row2: { flexDirection: 'row', gap: rs(10) },

  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  photoBox: {
    width: rs(72), height: rs(72), borderRadius: radii.md, overflow: 'hidden',
    position: 'relative', backgroundColor: colors.bgDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute', top: rs(4), right: rs(4),
    width: rs(20), height: rs(20), borderRadius: rs(10),
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoAdd: {
    width: rs(72), height: rs(72),
    borderRadius: radii.md,
    borderWidth: 1.5, borderColor: colors.click, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.clickSoft,
  },

  textareaWrap: { position: 'relative' },
  textarea: {
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg,
    padding: rs(12), paddingRight: rs(50),
    color: colors.text, fontSize: fs(13), minHeight: rs(96),
  },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(8),
    backgroundColor: colors.click,
    paddingVertical: rs(14), borderRadius: radii.lg,
    marginTop: rs(20),
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: fs(14), fontWeight: '700' },
});
