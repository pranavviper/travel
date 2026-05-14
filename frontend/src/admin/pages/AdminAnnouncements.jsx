import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, X, Save, Megaphone } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const empty = { title: '', message: '', type: 'info', target: 'all', isActive: true };

export default function AdminAnnouncements() {
  const { api } = useAdmin();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const res = await api.get('/announcements'); setList(res.data); }
    catch { toast.error('Failed'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async () => {
    try {
      if (editId) await api.put(`/announcements/${editId}`, form);
      else await api.post('/announcements', form);
      toast.success('Saved'); setShowForm(false); fetch();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await api.delete(`/announcements/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const TYPE_COLORS = { info: '#06B6D4', warning: '#F59E0B', maintenance: '#EF4444', promotion: '#10B981' };

  return (
    <div className="admin-section">
      <div className="page-header">
        <div><h1>Announcements</h1><p>Site-wide messages</p></div>
        <button className="admin-btn primary" onClick={() => { setForm(empty); setEditId(null); setShowForm(true); }}><Plus size={16} /> New Announcement</button>
      </div>

      <div className="ann-list">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="ann-card skel-block" />)
          : list.map(a => (
          <div key={a._id} className="ann-card">
            <div className="ann-type-dot" style={{ background: TYPE_COLORS[a.type] || '#888' }} />
            <div className="ann-body">
              <div className="ann-top">
                <h3>{a.title}</h3>
                <span className="chip" style={{ color: TYPE_COLORS[a.type] }}>{a.type}</span>
                <span className={`status-badge ${a.isActive ? 'active' : 'banned'}`}>{a.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <p className="muted">{a.message}</p>
              <span className="muted" style={{ fontSize: 12 }}>Target: {a.target} · Created {a.createdAt ? format(new Date(a.createdAt), 'MMM d, yyyy') : '—'} by {a.createdBy}</span>
            </div>
            <div className="action-btns">
              <button className="icon-btn edit" onClick={() => { setForm({ title: a.title, message: a.message, type: a.type, target: a.target, isActive: a.isActive }); setEditId(a._id); setShowForm(true); }}><Edit3 size={14} /></button>
              <button className="icon-btn danger" onClick={() => handleDelete(a._id)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {!loading && list.length === 0 && <div className="empty-row">No announcements yet</div>}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editId ? 'Edit' : 'New'} Announcement</h2><button onClick={() => setShowForm(false)}><X size={18} /></button></div>
            <div className="modal-body">
              <label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <label>Message</label><textarea rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              <label>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {['info', 'warning', 'maintenance', 'promotion'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <label>Target</label>
              <select value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}>
                {['all', 'user', 'admin'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="checkbox-row">
                <label><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="admin-btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="admin-btn primary" onClick={handleSave}><Save size={14} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
