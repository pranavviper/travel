import React, { useEffect, useState } from 'react';
import { Search, Trash2, ChevronLeft, ChevronRight, User, MapPin, CheckCircle, Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminTrips() {
  const { api } = useAdmin();
  const [data, setData] = useState({ trips: [], total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [expandedUsers, setExpandedUsers] = useState({});

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trips', { params: { page, limit: 50, search } });
      setData(res.data);
    } catch { toast.error('Failed to load trips'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [page, search]);

  const handleDelete = async (id) => {
    try { await api.delete(`/trips/${id}`); toast.success('Trip deleted'); setConfirmDelete(null); fetch(); }
    catch { toast.error('Failed'); }
  };

  const toggleUser = (userId) => {
    setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Group trips by user
  const groupedData = data.trips.reduce((acc, trip) => {
    const userId = trip.userId?._id || 'unknown';
    if (!acc[userId]) {
      acc[userId] = {
        user: trip.userId || { name: 'Guest / Unknown' },
        trips: { planned: [], ongoing: [], completed: [] }
      };
    }
    const status = trip.status || 'planned';
    if (acc[userId].trips[status]) acc[userId].trips[status].push(trip);
    return acc;
  }, {});

  const StatusSection = ({ title, trips, icon: Icon, color }) => {
    if (trips.length === 0) return null;
    return (
      <div className="status-group">
        <h4 style={{ color }}><Icon size={14} /> {title} ({trips.length})</h4>
        <div className="admin-trips-mini-grid">
          {trips.map(t => (
            <div key={t._id} className="trip-mini-card glass">
              <div className="trip-mini-info">
                <strong>{t.title || 'Untitled'}</strong>
                <span>{t.duration || '—'} · {t.itinerary?.length || 0} days</span>
              </div>
              <button className="icon-btn danger sm" onClick={() => setConfirmDelete(t)}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-section">
      <div className="page-header">
        <div><h1>Trip Management</h1><p>Monitoring trips across {Object.keys(groupedData).length} active users</p></div>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} />
          <input placeholder="Search trips by title..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="user-trips-container">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="skel user-row-skel" />)
        ) : Object.values(groupedData).length > 0 ? (
          Object.values(groupedData).map(({ user, trips }, idx) => (
            <div key={user._id || idx} className={`user-trip-group glass-card ${expandedUsers[user._id] ? 'expanded' : ''}`}>
              <div className="user-trip-header" onClick={() => toggleUser(user._id)}>
                <div className="user-meta-large">
                  <img src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'} alt="" />
                  <div>
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                  </div>
                </div>
                <div className="user-stats-pill">
                  <span>{trips.planned.length + trips.ongoing.length + trips.completed.length} Trips</span>
                  {expandedUsers[user._id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {expandedUsers[user._id] && (
                <div className="user-trip-content">
                  <StatusSection title="Ongoing" trips={trips.ongoing} icon={Clock} color="#F97316" />
                  <StatusSection title="Planned" trips={trips.planned} icon={Calendar} color="#3B82F6" />
                  <StatusSection title="Completed" trips={trips.completed} icon={CheckCircle} color="#10B981" />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">No trips found matching your search.</div>
        )}
      </div>

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="admin-modal small" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Delete Trip?</h2></div>
            <div className="modal-body"><p>Delete <strong>{confirmDelete.title}</strong>? This is irreversible.</p></div>
            <div className="modal-footer">
              <button className="admin-btn secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="admin-btn danger" onClick={() => handleDelete(confirmDelete._id)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

