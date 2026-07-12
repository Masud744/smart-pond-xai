import { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Inbox } from 'lucide-react';

export default function DataTable({ columns, data = [], rowsPerPageOptions = [10, 25, 50] }) {
  const [sortCol, setSortCol]   = useState(columns[0]?.key ?? '');
  const [sortDir, setSortDir]   = useState('desc');
  const [page, setPage]         = useState(1);
  const [perPage, setPerPage]   = useState(rowsPerPageOptions[0]);

  // Reset page to 1 when data changes (prevents blank page bug)
  useEffect(() => {
    setPage(1);
  }, [data]);

  const handleSort = (key) => {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(key); setSortDir('desc'); }
    setPage(1);
  };

  const sorted = useMemo(() => {
    if (!sortCol) return data;
    return [...data].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (av == null) return 1; if (bv == null) return -1;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const pageData   = sorted.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="data-table-container">
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => {
                const isSorted = sortCol === col.key;
                const ariaSort = !col.sortable ? undefined : isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
                
                return (
                  <th
                    key={col.key}
                    style={{ userSelect: 'none' }}
                    aria-sort={ariaSort}
                  >
                    {col.sortable !== false ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'inherit',
                          font: 'inherit',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: 0,
                          fontWeight: 'inherit',
                          letterSpacing: 'inherit',
                          textTransform: 'inherit'
                        }}
                        title={`Sort by ${col.label}`}
                      >
                        <span>{col.label}</span>
                        {isSorted
                          ? sortDir === 'asc'
                            ? <ChevronUp size={14} style={{ color: 'var(--color-blue)' }} />
                            : <ChevronDown size={14} style={{ color: 'var(--color-blue)' }} />
                          : <ChevronsUpDown size={14} style={{ opacity: 0.35 }} />}
                      </button>
                    ) : col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '60px 24px' }}>
                  <div className="empty-state-card" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                    <div className="empty-state-icon">
                      <Inbox size={22} />
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, marginBottom: 4 }}>
                      No Records Discovered
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: 300, lineHeight: 1.5 }}>
                      No historical metrics or telemetry reports match the active filtering scope.
                    </div>
                  </div>
                </td>
              </tr>
            ) : pageData.map((row, i) => (
              <tr key={i} style={{ transition: 'background-color 0.15s ease' }}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row, i) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderTop: '1px solid var(--border-color)',
        fontSize: 13, color: 'var(--text-secondary)',
        background: 'rgba(7, 10, 19, 0.4)',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{sorted.length === 0 ? 0 : (page - 1) * perPage + 1}</strong> to{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{Math.min(page * perPage, sorted.length)}</strong> of{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{sorted.length}</strong> entries
          </span>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Rows per page:</span>
            <select
              value={perPage}
              onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
              style={{
                padding: '4px 28px 4px 10px',
                fontSize: 12,
                borderRadius: 8,
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
              }}
              aria-label="Rows per page"
            >
              {rowsPerPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>Page <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> of {totalPages}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8 }}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8 }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
