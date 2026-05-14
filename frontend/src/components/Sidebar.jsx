import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Compass, Users, Brain, Settings, LogOut, Plane, Navigation, LogIn, ShieldCheck, X, Mail, Phone, MapPin, Edit3, Save, Briefcase, Heart, Sparkles, Terminal } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Sidebar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setEditData(parsed);
    }
  }, []);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Compass size={20} />, label: 'Explore', path: '/explore' },
    { icon: <Navigation size={20} />, label: 'Route', path: '/route' },
    { icon: <Users size={20} />, label: 'Meet', path: '/meet' },
    { icon: <Briefcase size={20} />, label: 'My Trips', path: '/trips' },
    { icon: <Brain size={20} />, label: 'Mind', path: '/mind' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/auth');
    window.location.reload();
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.put(`http://localhost:5001/api/users/${user._id}`, editData);
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Update failed.");
    }
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Plane size={32} color="var(--accent-primary)" />
          <span className="logo-text">Meet<span className="gradient-text">Mind</span></span>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink 
              key={item.label}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}

          {['admin', 'moderator', 'superadmin'].includes(user?.role) && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link admin-link ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={20} color="var(--accent-secondary)" />
              <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <div className="user-mini-profile" onClick={() => { setIsProfileOpen(true); setEditData(user); }} style={{ cursor: 'pointer' }}>
              <img src={user.avatar} alt="" />
              <div className="user-details">
                <span className="user-name">{user.name.split(' ')[0]}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </div>
          ) : (
            <NavLink to="/auth" className="nav-link login-btn">
              <LogIn size={20} />
              <span>Sign In</span>
            </NavLink>
          )}

          <button className="nav-link">
            <Settings size={20} />
            <span>Settings</span>
          </button>

          {user && (
            <button className="nav-link logout" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      <AnimatePresence>
        {isProfileOpen && user && (
          <div className="modal-overlay" onClick={() => { setIsProfileOpen(false); setIsEditing(false); }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="profile-modal glass"
              onClick={e => e.stopPropagation()}
            >
              <button className="close-modal" onClick={() => { setIsProfileOpen(false); setIsEditing(false); }}>
                <X size={20} />
              </button>
              
              <div className="profile-header">
                <div className="profile-avatar-large">
                  <img src={user.avatar} alt={user.name} />
                </div>
                {isEditing ? (
                  <input 
                    className="edit-name-input"
                    value={editData.name} 
                    onChange={e => setEditData({...editData, name: e.target.value})}
                  />
                ) : (
                  <h2>{user.name}</h2>
                )}
                <span className="profile-role-badge">{user.role}</span>
              </div>

              <div className="profile-details-grid">
                <div className="detail-item">
                  <Mail size={18} />
                  <div>
                    <label>Email Address</label>
                    {isEditing ? (
                      <input value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} />
                    ) : <p>{user.email}</p>}
                  </div>
                </div>
                <div className="detail-item">
                  <Phone size={18} />
                  <div>
                    <label>Phone Number</label>
                    {isEditing ? (
                      <input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
                    ) : <p>{user.phone || 'Not provided'}</p>}
                  </div>
                </div>
                <div className="detail-item">
                  <MapPin size={18} />
                  <div style={{ flex: 1 }}>
                    <label>Address / Location</label>
                    <div className="location-input-wrapper" style={{ display: 'flex', gap: '8px' }}>
                      {isEditing ? (
                        <>
                          <input 
                            style={{ flex: 1 }}
                            value={editData.location || ''} 
                            onChange={e => setEditData({...editData, location: e.target.value})} 
                          />
                          <button 
                            className="btn-icon" 
                            type="button"
                            title="Detect Location"
                            onClick={async () => {
                              if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(async (position) => {
                                  try {
                                    const { latitude, longitude } = position.coords;
                                    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                                    const address = res.data.display_name;
                                    setEditData(prev => ({ ...prev, location: address }));
                                  } catch (err) {
                                    alert("Could not fetch address details.");
                                  }
                                }, () => {
                                  alert("Geolocation permission denied or unavailable.");
                                });
                              }
                            }}
                          >
                            <Sparkles size={16} />
                          </button>
                        </>
                      ) : <p>{user.location || 'Not provided'}</p>}
                    </div>
                  </div>
                </div>
                <div className="detail-item">
                  <Briefcase size={18} />
                  <div>
                    <label>Preferred Budget</label>
                    {isEditing ? (
                      <select value={editData.preferredBudget} onChange={e => setEditData({...editData, preferredBudget: e.target.value})}>
                        <option>Economy</option>
                        <option>Moderate</option>
                        <option>Luxury</option>
                      </select>
                    ) : <p>{user.preferredBudget || 'Moderate'}</p>}
                  </div>
                </div>
              </div>

              <div className="profile-travel-details">
                <div className="detail-item-full">
                  <Heart size={18} />
                  <div style={{ width: '100%' }}>
                    <label>Travel Interests (comma separated)</label>
                    {isEditing ? (
                      <input 
                        value={Array.isArray(editData.interests) ? editData.interests.join(', ') : editData.interests} 
                        onChange={e => setEditData({...editData, interests: e.target.value.split(',').map(s => s.trim())})} 
                        placeholder="Nature, Beach, Adventure..."
                      />
                    ) : (
                      <div className="interests-tags">
                        {(user.interests || []).map(tag => (
                          <span key={tag} className="interest-tag">{tag}</span>
                        ))}
                        {(!user.interests || user.interests.length === 0) && <p>No interests added yet</p>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="detail-item-full">
                  <Edit3 size={18} />
                  <div style={{ width: '100%' }}>
                    <label>Bio / About Me</label>
                    {isEditing ? (
                      <textarea 
                        value={editData.bio || ''} 
                        onChange={e => setEditData({...editData, bio: e.target.value})} 
                        placeholder="Tell us about your travel style..."
                      />
                    ) : <p className="bio-text">{user.bio || 'Add a bio to your profile'}</p>}
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                {isEditing ? (
                  <button className="btn-primary full-width" onClick={handleUpdate}>
                    <Save size={18} />
                    <span>Save Changes</span>
                  </button>
                ) : (
                  <button className="btn-primary full-width" onClick={() => setIsEditing(true)}>
                    <Edit3 size={18} />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
