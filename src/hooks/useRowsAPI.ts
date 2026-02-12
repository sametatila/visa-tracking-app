'use client';

import { useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { RawRow } from '@/lib/types';
import { deriveAllRows } from '@/lib/derivation';
import { filterToSearchParams } from '@/lib/filterParams';

const PAGE_LIMIT = 200;

export function useRowsAPI() {
  const { state, dispatch } = useApp();
  const abortRef = useRef<AbortController | null>(null);

  const fetchTablePage = useCallback(
    async (page: number, append: boolean = false) => {
      dispatch({ type: 'SET_TABLE_LOADING', loading: true });

      try {
        const params = filterToSearchParams(state.filterState);
        params.set('page', String(page));
        params.set('limit', String(PAGE_LIMIT));

        const res = await fetch(`/api/rows?${params.toString()}`);
        if (!res.ok) throw new Error('Tablo verisi alınamadı');

        const data = await res.json();
        const derived = deriveAllRows(data.rows as RawRow[]);

        if (append) {
          dispatch({
            type: 'APPEND_TABLE_PAGE',
            rows: derived,
            page: data.page,
            hasMore: data.hasMore,
          });
        } else {
          dispatch({
            type: 'SET_TABLE_PAGE',
            rows: derived,
            page: data.page,
            hasMore: data.hasMore,
            totalFiltered: data.totalCount,
          });
        }
      } catch (err) {
        dispatch({ type: 'SET_TABLE_LOADING', loading: false });
        dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Bilinmeyen hata' });
      }
    },
    [state.filterState, dispatch]
  );

  const fetchStats = useCallback(async () => {
    dispatch({ type: 'SET_STATS_LOADING', loading: true });

    try {
      const params = filterToSearchParams(state.filterState);
      const res = await fetch(`/api/rows/stats?${params.toString()}`);
      if (!res.ok) throw new Error('İstatistik verisi alınamadı');

      const data = await res.json();
      const derived = deriveAllRows(data.rows as RawRow[]);

      dispatch({
        type: 'SET_STATS',
        rows: derived,
        totalUnfiltered: data.totalUnfiltered,
        totalFiltered: derived.length,
      });
    } catch (err) {
      dispatch({ type: 'SET_STATS_LOADING', loading: false });
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Bilinmeyen hata' });
    }
  }, [state.filterState, dispatch]);

  const fetchAll = useCallback(async () => {
    // Cancel previous in-flight requests
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    dispatch({ type: 'RESET_TABLE' });
    await Promise.all([fetchTablePage(1, false), fetchStats()]);
  }, [fetchTablePage, fetchStats, dispatch]);

  const loadMore = useCallback(async () => {
    if (state.tableLoading || !state.tableHasMore) return;
    await fetchTablePage(state.tablePage + 1, true);
  }, [state.tableLoading, state.tableHasMore, state.tablePage, fetchTablePage]);

  const addRow = useCallback(
    async (data: Omit<RawRow, 'id'>) => {
      dispatch({ type: 'SET_MUTATING', mutating: true });
      dispatch({ type: 'SET_ERROR', error: null });

      try {
        const res = await fetch('/api/rows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Kayıt eklenemedi');
        }

        dispatch({ type: 'SET_MUTATING', mutating: false });
        await fetchAll();
      } catch (err) {
        dispatch({ type: 'SET_MUTATING', mutating: false });
        throw err;
      }
    },
    [dispatch, fetchAll]
  );

  const updateRow = useCallback(
    async (id: string, key: string, value: string) => {
      dispatch({ type: 'SET_MUTATING', mutating: true });
      dispatch({ type: 'SET_ERROR', error: null });

      try {
        const res = await fetch(`/api/rows/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Kayıt güncellenemedi');
        }

        dispatch({ type: 'SET_MUTATING', mutating: false });
        await fetchAll();
      } catch (err) {
        dispatch({ type: 'SET_MUTATING', mutating: false });
        throw err;
      }
    },
    [dispatch, fetchAll]
  );

  const deleteRow = useCallback(
    async (id: string) => {
      dispatch({ type: 'SET_MUTATING', mutating: true });
      dispatch({ type: 'SET_ERROR', error: null });

      try {
        const res = await fetch(`/api/rows/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Kayıt silinemedi');
        }

        dispatch({ type: 'SET_MUTATING', mutating: false });
        await fetchAll();
      } catch (err) {
        dispatch({ type: 'SET_MUTATING', mutating: false });
        throw err;
      }
    },
    [dispatch, fetchAll]
  );

  return {
    fetchAll,
    fetchTablePage,
    fetchStats,
    addRow,
    updateRow,
    deleteRow,
    loadMore,
  };
}
