'use client';

import { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { AppState, FilterState, DerivedRow } from '@/lib/types';
import { CONSULATES } from '@/lib/constants';

function getDefaultFilter(): FilterState {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const fromMonth = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
  const toMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return {
    consulates: [...CONSULATES],
    deCity: '',
    appointmentMonthFrom: fromMonth,
    appointmentMonthTo: toMonth,
    onlyWithResult: false,
    excludeOutliers: false,
    searchQuery: '',
  };
}

const DEFAULT_STATE: AppState = {
  filterState: getDefaultFilter(),
  tableRows: [],
  tablePage: 0,
  tableHasMore: true,
  tableLoading: false,
  allFilteredRows: [],
  statsLoading: false,
  totalFiltered: 0,
  totalUnfiltered: 0,
  mutating: false,
  error: null,
  deleteWarning: null,
  activeVisitors: 0,
};

export type Action =
  | { type: 'SET_FILTER'; filter: Partial<FilterState> }
  | { type: 'SET_TABLE_PAGE'; rows: DerivedRow[]; page: number; hasMore: boolean; totalFiltered: number }
  | { type: 'APPEND_TABLE_PAGE'; rows: DerivedRow[]; page: number; hasMore: boolean }
  | { type: 'SET_STATS'; rows: DerivedRow[]; totalUnfiltered: number; totalFiltered: number }
  | { type: 'SET_TABLE_LOADING'; loading: boolean }
  | { type: 'SET_STATS_LOADING'; loading: boolean }
  | { type: 'SET_MUTATING'; mutating: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_DELETE_WARNING'; warning: string | null }
  | { type: 'SET_ACTIVE_VISITORS'; count: number }
  | { type: 'RESET_TABLE' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FILTER':
      return {
        ...state,
        filterState: { ...state.filterState, ...action.filter },
      };

    case 'SET_TABLE_PAGE':
      return {
        ...state,
        tableRows: action.rows,
        tablePage: action.page,
        tableHasMore: action.hasMore,
        totalFiltered: action.totalFiltered,
        tableLoading: false,
      };

    case 'APPEND_TABLE_PAGE': {
      const existingIds = new Set(state.tableRows.map((r) => r.id));
      const uniqueNew = action.rows.filter((r) => !existingIds.has(r.id));
      return {
        ...state,
        tableRows: [...state.tableRows, ...uniqueNew],
        tablePage: action.page,
        tableHasMore: action.hasMore,
        tableLoading: false,
      };
    }

    case 'SET_STATS':
      return {
        ...state,
        allFilteredRows: action.rows,
        totalUnfiltered: action.totalUnfiltered,
        totalFiltered: action.totalFiltered,
        statsLoading: false,
      };

    case 'SET_TABLE_LOADING':
      return { ...state, tableLoading: action.loading };

    case 'SET_STATS_LOADING':
      return { ...state, statsLoading: action.loading };

    case 'SET_MUTATING':
      return { ...state, mutating: action.mutating };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'SET_DELETE_WARNING':
      return { ...state, deleteWarning: action.warning };

    case 'SET_ACTIVE_VISITORS':
      return { ...state, activeVisitors: action.count };

    case 'RESET_TABLE':
      return {
        ...state,
        tableRows: [],
        tablePage: 0,
        tableHasMore: true,
      };

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
