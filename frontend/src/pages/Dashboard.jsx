import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, TrendingUp, Star, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ trips: 0, places: 0, users: 0, points: 0 });
  const [recommended, setRecommended] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const statsRes = await axios.get(`${API_URL}/api/stats`, { 
          params: { userId: user?._id },
          timeout: 5000 
        });
        setStats(statsRes.data);
        
        const placesRes = await axios.get(`${API_URL}/api/places`, { 
          params: { interests: Array.isArray(user?.interests) ? user.interests.join(',') : user?.interests },
          timeout: 5000 
        });
        setRecommended(placesRes.data.slice(0, 3));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setStats({ trips: 12, places: 45, users: 128, points: 2400 });
        setRecommended([
          { _id: '1', name: 'Munnar Tea Gardens', location: 'Kerala, India', category: 'Nature', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80' },
          { _id: '2', name: 'Gokarna Beaches', location: 'Karnataka, India', category: 'Relaxation', image: 'https://images.unsplash.com/photo-1559540868-63ca3f099205?auto=format&fit=crop&w=600&q=80' },
          { _id: '3', name: 'Ooty Hills', location: 'Tamil Nadu, India', category: 'Adventure', image: 'https://images.unsplash.com/photo-1589197331516-4d84b72aaef4?auto=format&fit=crop&w=600&q=80' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="welcome-text"
          >
            Welcome back, <span className="gradient-text">{user ? user.name.split(' ')[0] : 'Explorer'}</span>
          </motion.h1>
          <p className="subtitle">Where does your mind want to go today?</p>
        </div>
        
        <div className="search-bar">
          <Search size={20} color="var(--text-muted)" />
          <input type="text" placeholder="Search destinations..." />
          <kbd className="search-kbd">⌘K</kbd>
        </div>
      </header>

      <section className="stats-grid">
        {[
          { label: 'Total Trips', value: stats.trips, icon: <Calendar />, color: 'var(--accent-primary)', path: '/trips' },
          { label: 'Saved Places', value: stats.places, icon: <Star />, color: 'var(--accent-secondary)', path: '/explore' },
          { label: 'Travel Points', value: stats.points.toLocaleString(), icon: <TrendingUp />, color: '#F97316', path: '#' },
        ].map((stat, i) => (
          <div 
            key={stat.label}
            className="stat-card"
            onClick={() => navigate(stat.path)}
          >
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}10`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="featured-section">
        <div className="section-header">
          <h2>Recommended for <span className="gradient-text">You</span></h2>
          <button className="text-btn" onClick={() => navigate('/explore')}>View All</button>
        </div>
        
        <div className="destinations-grid">
          {isLoading ? (
            [1, 2, 3].map(i => <div key={i} className="dest-card skeleton glass" style={{ height: 480 }}></div>)
          ) : recommended.length > 0 ? (
            recommended.map((dest, i) => (
              <motion.div 
                key={dest._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className="dest-card"
                onClick={() => navigate('/explore')}
              >
                <div className="dest-image">
                  <img src={dest.image} alt={dest.name} />
                  <span className="dest-tag">{dest.category}</span>
                </div>
                <div className="dest-details">
                  <h3>{dest.name}</h3>
                  <div className="dest-meta">
                    <MapPin size={14} />
                    <span>{dest.location}</span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-muted">No recommendations found.</p>
          )}
        </div>
      </section>

      <section className="quick-actions-section">
        <div className="quick-action-banner">
          <div className="banner-content">
            <h3>Start your next adventure with AI</h3>
            <p>Our intelligent engine is ready to architect your perfect journey based on your preferences.</p>
            <button className="btn-primary" onClick={() => navigate('/mind')}>
              <span>Architect New Trip</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
