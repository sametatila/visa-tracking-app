import { MissingDocsParsed } from './types';

export function parseDDMMYYYY(s: string): Date | null {
  if (!s || !s.trim()) return null;
  const trimmed = s.trim();
  const match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

export function getYearMonth(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function parseMissingDocs(s: string): MissingDocsParsed {
  const empty: MissingDocsParsed = {
    dates: [],
    eventsCount: 0,
    firstDate: null,
    lastDate: null,
    hasWarning: false,
  };

  if (!s || !s.trim()) return empty;

  const tokens = s.split(/[,;|\n]/).map((t) => t.trim()).filter(Boolean);
  const allDates: Date[] = [];
  let hasWarning = false;

  for (const token of tokens) {
    const rangeParts = token.split(/\s*-\s*/);

    if (rangeParts.length === 2) {
      const start = parseDDMMYYYY(rangeParts[0]);
      const end = parseDDMMYYYY(rangeParts[1]);
      if (start && end) {
        allDates.push(start, end);
      } else {
        hasWarning = true;
      }
    } else if (rangeParts.length === 1) {
      const d = parseDDMMYYYY(rangeParts[0]);
      if (d) {
        allDates.push(d);
      } else {
        hasWarning = true;
      }
    } else {
      hasWarning = true;
    }
  }

  if (allDates.length === 0) {
    return { ...empty, eventsCount: tokens.length, hasWarning: true };
  }

  const sorted = [...allDates].sort((a, b) => a.getTime() - b.getTime());

  return {
    dates: allDates,
    eventsCount: tokens.length,
    firstDate: sorted[0],
    lastDate: sorted[sorted.length - 1],
    hasWarning,
  };
}

// Ordered date field keys for chronological validation
// Each date must be >= the previous one in this sequence
// missing_docs is special: uses earliest parsed date from the field
export const DATE_ORDER: readonly string[] = [
  'application_date',
  'assignment_date',
  'appointment_date',
  'missing_docs',
  'decision_email_date',
  'sms_date',
] as const;

const DATE_FIELD_LABELS: Record<string, string> = {
  application_date: 'Başvuru Tarihi',
  assignment_date: 'Atama Tarihi',
  appointment_date: 'Randevu Tarihi',
  missing_docs: 'Eksik Evrak',
  decision_email_date: 'Karar E-posta',
  sms_date: 'SMS Tarihi',
};

/**
 * For missing_docs field, extract the earliest date for ordering comparison.
 */
function getEffectiveDateForField(fieldKey: string, value: string): Date | null {
  if (!value.trim()) return null;
  if (fieldKey === 'missing_docs') {
    const parsed = parseMissingDocs(value);
    return parsed.firstDate;
  }
  return parseDDMMYYYY(value);
}

/**
 * Validates that a date value for a given field doesn't violate
 * chronological order with existing dates.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateDateOrder(
  fieldKey: string,
  newValue: string,
  allDates: Record<string, string>
): string | null {
  if (!newValue.trim()) return null;
  const newDate = getEffectiveDateForField(fieldKey, newValue);
  if (!newDate) return null;

  const idx = DATE_ORDER.indexOf(fieldKey);
  if (idx === -1) return null;

  // Check: new date must be >= all earlier fields
  for (let i = 0; i < idx; i++) {
    const earlierKey = DATE_ORDER[i];
    const earlierVal = allDates[earlierKey];
    if (!earlierVal?.trim()) continue;
    const earlierDate = getEffectiveDateForField(earlierKey, earlierVal);
    if (!earlierDate) continue;
    if (newDate.getTime() < earlierDate.getTime()) {
      return `${DATE_FIELD_LABELS[fieldKey]}, ${DATE_FIELD_LABELS[earlierKey]}'nden önce olamaz.`;
    }
  }

  // Check: new date must be <= all later fields
  for (let i = idx + 1; i < DATE_ORDER.length; i++) {
    const laterKey = DATE_ORDER[i];
    const laterVal = allDates[laterKey];
    if (!laterVal?.trim()) continue;
    const laterDate = getEffectiveDateForField(laterKey, laterVal);
    if (!laterDate) continue;
    if (newDate.getTime() > laterDate.getTime()) {
      return `${DATE_FIELD_LABELS[fieldKey]}, ${DATE_FIELD_LABELS[laterKey]}'nden sonra olamaz.`;
    }
  }

  return null;
}

/**
 * Validates date format on input change.
 * Returns error message if the value looks complete but is invalid,
 * or null if valid or still being typed.
 */
export function validateDateFormat(value: string): string | null {
  if (!value.trim()) return null;
  const trimmed = value.trim();
  // If user typed enough chars to be a full date (10 chars = GG.AA.YYYY)
  if (trimmed.length >= 10) {
    const match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) return 'Geçersiz format. GG.AA.YYYY kullanın.';
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (month < 1 || month > 12) return 'Geçersiz ay (01-12).';
    if (day < 1 || day > 31) return 'Geçersiz gün (01-31).';
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return 'Geçersiz tarih.';
    }
    return null;
  }
  // Partial input - check format pattern so far
  const partial = /^(\d{0,2})(\.(\d{0,2})(\.(\d{0,4}))?)?$/;
  if (!partial.test(trimmed)) return 'Geçersiz format. GG.AA.YYYY kullanın.';
  return null;
}

export function earliestDate(...dates: (Date | null)[]): Date | null {
  const valid = dates.filter((d): d is Date => d !== null);
  if (valid.length === 0) return null;
  return valid.reduce((min, d) => (d.getTime() < min.getTime() ? d : min));
}
