import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export default function DataTable({ columns, data, rowsPerPageOptions = [10, 25, 50] }) {
  const [sortCol, setSortCol]   = useState(columns[0]?.key ?? '');
  const [sortDir, setSortDir]   = useState('desc');
  const [page, setPage]         = useState(1);
  const [perPage, setPerPage]   = useState(rowsPerPageOptions[0]);

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
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>
                  {col.sortable !== false ? (
                    <span className="sort-btn" onClick={() => handleSort(col.key)}>
                      {col.label}
                      {sortCol === col.key
                        ? sortDir === 'asc'
                          ? <ChevronUp size={12} />
                          : <ChevronDown size={12} />
                        : <ChevronsUpDown size={12} style={{ opacity: 0.4 }} />}
                    </span>
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', color: '#8b949e', padding: '32px 0' }}>
                  No data available
                </td>
              </tr>
            ) : pageData.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        borderTop: '1px solid #21262d',
        fontSize: 13, color: '#8b949e',
      }}>
        <span>
          Showing <strong style={{ color: '#e6edf3' }}>{Math.min((page-1)*perPage+1, sorted.length)}</strong> to{' '}
          <strong style={{ color: '#e6edf3' }}>{Math.min(page*perPage, sorted.length)}</strong> of{' '}
          <strong style={{ color: '#e6edf3' }}>{sorted.length}</strong> entries
          &nbsp;&nbsp;Rows per page:&nbsp;
          <select
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
            style={{ padding: '3px 24px 3px 8px', fontSize: 12 }}
          >
            {rowsPerPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Page <strong style={{ color: '#e6edf3' }}>{page}</strong> of {totalPages}</span>
          <button
            className="btn-ghost"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >‹</button>
          <button
            className="btn-ghost"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >›</button>
        </div>
      </div>
    </div>
  );
}
