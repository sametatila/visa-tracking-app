import { RawRow, DerivedRow } from './types';
import { parseDDMMYYYY, daysBetween, earliestDate, parseMissingDocs } from './dateUtils';

export function deriveRow(raw: RawRow): DerivedRow {
  const applicationDate = parseDDMMYYYY(raw.application_date);
  const assignmentDate = parseDDMMYYYY(raw.assignment_date);
  const appointmentDate = parseDDMMYYYY(raw.appointment_date);
  const decisionEmailDate = parseDDMMYYYY(raw.decision_email_date);
  const smsDate = parseDDMMYYYY(raw.sms_date);

  const result_date = earliestDate(decisionEmailDate, smsDate);

  const appointment_to_result_days =
    appointmentDate && result_date
      ? daysBetween(appointmentDate, result_date)
      : null;

  const application_to_appointment_days =
    applicationDate && appointmentDate
      ? daysBetween(applicationDate, appointmentDate)
      : null;

  const application_to_result_days =
    applicationDate && result_date
      ? daysBetween(applicationDate, result_date)
      : null;

  // Validation: invalid_date_parse
  const dateFields = [
    raw.application_date,
    raw.assignment_date,
    raw.appointment_date,
    raw.decision_email_date,
    raw.sms_date,
  ];
  const invalid_date_parse = dateFields.some(
    (f) => f.trim() !== '' && parseDDMMYYYY(f) === null
  );

  // Validation: inconsistent (result < appointment)
  const inconsistent =
    result_date !== null &&
    appointmentDate !== null &&
    result_date.getTime() < appointmentDate.getTime();

  const missing_docs_parsed = parseMissingDocs(raw.missing_docs);

  return {
    ...raw,
    result_date,
    appointment_to_result_days,
    application_to_appointment_days,
    application_to_result_days,
    invalid_date_parse,
    inconsistent,
    missing_docs_parsed,
    masked_name: raw.name, // Names are already stored masked
  };
}

export function deriveAllRows(raws: RawRow[]): DerivedRow[] {
  return raws.map(deriveRow);
}
