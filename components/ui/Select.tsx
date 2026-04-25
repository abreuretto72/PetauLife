/**
 * Select — dropdown de seleção única com bottom sheet.
 *
 * Padrão do app: campo com label que abre Modal bottom sheet ao tocar,
 * lista as opções (com ícone + label + sublabel opcionais), seleciona e
 * fecha. Mesma estética dos outros campos (Input, etc.).
 *
 * Uso típico:
 *   <Select
 *     label="Qual pet?"
 *     placeholder="Selecione um pet"
 *     value={petId}
 *     options={pets.map(p => ({ value: p.id, label: p.name, sublabel: p.breed,
 *                                icon: p.species === 'dog' ? Dog : Cat }))}
 *     onChange={setPetId}
 *   />
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable, FlatList,
  StyleSheet, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { rs, fs } from '../../hooks/useResponsive';

export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
  /** Texto secundário pequeno embaixo do label (raça, descrição, etc.). */
  sublabel?: string;
  /** Componente de ícone (lucide-react-native). */
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  /** URL de imagem (alternativa ao icon — ex: avatar do pet). */
  imageUri?: string | null;
  /** Cor do ícone/badge (default = colors.click). */
  color?: string;
  /** Marca opção como desabilitada visualmente. */
  disabled?: boolean;
}

interface SelectProps<V extends string = string> {
  /** Valor atual (controlado). String vazia = nada selecionado. */
  value: V | '';
  /** Lista de opções. */
  options: SelectOption<V>[];
  /** Callback ao selecionar. */
  onChange: (value: V) => void;
  /** Placeholder quando vazio. */
  placeholder?: string;
  /** Título do bottom sheet (opcional — default = placeholder). */
  sheetTitle?: string;
  /** Desabilita o select inteiro. */
  disabled?: boolean;
}

export function Select<V extends string = string>({
  value, options, onChange,
  placeholder = 'Selecione',
  sheetTitle,
  disabled,
}: SelectProps<V>) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const Icon = selected?.icon;
  const iconColor = selected?.color ?? colors.click;

  return (
    <>
      <TouchableOpacity
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.7}
        style={[styles.field, disabled && styles.fieldDisabled]}
        accessibilityRole="button"
      >
        {/* Avatar/Ícone à esquerda */}
        {selected?.imageUri ? (
          <Image source={{ uri: selected.imageUri }} style={styles.fieldAvatar} />
        ) : Icon ? (
          <View style={[styles.fieldIconWrap, { borderColor: iconColor + '40', backgroundColor: iconColor + '14' }]}>
            <Icon size={rs(16)} color={iconColor} strokeWidth={1.8} />
          </View>
        ) : null}

        <View style={styles.fieldText}>
          {selected ? (
            <>
              <Text style={styles.fieldValue} numberOfLines={1}>{selected.label}</Text>
              {selected.sublabel ? (
                <Text style={styles.fieldSublabel} numberOfLines={1}>{selected.sublabel}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.fieldPlaceholder} numberOfLines={1}>{placeholder}</Text>
          )}
        </View>

        <ChevronDown size={rs(18)} color={colors.textDim} strokeWidth={1.8} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: rs(16) + insets.bottom }]}
            onPress={() => {}}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{sheetTitle ?? placeholder}</Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={rs(18)} color={colors.textDim} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                const ItemIcon = item.icon;
                const itemColor = item.color ?? colors.click;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      if (item.disabled) return;
                      onChange(item.value);
                      setOpen(false);
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                      item.disabled && styles.optionDisabled,
                    ]}
                  >
                    {item.imageUri ? (
                      <Image source={{ uri: item.imageUri }} style={styles.optionAvatar} />
                    ) : ItemIcon ? (
                      <View style={[styles.optionIconWrap, { borderColor: itemColor + '40', backgroundColor: itemColor + '14' }]}>
                        <ItemIcon size={rs(18)} color={itemColor} strokeWidth={1.8} />
                      </View>
                    ) : null}

                    <View style={styles.optionText}>
                      <Text style={styles.optionLabel} numberOfLines={1}>{item.label}</Text>
                      {item.sublabel ? (
                        <Text style={styles.optionSublabel} numberOfLines={1}>{item.sublabel}</Text>
                      ) : null}
                    </View>

                    {isSelected ? (
                      <Check size={rs(18)} color={colors.click} strokeWidth={2.2} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.optionSeparator} />}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: rs(420) }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(spacing.sm),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: rs(radii.lg),
    paddingHorizontal: rs(spacing.md),
    paddingVertical: rs(spacing.sm),
    minHeight: rs(56),
  },
  fieldDisabled: { opacity: 0.5 },
  fieldAvatar: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: colors.bgCard,
  },
  fieldIconWrap: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fieldText: { flex: 1 },
  fieldValue: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: fs(14),
    color: colors.text,
  },
  fieldSublabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: fs(11),
    color: colors.textDim,
    marginTop: rs(2),
  },
  fieldPlaceholder: {
    fontFamily: 'Sora_400Regular',
    fontSize: fs(14),
    color: colors.placeholder,
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 18, 25, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: rs(26),
    borderTopRightRadius: rs(26),
    paddingHorizontal: rs(spacing.md),
    paddingTop: rs(spacing.sm),
  },
  sheetHandle: {
    width: rs(40),
    height: rs(5),
    borderRadius: rs(3),
    backgroundColor: colors.textGhost,
    alignSelf: 'center',
    marginBottom: rs(spacing.md),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(spacing.md),
    paddingHorizontal: rs(spacing.xs),
  },
  sheetTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: fs(16),
    color: colors.text,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(spacing.sm),
    paddingHorizontal: rs(spacing.md),
    paddingVertical: rs(spacing.md),
    borderRadius: rs(radii.lg),
  },
  optionSelected: {
    backgroundColor: colors.cardHover,
  },
  optionDisabled: { opacity: 0.4 },
  optionAvatar: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: colors.bgCard,
  },
  optionIconWrap: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  optionText: { flex: 1 },
  optionLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: fs(14),
    color: colors.text,
  },
  optionSublabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: fs(11),
    color: colors.textDim,
    marginTop: rs(2),
  },
  optionSeparator: { height: rs(2) },
});
