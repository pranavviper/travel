import React, { useEffect, useState } from 'react';
import { Search, Plus, Trash2, Ban, Edit3, ChevronLeft, ChevronRight, X, Save, UserCheck } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ROLES = ['user', 'moderator', 'admin', 'superadmin'];

export default function AdminUsers() {
  const { api } = useAdmin();
  const [data, setData] = useState({ users: [], total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user', location: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, search, role: roleFilter, status: statusFilter };
      const res = await api.get('/users', { params });
      setData(res.data);
    } catch { toast.error('Failed to load users'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [page, search, roleFilter, statusFilter]);

  const handleBan = async (id) => {
    try { await api.put(`/users/${id}/ban`); toast.success('Ban status toggled'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/users/${id}`); toast.success('User deleted'); setConfirmDelete(null); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleEdit = async () => {
    try { await api.put(`/users/${editUser._id}`, editUser); toast.success('User updated'); setEditUser(null); fetch(); }
    catch { toast.error('Failed to update'); }
  };

  const handleAdd = async () => {
    try { await api.post('/users', newUser); toast.success('User created'); setShowAdd(false); fetch(); setNewUser({ name: '', email: '', password: '', role: 'user', location: '' }); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="admin-section">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>{data.total} total users</p>
        </div>
        <button className="admin-btn primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add User</button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} />
          <input placeholder="Search name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>User</th><th>Email</th><th>Role</th><th>Location</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skel" /></td>)}</tr>
              ))
            ) : data.users.map(u => (
              <tr key={u._id}>
                <td>
                  <div className="user-cell">
                    <img src={u.avatar} alt={u.name} />
                    <span>{u.name}</span>
                  </div>
                </td>
                <td className="muted">{u.email}</td>
                <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                <td className="muted">{u.location || '—'}</td>
                <td className="muted">{u.joinedAt ? format(new Date(u.joinedAt), 'MMM d, yyyy') : '—'}</td>
                <td><span className={`status-badge ${u.isBanned ? 'banned' : 'active'}`}>{u.isBanned ? 'Banned' : 'Active'}</span></td>
                <td>
                  <div className="action-btns">
                    <button className="icon-btn edit" onClick={() => setEditUser({ ...u })} title="Edit"><Edit3 size={14} /></button>
                    <button className="icon-btn warn" onClick={() => handleBan(u._id)} title={u.isBanned ? 'Unban' : 'Ban'}><Ban size={14} /></button>
                    <button className="icon-btn danger" onClick={() => setConfirmDelete(u)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} /></button>
        <span>Page {page} of {data.pages}</span>
        <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}><ChevronRight size={16} /></button>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Edit User</h2><button onClick={() => setEditUser(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <label>Name</label>
              <input value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
              <label>Email</label>
              <input value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
              <label>Role</label>
              <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <label>Location</label>
              <input value={editUser.location || ''} onChange={e => setEditUser({ ...editUser, location: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button className="admin-btn secondary" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="admin-btn primary" onClick={handleEdit}><Save size={14} /> Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add User</h2><button onClick={() => setShowAdd(false)}><X size={18} /></button></div>
            <div className="modal-body">
              {['name', 'email', 'password', 'location'].map(f => (
                <React.Fragment key={f}>
                  <label>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                  <input type={f === 'password' ? 'password' : 'text'} value={newUser[f]} onChange={e => setNewUser({ ...newUser, [f]: e.target.value })} />
                </React.Fragment>
              ))}
              <label>Role</label>
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="admin-btn secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="admin-btn primary" onClick={handleAdd}><UserCheck size={14} /> Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="admin-modal small" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Confirm Delete</h2></div>
            <div className="modal-body">
              <p>Delete <strong>{confirmDelete.name}</strong>? This cannot be undone.</p>
            </div>
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
