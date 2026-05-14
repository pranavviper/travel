import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Star, Clock, DollarSign, Navigation, Info, Camera, Lightbulb, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Rich knowledge base for each place
const PLACE_DATA = {
  "Meenakshi Amman Temple": {
    established: "1623 AD (rebuilt)",
    bestTime: "Oct – Mar",
    timings: "5:00 AM – 12:30 PM, 4:00 PM – 9:30 PM",
    entryFee: "Free (Camera ₹50)",
    duration: "2–3 hours",
    coords: [9.9195, 78.1193],
    history: "The Meenakshi Amman Temple is a historic Hindu temple located on the southern bank of the Vaigai River in Madurai, Tamil Nadu. Dedicated to Goddess Meenakshi (Parvati) and her consort Sundareswarar (Shiva), the temple's history stretches back over 2,000 years to the Sangam period. The current structure was primarily built during the Nayak dynasty in the 17th century. Its 14 gateway towers (gopurams), adorned with thousands of colorful stone sculptures, are an architectural marvel. The tallest tower rises to 52 meters. It was once a top contender for the New Seven Wonders of the World.",
    facts: [
      "14 colorful gopurams (towers) decorated with 33,000+ sculpted figures",
      "Draws over 15,000 pilgrims every day",
      "The temple complex spans 6 hectares (14 acres)",
      "Houses a museum and golden lotus tank inside"
    ],
    tips: [
      "Visit early morning (5 AM) to avoid crowds",
      "Remove footwear before entering — free deposit available",
      "Non-Hindus cannot enter the inner sanctum",
      "The evening Aarti (7 PM) is a must-see experience"
    ],
    nearbyPlaces: ["Thirumalai Nayakkar Palace", "Gandhi Memorial Museum", "Vaigai River"],
    mapEmbed: "https://www.openstreetmap.org/export/embed.html?bbox=78.1093,9.9095,78.1293,9.9295&layer=mapnik&marker=9.9195,78.1193"
  },
  "Marina Beach": {
    established: "Known since ancient times",
    bestTime: "Nov – Feb",
    timings: "Open 24 hours (Best 5–8 AM, 5–8 PM)",
    entryFee: "Free",
    duration: "1–2 hours",
    coords: [13.0500, 80.2824],
    history: "Marina Beach is the world's longest natural urban beach, stretching 13 km along the Bay of Bengal in Chennai (formerly Madras). It has been a cherished public space since the British colonial era. The Governor of Madras, Mountstuart Elphinstone Grant Duff, is credited with developing the beach promenade in the 1880s. The beach has witnessed key moments in Indian history and is home to several iconic statues including those of freedom fighters and former Chief Ministers. Today it is the social heart of Chennai, attracting millions of visitors annually.",
    facts: [
      "13 km long — the world's second longest natural urban beach",
      "Home to statues of MGR, Kamarajar, and Anna",
      "Several aquariums and parks line the promenade",
      "Famous for beach food: sundal, murukku, and corn"
    ],
    tips: [
      "Sunrise (5–6 AM) is the most magical and least crowded time",
      "Swimming is dangerous due to strong undercurrents",
      "Evening (6–8 PM) has the best street food and crowds",
      "Keep belongings safe — it gets very crowded on weekends"
    ],
    nearbyPlaces: ["Fort St. George", "Government Museum", "Kapaleeshwarar Temple"],
    mapEmbed: "https://www.openstreetmap.org/export/embed.html?bbox=80.2624,13.0300,80.3024,13.0700&layer=mapnik&marker=13.0500,80.2824"
  },
  "Munnar Hills": {
    established: "Developed as a British hill station c. 1870",
    bestTime: "Sep – Mar",
    timings: "Best visited during daylight hours",
    entryFee: "₹25–₹100 per attraction",
    duration: "2–3 days",
    coords: [10.0889, 77.0595],
    history: "Munnar, situated in the Western Ghats of Kerala at an altitude of 1,600 meters, was developed as a hill station by the British in the 19th century. The name 'Munnar' means 'three rivers' in Malayalam, referring to the confluence of Muthirapuzha, Nallathanni, and Kundaly rivers. The British established vast tea plantations here, which today cover over 30,000 hectares. The region was administered by the South Indian branch of Finlays, a British company, until Indian independence. Today Munnar is Kerala's premier hill station, famous for tea, cardamom, and breathtaking landscapes.",
    facts: [
      "Altitude: 1,600 meters above sea level",
      "Home to the rare Neelakurinji flower that blooms once every 12 years",
      "Over 30,000 hectares of tea plantations",
      "Eravikulam National Park nearby houses the endangered Nilgiri Tahr"
    ],
    tips: [
      "Book accommodation in advance during October–January peak season",
      "Visit the tea museum for a free tasting session",
      "Hire a local guide for jungle treks",
      "Carry a light jacket — evenings get cold year-round"
    ],
    nearbyPlaces: ["Eravikulam National Park", "Mattupetty Dam", "Top Station", "Kundala Lake"],
    mapEmbed: "https://www.openstreetmap.org/export/embed.html?bbox=77.0395,10.0689,77.0795,10.1089&layer=mapnik&marker=10.0889,77.0595"
  },
  "Alleppey Houseboats": {
    established: "Traditional, modernised in the 1990s",
    bestTime: "Nov – Feb",
    timings: "Check-in 12 PM, Check-out 9 AM",
    entryFee: "₹8,000–₹25,000 per night",
    duration: "1–2 nights",
    coords: [9.4981, 76.3388],
    history: "Alappuzha (Alleppey) is known as the 'Venice of the East' — a city built on a network of canals, backwaters, and lakes. The traditional houseboats, called Kettuvallam, were historically large rice barges used to transport goods through the Kerala backwaters. In the 1990s, entrepreneurs converted these old cargo boats into floating hotels, launching a tourism revolution. Today, over 1,500 houseboats operate in Kerala, many equipped with modern amenities. The backwater region is a UNESCO-recognized ecosystem supporting diverse flora and fauna.",
    facts: [
      "Over 1,500 houseboats cruise Kerala's 900 km network of canals",
      "Traditional name: Kettuvallam (literally 'tied boat')",
      "The Nehru Trophy Boat Race is held here every August",
      "Surrounded by coconut groves, paddy fields, and lotus ponds"
    ],
    tips: [
      "Book through certified operators for best safety standards",
      "Opt for overnight stays to experience the serene morning mist",
      "Request fresh Kerala meals (fish curry, appam) from the onboard cook",
      "Avoid peak monsoon season (June–August) for comfort"
    ],
    nearbyPlaces: ["Kuttanad (Paddy Fields)", "Krishnapuram Palace", "Mararikulam Beach"],
    mapEmbed: "https://www.openstreetmap.org/export/embed.html?bbox=76.3188,9.4781,76.3588,9.5181&layer=mapnik&marker=9.4981,76.3388"
  },
  "Athirappilly Waterfalls": {
    established: "Natural landmark",
    bestTime: "Jun – Jan",
    timings: "8:00 AM – 6:00 PM",
    entryFee: "₹30 per person",
    duration: "2–4 hours",
    coords: [10.2867, 76.5692],
    history: "Athirappilly Falls, located on the Chalakudy River in Kerala, is often called the 'Niagara of India.' The falls are about 24 meters high and 330 meters wide, making them the largest waterfalls in Kerala. The area is part of the Chalakudy River forest division and is rich with biodiversity. Several Bollywood and South Indian blockbusters have been filmed here, including 'Bahubali.' The surrounding forest is a critical wildlife corridor connecting the Parambikulam Tiger Reserve and the Anamalai Tiger Reserve.",
    facts: [
      "Height: 24 meters | Width: 330 meters — Kerala's largest waterfall",
      "Part of a critical wildlife corridor for elephants and tigers",
      "Featured in films: Bahubali, Dil Se, Raavan",
      "Four Great Hornbill species nest in the surrounding forest"
    ],
    tips: [
      "June–September (monsoon) offers the most dramatic waterfall views",
      "Wear non-slip footwear — the rocks near the falls are extremely slippery",
      "Combine with a visit to Vazhachal Falls nearby",
      "Arrive by 8 AM on weekdays to avoid crowd rush"
    ],
    nearbyPlaces: ["Vazhachal Falls", "Chalakudy River", "Parambikulam Tiger Reserve"],
    mapEmbed: "https://www.openstreetmap.org/export/embed.html?bbox=76.5492,10.2667,76.5892,10.3067&layer=mapnik&marker=10.2867,76.5692"
  }
};

const DEFAULT_DATA = {
  established: "Ancient origins",
  bestTime: "Oct – Mar",
  timings: "Open during daylight hours",
  entryFee: "Varies",
  duration: "2–3 hours",
  history: "A magnificent destination with deep cultural and historical roots. This place offers visitors a unique window into the rich heritage and natural beauty of South India.",
  facts: ["A beloved destination for travelers", "Rich in culture and history", "Offers stunning views and experiences"],
  tips: ["Visit early morning for best experience", "Carry water and sunscreen", "Hire a local guide for deeper insights"],
  nearbyPlaces: ["Local markets", "Nearby temples", "Scenic viewpoints"],
  mapEmbed: null
};

const getCategoryColor = (category) => {
  const colors = {
    Cultural: '#F59E0B',
    Coastal: '#06B6D4',
    Nature: '#10B981',
    Adventure: '#F43F5E',
    Urban: '#8B5CF6'
  };
  return colors[category] || '#8B5CF6';
};

const PlaceDetailModal = ({ place, onClose, onPlanRoute }) => {
  const navigate = useNavigate();
  const data = PLACE_DATA[place?.name] || { ...DEFAULT_DATA, mapEmbed: null };
  const overlayRef = useRef();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handlePlanRoute = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      toast.error("Please login to plan and save your routes!");
      navigate('/auth');
      return;
    }
    onClose();
    navigate('/route', { state: { destination: place.location } });
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleOverlayClick}
      >
          <motion.div
            className="place-modal"
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
            style={{ borderRadius: '2rem', overflow: 'hidden' }}
          >
            {/* Hero Image */}
            <div className="modal-hero" style={{ height: '400px', position: 'relative' }}>
              <img src={place.image} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="modal-hero-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,8,22,1), transparent)' }} />
              <div className="modal-hero-content" style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px' }}>
                <span className="modal-category-badge" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
                  {place.category}
                </span>
                <h2 className="modal-title" style={{ fontSize: '32px', fontWeight: 700, marginTop: '12px', lineHeight: 1.2 }}>{place.name}</h2>
                <div className="modal-meta-row" style={{ display: 'flex', gap: '20px', marginTop: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  <span className="modal-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} />{place.location}</span>
                  <span className="modal-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Star size={16} fill="#FFD700" color="#FFD700" />{place.rating}</span>
                </div>
              </div>
              <button className="modal-close" onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>

          {/* Scrollable Content */}
          <div className="modal-body">
            {/* Quick Stats */}
            <div className="modal-stats-grid">
              {[
                { icon: <Clock size={16} />, label: 'Best Time', value: data.bestTime },
                { icon: <Navigation size={16} />, label: 'Duration', value: data.duration },
                { icon: <DollarSign size={16} />, label: 'Entry Fee', value: data.entryFee },
                { icon: <Clock size={16} />, label: 'Timings', value: data.timings },
              ].map((stat, i) => (
                <div key={i} className="modal-stat-card">
                  <span className="modal-stat-icon">{stat.icon}</span>
                  <span className="modal-stat-label">{stat.label}</span>
                  <span className="modal-stat-value">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* History */}
            <section className="modal-section">
              <div className="modal-section-header">
                <Info size={18} className="section-icon" />
                <h3>History & Heritage</h3>
              </div>
              <p className="modal-history-text">{data.history}</p>
            </section>

            {/* Key Facts */}
            <section className="modal-section">
              <div className="modal-section-header">
                <Camera size={18} className="section-icon" />
                <h3>Key Facts</h3>
              </div>
              <ul className="modal-facts-list">
                {data.facts.map((fact, i) => (
                  <li key={i} className="modal-fact-item">
                    <span className="fact-dot" />
                    {fact}
                  </li>
                ))}
              </ul>
            </section>

            {/* Map */}
            <section className="modal-section">
              <div className="modal-section-header">
                <MapPin size={18} className="section-icon" />
                <h3>Location Map</h3>
              </div>
              <div className="modal-map-container">
                {data.mapEmbed ? (
                  <iframe
                    title={`Map of ${place.name}`}
                    src={data.mapEmbed}
                    className="modal-map-iframe"
                    allowFullScreen
                  />
                ) : (
                  <div className="modal-map-placeholder">
                    <MapPin size={32} />
                    <p>{place.location}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Traveler Tips */}
            <section className="modal-section">
              <div className="modal-section-header">
                <Lightbulb size={18} className="section-icon" />
                <h3>Traveler Tips</h3>
              </div>
              <div className="modal-tips-grid">
                {data.tips.map((tip, i) => (
                  <div key={i} className="modal-tip-card">
                    <span className="tip-number">{i + 1}</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Nearby */}
            <section className="modal-section">
              <div className="modal-section-header">
                <ExternalLink size={18} className="section-icon" />
                <h3>Nearby Places</h3>
              </div>
              <div className="modal-nearby-list">
                {data.nearbyPlaces.map((p, i) => (
                  <span key={i} className="nearby-tag">{p}</span>
                ))}
              </div>
            </section>

            {/* CTA */}
            <div className="modal-cta-row">
              <button className="btn-primary modal-cta-btn" onClick={handlePlanRoute}>
                <Navigation size={18} />
                Plan Route Here
              </button>
              <button className="btn-secondary modal-cta-btn" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PlaceDetailModal;
