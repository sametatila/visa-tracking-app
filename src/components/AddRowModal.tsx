'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Consulate, VisaType } from '@/lib/types';
import { CONSULATES, CONSULATE_LABELS, GERMAN_CITIES, VISA_TYPES, VISA_TYPE_LABELS } from '@/lib/constants';
import { maskName } from '@/lib/maskUtils';
import { validateDateOrder, validateDateFormat } from '@/lib/dateUtils';
import { useRowsAPI } from '@/hooks/useRowsAPI';
import Spinner from './Spinner';

interface AddRowModalProps {
  onClose: () => void;
}

export default function AddRowModal({ onClose }: AddRowModalProps) {
  const { addRow } = useRowsAPI();
  const backdropRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState('');
  const [consulate, setConsulate] = useState<Consulate>('Istanbul');
  const [city, setCity] = useState('');
  const [visaType, setVisaType] = useState<VisaType>('Diğer');
  const [applicationDate, setApplicationDate] = useState('');
  const [assignmentDate, setAssignmentDate] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [missingDocs, setMissingDocs] = useState('');
  const [decisionEmailDate, setDecisionEmailDate] = useState('');
  const [smsDate, setSmsDate] = useState('');
  const [courseStart, setCourseStart] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const getAllDates = (): Record<string, string> => ({
    application_date: applicationDate,
    assignment_date: assignmentDate,
    appointment_date: appointmentDate,
    missing_docs: missingDocs,
    decision_email_date: decisionEmailDate,
    sms_date: smsDate,
  });

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!name.trim()) errs.push('Kullanıcı adı zorunludur.');
    if (!consulate) errs.push('Konsolosluk seçimi zorunludur.');
    const hasDate = applicationDate.trim() || assignmentDate.trim() || appointmentDate.trim();
    if (!hasDate) errs.push('Başvuru, Atama veya Randevu tarihlerinden en az biri girilmelidir.');

    const allDates = getAllDates();
    const dateFields = [
      { key: 'application_date', value: applicationDate },
      { key: 'assignment_date', value: assignmentDate },
      { key: 'appointment_date', value: appointmentDate },
      { key: 'missing_docs', value: missingDocs },
      { key: 'decision_email_date', value: decisionEmailDate },
      { key: 'sms_date', value: smsDate },
    ];

    for (const field of dateFields) {
      if (!field.value.trim()) continue;
      const orderError = validateDateOrder(field.key, field.value, allDates);
      if (orderError) errs.push(orderError);
    }

    return errs;
  };

  const handleAdd = async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setSubmitting(true);

    try {
      await addRow({
        name,
        tr_consulate: consulate,
        de_city: city,
        visa_type: visaType,
        application_date: applicationDate,
        assignment_date: assignmentDate,
        appointment_date: appointmentDate,
        missing_docs: missingDocs,
        decision_email_date: decisionEmailDate,
        sms_date: smsDate,
        course_start: courseStart,
      });
      onClose();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Kayıt eklenemedi']);
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-card rounded-2xl shadow-2xl border border-card-border w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-card-border flex-shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Yeni Kayıt Ekle</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-secondary hover:bg-card-border rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 space-y-1">
              {errors.map((err, i) => (
                <div key={i} className="text-sm text-red-400">{err}</div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Kullanıcı Adı <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adı giriniz (otomatik maskelenecek)"
              className="w-full px-3.5 py-2.5 text-sm bg-input border border-input-border text-secondary rounded-xl placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
              autoFocus
            />
            {name && (
              <span className="text-[11px] text-muted mt-1 block">
                Maskeli: {maskName(name)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Konsolosluk <span className="text-red-400">*</span>
              </label>
              <select
                value={consulate}
                onChange={(e) => setConsulate(e.target.value as Consulate)}
                className="w-full px-3.5 py-2.5 text-sm bg-input border border-input-border text-secondary rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
              >
                {CONSULATES.map((c) => (
                  <option key={c} value={c}>{CONSULATE_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Vize Türü</label>
              <select
                value={visaType}
                onChange={(e) => setVisaType(e.target.value as VisaType)}
                className="w-full px-3.5 py-2.5 text-sm bg-input border border-input-border text-secondary rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
              >
                {VISA_TYPES.map((vt) => (
                  <option key={vt} value={vt}>{VISA_TYPE_LABELS[vt]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Almanya Şehri</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-input border border-input-border text-secondary rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
            >
              <option value="">Seçiniz...</option>
              {GERMAN_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="bg-input border border-input-border rounded-xl p-3">
            <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">
              Tarihler <span className="text-red-400">*</span>
              <span className="normal-case text-faint ml-1">(en az biri zorunlu, sıralama önemli)</span>
            </div>
            <div className="space-y-3">
              <DateField label="Başvuru Tarihi" value={applicationDate} onChange={setApplicationDate} />
              <DateField label="Atama Tarihi" value={assignmentDate} onChange={setAssignmentDate} />
              <DateField label="Randevu Tarihi" value={appointmentDate} onChange={setAppointmentDate} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Eksik Evrak</label>
            <input
              type="text"
              value={missingDocs}
              onChange={(e) => setMissingDocs(e.target.value)}
              placeholder="Tarih veya tarih aralığı (ör: 01.01.2026, 05.01.2026-10.01.2026)"
              className="w-full px-3.5 py-2.5 text-sm bg-input border border-input-border text-secondary rounded-xl placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
            />
          </div>

          <DateField label="Karar E-posta Tarihi" value={decisionEmailDate} onChange={setDecisionEmailDate} />
          <DateField label="SMS Tarihi" value={smsDate} onChange={setSmsDate} />

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Kurs Başlangıcı</label>
            <input
              type="text"
              value={courseStart}
              onChange={(e) => setCourseStart(e.target.value)}
              placeholder="GG.AA.YYYY veya aralık (ör: 05.01 => 16.02)"
              className="w-full px-3.5 py-2.5 text-sm bg-input border border-input-border text-secondary rounded-xl placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
            />
          </div>

          <div className="text-[11px] text-faint bg-background rounded-lg px-3 py-2">
            Tarih sıralaması: Başvuru ≤ Atama ≤ Randevu ≤ Eksik Evrak ≤ Karar E-posta ≤ SMS. Sonraki tarih öncekinden erken olamaz.
          </div>
        </div>

        <div className="px-6 py-4 border-t border-card-border flex gap-3 justify-end flex-shrink-0">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 text-sm font-medium text-muted hover:text-secondary hover:bg-card-border rounded-xl transition-all disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleAdd}
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {submitting ? <Spinner size="sm" label="Ekleniyor..." /> : 'Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [error, setError] = useState('');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    const fmtErr = validateDateFormat(v);
    setError(fmtErr || '');
  }, [onChange]);

  return (
    <div>
      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="GG.AA.YYYY"
        className={`w-full px-3.5 py-2.5 text-sm bg-input border text-secondary rounded-xl placeholder-faint focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50' : 'border-input-border focus:ring-indigo-500/30 focus:border-indigo-500/50'}`}
      />
      {error && (
        <div className="text-[11px] text-red-400 mt-1">{error}</div>
      )}
    </div>
  );
}
