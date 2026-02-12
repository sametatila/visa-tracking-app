export type Consulate = 'Istanbul' | 'Ankara' | 'Izmir' | 'Diğer';

export type VisaType = '36F' | '40F' | '41F' | '44F' | 'Diğer';

export interface RawRow {
  id: string;
  name: string;
  tr_consulate: Consulate;
  de_city: string;
  visa_type: VisaType;
  application_date: string;
  assignment_date: string;
  appointment_date: string;
  missing_docs: string;
  decision_email_date: string;
  sms_date: string;
  course_start: string;
}

export interface MissingDocsParsed {
  dates: Date[];
  eventsCount: number;
  firstDate: Date | null;
  lastDate: Date | null;
  hasWarning: boolean;
}

export interface DerivedRow extends RawRow {
  result_date: Date | null;
  appointment_to_result_days: number | null;
  application_to_appointment_days: number | null;
  application_to_result_days: number | null;
  invalid_date_parse: boolean;
  inconsistent: boolean;
  missing_docs_parsed: MissingDocsParsed;
  masked_name: string;
}

export interface FilterState {
  consulates: Consulate[];
  deCity: string;
  appointmentMonthFrom: string;
  appointmentMonthTo: string;
  onlyWithResult: boolean;
  excludeOutliers: boolean;
  searchQuery: string;
}

export interface AppState {
  filterState: FilterState;
  tableRows: DerivedRow[];
  tablePage: number;
  tableHasMore: boolean;
  tableLoading: boolean;
  allFilteredRows: DerivedRow[];
  statsLoading: boolean;
  totalFiltered: number;
  totalUnfiltered: number;
  mutating: boolean;
  error: string | null;
}

export interface ConsulateStats {
  consulate: Consulate;
  count: number;
  average: number | null;
}

export interface PeriodStats {
  period: string;
  count: number;
  average: number;
}

export interface CityStats {
  city: string;
  count: number;
  average: number;
}

export interface AllStats {
  totalRows: number;
  resultedRows: number;
  appointmentToResult: {
    average: number | null;
    p25: number | null;
    p75: number | null;
    min: number | null;
    max: number | null;
    count: number;
  };
  applicationToAppointment: {
    average: number | null;
    count: number;
  };
  applicationToResult: {
    average: number | null;
    count: number;
  };
  consulateStats: ConsulateStats[];
  periodStats: PeriodStats[];
  cityStats: CityStats[];
  missingDocsEffect: {
    avgWithout: number | null;
    avgWith: number | null;
    delta: number | null;
    countWithout: number;
    countWith: number;
  };
}

export type ColumnKey = keyof RawRow;

export interface ColumnDef {
  key: ColumnKey;
  label: string;
  width: string;
  editable: boolean;
  type: 'text' | 'consulate-select' | 'city-select' | 'visa-select' | 'date';
}
