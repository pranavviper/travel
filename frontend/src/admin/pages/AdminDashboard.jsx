import React, { useEffect, useState } from 'react';
import { Users, Map, Compass, Bot, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAdmin } from '../AdminContext';
import { format } from 'date-fns';

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function AdminDashboard() {
  const { api } = useAdmin();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading"><div className="spinner" /><p>Loading dashboard...</p></div>;

  const stats = [
    { label: 'Total Users', value: data?.stats.totalUsers || 0, icon: Users, color: '#8B5CF6', sub: `+${data?.stats.usersThisMonth || 0} this month` },
    { label: 'Total Trips', value: data?.stats.totalTrips || 0, icon: Map, color: '#06B6D4', sub: 'All time' },
    { label: 'Active Places', value: data?.stats.totalPlaces || 0, icon: Compass, color: '#10B981', sub: 'Curated destinations' },
    { label: 'AI Queries', value: data?.stats.aiQueries || 0, icon: Bot, color: '#F59E0B', sub: 'Total Gemini calls' },
  ];

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening with RoadSage.</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color + '20', color: s.color }}>
              <s.icon size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{s.value.toLocaleString()}</span>
              <span className="stat-label">{s.label}</span>
              <span className="stat-sub">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>User Signups (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.signupChart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} interval={6} />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: 8 }} />
              <Line type="monotone" dataKey="users" stroke="#8B5CF6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Places by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data?.categoryChart || []} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {(data?.categoryChart || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-grid">
        <div className="recent-card">
          <h3><Users size={16} /> Recent Users</h3>
          <div className="recent-list">
            {(data?.recentUsers || []).map(u => (
              <div key={u._id} className="recent-row">
                <img src={u.avatar} alt={u.name} className="recent-avatar" />
                <div>
                  <p className="recent-name">{u.name}</p>
                  <p className="recent-meta">{u.email}</p>
                </div>
                <span className={`role-badge role-${u.role}`}>{u.role}</span>
                <span className="recent-date">{u.joinedAt ? format(new Date(u.joinedAt), 'MMM d') : '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-card">
          <h3><Map size={16} /> Recent Trips</h3>
          <div className="recent-list">
            {(data?.recentTrips || []).map(t => (
              <div key={t._id} className="recent-row">
                <div className="trip-icon-box"><Map size={18} color="#8B5CF6" /></div>
                <div>
                  <p className="recent-name">{t.title || 'Untitled Trip'}</p>
                  <p className="recent-meta">{t.duration} · {t.budget}</p>
                </div>
                <span className="recent-date">{t.createdAt ? format(new Date(t.createdAt), 'MMM d') : '—'}</span>
              </div>
            ))}
            {(!data?.recentTrips || data.recentTrips.length === 0) && (
              <p className="empty-state">No trips yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
