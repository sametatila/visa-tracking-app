import { AllStats, CityStats, ConsulateStats, DerivedRow, PeriodStats } from './types';
import { CONSULATES } from './constants';
import { getYearMonth } from './dateUtils';

export function average(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return Math.round(arr.reduce((sum, v) => sum + v, 0) / arr.length);
}

export function percentile(arr: number[], p: number): number | null {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return Math.round(sorted[lower] * (1 - weight) + sorted[upper] * weight);
}

export function computeAllStats(rows: DerivedRow[]): AllStats {
  const totalRows = rows.length;
  const resultedRows = rows.filter((r) => r.result_date !== null).length;

  const atrValues = rows
    .map((r) => r.appointment_to_result_days)
    .filter((v): v is number => v !== null);

  const ataValues = rows
    .map((r) => r.application_to_appointment_days)
    .filter((v): v is number => v !== null);

  const aresValues = rows
    .map((r) => r.application_to_result_days)
    .filter((v): v is number => v !== null);

  const consulateStats: ConsulateStats[] = CONSULATES.map((c) => {
    const cRows = rows.filter((r) => r.tr_consulate === c);
    const cValues = cRows
      .map((r) => r.appointment_to_result_days)
      .filter((v): v is number => v !== null);
    return {
      consulate: c,
      count: cRows.length,
      average: average(cValues),
    };
  });

  // Period stats: group by appointment month, sorted chronologically
  const periodMap = new Map<string, number[]>();
  for (const row of rows) {
    if (row.appointment_date && row.appointment_to_result_days !== null) {
      const d = new Date(
        parseInt(row.appointment_date.split('.')[2]),
        parseInt(row.appointment_date.split('.')[1]) - 1,
        parseInt(row.appointment_date.split('.')[0])
      );
      if (!isNaN(d.getTime())) {
        const ym = getYearMonth(d);
        if (!periodMap.has(ym)) periodMap.set(ym, []);
        periodMap.get(ym)!.push(row.appointment_to_result_days);
      }
    }
  }

  const periodStats: PeriodStats[] = [];
  for (const [period, values] of periodMap) {
    const m = average(values);
    if (m !== null) {
      periodStats.push({ period, count: values.length, average: m });
    }
  }
  // Sort chronologically
  periodStats.sort((a, b) => a.period.localeCompare(b.period));

  const cityMap = new Map<string, number[]>();
  for (const row of rows) {
    if (row.de_city && row.appointment_to_result_days !== null) {
      const city = row.de_city.trim();
      if (!city) continue;
      if (!cityMap.has(city)) cityMap.set(city, []);
      cityMap.get(city)!.push(row.appointment_to_result_days);
    }
  }

  const cityStats: CityStats[] = [];
  for (const [city, values] of cityMap) {
    if (values.length >= 3) {
      const m = average(values);
      if (m !== null) {
        cityStats.push({ city, count: values.length, average: m });
      }
    }
  }
  cityStats.sort((a, b) => a.average - b.average);

  const withMissing = rows
    .filter((r) => r.missing_docs.trim() !== '' && r.appointment_to_result_days !== null)
    .map((r) => r.appointment_to_result_days!);
  const withoutMissing = rows
    .filter((r) => r.missing_docs.trim() === '' && r.appointment_to_result_days !== null)
    .map((r) => r.appointment_to_result_days!);

  const avgWith = average(withMissing);
  const avgWithout = average(withoutMissing);
  const delta =
    avgWith !== null && avgWithout !== null
      ? avgWith - avgWithout
      : null;

  return {
    totalRows,
    resultedRows,
    appointmentToResult: {
      average: average(atrValues),
      p25: percentile(atrValues, 25),
      p75: percentile(atrValues, 75),
      min: atrValues.length > 0 ? Math.min(...atrValues) : null,
      max: atrValues.length > 0 ? Math.max(...atrValues) : null,
      count: atrValues.length,
    },
    applicationToAppointment: {
      average: average(ataValues),
      count: ataValues.length,
    },
    applicationToResult: {
      average: average(aresValues),
      count: aresValues.length,
    },
    consulateStats,
    periodStats,
    cityStats,
    missingDocsEffect: {
      avgWithout,
      avgWith,
      delta,
      countWithout: withoutMissing.length,
      countWith: withMissing.length,
    },
  };
}
