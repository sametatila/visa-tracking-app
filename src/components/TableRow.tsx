'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { DerivedRow, ColumnDef, ColumnKey } from '@/lib/types';
import { COLUMNS, CONSULATES, CONSULATE_LABELS, GERMAN_CITIES, VISA_TYPES, VISA_TYPE_LABELS } from '@/lib/constants';
import { validateDateOrder, validateDateFormat, DATE_ORDER, parseDDMMYYYY } from '@/lib/dateUtils';
import { useRowsAPI } from '@/hooks/useRowsAPI';

interface TableRowProps {
  row: DerivedRow;
}

const REQUIRED_DATE_FIELDS: ColumnKey[] = ['application_date', 'assignment_date', 'appointment_date'];

export default function TableRow({ row }: TableRowProps) {
  const { updateRow, deleteRow } = useRowsAPI();
  const [editingField, setEditingField] = useState<ColumnKey | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [validationMsg, setValidationMsg] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const startEdit = useCallback(
    (col: ColumnDef) => {
      if (!col.editable || col.key === 'id' || saving) return;
      setEditingField(col.key);
      setDraftValue(row[col.key] as string);
      setValidationMsg('');
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [row, saving]
  );

  const getAllDates = useCallback((): Record<string, string> => {
    const dates: Record<string, string> = {};
    for (const key of DATE_ORDER) {
      dates[key] = row[key as ColumnKey] as string;
    }
    return dates;
  }, [row]);

  const doUpdate = useCallback(
    async (key: ColumnKey, value: string) => {
      setSaving(true);
      try {
        await updateRow(row.id, key, value);
      } catch {
        // Error handled in useRowsAPI
      } finally {
        setSaving(false);
      }
    },
    [row.id, updateRow]
  );

  const commitEdit = useCallback(() => {
    if (!editingField) return;

    if (editingField === 'name' && draftValue.trim() === '') {
      setValidationMsg('Kullanıcı adı boş bırakılamaz.');
      return;
    }

    if (REQUIRED_DATE_FIELDS.includes(editingField) && draftValue.trim() === '') {
      const otherDates = REQUIRED_DATE_FIELDS.filter((f) => f !== editingField);
      const hasOtherDate = otherDates.some((f) => (row[f] as string).trim() !== '');
      if (!hasOtherDate) {
        setValidationMsg('En az bir tarih alanı dolu olmalı.');
        return;
      }
    }

    if (DATE_ORDER.includes(editingField) && draftValue.trim()) {
      const allDates = getAllDates();
      allDates[editingField] = draftValue;
      const orderError = validateDateOrder(editingField, draftValue, allDates);
      if (orderError) {
        setValidationMsg(orderError);
        return;
      }
    }

    setValidationMsg('');
    const field = editingField;
    const value = draftValue;
    setEditingField(null);
    doUpdate(field, value);
  }, [editingField, draftValue, row, getAllDates, doUpdate]);

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setDraftValue('');
    setValidationMsg('');
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        const currentIdx = COLUMNS.findIndex((c) => c.key === editingField);
        const nextCol = COLUMNS.find(
          (c, i) => i > currentIdx && c.editable && c.key !== 'id'
        );
        if (nextCol) {
          setEditingField(nextCol.key);
          setDraftValue(row[nextCol.key] as string);
          setValidationMsg('');
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }
    },
    [commitEdit, cancelEdit, editingField, row]
  );

  const handleSelectChange = useCallback(
    (col: ColumnDef, value: string) => {
      setDraftValue(value);
      setEditingField(null);
      doUpdate(col.key, value);
    },
    [doUpdate]
  );

  const handleDelete = useCallback(async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setSaving(true);
    try {
      await deleteRow(row.id);
    } catch {
      // Error handled in useRowsAPI
    } finally {
      setSaving(false);
      setConfirmingDelete(false);
    }
  }, [row.id, deleteRow, confirmingDelete]);

  const badges = [];
  if (row.invalid_date_parse)
    badges.push(
      <span key="invalid" className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-red-500/20 text-red-400" title="Geçersiz tarih formatı">
        Geçersiz
      </span>
    );
  if (row.missing_docs_parsed.hasWarning)
    badges.push(
      <span key="mdwarn" className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-yellow-500/20 text-yellow-400" title="Eksik evrak tarih(ler)i ayrıştırılamadı">
        Uyarı
      </span>
    );

  const renderEditField = (col: ColumnDef) => {
    if (col.type === 'consulate-select') {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={draftValue}
          onChange={(e) => handleSelectChange(col, e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1.5 py-1 text-sm bg-input border border-indigo-500/50 rounded-lg text-secondary focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {CONSULATES.map((c) => (
            <option key={c} value={c}>{CONSULATE_LABELS[c]}</option>
          ))}
        </select>
      );
    }

    if (col.type === 'city-select') {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={draftValue}
          onChange={(e) => handleSelectChange(col, e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1.5 py-1 text-sm bg-input border border-indigo-500/50 rounded-lg text-secondary focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Seçiniz...</option>
          {GERMAN_CITIES.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      );
    }

    if (col.type === 'visa-select') {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={draftValue}
          onChange={(e) => handleSelectChange(col, e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1.5 py-1 text-sm bg-input border border-indigo-500/50 rounded-lg text-secondary focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {VISA_TYPES.map((vt) => (
            <option key={vt} value={vt}>{VISA_TYPE_LABELS[vt]}</option>
          ))}
        </select>
      );
    }

    if (col.type === 'date') {
      return (
        <div>
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draftValue}
            onChange={(e) => {
              const v = e.target.value;
              setDraftValue(v);
              const fmtErr = validateDateFormat(v);
              setValidationMsg(fmtErr || '');
            }}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className={`w-full px-1.5 py-1 text-sm bg-input border rounded-lg text-secondary focus:outline-none focus:ring-1 ${validationMsg ? 'border-red-500/50 focus:ring-red-500' : 'border-indigo-500/50 focus:ring-indigo-500'}`}
            placeholder="GG.AA.YYYY"
          />
          {validationMsg && (
            <div className="text-[10px] text-red-400 mt-0.5 whitespace-normal">{validationMsg}</div>
          )}
        </div>
      );
    }

    return (
      <div>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1.5 py-1 text-sm bg-input border border-indigo-500/50 rounded-lg text-secondary focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {validationMsg && (
          <div className="text-[10px] text-red-400 mt-0.5 whitespace-normal">{validationMsg}</div>
        )}
      </div>
    );
  };

  const hasResult = row.decision_email_date.trim() !== '' || row.sms_date.trim() !== '';
  const hasMissingDocsNoResult = row.missing_docs.trim() !== '' && !hasResult;

  const isDeleteProtected = (() => {
    if (!hasResult) return false;
    const appt = parseDDMMYYYY(row.appointment_date);
    if (!appt) return false;
    const daysSince = Math.floor((Date.now() - appt.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince > 60;
  })();

  const rowBg = hasResult
    ? 'bg-emerald-500/10 hover:bg-emerald-500/15'
    : hasMissingDocsNoResult
      ? 'bg-amber-500/10 hover:bg-amber-500/15'
      : 'hover:bg-input';

  const resultDays = row.appointment_to_result_days;

  return (
    <tr className={`border-b border-card-border transition-colors ${rowBg} ${saving ? 'opacity-60' : ''}`}>
      {COLUMNS.map((col) => {
        const isEditing = editingField === col.key;
        let displayValue = row[col.key] as string;

        if (col.key === 'tr_consulate') {
          displayValue = CONSULATE_LABELS[row.tr_consulate] || displayValue;
        }

        if (col.key === 'visa_type') {
          displayValue = row.visa_type;
        }

        return (
          <td
            key={col.key}
            className={`px-3 py-2 text-sm ${col.width} max-w-0 truncate`}
            onClick={() => !isEditing && startEdit(col)}
          >
            {isEditing ? (
              renderEditField(col)
            ) : (
              <span className="cursor-pointer block truncate text-secondary" title={row[col.key] as string}>
                {displayValue || <span className="text-faint">—</span>}
              </span>
            )}
          </td>
        );
      })}
      <td className="px-3 py-2 text-sm min-w-[120px] w-[120px]">
        <div className="h-full flex items-center gap-1.5 flex-wrap">
          {hasResult && resultDays !== null && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/20 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
              </svg>
              {resultDays} gün
            </span>
          )}
          {hasResult && resultDays === null && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/20 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
              </svg>
              Sonuç
            </span>
          )}
          {badges}
          {isDeleteProtected ? (
            <span
              className="ml-auto p-1 text-disabled cursor-not-allowed"
              title="Bu kayıt sonuçlanmış ve 60 günden eski olduğu için silinemez"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
            </span>
          ) : confirmingDelete ? (
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-1.5 py-0.5 text-[10px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                title="Silmeyi onayla"
              >
                Sil
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="px-1.5 py-0.5 text-[10px] font-medium text-muted hover:text-secondary hover:bg-card-border rounded-lg transition-colors"
                title="İptal"
              >
                İptal
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="ml-auto p-1 text-faint hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 disabled:opacity-50"
              title="Satırı sil"
              aria-label="Satırı sil"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
