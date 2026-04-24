/**
 * Tests for utils/format.ts — pure formatting utilities.
 * No mocks needed: all functions are pure and dependency-free.
 */

import {
  formatDate,
  formatRelativeDate,
  formatWeight,
  formatAge,
  truncateText,
  getHealthLevel,
  calcAgeMonths,
  getDateOrder,
  getDatePlaceholder,
  formatDateInput,
  parseDateInput,
  isoToDateInput,
} from '../../utils/format';

// ── formatWeight ──────────────────────────────────────────────────────────────

describe('formatWeight', () => {
  it('returns em dash for null', () => expect(formatWeight(null)).toBe('—'));
  it('returns em dash for undefined', () => expect(formatWeight(undefined)).toBe('—'));
  it('rounds weights >= 10 to integer', () => expect(formatWeight(32.7)).toBe('33 kg'));
  it('shows one decimal for weights < 10', () => expect(formatWeight(4.2)).toBe('4.2 kg'));
  it('shows one decimal for sub-1 kg', () => expect(formatWeight(0.8)).toBe('0.8 kg'));
  it('handles exactly 10 kg', () => expect(formatWeight(10)).toBe('10 kg'));
  it('shows one decimal for 9.9', () => expect(formatWeight(9.9)).toBe('9.9 kg'));
});

// ── formatAge ─────────────────────────────────────────────────────────────────

describe('formatAge', () => {
  it('returns em dash for null', () => expect(formatAge(null)).toBe('—'));
  it('returns em dash for undefined', () => expect(formatAge(undefined)).toBe('—'));

  describe('pt-BR (default)', () => {
    it('shows months only when < 12 months', () => expect(formatAge(8)).toBe('8 meses'));
    it('handles singular month', () => expect(formatAge(1)).toBe('1 mês'));
    it('shows years only when divisible by 12', () => expect(formatAge(24)).toBe('2 anos'));
    it('singular year', () => expect(formatAge(12)).toBe('1 ano'));
    it('shows years and months combined', () => expect(formatAge(28)).toBe('2 anos e 4 meses'));
    it('singular month in combined form', () => expect(formatAge(13)).toBe('1 ano e 1 mês'));
  });

  describe('en-US', () => {
    it('shows months only', () => expect(formatAge(8, 'en-US')).toBe('8 months'));
    it('singular month', () => expect(formatAge(1, 'en-US')).toBe('1 month'));
    it('shows years only', () => expect(formatAge(24, 'en-US')).toBe('2 years'));
    it('singular year', () => expect(formatAge(12, 'en-US')).toBe('1 year'));
    it('shows combined years and months', () => expect(formatAge(28, 'en-US')).toBe('2y 4m'));
  });
});

// ── truncateText ──────────────────────────────────────────────────────────────

describe('truncateText', () => {
  it('returns text unchanged when within limit', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('returns text unchanged when exactly at limit', () => {
    expect(truncateText('hello', 5)).toBe('hello');
  });

  it('truncates with ellipsis when over limit', () => {
    const result = truncateText('hello world', 8);
    expect(result.length).toBe(8);
    expect(result.endsWith('\u2026')).toBe(true);
  });

  it('trims trailing whitespace before ellipsis', () => {
    const result = truncateText('hello   world', 8);
    expect(result).not.toMatch(/ \u2026$/);
    expect(result.endsWith('\u2026')).toBe(true);
  });

  it('handles empty string', () => {
    expect(truncateText('', 5)).toBe('');
  });
});

// ── getHealthLevel ─────────────────────────────────────────────────────────────

describe('getHealthLevel', () => {
  it('returns warning for null score', () => {
    expect(getHealthLevel(null).level).toBe('warning');
    expect(getHealthLevel(null).label).toBe('—');
  });

  it('returns good for score >= 80', () => {
    expect(getHealthLevel(80).level).toBe('good');
    expect(getHealthLevel(95).level).toBe('good');
    expect(getHealthLevel(100).level).toBe('good');
  });

  it('returns warning for 50-79', () => {
    expect(getHealthLevel(50).level).toBe('warning');
    expect(getHealthLevel(65).level).toBe('warning');
    expect(getHealthLevel(79).level).toBe('warning');
  });

  it('returns danger for < 50', () => {
    expect(getHealthLevel(49).level).toBe('danger');
    expect(getHealthLevel(0).level).toBe('danger');
  });

  it('label contains the score value as string', () => {
    expect(getHealthLevel(85).label).toBe('85');
  });
});

// ── getDateOrder ──────────────────────────────────────────────────────────────

describe('getDateOrder', () => {
  it('returns mdy for en-US', () => expect(getDateOrder('en-US')).toBe('mdy'));
  it('returns ymd for Japanese locale', () => expect(getDateOrder('ja-JP')).toBe('ymd'));
  it('returns ymd for Korean', () => expect(getDateOrder('ko-KR')).toBe('ymd'));
  it('returns dmy for pt-BR', () => expect(getDateOrder('pt-BR')).toBe('dmy'));
  it('returns dmy for fr-FR', () => expect(getDateOrder('fr-FR')).toBe('dmy'));
  it('returns dmy for es-ES', () => expect(getDateOrder('es-ES')).toBe('dmy'));
});

// ── getDatePlaceholder ────────────────────────────────────────────────────────

describe('getDatePlaceholder', () => {
  it('en-US → mm/dd/yyyy', () => expect(getDatePlaceholder('en-US')).toBe('mm/dd/yyyy'));
  it('ja-JP → yyyy/mm/dd', () => expect(getDatePlaceholder('ja-JP')).toBe('yyyy/mm/dd'));
  it('pt-BR → dd/mm/yyyy', () => expect(getDatePlaceholder('pt-BR')).toBe('dd/mm/yyyy'));
});

// ── formatDateInput ───────────────────────────────────────────────────────────

describe('formatDateInput', () => {
  describe('dmy (pt-BR default)', () => {
    it('1 digit → unchanged', () => expect(formatDateInput('1', 'pt-BR')).toBe('1'));
    it('2 digits → unchanged', () => expect(formatDateInput('15', 'pt-BR')).toBe('15'));
    it('3 digits → adds first slash', () => expect(formatDateInput('150', 'pt-BR')).toBe('15/0'));
    it('5 digits → two parts', () => expect(formatDateInput('15032', 'pt-BR')).toBe('15/03/2'));
    it('8 digits → full date', () => expect(formatDateInput('15032026', 'pt-BR')).toBe('15/03/2026'));
    it('strips non-digits', () => expect(formatDateInput('15/03/2026', 'pt-BR')).toBe('15/03/2026'));
    it('trims to 8 digits max', () => expect(formatDateInput('150320261', 'pt-BR')).toBe('15/03/2026'));
  });

  describe('ymd (ja-JP)', () => {
    it('4 digits → year only', () => expect(formatDateInput('2026', 'ja-JP')).toBe('2026'));
    it('5 digits → year and first month digit', () => expect(formatDateInput('20260', 'ja-JP')).toBe('2026/0'));
    it('8 digits → full date', () => expect(formatDateInput('20260315', 'ja-JP')).toBe('2026/03/15'));
  });

  describe('mdy (en-US)', () => {
    it('5 digits → month/day/first year digit', () => expect(formatDateInput('03152', 'en-US')).toBe('03/15/2'));
    it('8 digits → full date', () => expect(formatDateInput('03152026', 'en-US')).toBe('03/15/2026'));
  });
});

// ── parseDateInput ────────────────────────────────────────────────────────────

describe('parseDateInput', () => {
  it('returns null for incomplete input', () => {
    expect(parseDateInput('15/03', 'pt-BR')).toBeNull();
    expect(parseDateInput('', 'pt-BR')).toBeNull();
  });

  it('parses dmy (pt-BR) correctly', () => {
    expect(parseDateInput('15/03/2020', 'pt-BR')).toBe('2020-03-15');
  });

  it('parses mdy (en-US) correctly', () => {
    expect(parseDateInput('03/15/2020', 'en-US')).toBe('2020-03-15');
  });

  it('parses ymd (ja-JP) correctly', () => {
    expect(parseDateInput('2020/03/15', 'ja-JP')).toBe('2020-03-15');
  });

  it('returns null for future dates', () => {
    expect(parseDateInput('15/03/2099', 'pt-BR')).toBeNull();
  });

  it('returns null for invalid dates (31 Feb)', () => {
    expect(parseDateInput('31/02/2020', 'pt-BR')).toBeNull();
  });

  it('returns null for impossible month (month 13 in en-US mm first)', () => {
    expect(parseDateInput('13/01/2020', 'en-US')).toBeNull();
  });

  // ─── REGRESSÃO — bug timezone UTC midnight (2026-04-22) ────────────
  // Em timezones a oeste de UTC (Brasil UTC-3), `new Date("yyyy-mm-dd")`
  // era interpretado como UTC midnight → convertido para local virava o
  // dia ANTERIOR às 21h, derrubando a validação getMonth() para toda
  // data que cai no dia 1 de qualquer mês. Os testes abaixo garantem
  // que nenhuma data válida é rejeitada por erro de fuso.

  describe('regression: day-1 dates must never be rejected (timezone bug)', () => {
    it('accepts 01/01/2014 (the bug the user reported)', () => {
      expect(parseDateInput('01/01/2014', 'pt-BR')).toBe('2014-01-01');
    });

    it('accepts day 1 of EVERY month across pt-BR', () => {
      for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2, '0');
        expect(parseDateInput(`01/${mm}/2010`, 'pt-BR')).toBe(`2010-${mm}-01`);
      }
    });

    it('accepts day 1 of EVERY month across en-US', () => {
      for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2, '0');
        expect(parseDateInput(`${mm}/01/2010`, 'en-US')).toBe(`2010-${mm}-01`);
      }
    });

    it('accepts day 1 of EVERY month across ja-JP (ymd)', () => {
      for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2, '0');
        expect(parseDateInput(`2010/${mm}/01`, 'ja-JP')).toBe(`2010-${mm}-01`);
      }
    });

    it('accepts leap day 29/02/2020', () => {
      expect(parseDateInput('29/02/2020', 'pt-BR')).toBe('2020-02-29');
    });

    it('rejects non-leap 29/02/2021', () => {
      expect(parseDateInput('29/02/2021', 'pt-BR')).toBeNull();
    });

    it('rejects 31/04 (April has 30 days)', () => {
      expect(parseDateInput('31/04/2020', 'pt-BR')).toBeNull();
    });

    it('rejects 00/01 (day zero)', () => {
      expect(parseDateInput('00/01/2020', 'pt-BR')).toBeNull();
    });

    it('rejects 01/00 (month zero)', () => {
      expect(parseDateInput('01/00/2020', 'pt-BR')).toBeNull();
    });

    it('rejects year before 1900 as overflow guard', () => {
      expect(parseDateInput('01/01/1800', 'pt-BR')).toBeNull();
    });
  });
});

// ── isoToDateInput ────────────────────────────────────────────────────────────

describe('isoToDateInput', () => {
  it('pt-BR → dd/mm/yyyy', () => {
    expect(isoToDateInput('2020-03-15', 'pt-BR')).toBe('15/03/2020');
  });

  it('en-US → mm/dd/yyyy', () => {
    expect(isoToDateInput('2020-03-15', 'en-US')).toBe('03/15/2020');
  });

  it('ja-JP → yyyy/mm/dd', () => {
    expect(isoToDateInput('2020-03-15', 'ja-JP')).toBe('2020/03/15');
  });

  it('returns empty string for missing ISO segments', () => {
    // split('-') on '' gives [''], so yyyy exists but mm/dd are undefined
    expect(isoToDateInput('', 'pt-BR')).toBe('');
  });
});

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns em dash for null', () => expect(formatDate(null)).toBe('—'));
  it('returns em dash for undefined', () => expect(formatDate(undefined)).toBe('—'));
  it('returns em dash for empty string', () => expect(formatDate('')).toBe('—'));
  it('returns em dash for invalid date string', () => expect(formatDate('not-a-date')).toBe('—'));

  it('formats a valid ISO date (result contains year)', () => {
    const result = formatDate('2024-06-15', 'pt-BR');
    expect(result).toContain('2024');
    expect(result.length).toBeGreaterThan(4);
  });

  it('accepts en-US locale without throwing', () => {
    const result = formatDate('2024-06-15', 'en-US');
    expect(result).toContain('2024');
  });
});

// ── formatRelativeDate ────────────────────────────────────────────────────────

describe('formatRelativeDate', () => {
  it('returns em dash for null', () => expect(formatRelativeDate(null)).toBe('—'));
  it('returns em dash for undefined', () => expect(formatRelativeDate(undefined)).toBe('—'));
  it('returns em dash for invalid date', () => expect(formatRelativeDate('bad')).toBe('—'));

  it('returns "agora" for a date < 1 min ago (pt-BR)', () => {
    const justNow = new Date(Date.now() - 30_000).toISOString();
    expect(formatRelativeDate(justNow, 'pt-BR')).toBe('agora');
  });

  it('returns "just now" for < 1 min ago (en-US)', () => {
    const justNow = new Date(Date.now() - 30_000).toISOString();
    expect(formatRelativeDate(justNow, 'en-US')).toBe('just now');
  });

  it('returns "há X min" for 30 minutes ago (pt-BR)', () => {
    const thirtyMin = new Date(Date.now() - 30 * 60_000).toISOString();
    expect(formatRelativeDate(thirtyMin, 'pt-BR')).toBe('há 30 min');
  });

  it('returns "Xm ago" for 30 minutes ago (en-US)', () => {
    const thirtyMin = new Date(Date.now() - 30 * 60_000).toISOString();
    expect(formatRelativeDate(thirtyMin, 'en-US')).toBe('30m ago');
  });

  it('returns "há Xh" for 3 hours ago (pt-BR)', () => {
    const threeHours = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect(formatRelativeDate(threeHours, 'pt-BR')).toBe('há 3h');
  });

  it('returns "Xh ago" for 3 hours ago (en-US)', () => {
    const threeHours = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect(formatRelativeDate(threeHours, 'en-US')).toBe('3h ago');
  });

  it('returns "ontem" for exactly 1 day ago (pt-BR)', () => {
    const yesterday = new Date(Date.now() - 25 * 3_600_000).toISOString();
    expect(formatRelativeDate(yesterday, 'pt-BR')).toBe('ontem');
  });

  it('returns "yesterday" for 1 day ago (en-US)', () => {
    const yesterday = new Date(Date.now() - 25 * 3_600_000).toISOString();
    expect(formatRelativeDate(yesterday, 'en-US')).toBe('yesterday');
  });

  it('returns "há X dias" for 3 days ago (pt-BR)', () => {
    const threeDays = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(formatRelativeDate(threeDays, 'pt-BR')).toBe('há 3 dias');
  });

  it('returns "Xd ago" for 3 days ago (en-US)', () => {
    const threeDays = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(formatRelativeDate(threeDays, 'en-US')).toBe('3d ago');
  });

  it('falls back to formatDate for dates >= 7 days ago (result contains year)', () => {
    const twoWeeks = new Date(Date.now() - 14 * 86_400_000).toISOString();
    const result = formatRelativeDate(twoWeeks, 'pt-BR');
    expect(result).toContain(new Date(twoWeeks).getFullYear().toString());
  });
});

// ── calcAgeMonths ─────────────────────────────────────────────────────────────

describe('calcAgeMonths', () => {
  it('returns 0 for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(calcAgeMonths(today)).toBe(0);
  });

  it('returns positive months for a past date', () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const iso = oneYearAgo.toISOString().split('T')[0];
    // Allow ±1 month for day-of-month edge cases
    const result = calcAgeMonths(iso);
    expect(result).toBeGreaterThanOrEqual(11);
    expect(result).toBeLessThanOrEqual(13);
  });

  it('returns ~24 months for 2 years ago', () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const iso = twoYearsAgo.toISOString().split('T')[0];
    const result = calcAgeMonths(iso);
    expect(result).toBeGreaterThanOrEqual(23);
    expect(result).toBeLessThanOrEqual(25);
  });
});
