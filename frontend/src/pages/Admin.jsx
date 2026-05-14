import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, MapPin, Search, Eye, EyeOff, LayoutGrid, Users } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config/api';

const Admin = () => {
  const [places, setPlaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [view, setView] = useState('places');
  const [newPlace, setNewPlace] = useState({
    name: '',
    location: '',
    image: '',
    category: 'Cultural',
    price: '$$',
    description: '',
    isHidden: false
  });

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    try {
      const placesRes = await axios.get(`${API_URL}/api/places?all=true`);
      const usersRes = await axios.get(`${API_URL}/api/users`);
      setPlaces(placesRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPlace = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/places`, newPlace);
      setNewPlace({ name: '', location: '', image: '', category: 'Cultural', price: '$$', description: '', isHidden: false });
      fetchData();
    } catch (err) {
      alert("Error adding place");
    }
  };

  const handleDeletePlace = async (id) => {
    if (window.confirm("Delete this place?")) {
      await axios.delete(`${API_URL}/api/places/${id}`);
      fetchData();
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-sidebar glass">
        <h2>Admin Panel</h2>
        <nav>
          <button className={view === 'places' ? 'active' : ''} onClick={() => setView('places')}>
            <LayoutGrid size={18} />
            <span>Manage Places</span>
          </button>
          <button className={view === 'users' ? 'active' : ''} onClick={() => setView('users')}>
            <Users size={18} />
            <span>Manage Users</span>
          </button>
        </nav>
      </div>

      <div className="admin-main">
        {view === 'places' ? (
          <div className="admin-section">
            <header className="section-header">
              <h1>Travel Destinations</h1>
              <p>Add and manage global locations & hidden gems.</p>
            </header>

            <form className="add-place-form glass" onSubmit={handleAddPlace}>
              <div className="form-grid">
                <input placeholder="Place Name" required value={newPlace.name} onChange={e => setNewPlace({...newPlace, name: e.target.value})} />
                <input placeholder="Location" required value={newPlace.location} onChange={e => setNewPlace({...newPlace, location: e.target.value})} />
                <input placeholder="Image URL" required value={newPlace.image} onChange={e => setNewPlace({...newPlace, image: e.target.value})} />
                <select value={newPlace.category} onChange={e => setNewPlace({...newPlace, category: e.target.value})}>
                  <option>Coastal</option>
                  <option>Cultural</option>
                  <option>Adventure</option>
                  <option>Mystery</option>
                  <option>Urban</option>
                </select>
                <div className="checkbox-group">
                  <label>
                    <input type="checkbox" checked={newPlace.isHidden} onChange={e => setNewPlace({...newPlace, isHidden: e.target.checked})} />
                    Hidden Place
                  </label>
                </div>
              </div>
              <textarea placeholder="Description" rows="3" value={newPlace.description} onChange={e => setNewPlace({...newPlace, description: e.target.value})}></textarea>
              <button className="btn-primary" type="submit"><Plus size={18} /> Add New Place</button>
            </form>

            <div className="places-list glass">
              <div className="list-header">
                <span>Place Info</span>
                <span>Category</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {places.map(place => (
                <div key={place._id} className="list-row">
                  <div className="place-meta">
                    <img src={place.image} alt="" />
                    <div>
                      <h4>{place.name}</h4>
                      <p>{place.location}</p>
                    </div>
                  </div>
                  <span className="chip">{place.category}</span>
                  <span className={`status ${place.isHidden ? 'hidden' : 'visible'}`}>
                    {place.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    {place.isHidden ? 'Hidden' : 'Visible'}
                  </span>
                  <div className="row-actions">
                    <button className="delete-btn" onClick={() => handleDeletePlace(place._id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="admin-section">
            <header className="section-header">
              <h1>Community Members</h1>
              <p>Monitor and manage MeetMind user profiles.</p>
            </header>

            <div className="users-list glass">
              <div className="list-header">
                <span>User</span>
                <span>Location</span>
                <span>Role</span>
                <span>Actions</span>
              </div>
              {users.map(user => (
                <div key={user._id} className="list-row">
                  <div className="user-meta">
                    <img src={user.avatar} alt="" />
                    <div>
                      <h4>{user.name}</h4>
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <span>{user.location}</span>
                  <span className="chip admin">{user.role}</span>
                  <div className="row-actions">
                    <button className="delete-btn"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
