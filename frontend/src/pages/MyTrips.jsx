import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Trash2, ChevronRight, Compass, Sparkles, Plus, Car, Bike, Train, Plane, FileText, X } from 'lucide-react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import PlaceDetailModal from '../components/PlaceDetailModal';

// Fix Leaflet marker icon
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapViewHandler = ({ route, places }) => {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 0) {
      const bounds = L.latLngBounds(route);
      map.fitBounds(bounds, { padding: [30, 30] });
    } else if (places && places.length === 1) {
      map.setView([places[0].lat, places[0].lon], 10);
    }
  }, [route, places, map]);
  return null;
};

const MyTrips = () => {
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // New Trip Form State
  const [newTrip, setNewTrip] = useState({
    title: '',
    places: [],
    vehicle: 'Car',
    distance: '',
    startDate: '',
    endDate: '',
    budget: '',
    notes: ''
  });

  const [placeInput, setPlaceInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routePolyline, setRoutePolyline] = useState(null);

  // AI Suggestions state
  const [createdTrip, setCreatedTrip] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // Selected Trip details modal state
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [selectedExplorePlace, setSelectedExplorePlace] = useState(null);

  // DB place suggestions panel (shown while planning)
  const [dbPlaceSuggestions, setDbPlaceSuggestions] = useState([]);
  const [isFetchingDbSuggestions, setIsFetchingDbSuggestions] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  // Fetch nearby places when a trip is selected
  useEffect(() => {
    if (!selectedTrip || !selectedTrip.places || selectedTrip.places.length === 0) {
      setNearbyPlaces([]);
      return;
    }
    const fetchNearby = async () => {
      setIsLoadingNearby(true);
      try {
        const res = await axios.get('http://localhost:5001/api/places?all=true', { timeout: 5000 });
        const destinations = selectedTrip.places.map(p => p.toLowerCase());
        const matched = res.data.filter(p => {
          const loc = (p.location || '').toLowerCase();
          const district = loc.split(',')[0].trim();
          return destinations.some(d => loc.includes(d) || d.includes(district));
        });
        setNearbyPlaces(matched.slice(0, 9));
      } catch (e) {
        setNearbyPlaces([]);
      } finally {
        setIsLoadingNearby(false);
      }
    };
    fetchNearby();
  }, [selectedTrip]);

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:5001/api/trips', { 
        params: { userId: user?._id },
        timeout: 5000 
      });
      setTrips(res.data);
    } catch (err) {
      console.error(err);
      setTrips([
        { _id: '1', title: 'Weekend in Wayanad', duration: '3 Days', budget: '₹12,000', itinerary: [{}, {}, {}], vehicle: 'Car', distance: '300', dates: '12 Nov - 15 Nov' },
        { _id: '2', title: 'Himalayan Retreat', duration: '7 Days', budget: '₹35,000', itinerary: [{}, {}, {}, {}, {}], vehicle: 'Flight', distance: '2500', dates: '01 Dec - 08 Dec' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTrip = async (id) => {
    if (window.confirm("Remove this trip from your archive?")) {
      try {
        await axios.delete(`http://localhost:5001/api/trips/${id}`);
      } catch(e) {}
      setTrips(trips.filter(t => t._id !== id));
    }
  };

  // Debounced geocode for suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (placeInput.length > 2) {
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: { q: placeInput, format: 'json', limit: 4 }
          });
          setSuggestions(res.data);
        } catch(e) {}
      } else {
        setSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [placeInput]);

  const addPlace = (place) => {
    setNewTrip(prev => ({
      ...prev,
      places: [...prev.places, { name: place.display_name.split(',')[0], lat: parseFloat(place.lat), lon: parseFloat(place.lon) }]
    }));
    setPlaceInput('');
    setSuggestions([]);
  };

  const removePlace = (index) => {
    setNewTrip(prev => ({
      ...prev,
      places: prev.places.filter((_, i) => i !== index)
    }));
  };

  // Recalculate distance and get polyline
  useEffect(() => {
    const calcDistance = async () => {
      if (newTrip.places.length < 2) {
        setNewTrip(prev => ({ ...prev, distance: '' }));
        setRoutePolyline(null);
        return;
      }
      setIsCalculating(true);
      try {
        const routePromises = [];
        for (let i = 0; i < newTrip.places.length - 1; i++) {
          const p1 = newTrip.places[i];
          const p2 = newTrip.places[i+1];
          const coords = `${p1.lon},${p1.lat};${p2.lon},${p2.lat}`;
          routePromises.push(
            axios.get(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
          );
        }
        
        const results = await Promise.all(routePromises);
        let totalDistance = 0;
        let allCoords = [];
        
        results.forEach(res => {
          if (res.data && res.data.routes && res.data.routes.length > 0) {
            totalDistance += res.data.routes[0].distance;
            const segmentCoords = res.data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            allCoords = allCoords.concat(segmentCoords);
          }
        });
        
        const distKm = (totalDistance / 1000).toFixed(0);
        setNewTrip(prev => ({ ...prev, distance: distKm }));
        setRoutePolyline(allCoords);
      } catch (e) {
        console.error("Failed to calc route", e);
      } finally {
        setIsCalculating(false);
      }
    };
    calcDistance();
  }, [newTrip.places]);

  // Fetch matching DB places whenever destinations change
  useEffect(() => {
    const fetchDbPlaces = async () => {
      if (newTrip.places.length === 0) { setDbPlaceSuggestions([]); return; }
      setIsFetchingDbSuggestions(true);
      try {
        // Build a search query from place names (match any destination district)
        const placeNames = newTrip.places.map(p => p.name).join(',');
        const res = await axios.get(`http://localhost:5001/api/places?all=true`, { timeout: 5000 });
        // Filter client-side: match any place whose location contains one of the trip destinations
        const destinations = newTrip.places.map(p => p.name.toLowerCase());
        const matched = res.data.filter(p => {
          const loc = (p.location || '').toLowerCase();
          const pname = (p.name || '').toLowerCase();
          return destinations.some(d => loc.includes(d) || d.includes(loc.split(',')[0].trim()));
        });
        setDbPlaceSuggestions(matched.slice(0, 12));
      } catch (e) {
        setDbPlaceSuggestions([]);
      } finally {
        setIsFetchingDbSuggestions(false);
      }
    };
    fetchDbPlaces();
  }, [newTrip.places]);

  const fetchSuggestions = async (placesArr) => {
    setIsFetchingSuggestions(true);
    try {
      const res = await axios.post('http://localhost:5001/api/ai/suggestions', { places: placesArr });
      setAiSuggestions(res.data);
    } catch (err) {
      setAiSuggestions([
        { title: "Local Temples", desc: "Explore historic temples in the region with magnificent architecture." },
        { title: "Street Food Tour", desc: "Try famous local delicacies and authentic street food specialties." },
        { title: "Sunset Checkpoints", desc: "Find the best high-altitude spots along your route to watch the sunset." }
      ]);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    const tripData = {
      ...newTrip,
      userId: user?._id,
      places: newTrip.places.map(p => p.name),
      dates: (newTrip.startDate && newTrip.endDate) ? `${newTrip.startDate} to ${newTrip.endDate}` : newTrip.startDate,
      itinerary: []
    };
    
    let savedTrip;
    try {
      const res = await axios.post('http://localhost:5001/api/trips', tripData);
      savedTrip = res.data;
      setTrips([savedTrip, ...trips]);
    } catch (err) {
      console.error("Failed to save trip", err);
      savedTrip = { ...tripData, _id: Date.now().toString() };
      setTrips([savedTrip, ...trips]);
    }
    
    setCreatedTrip(savedTrip);
    fetchSuggestions(savedTrip.places);
  };

  const closeEverything = () => {
    setShowModal(false);
    setCreatedTrip(null);
    setAiSuggestions([]);
    setDbPlaceSuggestions([]);
    setNewTrip({ title: '', places: [], vehicle: 'Car', distance: '', startDate: '', endDate: '', budget: '', notes: '' });
    setRoutePolyline(null);
  };

  return (
    <div className="my-trips-page">
      <header className="section-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1>My <span className="gradient-text">Adventures</span></h1>
          <p>A collection of your architected journeys.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Plan Trip
        </button>
      </header>

      {isLoading ? (
        <div className="trips-grid">
          {[1, 2, 3].map(i => <div key={i} className="trip-card skeleton glass" style={{ height: 200 }}></div>)}
        </div>
      ) : trips.length === 0 ? (
        <div className="empty-state glass">
          <Compass size={48} className="icon-muted" />
          <h3>No trips saved yet</h3>
          <p>Click "Plan Trip" to create your first journey!</p>
        </div>
      ) : (
        <div className="trips-grid">
          {trips.map((trip, i) => (
            <motion.div 
              key={trip._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="trip-card glass-card"
            >
              <div className="trip-card-header">
                <div className="trip-icon">
                  {trip.vehicle === 'Flight' || trip.vehicle === 'Plane' ? <Plane size={20} /> : 
                   trip.vehicle === 'Bike' ? <Bike size={20} /> :
                   trip.vehicle === 'Train' ? <Train size={20} /> :
                   <Car size={20} />}
                </div>
                <button className="delete-trip-btn" onClick={() => deleteTrip(trip._id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="trip-card-body">
                <h3>{trip.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {trip.places && Array.isArray(trip.places) ? trip.places.join(' → ') : 'Multiple Destinations'}
                </p>
                <div className="trip-meta" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <span><Calendar size={14} /> {trip.dates || trip.duration}</span>
                  <span><Compass size={14} /> {trip.distance ? `${trip.distance} km` : 'TBD'}</span>
                  {trip.budget && <span><Sparkles size={14} /> {trip.budget}</span>}
                  {trip.notes && <span><FileText size={14} /> Notes added</span>}
                </div>
              </div>

              <div className="trip-card-footer" style={{ marginTop: '16px' }}>
                <span className="budget-tag">{trip.vehicle || 'Car'}</span>
                <button className="view-details-btn" onClick={() => setSelectedTrip(trip)}>
                  <span>Details</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Plan Trip Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={closeEverything} style={{ display: 'flex', gap: '24px', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              className="profile-modal glass"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '540px', width: '100%', overflow: 'visible' }}
            >
              {!createdTrip ? (
                <>
                  <h2 style={{ marginBottom: '24px' }}>Plan New Trip</h2>
                  <form onSubmit={handleCreateTrip} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="input-wrapper">
                      <input required placeholder="Trip Title (e.g. Summer Roadtrip)" value={newTrip.title} onChange={e => setNewTrip({...newTrip, title: e.target.value})} />
                    </div>
                    
                    {/* Place Autocomplete */}
                    <div style={{ position: 'relative' }}>
                      <div className="input-wrapper">
                        <MapPin size={16} color="var(--text-muted)" />
                        <input 
                          placeholder="Type a place to add..." 
                          value={placeInput} 
                          onChange={e => setPlaceInput(e.target.value)} 
                        />
                      </div>
                      {suggestions.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', borderRadius: '12px', padding: '8px', zIndex: 50, marginTop: '4px', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-premium)' }}>
                          {suggestions.map((s, i) => (
                            <div key={i} onClick={() => addPlace(s)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                              {s.display_name}
                            </div>
                          ))}
                        </div>
                      )}
                      {newTrip.places.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                          {newTrip.places.map((p, i) => (
                            <span key={i} style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--text-primary)', border: '1px solid rgba(139, 92, 246, 0.4)', padding: '6px 12px', borderRadius: '100px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {p.name} <X size={14} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => removePlace(i)} />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* DB Place Suggestions panel */}
                    {(dbPlaceSuggestions.length > 0 || isFetchingDbSuggestions) && (
                      <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '14px', padding: '14px' }}>
                        <div style={{ fontSize: '12px', color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sparkles size={12} /> Places to visit at your destination
                        </div>
                        {isFetchingDbSuggestions ? (
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Finding places...</div>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {dbPlaceSuggestions.map((p, i) => (
                              <motion.span
                                key={p._id || i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.04 }}
                                title={p.description}
                                onClick={() => setSelectedExplorePlace(p)}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '5px 12px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                              >
                                <MapPin size={11} color="#8B5CF6" /> {p.name}
                              </motion.span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="input-wrapper" style={{ padding: '0 16px' }}>
                        <select 
                          value={newTrip.vehicle} 
                          onChange={e => setNewTrip({...newTrip, vehicle: e.target.value})}
                          style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', padding: '14px 0', outline: 'none' }}
                        >
                          <option value="Car" style={{ color: 'black' }}>Car</option>
                          <option value="Bike" style={{ color: 'black' }}>Bike</option>
                          <option value="Train" style={{ color: 'black' }}>Train</option>
                          <option value="Flight" style={{ color: 'black' }}>Flight</option>
                          <option value="Bus" style={{ color: 'black' }}>Bus</option>
                        </select>
                      </div>
                      <div className="input-wrapper">
                        <Compass size={16} color="var(--text-muted)" />
                        <input type="number" placeholder={isCalculating ? "Calculating..." : "Distance (km)"} value={newTrip.distance} onChange={e => setNewTrip({...newTrip, distance: e.target.value})} />
                      </div>
                    </div>

                    {/* Calendar Date Inputs */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div className="input-wrapper" style={{ flex: 1 }}>
                        <Calendar size={16} color="var(--text-muted)" />
                        <input type="date" value={newTrip.startDate} onChange={e => setNewTrip({...newTrip, startDate: e.target.value})} style={{ colorScheme: 'dark' }} required />
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>to</span>
                      <div className="input-wrapper" style={{ flex: 1 }}>
                        <Calendar size={16} color="var(--text-muted)" />
                        <input type="date" value={newTrip.endDate} onChange={e => setNewTrip({...newTrip, endDate: e.target.value})} style={{ colorScheme: 'dark' }} required />
                      </div>
                    </div>

                    <div className="input-wrapper">
                      <Sparkles size={16} color="var(--text-muted)" />
                      <input placeholder="Budget (e.g. ₹5,000)" value={newTrip.budget} onChange={e => setNewTrip({...newTrip, budget: e.target.value})} />
                    </div>

                    <div className="input-wrapper" style={{ alignItems: 'flex-start' }}>
                      <FileText size={16} color="var(--text-muted)" style={{ marginTop: '14px' }} />
                      <textarea 
                        placeholder="Notes or features you like..." 
                        value={newTrip.notes} 
                        onChange={e => setNewTrip({...newTrip, notes: e.target.value})}
                        style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', minHeight: '80px', padding: '14px 0', outline: 'none', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={closeEverything}>Cancel</button>
                      <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Trip</button>
                    </div>
                  </form>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '10px 0' }}>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Sparkles size={28} />
                    </div>
                    <h2>Trip Architected!</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                      Here are some curated local recommendations for your journey to {createdTrip.places.join(', ')}
                    </p>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px' }}>
                    {isFetchingSuggestions ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '16px' }}>
                          <Compass size={32} />
                        </motion.div>
                        <p>Our AI is crafting local suggestions...</p>
                      </div>
                    ) : (
                      aiSuggestions.map((s, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: i * 0.1 }} 
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}
                        >
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                            <MapPin size={16} color="#8B5CF6"/> {s.title}
                          </h4>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</p>
                        </motion.div>
                      ))
                    )}
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <button className="btn-primary" style={{ width: '100%' }} onClick={closeEverything}>Awesome, let's go!</button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Map Preview Side Panel */}
            <AnimatePresence>
              {newTrip.places.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  className="profile-modal glass"
                  onClick={e => e.stopPropagation()}
                  style={{ width: '400px', height: '100%', maxHeight: '600px', padding: '16px', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', margin: 0 }}>Route Preview</h3>
                    {newTrip.distance && (
                      <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', padding: '4px 10px', borderRadius: '100px', fontSize: '13px', fontWeight: 'bold' }}>
                        Total: {newTrip.distance} km
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                    <MapContainer center={[newTrip.places[0].lat, newTrip.places[0].lon]} zoom={6} scrollWheelZoom={true} zoomControl={false} style={{ width: '100%', height: '100%' }}>
                      <TileLayer 
                        attribution='&copy; <a href="https://carto.com/">CartoDB</a>' 
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                      />
                      {newTrip.places.map((p, idx) => (
                        <Marker key={idx} position={[p.lat, p.lon]} />
                      ))}
                      {routePolyline && (
                        <Polyline positions={routePolyline} color="#8B5CF6" weight={4} opacity={0.8} />
                      )}
                      <MapViewHandler route={routePolyline} places={newTrip.places} />
                    </MapContainer>
                  </div>
                  {isCalculating && <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Drawing route...</p>}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}
      </AnimatePresence>

      {/* Trip Details Modal */}
      <AnimatePresence>
        {selectedTrip && (
          <div className="modal-overlay" onClick={() => setSelectedTrip(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="profile-modal glass"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
                <h2 style={{ margin: 0 }}>{selectedTrip.title}</h2>
                <div onClick={() => setSelectedTrip(null)} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '50%' }}>
                  <X size={16} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '4px' }}>
                {/* Places journey */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ color: 'var(--text-muted)', marginBottom: '12px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Journey</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedTrip.places && Array.isArray(selectedTrip.places) ? selectedTrip.places.map((place, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MapPin size={14} />
                        </div>
                        <span style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{place}</span>
                      </div>
                    )) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Destinations not specified</div>
                    )}
                  </div>
                </div>

                {/* Meta details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Dates</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <Calendar size={14} color="#10B981" /> {selectedTrip.dates || selectedTrip.duration || 'N/A'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Distance</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <Compass size={14} color="#3B82F6" /> {selectedTrip.distance ? `${selectedTrip.distance} km` : 'N/A'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Vehicle</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <Car size={14} color="#F59E0B" /> {selectedTrip.vehicle || 'Car'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Budget</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <Sparkles size={14} color="#EC4899" /> {selectedTrip.budget || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedTrip.notes && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}>
                    <h4 style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Notes</h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedTrip.notes}</p>
                  </div>
                )}

                {/* Nearby Places from DB */}
                {(isLoadingNearby || nearbyPlaces.length > 0) && (
                  <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '12px', padding: '16px' }}>
                    <h4 style={{ color: '#8B5CF6', marginBottom: '12px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} /> Places Nearby Your Destinations
                    </h4>
                    {isLoadingNearby ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Finding nearby places...</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {nearbyPlaces.map((p, i) => (
                          <motion.div
                            key={p._id || i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedExplorePlace(p)}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < nearbyPlaces.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer' }}
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                              onError={e => e.target.style.display = 'none'}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <MapPin size={10} /> {p.location}
                              </div>
                            </div>
                            <span style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA', borderRadius: '100px', padding: '3px 8px', fontSize: '11px', flexShrink: 0 }}>
                              {p.category}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedExplorePlace && (
          <PlaceDetailModal
            place={selectedExplorePlace}
            onClose={() => setSelectedExplorePlace(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default MyTrips;
