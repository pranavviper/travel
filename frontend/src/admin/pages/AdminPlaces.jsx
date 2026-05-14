import React, { useEffect, useState } from 'react';
import { Search, Plus, Trash2, Edit3, Eye, EyeOff, X, Save } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import toast from 'react-hot-toast';

const CATS = ['Coastal', 'Cultural', 'Adventure', 'Nature', 'Urban', 'Mystery'];
const PRICES = ['$', '$$', '$$$', '$$$$'];
const empty = { name: '', location: '', image: '', category: 'Cultural', price: '$$', description: '', isHidden: false, verified: false };

export default function AdminPlaces() {
  const { api } = useAdmin();
  const [data, setData] = useState({ places: [], total: 0 });
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/places', { params: { search, category: catFilter, limit: 50 } });
      setData(res.data);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [search, catFilter]);

  const openAdd = () => { setForm(empty); setEditId(null); setShowForm(true); };
  const openEdit = (p) => { setForm({ ...p }); setEditId(p._id); setShowForm(true); };

  const handleSave = async () => {
    try {
      if (editId) { await api.put(`/places/${editId}`, form); toast.success('Place updated'); }
      else { await api.post('/places', form); toast.success('Place added'); }
      setShowForm(false); fetch();
    } catch { toast.error('Save failed'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/places/${id}`); toast.success('Deleted'); setConfirmDelete(null); fetch(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="admin-section">
      <div className="page-header">
        <div><h1>Places Management</h1><p>{data.total} places</p></div>
        <button className="admin-btn primary" onClick={openAdd}><Plus size={16} /> Add Place</button>
      </div>

      <div className="filter-bar">
        <div className="search-box"><Search size={15} /><input placeholder="Search places..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Place</th><th>Location</th><th>Category</th><th>Price</th><th>Rating</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skel" /></td>)}</tr>)
              : data.places.map(p => (
              <tr key={p._id}>
                <td>
                  <div className="user-cell">
                    <img src={p.image} alt={p.name} style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 4 }} />
                    <strong>{p.name}</strong>
                  </div>
                </td>
                <td className="muted">{p.location}</td>
                <td><span className="chip">{p.category}</span></td>
                <td className="muted">{p.price}</td>
                <td>⭐ {p.rating}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span className={`status-badge ${p.isHidden ? 'banned' : 'active'}`}>{p.isHidden ? 'Hidden' : 'Visible'}</span>
                    {p.verified && <span className="status-badge active">✓ Verified</span>}
                  </div>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="icon-btn edit" onClick={() => openEdit(p)}><Edit3 size={14} /></button>
                    <button className="icon-btn danger" onClick={() => setConfirmDelete(p)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editId ? 'Edit Place' : 'Add Place'}</h2><button onClick={() => setShowForm(false)}><X size={18} /></button></div>
            <div className="modal-body two-col">
              <div>
                <label>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <label>Location</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                <label>Image URL</label><input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
                <label>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label>Price</label>
                <select value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}>
                  {PRICES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <label>Rating (1–5)</label>
                <input type="number" min="1" max="5" step="0.1" value={form.rating || 4.5} onChange={e => setForm({ ...form, rating: parseFloat(e.target.value) })} />
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <div className="checkbox-row">
                  <label><input type="checkbox" checked={form.isHidden} onChange={e => setForm({ ...form, isHidden: e.target.checked })} /> Hidden</label>
                  <label><input type="checkbox" checked={form.verified} onChange={e => setForm({ ...form, verified: e.target.checked })} /> Verified</label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="admin-btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="admin-btn primary" onClick={handleSave}><Save size={14} /> Save</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="admin-modal small" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Delete Place?</h2></div>
            <div className="modal-body"><p>Delete <strong>{confirmDelete.name}</strong>?</p></div>
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
