import { RawRow, ColumnKey } from './types';
import { COLUMNS, generateId } from './constants';

const EXPORT_KEYS: ColumnKey[] = COLUMNS.map((c) => c.key);

function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] || '';
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  if (tabs > commas && tabs > semicolons) return '\t';
  if (semicolons > commas) return ';';
  return ',';
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function normalizeHeader(h: string): ColumnKey | null {
  const lower = h.trim().toLowerCase().replace(/[\s_-]+/g, '_');
  const map: Record<string, ColumnKey> = {
    name: 'name',
    kullanici: 'name',
    kullanıcı: 'name',
    ad_soyad: 'name',
    ad: 'name',
    isim: 'name',
    tr_consulate: 'tr_consulate',
    konsolosluk: 'tr_consulate',
    consulate: 'tr_consulate',
    de_city: 'de_city',
    almanya_sehri: 'de_city',
    almanya_şehri: 'de_city',
    city: 'de_city',
    application_date: 'application_date',
    basvuru_tarihi: 'application_date',
    başvuru_tarihi: 'application_date',
    assignment_date: 'assignment_date',
    atama_tarihi: 'assignment_date',
    appointment_date: 'appointment_date',
    randevu_tarihi: 'appointment_date',
    missing_docs: 'missing_docs',
    eksik_evrak: 'missing_docs',
    decision_email_date: 'decision_email_date',
    karar_e_posta: 'decision_email_date',
    karar_eposta: 'decision_email_date',
    sms_date: 'sms_date',
    sms_tarihi: 'sms_date',
    course_start: 'course_start',
    kurs_baslangici: 'course_start',
    kurs_başlangıcı: 'course_start',
    visa_type: 'visa_type',
    vize_turu: 'visa_type',
    vize_türü: 'visa_type',
  };
  return map[lower] || null;
}

export function parseCSV(text: string): RawRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(text);
  const headers = parseCSVLine(lines[0], delimiter);
  const columnMap: (ColumnKey | null)[] = headers.map(normalizeHeader);

  const rows: RawRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i], delimiter);
    const row: RawRow = {
      id: generateId(),
      name: '',
      tr_consulate: 'Diğer',
      de_city: '',
      visa_type: 'Diğer',
      application_date: '',
      assignment_date: '',
      appointment_date: '',
      missing_docs: '',
      decision_email_date: '',
      sms_date: '',
      course_start: '',
    };

    for (let j = 0; j < fields.length; j++) {
      const key = columnMap[j];
      if (!key || key === 'id') continue;
      const val = fields[j].trim();
      if (key === 'tr_consulate') {
        const normalized = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        if (['Istanbul', 'Ankara', 'Izmir'].includes(normalized)) {
          row.tr_consulate = normalized as RawRow['tr_consulate'];
        } else {
          row.tr_consulate = 'Diğer';
        }
      } else if (key === 'visa_type') {
        const upper = val.toUpperCase().trim();
        const validTypes = ['36F', '40F', '41F', '44F', '§16A', '§16B', '§16F', '§17'];
        const typeMap: Record<string, string> = { '§16A': '§16a', '§16B': '§16b', '§16F': '§16f' };
        if (validTypes.includes(upper)) {
          row.visa_type = (typeMap[upper] || upper) as RawRow['visa_type'];
        } else {
          row.visa_type = 'Diğer';
        }
      } else {
        (row as unknown as Record<string, string>)[key] = val;
      }
    }
    rows.push(row);
  }
  return rows;
}

export function parseJSON(text: string): RawRow[] {
  try {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : [];
    return arr.map((item: Record<string, string>) => ({
      id: generateId(),
      name: item.name || '',
      tr_consulate: (['Istanbul', 'Ankara', 'Izmir', 'Diğer'].includes(item.tr_consulate)
        ? item.tr_consulate
        : 'Diğer') as RawRow['tr_consulate'],
      de_city: item.de_city || '',
      visa_type: (['36F', '40F', '41F', '44F', '§16a', '§16b', '§16f', '§17', 'Diğer'].includes(item.visa_type)
        ? item.visa_type
        : 'Diğer') as RawRow['visa_type'],
      application_date: item.application_date || '',
      assignment_date: item.assignment_date || '',
      appointment_date: item.appointment_date || '',
      missing_docs: item.missing_docs || '',
      decision_email_date: item.decision_email_date || '',
      sms_date: item.sms_date || '',
      course_start: item.course_start || '',
    }));
  } catch {
    return [];
  }
}

function escapeCSVField(val: string, delimiter: string): string {
  if (val.includes(delimiter) || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function exportCSV(rows: RawRow[]): string {
  const headerLabels = COLUMNS.map((c) => c.label);
  const lines = [headerLabels.join(',')];

  for (const row of rows) {
    const fields = EXPORT_KEYS.map((key) => {
      const val = row[key] as string;
      return escapeCSVField(val, ',');
    });
    lines.push(fields.join(','));
  }
  return lines.join('\n');
}

export function exportJSON(rows: RawRow[]): string {
  const data = rows.map((row) => {
    const obj: Record<string, string> = {};
    for (const key of EXPORT_KEYS) {
      obj[key] = row[key] as string;
    }
    return obj;
  });
  return JSON.stringify(data, null, 2);
}
