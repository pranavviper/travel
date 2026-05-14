import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Sparkles, Map, Calendar, Users, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import API_URL from '../config/api';

const Mind = () => {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!user) {
      toast.error("Please login to save your trips!");
      navigate('/auth');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/trips`, { ...plan, userId: user._id });
      toast.success("Trip saved to your profile!");
    } catch (err) {
      toast.error("Failed to save trip.");
    }
  };

  const handleGenerate = async () => {
    if (!query) return;

    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/api/ai/generate`,
        { query, userId: user?._id }
      );

      setPlan(response.data);
    } catch (err) {
      console.error("AI Generation Error:", err);
      setError("Failed to generate plan. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mind-page">
      <div className="mind-hero">
        <div className="mind-icon-container">
          <Brain className="mind-brain-icon" size={48} />
        </div>
        <h1>Meet<span className="gradient-text">Mind</span> AI</h1>
        <p>Your intelligent travel architect, powered by AI.</p>
      </div>

      <div className="chat-container">
        <div className="input-area">
          <input 
            type="text" 
            placeholder="E.g. Plan a 5-day luxury trip to Switzerland for 2 people in December..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button className="btn-primary" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Sparkles size={18} />
              </motion.div>
            ) : <Send size={18} />}
            <span>{isGenerating ? 'Architecting...' : 'Generate Plan'}</span>
          </button>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-msg">
          <AlertCircle size={18} color="var(--accent-tertiary)" />
          <span>{error}</span>
        </motion.div>
      )}

      <AnimatePresence>
        {plan && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="plan-result"
          >
            <div className="plan-header">
              <div>
                <h2>{plan.title}</h2>
                <div className="plan-meta">
                  <span><Calendar size={14} /> {plan.duration}</span>
                  <span><Users size={14} /> AI Tailored</span>
                  <span><Map size={14} /> Global Discovery</span>
                </div>
              </div>
              <div className="plan-budget">
                <span className="label">Est. Budget</span>
                <span className="value">{plan.budget}</span>
              </div>
            </div>

            <div className="itinerary-timeline">
              {plan.itinerary.map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h3>Day {item.day}: {item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="plan-actions">
              <button 
                className="btn-secondary" 
                onClick={handleSave}
              >
                Save to Trips
              </button>
              <button className="btn-primary">Book Now</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Mind;
