import { Consulate, VisaType } from './types';

const VALID_CONSULATES: Consulate[] = ['Istanbul', 'Ankara', 'Izmir', 'Diğer'];
const VALID_VISA_TYPES: VisaType[] = ['36F', '40F', '41F', '44F', 'Diğer'];

const MAX_LENGTHS: Record<string, number> = {
  name: 100,
  de_city: 100,
  application_date: 10,
  assignment_date: 10,
  appointment_date: 10,
  decision_email_date: 10,
  sms_date: 10,
  missing_docs: 200,
  course_start: 50,
};

// GG.AA.YYYY formatı — boş string de kabul edilir
const DATE_REGEX = /^\d{2}\.\d{2}\.\d{4}$/;
// Tarih aralığı: GG.AA.YYYY-GG.AA.YYYY veya tek tarih
const DATE_RANGE_REGEX = /^(\d{2}\.\d{2}\.\d{4})(-\d{2}\.\d{2}\.\d{4})?$/;

const DATE_FIELDS = ['application_date', 'assignment_date', 'appointment_date', 'decision_email_date', 'sms_date'];

export function sanitizeString(value: unknown, maxLength: number): string {
  const str = String(value ?? '').trim();
  return str.slice(0, maxLength);
}

export function validateDateField(key: string, value: string): string | null {
  if (!value) return null; // boş kabul edilir

  if (key === 'missing_docs') {
    if (!DATE_RANGE_REGEX.test(value)) {
      return `${key}: Geçersiz tarih formatı. GG.AA.YYYY veya GG.AA.YYYY-GG.AA.YYYY kullanın.`;
    }
    return null;
  }

  if (DATE_FIELDS.includes(key)) {
    if (!DATE_REGEX.test(value)) {
      return `${key}: Geçersiz tarih formatı. GG.AA.YYYY kullanın.`;
    }
    const [day, month, year] = value.split('.').map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
      return `${key}: Geçersiz tarih değeri.`;
    }
  }

  return null;
}

export function isValidConsulate(value: string): value is Consulate {
  return VALID_CONSULATES.includes(value as Consulate);
}

export function isValidVisaType(value: string): value is VisaType {
  return VALID_VISA_TYPES.includes(value as VisaType);
}

export function getMaxLength(field: string): number {
  return MAX_LENGTHS[field] || 200;
}

export function validateRowInput(body: Record<string, unknown>): { errors: string[]; sanitized: Record<string, string> } {
  const errors: string[] = [];
  const sanitized: Record<string, string> = {};

  for (const [key, maxLen] of Object.entries(MAX_LENGTHS)) {
    const raw = body[key];
    const value = sanitizeString(raw, maxLen);
    sanitized[key] = value;

    const dateError = validateDateField(key, value);
    if (dateError) errors.push(dateError);
  }

  return { errors, sanitized };
}
