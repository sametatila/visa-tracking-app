'use client';

import { AllStats } from '@/lib/types';
import { CONSULATE_LABELS } from '@/lib/constants';

const MONTH_NAMES_TR: Record<string, string> = {
  '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan',
  '05': 'Mayıs', '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos',
  '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık',
};

function formatPeriodTR(ym: string): string {
  const [year, month] = ym.split('-');
  return `${MONTH_NAMES_TR[month] || month} ${year}`;
}

interface StatCardsProps {
  stats: AllStats;
}

function Card({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="group relative bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-5 transition-all hover:border-[#3a3d4a] hover:-translate-y-0.5">
      {accent && (
        <div className={`absolute top-0 left-6 right-6 h-0.5 rounded-b ${accent}`} />
      )}
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function BigNumber({ value, unit, sub }: { value: string | number | null; unit?: string; sub?: string }) {
  return (
    <div>
      <span className="text-2xl font-bold text-gray-100 tracking-tight">
        {value ?? '—'}
      </span>
      {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
      {sub && <span className="text-xs text-gray-500 ml-2">{sub}</span>}
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-gray-500 bg-[#0f1117] rounded">
      {count} veri
    </span>
  );
}

export default function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card title="Veri Seti" accent="bg-blue-500">
        <div className="flex items-end gap-6">
          <div>
            <div className="text-3xl font-extrabold text-gray-100">{stats.totalRows}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">toplam kayıt</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-400">{stats.resultedRows}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">sonuçlanan</div>
          </div>
        </div>
      </Card>

      <Card title="Randevu → Sonuç" accent="bg-violet-500">
        <BigNumber
          value={stats.appointmentToResult.average}
          unit="gün ort."
          sub={`${stats.appointmentToResult.count} veri`}
        />
        <div className="mt-2 flex gap-3 text-xs text-gray-500">
          <span>P25–P75: {stats.appointmentToResult.p25 ?? '—'}–{stats.appointmentToResult.p75 ?? '—'}</span>
          <span>Min–Maks: {stats.appointmentToResult.min ?? '—'}–{stats.appointmentToResult.max ?? '—'}</span>
        </div>
      </Card>

      <Card title="Başvuru → Randevu" accent="bg-amber-500">
        <BigNumber
          value={stats.applicationToAppointment.average}
          unit="gün ort."
          sub={`${stats.applicationToAppointment.count} veri`}
        />
      </Card>

      <Card title="Başvuru → Sonuç" accent="bg-rose-500">
        <BigNumber
          value={stats.applicationToResult.average}
          unit="gün ort."
          sub={`${stats.applicationToResult.count} veri`}
        />
      </Card>

      <Card title="Konsolosluk Karşılaştırma">
        <div className="space-y-2">
          {stats.consulateStats.map((cs) => (
            <div key={cs.consulate} className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{CONSULATE_LABELS[cs.consulate]}</span>
              <div className="flex items-center gap-2">
                {cs.average !== null ? (
                  <>
                    <span className="text-sm font-semibold text-gray-200">{cs.average} gün</span>
                    <CountBadge count={cs.count} />
                  </>
                ) : (
                  <span className="text-sm text-gray-600">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Dönem Hızı (Aylık)">
        {stats.periodStats.length > 0 ? (
          <div className="space-y-1.5">
            {stats.periodStats.map((p) => (
              <div key={p.period} className="flex justify-between items-center py-0.5">
                <span className="text-sm text-gray-400">{formatPeriodTR(p.period)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-200">{p.average} gün</span>
                  <CountBadge count={p.count} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600">Yeterli veri yok</div>
        )}
      </Card>

      <Card title="Şehir Hızı (min. 3 kayıt)">
        {stats.cityStats.length > 0 ? (
          <div className="space-y-1.5">
            {stats.cityStats.map((cs) => (
              <div key={cs.city} className="flex justify-between items-center">
                <span className="text-sm text-gray-400">{cs.city}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-200">{cs.average} gün</span>
                  <CountBadge count={cs.count} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600">Yeterli veri yok</div>
        )}
      </Card>

      <Card title="Eksik Evrak Etkisi">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Eksik evrak yok</span>
            <div className="flex items-center gap-2">
              {stats.missingDocsEffect.avgWithout !== null ? (
                <>
                  <span className="text-sm font-semibold text-gray-200">{stats.missingDocsEffect.avgWithout} gün</span>
                  <CountBadge count={stats.missingDocsEffect.countWithout} />
                </>
              ) : (
                <span className="text-sm text-gray-600">—</span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Eksik evrak var</span>
            <div className="flex items-center gap-2">
              {stats.missingDocsEffect.avgWith !== null ? (
                <>
                  <span className="text-sm font-semibold text-gray-200">{stats.missingDocsEffect.avgWith} gün</span>
                  <CountBadge count={stats.missingDocsEffect.countWith} />
                </>
              ) : (
                <span className="text-sm text-gray-600">—</span>
              )}
            </div>
          </div>
          {stats.missingDocsEffect.delta !== null && (
            <div className="pt-2 border-t border-[#2a2d3a]">
              <span className={`text-sm font-bold ${stats.missingDocsEffect.delta > 0 ? 'text-red-400' : stats.missingDocsEffect.delta < 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                {stats.missingDocsEffect.delta > 0 ? '+' : ''}{stats.missingDocsEffect.delta} gün fark
              </span>
            </div>
          )}
        </div>
      </Card>

    </div>
  );
}
