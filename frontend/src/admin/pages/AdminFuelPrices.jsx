import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, AlertTriangle, X, Save } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const empty = { city: '', state: '', petrol: '', diesel: '', cng: '' };

export default function AdminFuelPrices() {
  const { api } = useAdmin();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const res = await api.get('/fuel-prices'); setPrices(res.data); }
    catch { toast.error('Failed'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const isStale = (d) => d && new Date() - new Date(d) > 7 * 24 * 60 * 60 * 1000;

  const handleSave = async () => {
    try {
      if (editId) await api.put(`/fuel-prices/${editId}`, form);
      else await api.post('/fuel-prices', form);
      toast.success('Saved'); setShowForm(false); fetch();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await api.delete(`/fuel-prices/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="admin-section">
      <div className="page-header">
        <div><h1>Fuel Prices</h1><p>Manage city-wise fuel prices</p></div>
        <button className="admin-btn primary" onClick={() => { setForm(empty); setEditId(null); setShowForm(true); }}><Plus size={16} /> Add Price</button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>City</th><th>State</th><th>Petrol ₹/L</th><th>Diesel ₹/L</th><th>CNG ₹/kg</th><th>Last Updated</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? [...Array(4)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skel" /></td>)}</tr>)
              : prices.map(p => (
              <tr key={p._id} className={isStale(p.lastUpdated) ? 'stale-row' : ''}>
                <td><strong>{p.city}</strong></td>
                <td className="muted">{p.state}</td>
                <td>₹{p.petrol?.toFixed(2)}</td>
                <td>₹{p.diesel?.toFixed(2)}</td>
                <td>{p.cng ? `₹${p.cng.toFixed(2)}` : '—'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isStale(p.lastUpdated) && <AlertTriangle size={14} color="#F59E0B" />}
                    <span className="muted">{p.lastUpdated ? formatDistanceToNow(new Date(p.lastUpdated), { addSuffix: true }) : '—'}</span>
                  </div>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="icon-btn edit" onClick={() => { setForm({ city: p.city, state: p.state, petrol: p.petrol, diesel: p.diesel, cng: p.cng || '' }); setEditId(p._id); setShowForm(true); }}><Edit3 size={14} /></button>
                    <button className="icon-btn danger" onClick={() => handleDelete(p._id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editId ? 'Edit' : 'Add'} Fuel Price</h2><button onClick={() => setShowForm(false)}><X size={18} /></button></div>
            <div className="modal-body">
              {[['city', 'City'], ['state', 'State'], ['petrol', 'Petrol ₹/L'], ['diesel', 'Diesel ₹/L'], ['cng', 'CNG ₹/kg (0 if N/A)']].map(([k, label]) => (
                <React.Fragment key={k}>
                  <label>{label}</label>
                  <input type={['petrol','diesel','cng'].includes(k) ? 'number' : 'text'} step="0.01" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />
                </React.Fragment>
              ))}
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
