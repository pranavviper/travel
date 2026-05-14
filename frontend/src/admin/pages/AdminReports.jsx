import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const { api } = useAdmin();
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try { const res = await api.get('/reports', { params: { status: statusFilter } }); setReports(res.data); }
    catch { toast.error('Failed'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [statusFilter]);

  const update = async (id, status) => {
    try { await api.put(`/reports/${id}`, { status }); toast.success(`Report ${status}`); fetch(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="admin-section">
      <div className="page-header">
        <div><h1>Reports & Moderation</h1><p>{reports.length} reports</p></div>
        <div className="tab-group">
          {['pending', 'resolved', 'dismissed'].map(s => (
            <button key={s} className={`tab-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Type</th><th>Reason</th><th>Description</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? [...Array(3)].map((_, i) => <tr key={i}>{[...Array(5)].map((_, j) => <td key={j}><div className="skel" /></td>)}</tr>)
              : reports.map(r => (
              <tr key={r._id}>
                <td><span className="chip">{r.reportedType}</span></td>
                <td><strong>{r.reason}</strong></td>
                <td className="muted" style={{ maxWidth: 250 }}>{r.description || '—'}</td>
                <td className="muted">{r.createdAt ? format(new Date(r.createdAt), 'MMM d, yyyy') : '—'}</td>
                <td>
                  {r.status === 'pending' && (
                    <div className="action-btns">
                      <button className="icon-btn active" title="Resolve" onClick={() => update(r._id, 'resolved')}><CheckCircle size={16} /></button>
                      <button className="icon-btn warn" title="Dismiss" onClick={() => update(r._id, 'dismissed')}><XCircle size={16} /></button>
                    </div>
                  )}
                  {r.status !== 'pending' && <span className={`status-badge ${r.status === 'resolved' ? 'active' : 'banned'}`}>{r.status}</span>}
                </td>
              </tr>
            ))}
            {!loading && reports.length === 0 && <tr><td colSpan={5} className="empty-row">No {statusFilter} reports</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
