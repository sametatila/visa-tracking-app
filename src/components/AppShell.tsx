'use client';

import { useEffect, useMemo, useRef } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { FilterState } from '@/lib/types';
import { computeAllStats } from '@/lib/statistics';
import StatCards from './StatCards';
import FilterBar from './FilterBar';
import DataTable from './DataTable';
import TopBar from './TopBar';
import LiveReloadIndicator from './LiveReloadIndicator';
import Spinner from './Spinner';
import { useRowsAPI } from '@/hooks/useRowsAPI';
import { useLiveReload } from '@/hooks/useLiveReload';

function AppContent() {
  const { state, dispatch } = useApp();
  const { fetchAll, loadMore, refreshInBackground } = useRowsAPI();
  const isFirstMount = useRef(true);
  const filterRef = useRef(state.filterState);

  // Fetch on mount
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change (skip first mount)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    filterRef.current = state.filterState;
    const timer = setTimeout(() => {
      if (filterRef.current === state.filterState) {
        fetchAll();
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.filterState]);

  // Apply excludeOutliers client-side to stats rows
  const statsFiltered = useMemo(() => {
    if (!state.filterState.excludeOutliers) return state.allFilteredRows;
    return state.allFilteredRows.filter(
      (r) => r.appointment_to_result_days === null || r.appointment_to_result_days <= 180
    );
  }, [state.allFilteredRows, state.filterState.excludeOutliers]);

  const stats = useMemo(() => computeAllStats(statsFiltered), [statsFiltered]);

  // Apply excludeOutliers client-side to table rows
  const tableFiltered = useMemo(() => {
    if (!state.filterState.excludeOutliers) return state.tableRows;
    return state.tableRows.filter(
      (r) => r.appointment_to_result_days === null || r.appointment_to_result_days <= 180
    );
  }, [state.tableRows, state.filterState.excludeOutliers]);

  const handleFilterChange = (patch: Partial<FilterState>) => {
    dispatch({ type: 'SET_FILTER', filter: patch });
  };

  const { status: liveReloadStatus } = useLiveReload({
    onTick: refreshInBackground,
    enabled: !state.mutating,
  });

  const isLoading = state.tableLoading && state.tableRows.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Vize Takip
            </h1>
            <span className="text-xs font-medium text-muted bg-card px-2.5 py-1 rounded-full border border-card-border">
              {state.totalFiltered === state.totalUnfiltered
                ? `${state.totalUnfiltered} kayıt`
                : `${state.totalFiltered} / ${state.totalUnfiltered} kayıt`}
            </span>
            {state.activeVisitors > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted bg-card px-2.5 py-1 rounded-full border border-card-border">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                {state.activeVisitors} aktif
              </span>
            )}
            {state.mutating && (
              <Spinner size="sm" label="Kaydediliyor..." />
            )}
          </div>
          <div className="flex items-center gap-2">
            <LiveReloadIndicator status={liveReloadStatus} />
            <TopBar />
          </div>
        </div>

        {state.deleteWarning && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-400 flex-shrink-0">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-amber-400">{state.deleteWarning}</span>
            </div>
            <button
              onClick={() => dispatch({ type: 'SET_DELETE_WARNING', warning: null })}
              className="p-1 text-amber-400/60 hover:text-amber-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        )}

        {state.error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <StatCards stats={stats} />
        <FilterBar filter={state.filterState} onFilterChange={handleFilterChange} />

        {isLoading ? (
          <div className="bg-card rounded-2xl border border-card-border py-16 flex items-center justify-center">
            <Spinner size="lg" label="Yükleniyor..." />
          </div>
        ) : (
          <DataTable
            rows={tableFiltered}
            hasMore={state.tableHasMore}
            loading={state.tableLoading}
            onLoadMore={loadMore}
          />
        )}

        <div className="text-center text-xs text-faint py-4">
          Randevu dönemi filtresi varsayılan olarak son 6 ayı gösterir. Tüm verileri görmek için tarih aralığını genişletin.
        </div>
      </div>

      {/* GitHub sticky butonu */}
      <a
        href="https://github.com/sametatila/visa-tracking-app"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-muted hover:text-secondary bg-card border border-card-border rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
        title="GitHub'da görüntüle"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        GitHub
      </a>
    </div>
  );
}

export default function AppShell() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
