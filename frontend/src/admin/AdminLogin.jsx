import React, { useState } from 'react';
import './admin.css';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAdmin } from './AdminContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const { login } = useAdmin();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      toast.success('Welcome to Admin Panel!');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <div className="brand-shield">
            <Shield size={36} />
          </div>
          <h1>RoadSage <span>Admin</span></h1>
          <p>Secure access to the control center</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="al-input-group">
            <Mail size={16} />
            <input
              type="email" placeholder="Admin Email" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="al-input-group">
            <Lock size={16} />
            <input
              type="password" placeholder="Password" required
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {error && (
            <div className="al-error">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" className="al-submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Access Admin Panel'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
