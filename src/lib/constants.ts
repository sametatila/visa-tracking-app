import { ColumnDef, Consulate, VisaType } from './types';

export const CONSULATES: Consulate[] = ['Istanbul', 'Ankara', 'Izmir', 'Diğer'];

export const CONSULATE_LABELS: Record<Consulate, string> = {
  Istanbul: 'İstanbul',
  Ankara: 'Ankara',
  Izmir: 'İzmir',
  'Diğer': 'Diğer',
};

export const VISA_TYPES: VisaType[] = ['36F', '39F', '40F', '41F', '44F', 'Diğer'];

export const VISA_TYPE_LABELS: Record<VisaType, string> = {
  '36F': '36F',
  '39F': '39F',
  '40F': '40F',
  '41F': '41F',
  '44F': '44F',
  'Diğer': 'Diğer',
};

export const GERMAN_CITIES: string[] = [
  'Aachen',
  'Augsburg',
  'Berlin',
  'Bielefeld',
  'Bochum',
  'Bonn',
  'Braunschweig',
  'Bremen',
  'Chemnitz',
  'Clausthal',
  'Darmstadt',
  'Dortmund',
  'Dresden',
  'Duisburg',
  'Düsseldorf',
  'Erfurt',
  'Erlangen',
  'Essen',
  'Flensburg',
  'Frankfurt am Main',
  'Freiburg im Breisgau',
  'Gelsenkirchen',
  'Giessen',
  'Göttingen',
  'Halle (Saale)',
  'Hamburg',
  'Hannover',
  'Heidelberg',
  'Ingolstadt',
  'Jena',
  'Kaiserslautern',
  'Karlsruhe',
  'Kassel',
  'Kiel',
  'Koblenz',
  'Köln',
  'Krefeld',
  'Leipzig',
  'Leverkusen',
  'Lübeck',
  'Ludwigshafen am Rhein',
  'Magdeburg',
  'Mainz',
  'Mannheim',
  'Marburg',
  'Mönchengladbach',
  'München',
  'Münster',
  'Nürnberg',
  'Oberhausen',
  'Oldenburg',
  'Osnabrück',
  'Paderborn',
  'Passau',
  'Potsdam',
  'Regensburg',
  'Rostock',
  'Saarbrücken',
  'Siegen',
  'Stuttgart',
  'Trier',
  'Tübingen',
  'Ulm',
  'Wiesbaden',
  'Wuppertal',
  'Würzburg',
];

export const COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Kullanıcı', width: 'min-w-[130px] w-[130px]', editable: true, type: 'text' },
  { key: 'tr_consulate', label: 'Konsolosluk', width: 'min-w-[100px] w-[100px]', editable: true, type: 'consulate-select' },
  { key: 'de_city', label: 'Almanya Şehri', width: 'min-w-[130px] w-[130px]', editable: true, type: 'city-select' },
  { key: 'visa_type', label: 'Vize Türü', width: 'min-w-[70px] w-[70px]', editable: true, type: 'visa-select' },
  { key: 'application_date', label: 'Başvuru Tarihi', width: 'min-w-[100px] w-[100px]', editable: true, type: 'date' },
  { key: 'assignment_date', label: 'Atama Tarihi', width: 'min-w-[100px] w-[100px]', editable: true, type: 'date' },
  { key: 'appointment_date', label: 'Randevu Tarihi', width: 'min-w-[100px] w-[100px]', editable: true, type: 'date' },
  { key: 'missing_docs', label: 'Eksik Evrak', width: 'min-w-[130px] w-[130px]', editable: true, type: 'text' },
  { key: 'decision_email_date', label: 'Karar E-posta', width: 'min-w-[100px] w-[100px]', editable: true, type: 'date' },
  { key: 'sms_date', label: 'SMS Tarihi', width: 'min-w-[100px] w-[100px]', editable: true, type: 'date' },
  { key: 'course_start', label: 'Kurs Başlangıcı', width: 'min-w-[100px] w-[100px]', editable: true, type: 'text' },
];

let _idCounter = 0;
export function generateId(): string {
  return `row_${Date.now()}_${++_idCounter}`;
}
