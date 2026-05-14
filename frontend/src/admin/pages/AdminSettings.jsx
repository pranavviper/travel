import React, { useEffect, useState } from 'react';
import { Save, Shield } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { api, adminUser } = useAdmin();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => { setSettings(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try { const res = await api.put('/settings', settings); setSettings(res.data); toast.success('Settings saved!'); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const toggle = (path) => {
    const keys = path.split('.');
    setSettings(prev => {
      const next = { ...prev };
      if (keys.length === 1) next[keys[0]] = !next[keys[0]];
      else { next[keys[0]] = { ...next[keys[0]], [keys[1]]: !next[keys[0]][keys[1]] }; }
      return next;
    });
  };

  if (loading) return <div className="admin-loading"><div className="spinner" /><p>Loading settings...</p></div>;

  const isSuperAdmin = adminUser?.role === 'superadmin';

  return (
    <div className="admin-section">
      <div className="page-header">
        <div><h1>System Settings</h1><p>Global platform configuration</p></div>
        {isSuperAdmin && (
          <button className="admin-btn primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="info-banner"><Shield size={16} /> Only superadmins can edit settings.</div>
      )}

      <div className="settings-grid">
        {/* General */}
        <div className="settings-card">
          <h3>General</h3>
          <div className="settings-row">
            <label>Site Name</label>
            <input value={settings?.siteName || ''} onChange={e => setSettings({ ...settings, siteName: e.target.value })} disabled={!isSuperAdmin} />
          </div>
          <div className="settings-row toggle-row">
            <div>
              <label>Maintenance Mode</label>
              <p className="muted">Show maintenance page to regular users</p>
            </div>
            <button className={`toggle ${settings?.maintenanceMode ? 'on' : ''}`} onClick={() => isSuperAdmin && toggle('maintenanceMode')}>
              <span />
            </button>
          </div>
          <div className="settings-row toggle-row">
            <div><label>Allow New Signups</label></div>
            <button className={`toggle ${settings?.allowSignups ? 'on' : ''}`} onClick={() => isSuperAdmin && toggle('allowSignups')}><span /></button>
          </div>
        </div>

        {/* Features */}
        <div className="settings-card">
          <h3>Feature Flags</h3>
          {[
            ['features.ai', 'AI Assistant', 'Enable Gemini AI trip planning'],
            ['features.groupTrips', 'Group Trips', 'Allow multi-user trips'],
            ['features.tripSharing', 'Trip Sharing', 'Share trips publicly'],
            ['features.evMode', 'EV Mode', 'Electric vehicle route planning'],
          ].map(([path, label, desc]) => (
            <div key={path} className="settings-row toggle-row">
              <div><label>{label}</label><p className="muted">{desc}</p></div>
              <button
                className={`toggle ${path.split('.').reduce((o, k) => o?.[k], settings) ? 'on' : ''}`}
                onClick={() => isSuperAdmin && toggle(path)}
              ><span /></button>
            </div>
          ))}
        </div>

        {/* Trip Defaults */}
        <div className="settings-card">
          <h3>Trip Defaults</h3>
          <div className="settings-row">
            <label>Default Toll Rate (₹/km)</label>
            <input type="number" step="0.1" value={settings?.defaultTollRate || 2.4} onChange={e => setSettings({ ...settings, defaultTollRate: parseFloat(e.target.value) })} disabled={!isSuperAdmin} />
          </div>
          <div className="settings-row">
            <label>Gemini Daily Limit</label>
            <input type="number" value={settings?.apiLimits?.gemini || 100} onChange={e => setSettings({ ...settings, apiLimits: { ...settings.apiLimits, gemini: +e.target.value } })} disabled={!isSuperAdmin} />
          </div>
        </div>
      </div>
    </div>
  );
}
