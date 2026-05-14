import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Search, X, ChevronDown } from 'lucide-react';
import axios from 'axios';
import PlaceDetailModal from '../components/PlaceDetailModal';
import API_URL from '../config/api';

const DISTRICTS = [
  'All Districts', 'Chennai', 'Chengalpattu', 'Kanchipuram', 'Tiruvallur', 'Ranipet',
  'Vellore', 'Tirupathur', 'Tiruvannamalai', 'Villupuram', 'Kallakurichi',
  'Cuddalore', 'Mayiladuthurai', 'Nagapattinam', 'Thanjavur', 'Tiruvarur',
  'Tiruchirappalli', 'Perambalur', 'Ariyalur', 'Pudukkottai', 'Sivagangai',
  'Ramanathapuram', 'Madurai', 'Dindigul', 'Theni', 'Virudhunagar',
  'Tirunelveli', 'Tenkasi', 'Thoothukudi', 'Kanniyakumari', 'Coimbatore',
  'Tiruppur', 'Erode', 'Salem', 'Namakkal', 'Dharmapuri', 'Krishnagiri',
  'Nilgiris', 'Karur'
];

const CATEGORIES = ['All', 'Temple', 'Beach', 'Waterfall', 'Hill Station', 'Nature', 'Heritage', 'Cultural', 'Landmark'];

const categoryEmoji = {
  'All': '🗺️', 'Temple': '🛕', 'Beach': '🏖️', 'Waterfall': '💧',
  'Hill Station': '⛰️', 'Nature': '🌿', 'Heritage': '🏛️', 'Cultural': '🎭', 'Landmark': '📍'
};

const Explore = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeDistrict, setActiveDistrict] = useState('All Districts');
  const [showHidden] = useState(false);
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

  useEffect(() => {
    const fetchPlaces = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/places?hidden=${showHidden}`, { timeout: 5000 });
        setPlaces(res.data);
      } catch (err) {
        console.error("Failed to fetch places:", err);
        setPlaces([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlaces();
  }, [showHidden]);

  const filteredPlaces = places.filter(p => {
    const matchCat = activeFilter === 'All' || p.category === activeFilter;
    const matchDistrict = activeDistrict === 'All Districts' || p.location?.includes(activeDistrict) || p.district === activeDistrict;
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchDistrict && matchSearch;
  });

  return (
    <div className="explore-page">
      <header className="explore-header">
        <div>
          <h1>Tamil Nadu <span className="gradient-text">Explorer</span></h1>
          <p>Curated places across all 38 districts of Tamil Nadu.</p>
        </div>
        <div className="explore-actions">
          <div className="explore-search">
            <Search size={16} />
            <input
              placeholder="Search places..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && <X size={14} onClick={() => setSearchQuery('')} className="clear-search" />}
          </div>

          <div className="district-filter-container">
            <button
              className="btn-secondary"
              onClick={() => setShowDistrictDropdown(v => !v)}
            >
              <MapPin size={16} />
              <span>{activeDistrict}</span>
              <ChevronDown size={14} style={{ transform: showDistrictDropdown ? 'rotate(180deg)' : 'none' }} />
            </button>
            <AnimatePresence>
              {showDistrictDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="district-dropdown"
                >
                  {DISTRICTS.map(d => (
                    <div
                      key={d}
                      onClick={() => { setActiveDistrict(d); setShowDistrictDropdown(false); }}
                      className={`district-option ${activeDistrict === d ? 'active' : ''}`}
                    >
                      {d}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="filter-scroll">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-chip ${activeFilter === cat ? 'active' : ''}`}
            onClick={() => setActiveFilter(cat)}
          >
            <span className="emoji">{categoryEmoji[cat]}</span> {cat}
          </button>
        ))}
      </div>

      <div className="results-count">
        {isLoading ? 'Scanning destinations...' : `Found ${filteredPlaces.length} magical locations`}
      </div>

      <div className="explore-grid">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="explore-card skeleton" style={{ height: 300 }}></div>)
        ) : filteredPlaces.length === 0 ? (
          <div className="empty-results">
            <MapPin size={48} />
            <p>No places found matching your search. Try adjusting filters.</p>
          </div>
        ) : (
          filteredPlaces.map((place, i) => (
            <motion.div
              key={place._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.5) }}
              className="explore-card"
              onClick={() => setSelectedPlace(place)}
            >
              <div className="card-media">
                <img src={place.image} alt={place.name} />
                <div className="category-badge">
                  <span>{categoryEmoji[place.category] || '📍'} {place.category}</span>
                </div>
                <div className="rating">
                  <Star size={12} fill="#FFD700" color="#FFD700" />
                  <span>{place.rating}</span>
                </div>
                <div className="card-hover-overlay">
                  <span className="view-detail-btn">View Details</span>
                </div>
              </div>
              <div className="card-info">
                <h3>{place.name}</h3>
                <p className="location-text"><MapPin size={12} /> {place.location}</p>
                <p className="description-text">{place.description}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedPlace && (
          <PlaceDetailModal
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Explore;
