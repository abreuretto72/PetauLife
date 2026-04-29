/**
 * components/lenses/FeedSheet.tsx
 *
 * Bottom sheet GENÉRICO de feed estilo Instagram. Usado pelos painéis
 * Amigos e Viagens — quando o tutor toca num card, abre uma timeline
 * vertical com fotos grandes + narração da IA + data + chips.
 *
 * Cada "post" representa uma menção no diário (1 row da tabela origem).
 * Sem foto na entrada → fallback com avatar do pet titular + ícone temático.
 *
 * Uso:
 *   <FeedSheet
 *     visible={open}
 *     onClose={() => setOpen(false)}
 *     title="Mana & Pico"      // header do sheet
 *     subtitle="3 encontros"   // hint embaixo do título
 *     headerColor={colors.click}
 *     posts={[
 *       { id, date, narration, notes, cover_url, photos, chips },
 *       ...
 *     ]}
 *     petAvatarUrl="..."       // avatar do pet titular (fallback sem foto)
 *     fallbackIcon={PawPrint}   // ícone temático do contexto
 *   />
 */
import React, { useCallback } from 'react';
import {
  Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, Image,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, Inbox } from 'lucide-react-native';

import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { rs, fs } from '../../hooks/useResponsive';

export interface FeedPost {
  id: string;
  date: string | null;
  narration: string | null;
  notes: string | null;
  cover_url: string | null;
  photos: string[];
  /** Chips opcionais (mood, contexto, tags). Cor opcional. */
  chips?: Array<{ label: string; color?: string }>;
}

type IconCmp = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerColor?: string;
  posts: FeedPost[];
  /** Avatar do pet titular — usado quando o post não tem foto. */
  petAvatarUrl?: string | null;
  /** Ícone temático (PawPrint pra Amigos, MapPin pra Viagens). */
  FallbackIcon: IconCmp;
}

function formatDate(iso: string | null, lang: string): string {
  if (!iso) return '—';
  // ISO local — evita o bug UTC-3 do new Date("yyyy-mm-dd")
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dt = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(iso);
  if (isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString(lang, { day: '2-digit', month: 'short', year: 'numeric' });
}

const PostCard = React.memo(function PostCard({
  post, petAvatarUrl, FallbackIcon, headerColor, lang,
}: {
  post: FeedPost;
  petAvatarUrl?: string | null;
  FallbackIcon: IconCmp;
  headerColor: string;
  lang: string;
}) {
  const cover = post.cover_url ?? post.photos[0] ?? null;
  const dateLabel = formatDate(post.date, lang);

  return (
    <View style={s.post}>
      {/* Cover ou fallback */}
      {cover ? (
        <Image source={{ uri: cover }} style={s.postCover} resizeMode="cover" />
      ) : (
        <View style={[s.postFallback, { backgroundColor: headerColor + '12' }]}>
          {petAvatarUrl ? (
            <Image source={{ uri: petAvatarUrl }} style={s.fallbackAvatar} resizeMode="cover" />
          ) : (
            <View style={[s.fallbackAvatarEmpty, { backgroundColor: headerColor + '20' }]}>
              <FallbackIcon size={rs(28)} color={headerColor} strokeWidth={1.6} />
            </View>
          )}
          <FallbackIcon size={rs(20)} color={headerColor} strokeWidth={1.8} style={{ position: 'absolute', bottom: rs(12), right: rs(12) }} />
        </View>
      )}

      {/* Galeria horizontal — só aparece se tem mais de 1 foto */}
      {post.photos.length > 1 && (
        <View style={s.gallery}>
          {post.photos.slice(1, 5).map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={s.galleryThumb} resizeMode="cover" />
          ))}
          {post.photos.length > 5 && (
            <View style={[s.galleryThumb, s.galleryMore]}>
              <Text style={s.galleryMoreText}>+{post.photos.length - 5}</Text>
            </View>
          )}
        </View>
      )}

      {/* Body */}
      <View style={s.postBody}>
        <Text style={s.postDate}>{dateLabel}</Text>

        {post.narration && (
          <Text style={s.postNarration}>{post.narration.trim()}</Text>
        )}

        {!post.narration && post.notes && (
          <Text style={s.postNotes}>{post.notes.trim()}</Text>
        )}

        {(post.chips?.length ?? 0) > 0 && (
          <View style={s.chipsRow}>
            {post.chips!.map((chip, i) => {
              const c = chip.color ?? colors.textDim;
              return (
                <View key={i} style={[s.chip, { backgroundColor: c + '14', borderColor: c + '28' }]}>
                  <Text style={[s.chipText, { color: c }]}>{chip.label}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
});

export function FeedSheet({
  visible, onClose, title, subtitle, headerColor = colors.click,
  posts, petAvatarUrl, FallbackIcon,
}: Props) {
  const { t, i18n } = useTranslation();

  const renderItem = useCallback(({ item }: { item: FeedPost }) => (
    <PostCard
      post={item}
      petAvatarUrl={petAvatarUrl}
      FallbackIcon={FallbackIcon}
      headerColor={headerColor}
      lang={i18n.language}
    />
  ), [petAvatarUrl, FallbackIcon, headerColor, i18n.language]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.handleBar} />

          <View style={s.header}>
            <View style={s.headerTextWrap}>
              <Text style={s.title} numberOfLines={1}>{title}</Text>
              {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <X size={rs(22)} color={colors.textSec} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          {posts.length === 0 ? (
            <View style={s.emptyBox}>
              <Inbox size={rs(36)} color={colors.textGhost} strokeWidth={1.4} />
              <Text style={s.emptyTitle}>
                {t('feed.empty', { defaultValue: 'Nenhum registro ainda' })}
              </Text>
            </View>
          ) : (
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={s.list}
              ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
              showsVerticalScrollIndicator={false}
            />
          )}
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
    minHeight: '60%',
    paddingBottom: rs(20),
  },
  handleBar: {
    width: rs(40),
    height: rs(4),
    backgroundColor: colors.textGhost,
    borderRadius: rs(2),
    alignSelf: 'center',
    marginTop: rs(10),
    marginBottom: rs(8),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: fs(17),
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fs(11),
    color: colors.textDim,
    marginTop: rs(2),
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  // Post card
  post: {
    backgroundColor: colors.card,
    borderRadius: rs(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  postCover: {
    width: '100%',
    aspectRatio: 4 / 5, // Instagram clássico
    backgroundColor: colors.bgDeep,
  },
  postFallback: {
    width: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackAvatar: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    borderWidth: 3,
    borderColor: colors.bg,
  },
  fallbackAvatarEmpty: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Galeria
  gallery: {
    flexDirection: 'row',
    gap: rs(2),
    paddingHorizontal: rs(2),
    paddingTop: rs(2),
  },
  galleryThumb: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.bgDeep,
  },
  galleryMore: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgDeep,
  },
  galleryMoreText: {
    fontSize: fs(13),
    fontWeight: '700',
    color: colors.textSec,
  },

  // Body
  postBody: {
    padding: rs(14),
    gap: rs(8),
  },
  postDate: {
    fontSize: fs(10),
    color: colors.textDim,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  postNarration: {
    fontSize: fs(14),
    color: colors.text,
    lineHeight: fs(21),
    fontStyle: 'italic',
  },
  postNotes: {
    fontSize: fs(13),
    color: colors.textSec,
    lineHeight: fs(19),
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(6),
    marginTop: rs(2),
  },
  chip: {
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
    borderRadius: rs(8),
    borderWidth: 1,
  },
  chipText: {
    fontSize: fs(10),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Empty
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: rs(10),
    minHeight: rs(240),
  },
  emptyTitle: {
    fontSize: fs(13),
    color: colors.textDim,
    textAlign: 'center',
  },
});
