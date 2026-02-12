'use client';

import { useEffect, useMemo, useRef } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { FilterState } from '@/lib/types';
import { computeAllStats } from '@/lib/statistics';
import StatCards from './StatCards';
import FilterBar from './FilterBar';
import DataTable from './DataTable';
import { useRowsAPI } from '@/hooks/useRowsAPI';

function AppContent() {
  const { state, dispatch } = useApp();
  const { fetchAll, loadMore } = useRowsAPI();
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

  const isLoading = state.tableLoading && state.tableRows.length === 0;

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">
            Vize Takip
          </h1>
          <span className="text-xs font-medium text-gray-400 bg-[#1a1d27] px-2.5 py-1 rounded-full border border-[#2a2d3a]">
            {state.totalFiltered === state.totalUnfiltered
              ? `${state.totalUnfiltered} kayıt`
              : `${state.totalFiltered} / ${state.totalUnfiltered} kayıt`}
          </span>
          {state.mutating && (
            <span className="text-xs text-indigo-400 animate-pulse">Kaydediliyor...</span>
          )}
        </div>

        {state.error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <StatCards stats={stats} />
        <FilterBar filter={state.filterState} onFilterChange={handleFilterChange} />

        {isLoading ? (
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-16 flex items-center justify-center">
            <div className="animate-pulse text-gray-500 text-sm">Yükleniyor...</div>
          </div>
        ) : (
          <DataTable
            rows={tableFiltered}
            hasMore={state.tableHasMore}
            loading={state.tableLoading}
            onLoadMore={loadMore}
          />
        )}

        <div className="text-center text-xs text-gray-600 py-4">
          Randevu dönemi filtresi varsayılan olarak son 6 ayı gösterir. Tüm verileri görmek için tarih aralığını genişletin.
        </div>
      </div>
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
