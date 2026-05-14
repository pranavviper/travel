import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, MessageCircle, Heart, MapPin } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config/api';

const Meet = () => {
  const [travelers, setTravelers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTravelers = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/users`, { timeout: 1000 });
        setTravelers(res.data);
      } catch (err) {
        console.error("Failed to fetch travelers:", err);
        // Fallback mock data if backend fails
        setTravelers([
          { _id: '1', name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', location: 'New York, USA', bio: 'Digital nomad and adventure seeker. Love exploring hidden coastal towns and trying local street food.' },
          { _id: '2', name: 'Sarah Williams', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d', location: 'London, UK', bio: 'Architecture enthusiast. Planning a trip to Southern India to explore ancient temples and culture.' },
          { _id: '3', name: 'Miguel Rossi', avatar: 'https://i.pravatar.cc/150?u=a04258a2462d826712d', location: 'Barcelona, Spain', bio: 'Photography is my passion. Looking for travel buddies to hike the Western Ghats next month.' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTravelers();
  }, []);

  return (
    <div className="meet-page">
      <header className="page-header">
        <h1>Meet <span className="gradient-text">Travelers</span></h1>
        <p>Connect with people who share your mindset and destination.</p>
      </header>

      <div className="travelers-grid">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="traveler-card skeleton glass" style={{ height: 250 }}></div>)
        ) : (
          travelers.map((user, i) => (
            <motion.div 
              key={user._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="traveler-card glass-card"
            >
              <div className="match-badge">
                <Heart size={12} fill="var(--accent-tertiary)" color="var(--accent-tertiary)" />
                <span>95% Match</span>
              </div>
              
              <div className="traveler-header">
                <div className="avatar">
                  <img src={user.avatar} alt={user.name} />
                </div>
                <div className="traveler-info">
                  <h3>{user.name}</h3>
                  <div className="location">
                    <MapPin size={14} />
                    <span>{user.location}</span>
                  </div>
                </div>
              </div>

              <p className="bio">{user.bio}</p>

              <div className="card-actions">
                <button className="action-btn secondary glass">
                  <MessageCircle size={18} />
                  <span>Message</span>
                </button>
                <button className="action-btn primary gradient-bg">
                  <UserPlus size={18} />
                  <span>Connect</span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Meet;
