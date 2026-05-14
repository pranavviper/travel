import React, { useEffect, useState } from 'react';
import { Users, Map, Compass } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAdmin } from '../AdminContext';
import toast from 'react-hot-toast';

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function AdminAnalytics() {
  const { api } = useAdmin();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics').then(r => { setData(r.data); setLoading(false); }).catch(() => { toast.error('Failed'); setLoading(false); });
  }, []);

  if (loading) return <div className="admin-loading"><div className="spinner" /><p>Loading analytics...</p></div>;

  const roleData = (data?.roleBreakdown || []).map(r => ({ name: r._id || 'unknown', value: r.count }));
  const catData = (data?.categoryBreakdown || []).map(c => ({ name: c._id || 'unknown', count: c.count }));

  return (
    <div className="admin-section">
      <div className="page-header"><h1>Analytics</h1><p>Platform insights</p></div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Total Users', value: data?.totalUsers || 0, icon: Users, color: '#8B5CF6' },
          { label: 'Total Trips', value: data?.totalTrips || 0, icon: Map, color: '#06B6D4' },
          { label: 'Total Places', value: data?.totalPlaces || 0, icon: Compass, color: '#10B981' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color + '20', color: s.color }}><s.icon size={22} /></div>
            <div className="stat-info"><span className="stat-value">{s.value}</span><span className="stat-label">{s.label}</span></div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>User Role Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Places by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
