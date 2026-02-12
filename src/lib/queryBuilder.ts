import { InValue } from '@libsql/client';

const VALID_CONSULATES = new Set(['Istanbul', 'Ankara', 'Izmir', 'Diğer']);
const MAX_CONSULATE_PARAMS = 10;

export interface FilterParams {
  consulates: string[];
  deCity: string;
  appointmentMonthFrom: string;
  appointmentMonthTo: string;
  onlyWithResult: boolean;
}

export interface QueryFragment {
  where: string;
  args: InValue[];
}

function escapeLikePattern(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

export function buildFilterQuery(params: FilterParams): QueryFragment {
  const conditions: string[] = [];
  const args: InValue[] = [];

  // Consulates: whitelist doğrulama + maksimum sayı limiti
  if (params.consulates.length > 0) {
    const validConsulates = params.consulates
      .filter((c) => VALID_CONSULATES.has(c))
      .slice(0, MAX_CONSULATE_PARAMS);

    if (validConsulates.length > 0) {
      const placeholders = validConsulates.map(() => '?').join(', ');
      conditions.push(`tr_consulate IN (${placeholders})`);
      args.push(...validConsulates);
    }
  }

  // deCity: LIKE wildcard karakterleri escape edilir
  if (params.deCity) {
    const safeCity = escapeLikePattern(params.deCity.toLowerCase()).slice(0, 100);
    conditions.push(`LOWER(de_city) LIKE ? ESCAPE '\\'`);
    args.push(`%${safeCity}%`);
  }

  // Randevu dönemi filtresi: boş randevu tarihli kayıtlar her zaman dahil edilir
  if (params.appointmentMonthFrom) {
    conditions.push(
      `(appointment_date = '' OR SUBSTR(appointment_date, 7, 4) || '-' || SUBSTR(appointment_date, 4, 2) >= ?)`
    );
    args.push(params.appointmentMonthFrom);
  }

  if (params.appointmentMonthTo) {
    conditions.push(
      `(appointment_date = '' OR SUBSTR(appointment_date, 7, 4) || '-' || SUBSTR(appointment_date, 4, 2) <= ?)`
    );
    args.push(params.appointmentMonthTo);
  }

  if (params.onlyWithResult) {
    conditions.push(`(decision_email_date != '' OR sms_date != '')`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, args };
}

export const ORDER_BY = `ORDER BY
  CASE WHEN appointment_date = '' THEN 0 ELSE 1 END,
  SUBSTR(appointment_date, 7, 4) || '-' || SUBSTR(appointment_date, 4, 2) || '-' || SUBSTR(appointment_date, 1, 2) DESC,
  created_at DESC`;

export function parseFilterSearchParams(searchParams: URLSearchParams): FilterParams {
  const consulatesRaw = searchParams.get('consulates') || '';
  const consulates = consulatesRaw ? consulatesRaw.split(',').filter(Boolean) : [];

  return {
    consulates,
    deCity: searchParams.get('deCity') || '',
    appointmentMonthFrom: searchParams.get('appointmentMonthFrom') || '',
    appointmentMonthTo: searchParams.get('appointmentMonthTo') || '',
    onlyWithResult: searchParams.get('onlyWithResult') === 'true',
  };
}
