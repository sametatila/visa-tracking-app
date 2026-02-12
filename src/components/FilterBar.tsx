'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FilterState, Consulate } from '@/lib/types';
import { CONSULATES, CONSULATE_LABELS } from '@/lib/constants';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (patch: Partial<FilterState>) => void;
}

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

function parseYM(ym: string): { year: number; month: number } | null {
  if (!ym) return null;
  const [y, m] = ym.split('-');
  return { year: parseInt(y), month: parseInt(m) };
}

function formatYM(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function formatLabel(ym: string): string {
  const parsed = parseYM(ym);
  if (!parsed) return '';
  return `${MONTHS_TR[parsed.month - 1]} ${parsed.year}`;
}

function MonthPicker({
  value,
  onChange,
  placeholder,
  minValue,
  maxValue,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  minValue?: string;
  maxValue?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const now = new Date();
  const parsed = parseYM(value);
  const [viewYear, setViewYear] = useState(parsed?.year ?? now.getFullYear());

  const minYear = now.getFullYear() - 2;
  const maxYear = now.getFullYear() + 1;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = useCallback(() => {
    if (parsed) setViewYear(parsed.year);
    setOpen((o) => !o);
  }, [parsed]);

  const isDisabled = (month: number): boolean => {
    const ym = formatYM(viewYear, month);
    if (minValue && ym < minValue) return true;
    if (maxValue && ym > maxValue) return true;
    return false;
  };

  const isSelected = (month: number): boolean => {
    return parsed?.year === viewYear && parsed?.month === month;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full px-2.5 py-2 text-xs text-left bg-input border border-input-border text-secondary rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all flex items-center justify-between gap-1"
      >
        <span className={value ? 'text-secondary' : 'text-faint'}>
          {value ? formatLabel(value) : placeholder}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-muted flex-shrink-0">
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-56 bg-card border border-input-border rounded-xl shadow-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewYear((y) => Math.max(minYear, y - 1))}
              disabled={viewYear <= minYear}
              className="p-1 text-muted hover:text-secondary disabled:text-disabled disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-secondary">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => Math.min(maxYear, y + 1))}
              disabled={viewYear >= maxYear}
              className="p-1 text-muted hover:text-secondary disabled:text-disabled disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MONTHS_TR.map((name, i) => {
              const month = i + 1;
              const disabled = isDisabled(month);
              const selected = isSelected(month);
              return (
                <button
                  key={month}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(formatYM(viewYear, month));
                    setOpen(false);
                  }}
                  className={`px-1 py-1.5 text-[11px] rounded-lg transition-all ${
                    selected
                      ? 'bg-indigo-500 text-white font-semibold'
                      : disabled
                        ? 'text-disabled cursor-not-allowed'
                        : 'text-muted hover:bg-card-border hover:text-secondary'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="w-full mt-2 px-2 py-1 text-[11px] text-muted hover:text-secondary hover:bg-card-border rounded-lg transition-colors text-center"
            >
              Temizle
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({ filter, onFilterChange }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleConsulate = (c: Consulate) => {
    const current = filter.consulates;
    const next = current.includes(c)
      ? current.filter((x) => x !== c)
      : [...current, c];
    onFilterChange({ consulates: next });
  };

  const handleFromChange = (v: string) => {
    const patch: Partial<FilterState> = { appointmentMonthFrom: v };
    // Bitiş ayı başlangıçtan önce ise bitiş'i de güncelle
    if (v && filter.appointmentMonthTo && v > filter.appointmentMonthTo) {
      patch.appointmentMonthTo = v;
    }
    onFilterChange(patch);
  };

  const handleToChange = (v: string) => {
    const patch: Partial<FilterState> = { appointmentMonthTo: v };
    // Başlangıç ayı bitişten sonra ise başlangıç'ı da güncelle
    if (v && filter.appointmentMonthFrom && v < filter.appointmentMonthFrom) {
      patch.appointmentMonthFrom = v;
    }
    onFilterChange(patch);
  };

  return (
    <div className="bg-card rounded-2xl border border-card-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between sm:hidden text-sm font-medium text-secondary"
      >
        Filtreler
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div className={`p-5 ${expanded ? 'block' : 'hidden'} sm:block`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
              Konsolosluk
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CONSULATES.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleConsulate(c)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    filter.consulates.includes(c)
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-accent-text'
                      : 'bg-input border-input-border text-muted hover:border-muted'
                  }`}
                >
                  {CONSULATE_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="deCity"
              className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5"
            >
              Almanya Şehri
            </label>
            <input
              id="deCity"
              type="text"
              value={filter.deCity}
              onChange={(e) => onFilterChange({ deCity: e.target.value })}
              placeholder="Şehir..."
              className="w-full px-3.5 py-2 text-sm bg-input border border-input-border text-secondary rounded-xl placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
            />
          </div>

          <div>
            <span className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
              Randevu Dönemi
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <MonthPicker
                  value={filter.appointmentMonthFrom}
                  onChange={handleFromChange}
                  placeholder="Başlangıç"
                  maxValue={filter.appointmentMonthTo || undefined}
                />
              </div>
              <span className="text-faint text-xs">–</span>
              <div className="flex-1">
                <MonthPicker
                  value={filter.appointmentMonthTo}
                  onChange={handleToChange}
                  placeholder="Bitiş"
                  minValue={filter.appointmentMonthFrom || undefined}
                />
              </div>
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
              &nbsp;
            </span>
            <div className="space-y-2.5">
              <Toggle
                label="Sadece sonuçlananlar"
                checked={filter.onlyWithResult}
                onChange={(v) => onFilterChange({ onlyWithResult: v })}
              />
              <Toggle
                label="Aykırı değerleri hariç tut (>180g)"
                checked={filter.excludeOutliers}
                onChange={(v) => onFilterChange({ excludeOutliers: v })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-8 h-[18px] rounded-full transition-colors ${
            checked ? 'bg-indigo-500' : 'bg-input-border group-hover:bg-muted'
          }`}
        >
          <div
            className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform ${
              checked ? 'translate-x-[14px]' : ''
            }`}
          />
        </div>
      </div>
      <span className="text-xs text-muted group-hover:text-secondary transition-colors">{label}</span>
    </label>
  );
}
