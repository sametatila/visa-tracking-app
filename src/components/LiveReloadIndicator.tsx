'use client';

interface LiveReloadIndicatorProps {
  status: 'active' | 'paused';
}

export default function LiveReloadIndicator({ status }: LiveReloadIndicatorProps) {
  const isActive = status === 'active';

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card border border-card-border"
      title={isActive ? 'Tablo 15 saniyede bir otomatik yenileniyor' : 'İnaktivite nedeniyle otomatik yenileme durdu. Sayfayı yenileyerek tekrar başlatabilirsiniz.'}
    >
      <div className="relative flex items-center justify-center">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-muted'}`} />
        {isActive && (
          <div className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        )}
      </div>
      <span className={`text-[11px] font-medium ${isActive ? 'text-emerald-400' : 'text-muted'}`}>
        {isActive ? 'Canlı' : 'Durdu'}
      </span>
    </div>
  );
}
