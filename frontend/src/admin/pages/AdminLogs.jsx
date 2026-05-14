import React, { useEffect, useState } from 'react';
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminLogs() {
  const { api } = useAdmin();
  const [data, setData] = useState({ logs: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/logs', { params: { page, limit: 30 } })
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => { toast.error('Failed'); setLoading(false); });
  }, [page]);

  const ACTION_COLORS = {
    DELETE_USER: '#EF4444', BAN_USER: '#F59E0B', UNBAN_USER: '#10B981',
    CREATE_USER: '#06B6D4', UPDATE_USER: '#8B5CF6', DELETE_TRIP: '#EF4444',
    CREATE_PLACE: '#10B981', UPDATE_PLACE: '#8B5CF6', DELETE_PLACE: '#EF4444',
    UPDATE_SETTINGS: '#EC4899',
  };

  return (
    <div className="admin-section">
      <div className="page-header">
        <div><h1>Audit Logs</h1><p>{data.total} total actions recorded</p></div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Admin</th><th>Action</th><th>Target</th><th>Details</th><th>IP</th><th>Time</th></tr></thead>
          <tbody>
            {loading ? [...Array(6)].map((_, i) => <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><div className="skel" /></td>)}</tr>)
              : data.logs.map(l => (
              <tr key={l._id}>
                <td><strong>{l.adminName || '—'}</strong></td>
                <td>
                  <span className="action-badge" style={{ background: (ACTION_COLORS[l.action] || '#888') + '20', color: ACTION_COLORS[l.action] || '#888' }}>
                    {l.action}
                  </span>
                </td>
                <td className="muted">{l.targetType}</td>
                <td className="muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.details}</td>
                <td className="muted">{l.ipAddress || '—'}</td>
                <td className="muted">{l.timestamp ? format(new Date(l.timestamp), 'MMM d, HH:mm:ss') : '—'}</td>
              </tr>
            ))}
            {!loading && data.logs.length === 0 && <tr><td colSpan={6} className="empty-row">No audit logs yet</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} /></button>
        <span>Page {page} of {data.pages}</span>
        <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page >= data.pages}><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
