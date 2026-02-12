'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DerivedRow } from '@/lib/types';
import { COLUMNS } from '@/lib/constants';
import TableRow from './TableRow';
import AddRowModal from './AddRowModal';

interface DataTableProps {
  rows: DerivedRow[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

export default function DataTable({ rows, hasMore, loading, onLoadMore }: DataTableProps) {
  const [showModal, setShowModal] = useState(false);
  const sentinelRef = useRef<HTMLTableRowElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      {
        root: container,
        rootMargin: '200px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, handleLoadMore]);

  return (
    <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#2a2d3a] flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">
          {rows.length} satır gösteriliyor
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Yeni Ekle
        </button>
      </div>
      <div className="overflow-x-auto">
        <div ref={scrollContainerRef} className="max-h-[720px] overflow-y-auto">
          <table className="w-full min-w-[1280px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#151821] border-b border-[#2a2d3a]">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${col.width}`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider min-w-[120px] w-[120px]">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <TableRow key={row.id} row={row} />
              ))}
              {hasMore && (
                <tr ref={sentinelRef}>
                  <td colSpan={COLUMNS.length + 1} className="py-4 text-center">
                    {loading && (
                      <span className="text-sm text-gray-500 animate-pulse">Yükleniyor...</span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {rows.length === 0 && !loading && (
        <div className="py-16 text-center text-gray-600">
          Gösterilecek veri yok. Yeni kayıt ekleyin veya filtrelerinizi değiştirin.
        </div>
      )}
      {showModal && <AddRowModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
