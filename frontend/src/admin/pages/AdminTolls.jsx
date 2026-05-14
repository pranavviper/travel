import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, X, Save } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import toast from 'react-hot-toast';

const empty = { name: '', highway: '', state: '', location: { lat: '', lng: '' }, rates: { car: '', lcv: '', bus: '', truck: '' } };

export default function AdminTolls() {
  const { api } = useAdmin();
  const [tolls, setTolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const res = await api.get('/tolls'); setTolls(res.data); }
    catch { toast.error('Failed'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async () => {
    try {
      if (editId) await api.put(`/tolls/${editId}`, form);
      else await api.post('/tolls', form);
      toast.success('Saved'); setShowForm(false); fetch();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete toll plaza?')) return;
    try { await api.delete(`/tolls/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="admin-section">
      <div className="page-header">
        <div><h1>Toll Plazas</h1><p>{tolls.length} toll plazas</p></div>
        <button className="admin-btn primary" onClick={() => { setForm(empty); setEditId(null); setShowForm(true); }}><Plus size={16} /> Add Toll</button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Highway</th><th>State</th><th>Car ₹</th><th>Truck ₹</th><th>Lat/Lng</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? [...Array(4)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skel" /></td>)}</tr>)
              : tolls.map(t => (
              <tr key={t._id}>
                <td><strong>{t.name}</strong></td>
                <td className="muted">{t.highway}</td>
                <td className="muted">{t.state}</td>
                <td>₹{t.rates?.car}</td>
                <td>₹{t.rates?.truck}</td>
                <td className="muted">{t.location?.lat?.toFixed(2)}, {t.location?.lng?.toFixed(2)}</td>
                <td>
                  <div className="action-btns">
                    <button className="icon-btn edit" onClick={() => { setForm({ name: t.name, highway: t.highway, state: t.state, location: t.location || { lat: '', lng: '' }, rates: t.rates || {} }); setEditId(t._id); setShowForm(true); }}><Edit3 size={14} /></button>
                    <button className="icon-btn danger" onClick={() => handleDelete(t._id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editId ? 'Edit' : 'Add'} Toll Plaza</h2><button onClick={() => setShowForm(false)}><X size={18} /></button></div>
            <div className="modal-body two-col">
              <div>
                <label>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <label>Highway</label><input value={form.highway} onChange={e => setForm({ ...form, highway: e.target.value })} />
                <label>State</label><input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                <label>Latitude</label><input type="number" step="0.0001" value={form.location?.lat} onChange={e => setForm({ ...form, location: { ...form.location, lat: parseFloat(e.target.value) } })} />
                <label>Longitude</label><input type="number" step="0.0001" value={form.location?.lng} onChange={e => setForm({ ...form, location: { ...form.location, lng: parseFloat(e.target.value) } })} />
              </div>
              <div>
                <label>Car Rate ₹</label><input type="number" value={form.rates?.car} onChange={e => setForm({ ...form, rates: { ...form.rates, car: +e.target.value } })} />
                <label>LCV Rate ₹</label><input type="number" value={form.rates?.lcv} onChange={e => setForm({ ...form, rates: { ...form.rates, lcv: +e.target.value } })} />
                <label>Bus Rate ₹</label><input type="number" value={form.rates?.bus} onChange={e => setForm({ ...form, rates: { ...form.rates, bus: +e.target.value } })} />
                <label>Truck Rate ₹</label><input type="number" value={form.rates?.truck} onChange={e => setForm({ ...form, rates: { ...form.rates, truck: +e.target.value } })} />
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
