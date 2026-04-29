/**
 * components/lenses/AddFriendSheet.tsx
 *
 * Bottom sheet pro tutor adicionar um amigo do pet diretamente do painel
 * (sem precisar passar pelo diário). Persiste em `pet_connections` —
 * trigger automático manda pro RAG (a IA aprende em segundos).
 *
 * Fluxo Elite (zero atrito):
 *   1. Mic + texto pra "Quem é o amigo?" (nome livre)
 *   2. Chips de espécie (Cão, Gato, Pássaro, Outro)
 *   3. Chips de tipo (Amigo, Coleguinha, Vizinho, Parente)
 *   4. Anexar até 4 fotos (galeria ou câmera)
 *   5. Mic + texto pra história do encontro (notes)
 *   6. Salvar
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
  Dog, Cat, Bird, PawPrint,
} from 'lucide-react-native';

import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { rs, fs } from '../../hooks/useResponsive';
import { useToast } from '../Toast';
import { useSimpleSTT } from '../../hooks/useSimpleSTT';
import { supabase } from '../../lib/supabase';
import { getErrorMessage } from '../../utils/errorMessages';

const MAX_PHOTOS = 4;

type Species = 'dog' | 'cat' | 'bird' | 'other';
type ConnectionType = 'friend' | 'playmate' | 'neighbor' | 'relative';

const SPECIES_OPTIONS: Array<{ value: Species; icon: React.ElementType; labelKey: string }> = [
  { value: 'dog',   icon: Dog,       labelKey: 'friends.species_dog' },
  { value: 'cat',   icon: Cat,       labelKey: 'friends.species_cat' },
  { value: 'bird',  icon: Bird,      labelKey: 'friends.species_bird' },
  { value: 'other', icon: PawPrint,  labelKey: 'friends.species_other' },
];

const CONNECTION_OPTIONS: ConnectionType[] = ['friend', 'playmate', 'neighbor', 'relative'];

interface Props {
  visible: boolean;
  onClose: () => void;
  petId: string;
}

export function AddFriendSheet({ visible, onClose, petId }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [friendName, setFriendName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [connectionType, setConnectionType] = useState<ConnectionType>('friend');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // STT — só commita texto quando recebe transcript final (evita flood de
  // resultados intermediários no campo durante a fala)
  const nameSTT = useSimpleSTT({
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        setFriendName((prev) => prev + (prev ? ' ' : '') + text.trim());
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
    setFriendName('');
    setSpecies('dog');
    setConnectionType('friend');
    setNotes('');
    setPhotos([]);
    nameSTT.stop();
    notesSTT.stop();
  }, [nameSTT, notesSTT]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // ── Upload de mídia ────────────────────────────────────────────────────────
  const uploadPhoto = useCallback(async (uri: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast(t('errors.sessionExpired'), 'error');
        return null;
      }
      const filename = `${user.id}/friends/${petId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const { error } = await supabase.storage.from('pet-photos').upload(filename, bytes, {
        contentType: 'image/jpeg', upsert: false,
      });
      if (error) throw error;
      const { data: pub } = supabase.storage.from('pet-photos').getPublicUrl(filename);
      return pub.publicUrl;
    } catch (e) {
      console.warn('[AddFriendSheet] upload error:', e);
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
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.88,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    const url = await uploadPhoto(result.assets[0].uri);
    setUploading(false);
    if (url) setPhotos((prev) => [...prev, url]);
  }, [photos.length, uploadPhoto, t, toast]);

  const addFromGallery = useCallback(async () => {
    const slotsLeft = MAX_PHOTOS - photos.length;
    if (slotsLeft <= 0) {
      toast(t('addFriend.maxPhotosReached', { defaultValue: `Máximo ${MAX_PHOTOS} fotos.` }), 'warning');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.88,
      allowsMultipleSelection: true,
      selectionLimit: slotsLeft,
    });
    if (result.canceled) return;
    setUploading(true);
    const uploads = await Promise.all(result.assets.map((a) => uploadPhoto(a.uri)));
    setUploading(false);
    const ok = uploads.filter((u): u is string => !!u);
    setPhotos((prev) => [...prev, ...ok]);
  }, [photos.length, uploadPhoto, t, toast]);

  const removePhoto = useCallback((idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // ── Salvar ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (friendName.trim().length < 1) {
      toast(t('addFriend.nameRequired', { defaultValue: 'Informe o nome do amigo.' }), 'warning');
      return;
    }
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast(t('errors.sessionExpired'), 'error');
        return;
      }
      const { error } = await supabase.from('pet_connections').insert({
        pet_id: petId,
        user_id: user.id,
        friend_name: friendName.trim(),
        friend_species: species,
        connection_type: connectionType,
        first_met_at: today,
        last_seen_at: today,
        notes: notes.trim() || null,
        photos: photos.length > 0 ? photos : null,
        cover_url: photos[0] ?? null,
      });
      if (error) throw error;

      // Invalida o cache do painel pra refletir imediatamente.
      // O trigger AFTER INSERT em pet_connections já dispara reembed-pet-multi
      // automaticamente — RAG aprende sem código adicional aqui.
      await qc.invalidateQueries({ queryKey: ['pets', petId, 'lens', 'friends'] });

      toast(t('addFriend.saved', { defaultValue: 'Amigo registrado.' }), 'success');
      handleClose();
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  }, [friendName, species, connectionType, notes, photos, petId, qc, t, toast, handleClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={s.backdrop} onPress={handleClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.handleBar} />

          <View style={s.header}>
            <Text style={s.title}>{t('addFriend.title', { defaultValue: 'Adicionar amigo' })}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <X size={rs(22)} color={colors.textSec} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Nome */}
            <Text style={s.label}>{t('addFriend.nameLabel', { defaultValue: 'Nome do amigo' })}</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                value={friendName}
                onChangeText={setFriendName}
                placeholder={t('addFriend.namePlaceholder', { defaultValue: 'Ex: Bento, Maluquinho, Mel...' })}
                placeholderTextColor={colors.textDim}
              />
              {nameSTT.isAvailable && (
                <TouchableOpacity
                  onPress={nameSTT.toggle}
                  style={[s.micBtn, nameSTT.isListening && s.micBtnActive]}
                  hitSlop={8}
                >
                  {nameSTT.isListening
                    ? <Square size={rs(16)} color="#fff" fill="#fff" />
                    : <Mic size={rs(18)} color={colors.click} strokeWidth={1.8} />}
                </TouchableOpacity>
              )}
            </View>

            {/* Espécie */}
            <Text style={s.label}>{t('addFriend.speciesLabel', { defaultValue: 'Espécie' })}</Text>
            <View style={s.chipsRow}>
              {SPECIES_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = species === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => setSpecies(opt.value)}
                  >
                    <Icon size={rs(13)} color={active ? '#fff' : colors.textSec} strokeWidth={1.8} />
                    <Text style={[s.chipText, active && s.chipTextActive]}>
                      {t(opt.labelKey, { defaultValue: opt.value })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tipo de relação */}
            <Text style={s.label}>{t('addFriend.typeLabel', { defaultValue: 'Tipo de relação' })}</Text>
            <View style={s.chipsRow}>
              {CONNECTION_OPTIONS.map((tipo) => {
                const active = connectionType === tipo;
                return (
                  <TouchableOpacity
                    key={tipo}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => setConnectionType(tipo)}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>
                      {t(`friends.type${tipo[0].toUpperCase()}${tipo.slice(1)}`, { defaultValue: tipo })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Fotos */}
            <Text style={s.label}>
              {t('addFriend.photosLabel', { defaultValue: 'Fotos' })} ({photos.length}/{MAX_PHOTOS})
            </Text>
            <View style={s.photosRow}>
              {photos.map((uri, idx) => (
                <View key={idx} style={s.photoBox}>
                  <Image source={{ uri }} style={s.photo} resizeMode="cover" />
                  <TouchableOpacity
                    style={s.photoRemove}
                    onPress={() => removePhoto(idx)}
                    hitSlop={6}
                  >
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

            {/* Histórico/notas */}
            <Text style={s.label}>{t('addFriend.notesLabel', { defaultValue: 'Como foi o encontro?' })}</Text>
            <View style={s.textareaWrap}>
              <TextInput
                style={s.textarea}
                value={notes}
                onChangeText={setNotes}
                placeholder={t('addFriend.notesPlaceholder', { defaultValue: 'Conte como conheceram, o que aconteceu...' })}
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 18, 25, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    maxHeight: '92%',
    minHeight: '70%',
  },
  handleBar: {
    width: rs(40), height: rs(4),
    backgroundColor: colors.textGhost,
    borderRadius: rs(2),
    alignSelf: 'center',
    marginTop: rs(10), marginBottom: rs(8),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fs(17), fontWeight: '700', color: colors.text,
  },
  scrollBody: {
    padding: spacing.lg,
    paddingBottom: rs(36),
  },

  label: {
    fontSize: fs(11),
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: rs(14),
    marginBottom: rs(6),
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: rs(12),
    color: colors.text,
    fontSize: fs(14),
  },
  micBtn: {
    width: rs(44), height: rs(44),
    borderRadius: rs(22),
    borderWidth: 1.5,
    borderColor: colors.click,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.clickSoft,
  },
  micBtnFloat: {
    position: 'absolute',
    right: rs(8), top: rs(8),
    width: rs(34), height: rs(34),
    borderRadius: rs(17),
    borderWidth: 1.5,
    borderColor: colors.click,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.clickSoft,
  },
  micBtnActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(6),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(5),
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: {
    backgroundColor: colors.click,
    borderColor: colors.click,
  },
  chipText: {
    fontSize: fs(12),
    color: colors.textSec,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },

  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(8),
  },
  photoBox: {
    width: rs(72), height: rs(72),
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.bgDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute',
    top: rs(4), right: rs(4),
    width: rs(20), height: rs(20),
    borderRadius: rs(10),
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoAdd: {
    width: rs(72), height: rs(72),
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.click,
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.clickSoft,
  },

  textareaWrap: {
    position: 'relative',
  },
  textarea: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: rs(12),
    paddingRight: rs(50),
    color: colors.text,
    fontSize: fs(13),
    minHeight: rs(96),
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: rs(8),
    backgroundColor: colors.click,
    paddingVertical: rs(14),
    borderRadius: radii.lg,
    marginTop: rs(20),
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '700',
  },
});
