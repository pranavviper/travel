import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Search, Pin, MapPin, Bookmark, Map as MapIcon, Navigation, Route as RouteIcon, 
  Car, Footprints, Train, Bike, X, ChevronDown, Plus, Info, GripHorizontal
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Fix for default marker icons in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapViewHandler = ({ route }) => {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 0) {
      const bounds = L.latLngBounds(route);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);
  return null;
};

const RoutePlanner = () => {
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const [startPoint, setStartPoint] = useState({ label: '', coords: null });
  const [endPoint, setEndPoint] = useState({ label: '', coords: null });
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState('car');
  const [showDirections, setShowDirections] = useState(false);

  // Suggestions state
  const [activeInput, setActiveInput] = useState(null); // 'start' or 'end'
  const [suggestions, setSuggestions] = useState([]);

  const geocode = React.useCallback(async (text) => {
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: { q: text, format: 'json', limit: 1 }
      });
      if (res.data.length > 0) {
        return [parseFloat(res.data[0].lat), parseFloat(res.data[0].lon)];
      }
    } catch (e) {
      console.error("Geocode failed:", e);
    }
    return null;
  }, []);

  const calculateRoute = React.useCallback(async (activeStart, activeEnd) => {
    setIsLoading(true);
    try {
      let startCoords = activeStart.coords;
      let endCoords = activeEnd.coords;

      if (!startCoords && activeStart.label) startCoords = await geocode(activeStart.label);
      if (!endCoords && activeEnd.label) endCoords = await geocode(activeEnd.label);

      if (!startCoords || !endCoords) return;

      setStartPoint({ ...activeStart, coords: startCoords });
      setEndPoint({ ...activeEnd, coords: endCoords });

      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}`,
        { params: { overview: 'full', geometries: 'geojson' } }
      );
      
      const coordinates = response.data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      const summary = response.data.routes[0];
      
      const formatDuration = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.floor(totalMinutes % 60);
        return hours > 0 ? `${hours} hrs ${minutes} min` : `${minutes} min`;
      };
      
      setRouteData({
        coordinates,
        distance: (summary.distance / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 }),
        duration: formatDuration(summary.duration / 60)
      });
      setShowDirections(true);
    } catch (error) {
      console.error("Route Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [geocode]);

  useEffect(() => {
    if (startPoint.label && endPoint.label) {
      calculateRoute(startPoint, endPoint);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced suggestion fetcher
  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = activeInput === 'start' ? startPoint.label : activeInput === 'end' ? endPoint.label : '';
      if (query && query.length > 2 && activeInput) {
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: { q: query, format: 'json', limit: 4 }
          });
          setSuggestions(res.data);
        } catch(e) {}
      } else {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [startPoint.label, endPoint.label, activeInput]);

  const selectSuggestion = (s) => {
    const coords = [parseFloat(s.lat), parseFloat(s.lon)];
    const newPoint = { label: s.display_name.split(',')[0], coords };
    
    if (activeInput === 'start') {
      setStartPoint(newPoint);
      if (endPoint.label) calculateRoute(newPoint, endPoint);
    } else {
      setEndPoint(newPoint);
      if (startPoint.label) calculateRoute(startPoint, newPoint);
    }
    setActiveInput(null);
    setSuggestions([]);
  };

  return (
    <div className="route-planner-fullscreen">
      {/* Absolute Fullscreen Map */}
      <div className="map-full">
        <MapContainer center={startPoint.coords || [20.5937, 78.9629]} zoom={5} scrollWheelZoom={true} zoomControl={false} style={{ width: '100%', height: '100%' }}>
          <TileLayer 
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>' 
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
          />
          {startPoint.coords && <Marker position={startPoint.coords}></Marker>}
          {endPoint.coords && <Marker position={endPoint.coords}></Marker>}
          {routeData && (
            <Polyline 
              positions={routeData.coordinates} 
              color="#3B82F6" 
              weight={6} 
              opacity={0.9} 
            />
          )}
          <MapViewHandler route={routeData?.coordinates} />
        </MapContainer>
      </div>

      {/* Floating UI Overlays */}
      <div className="panels-container">
        
        {/* Panel 1: Places / Search */}
        <div className="places-panel">
          <div className="am-search-bar">
            <Search size={16} color="var(--text-muted)" />
            <input placeholder="Search Maps" />
          </div>

          <h3 className="am-section-title">Places</h3>
          <div className="am-list-item">
            <div className="am-list-icon"><Pin size={14} /></div>
            <div className="am-list-text"><span className="am-list-title">Pinned</span></div>
          </div>
          <div className="am-list-item">
            <div className="am-list-icon"><Bookmark size={14} /></div>
            <div className="am-list-text"><span className="am-list-title">Saved Places</span></div>
          </div>
          <div className="am-list-item">
            <div className="am-list-icon"><MapIcon size={14} /></div>
            <div className="am-list-text"><span className="am-list-title">Guides</span></div>
          </div>
          <div className="am-list-item" onClick={() => setShowDirections(true)}>
            <div className="am-list-icon"><RouteIcon size={14} /></div>
            <div className="am-list-text"><span className="am-list-title">Routes</span></div>
          </div>

          <h3 className="am-section-title" style={{ marginTop: '24px' }}>Recents</h3>
          <div className="am-list-item">
            <div className="am-list-icon" style={{ background: 'transparent' }}><Navigation size={20} color="var(--text-muted)" /></div>
            <div className="am-list-text">
              <span className="am-list-title">Mumbai Airport</span>
              <span className="am-list-subtitle">From Sonua Dam</span>
            </div>
          </div>
          <div className="am-list-item">
            <div className="am-list-icon" style={{ background: 'transparent' }}><Pin size={20} color="var(--text-muted)" /></div>
            <div className="am-list-text">
              <span className="am-list-title">Mumbai</span>
              <span className="am-list-subtitle">Maharashtra</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Directions (Conditional) */}
        <AnimatePresence>
          {showDirections && (
            <motion.div 
              className="directions-panel"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ overflow: 'visible' }}
            >
              <div className="am-directions-header">
                <h2>Directions</h2>
                <div className="am-close-btn" onClick={() => setShowDirections(false)}>
                  <X size={14} />
                </div>
              </div>

              <div className="am-transport-modes">
                <div className={`am-mode-btn ${activeMode === 'car' ? 'active' : ''}`} onClick={() => setActiveMode('car')}><Car size={18} /></div>
                <div className={`am-mode-btn ${activeMode === 'walk' ? 'active' : ''}`} onClick={() => setActiveMode('walk')}><Footprints size={18} /></div>
                <div className={`am-mode-btn ${activeMode === 'train' ? 'active' : ''}`} onClick={() => setActiveMode('train')}><Train size={18} /></div>
                <div className={`am-mode-btn ${activeMode === 'bike' ? 'active' : ''}`} onClick={() => setActiveMode('bike')}><Bike size={18} /></div>
              </div>

              <div className="am-route-inputs" style={{ position: 'relative' }}>
                <div className="am-input-row">
                  <Navigation size={14} color="#3B82F6" />
                  <input 
                    placeholder="Start location"
                    value={startPoint.label} 
                    onFocus={() => setActiveInput('start')}
                    onChange={e => setStartPoint({ label: e.target.value, coords: null })} 
                    onBlur={() => setTimeout(() => activeInput === 'start' && setActiveInput(null), 200)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        setActiveInput(null);
                        setSuggestions([]);
                        calculateRoute(startPoint, endPoint);
                      }
                    }}
                  />
                  <GripHorizontal size={14} color="var(--text-muted)" />
                </div>
                <div className="am-divider"></div>
                <div className="am-input-row">
                  <MapPin size={14} color="#EF4444" />
                  <input 
                    placeholder="Destination"
                    value={endPoint.label} 
                    onFocus={() => setActiveInput('end')}
                    onChange={e => setEndPoint({ label: e.target.value, coords: null })} 
                    onBlur={() => setTimeout(() => activeInput === 'end' && setActiveInput(null), 200)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        setActiveInput(null);
                        setSuggestions([]);
                        calculateRoute(startPoint, endPoint);
                      }
                    }}
                  />
                  <GripHorizontal size={14} color="var(--text-muted)" />
                </div>
                
                {/* Suggestions Dropdown */}
                {activeInput && suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: activeInput === 'start' ? '40px' : '90px', left: 0, right: 0, background: 'var(--bg-secondary)', borderRadius: '12px', padding: '8px', zIndex: 100, border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-premium)' }}>
                    {suggestions.map((s, i) => (
                      <div key={i} onMouseDown={() => selectSuggestion(s)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                        {s.display_name}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="am-add-stop" style={{ marginTop: '12px' }}>
                  <Plus size={16} /> Add Stop
                </div>
              </div>

              <div className="am-dropdowns">
                <div className="am-dropdown">Now <ChevronDown size={14} /></div>
                <div className="am-dropdown">Avoid <ChevronDown size={14} /></div>
              </div>

              {isLoading && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  Calculating route...
                </div>
              )}

              {!isLoading && routeData && (
                <motion.div 
                  className="am-summary-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="am-summary-time">{routeData.duration}</div>
                  <div className="am-summary-meta">
                    10:40 ETA • {routeData.distance} km<br />Fastest
                  </div>
                  <div className="am-summary-alert">
                    <span style={{ color: '#10B981' }}>₹</span> Tolls required
                  </div>
                  <div style={{ position: 'absolute', right: '16px', top: '16px', display: 'flex', gap: '8px' }}>
                    <button 
                      className="glass-btn sm" 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!user) {
                          toast.error("Please login to save your routes!");
                          navigate('/auth');
                          return;
                        }
                        try {
                          await axios.post('http://localhost:5001/api/trips', {
                            title: `Route: ${startPoint.label} to ${endPoint.label}`,
                            userId: user._id,
                            status: 'planned',
                            duration: routeData.duration,
                            distance: routeData.distance + ' km',
                            itinerary: [{ day: 1, title: 'Travel Day', desc: `Drive from ${startPoint.label} to ${endPoint.label}` }]
                          });
                          toast.success("Route saved to your trips!");
                        } catch (err) {
                          toast.error("Failed to save route.");
                        }
                      }}
                      title="Save to Trips"
                    >
                      <Bookmark size={16} />
                    </button>
                    <Info size={18} opacity={0.6} />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RoutePlanner;
