import React, { useEffect, useState } from 'react';
import { Bot, Zap, Calendar, Clock } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminAI() {
  const { api } = useAdmin();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ai/stats').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading"><div className="spinner" /><p>Loading AI stats...</p></div>;

  return (
    <div className="admin-section">
      <div className="page-header">
        <div><h1>AI Manager</h1><p>Gemini API usage and logs</p></div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Total Queries', value: stats?.total || 0, icon: Bot, color: '#8B5CF6' },
          { label: 'Today', value: stats?.today || 0, icon: Zap, color: '#10B981' },
          { label: 'Free Tier Limit', value: '1,500/day', icon: Calendar, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color + '20', color: s.color }}><s.icon size={22} /></div>
            <div className="stat-info">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-table-wrap" style={{ marginTop: 24 }}>
        <h3 style={{ padding: '16px 20px', borderBottom: '1px solid #ffffff10' }}>Recent AI Queries</h3>
        <table className="admin-table">
          <thead><tr><th>User ID</th><th>Query</th><th>Model</th><th>Time</th></tr></thead>
          <tbody>
            {(stats?.recent || []).map(l => (
              <tr key={l._id}>
                <td className="muted">{l.userId}</td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.query}</td>
                <td><span className="chip">{l.model}</span></td>
                <td className="muted">{l.timestamp ? format(new Date(l.timestamp), 'MMM d, HH:mm') : '—'}</td>
              </tr>
            ))}
            {(!stats?.recent || stats.recent.length === 0) && (
              <tr><td colSpan={4} className="empty-row">No AI queries logged yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
