/**
 * components/DatePickerSheet.tsx
 *
 * Calendar picker em bottom sheet — zero dependencias externas, zero TextInput.
 * Compativel com a regra inviolavel "sem TextInput em telas de viagem".
 *
 * Uso:
 *   <DatePickerSheet
 *     visible={showFrom}
 *     initialDate={draft.startDate}
 *     minDate={null}
 *     maxDate={draft.endDate ?? null}
 *     title="Data de ida"
 *     onClose={() => setShowFrom(false)}
 *     onPick={(iso) => setDraft({ ...draft, startDate: iso })}
 *   />
 *
 * Layout:
 *   - Header: titulo + botao fechar
 *   - Mes/ano com setas << >> pra navegar
 *   - Grid 7x6 (dom-sab) com dias clicaveis (passado/futuro grayed out)
 *   - Footer: botao "Confirmar" sticky
 */
import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView,
} from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../constants/colors';
import { radii, spacing } from '../constants/spacing';
import { rs, fs } from '../hooks/useResponsive';

interface DatePickerSheetProps {
  visible: boolean;
  initialDate?: string | null;   // 'YYYY-MM-DD' ou null
  minDate?: string | null;        // datas anteriores ficam disabled
  maxDate?: string | null;        // datas posteriores ficam disabled
  title?: string;
  onClose: () => void;
  onPick: (iso: string) => void;
}

const WEEKDAYS_PT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WEEKDAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Helpers de data (LOCAL, sem timezone) ─────────────────────────────────

function parseISOLocal(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function toISO(d: Date): string {
  const yyyy = d.getFullYear().toString().padStart(4, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// ── Componente ────────────────────────────────────────────────────────────

export function DatePickerSheet({
  visible, initialDate, minDate, maxDate, title, onClose, onPick,
}: DatePickerSheetProps) {
  const { i18n } = useTranslation();
  const isPt = (i18n.language ?? 'pt-BR').startsWith('pt');
  const WEEKDAYS = isPt ? WEEKDAYS_PT : WEEKDAYS_EN;
  const MONTHS = isPt ? MONTHS_PT : MONTHS_EN;

  // Mes/ano em foco
  const today = useMemo(() => startOfDay(new Date()), []);
  const initial = useMemo(() => parseISOLocal(initialDate ?? undefined) ?? today, [initialDate, today]);
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [selected, setSelected] = useState<Date | null>(initial);

  // Reseta foco quando abre
  useEffect(() => {
    if (!visible) return;
    const ini = parseISOLocal(initialDate ?? undefined) ?? today;
    setViewMonth(ini.getMonth());
    setViewYear(ini.getFullYear());
    setSelected(ini);
  }, [visible, initialDate, today]);

  const min = parseISOLocal(minDate ?? undefined);
  const max = parseISOLocal(maxDate ?? undefined);

  // Grid do mes em foco
  const grid = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstOfMonth.getDay();  // 0=domingo
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: Array<{ day: number; date: Date; outside: boolean }> = [];
    // Preenche celulas do mes anterior pra alinhar primeira semana
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthDays - i);
      cells.push({ day: d.getDate(), date: d, outside: true });
    }
    // Mes atual
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, date: new Date(viewYear, viewMonth, d), outside: false });
    }
    // Preenche pra completar 6 linhas (42 celulas)
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
      cells.push({ day: next.getDate(), date: next, outside: true });
    }
    return cells;
  }, [viewMonth, viewYear]);

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };
  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isDisabled = (d: Date): boolean => {
    if (min && startOfDay(d) < startOfDay(min)) return true;
    if (max && startOfDay(d) > startOfDay(max)) return true;
    return false;
  };

  const isSameDay = (a: Date | null, b: Date | null): boolean => {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  };

  const handleConfirm = () => {
    if (!selected) return;
    onPick(toISO(selected));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.sheet}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ width: rs(22) }} />
          <Text style={s.title}>{title ?? ''}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <X size={rs(22)} color={colors.click} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {/* Mes / ano com setas */}
        <View style={s.monthRow}>
          <TouchableOpacity onPress={goPrev} hitSlop={12} style={s.arrowBtn}>
            <ChevronLeft size={rs(20)} color={colors.click} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={s.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
          <TouchableOpacity onPress={goNext} hitSlop={12} style={s.arrowBtn}>
            <ChevronRight size={rs(20)} color={colors.click} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {/* Cabecalho dos dias da semana */}
        <View style={s.weekdaysRow}>
          {WEEKDAYS.map((w, i) => (
            <Text key={i} style={s.weekday}>{w}</Text>
          ))}
        </View>

        {/* Grid */}
        <ScrollView contentContainerStyle={s.grid} showsVerticalScrollIndicator={false}>
          {grid.map((cell, i) => {
            const disabled = cell.outside || isDisabled(cell.date);
            const isSelected = isSameDay(cell.date, selected);
            const isToday = isSameDay(cell.date, today);
            return (
              <TouchableOpacity
                key={i}
                style={[
                  s.dayCell,
                  isSelected && s.dayCellSelected,
                  isToday && !isSelected && s.dayCellToday,
                ]}
                onPress={() => !disabled && setSelected(cell.date)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Text style={[
                  s.dayTxt,
                  cell.outside && s.dayTxtOutside,
                  disabled && !cell.outside && s.dayTxtDisabled,
                  isSelected && s.dayTxtSelected,
                  isToday && !isSelected && s.dayTxtToday,
                ]}>
                  {cell.day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.cta, !selected && s.ctaDisabled]}
            onPress={handleConfirm}
            disabled={!selected}
            activeOpacity={0.85}
          >
            <Text style={s.ctaTxt}>{isPt ? 'Confirmar' : 'Confirm'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,18,25,0.6)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: rs(26), borderTopRightRadius: rs(26),
    maxHeight: '85%', paddingBottom: rs(20),
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: fs(15), fontWeight: '700' },
  monthRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  arrowBtn: {
    width: rs(36), height: rs(36), borderRadius: rs(18),
    backgroundColor: colors.clickSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  monthLabel: { color: colors.text, fontSize: fs(15), fontWeight: '700' },
  weekdaysRow: {
    flexDirection: 'row', paddingHorizontal: spacing.md, marginBottom: rs(6),
  },
  weekday: {
    flex: 1, textAlign: 'center', color: colors.textDim,
    fontSize: fs(11), fontWeight: '700', letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.md, paddingVertical: rs(4),
  },
  dayCell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: colors.click, borderRadius: rs(20), margin: rs(2),
  },
  dayCellToday: {
    borderWidth: 1.5, borderColor: colors.click + '60', borderRadius: rs(20), margin: rs(2),
  },
  dayTxt: { color: colors.text, fontSize: fs(14), fontWeight: '500' },
  dayTxtOutside: { color: colors.textGhost, fontWeight: '400' },
  dayTxtDisabled: { color: colors.textGhost },
  dayTxtSelected: { color: '#FFFFFF', fontWeight: '800' },
  dayTxtToday: { color: colors.click, fontWeight: '800' },
  footer: {
    paddingHorizontal: spacing.md, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  cta: {
    backgroundColor: colors.click, paddingVertical: rs(14),
    borderRadius: radii.lg, alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaTxt: { color: '#FFFFFF', fontSize: fs(15), fontWeight: '700' },
});
