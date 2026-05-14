const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const { User, Place, Trip, AiQueryLog } = require('./models');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// ========================
// PUBLIC AUTH ROUTES
// ========================
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (password !== user.password) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ message: 'Account banned' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const newUser = new User(req.body);
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ========================
// USER PROFILE
// ========================
app.put('/api/users/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========================
// PLACES
// ========================
app.get('/api/places', async (req, res) => {
  try {
    const { hidden, interests } = req.query;
    const query = hidden === 'true' ? {} : { isHidden: { $ne: true } };
    
    let places = await Place.find(query);

    if (interests) {
      const interestList = interests.split(',').map(i => i.trim().toLowerCase());
      // Filter/Sort by interest match
      places = places.sort((a, b) => {
        const aMatch = interestList.some(i => a.category.toLowerCase().includes(i) || i.includes(a.category.toLowerCase()));
        const bMatch = interestList.some(i => b.category.toLowerCase().includes(i) || i.includes(b.category.toLowerCase()));
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    }

    res.json(places);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/places', async (req, res) => {
  const place = new Place(req.body);
  try {
    const newPlace = await place.save();
    res.status(201).json(newPlace);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/places/:id', async (req, res) => {
  try {
    await Place.findByIdAndDelete(req.params.id);
    res.json({ message: 'Place deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/places/:id', async (req, res) => {
  try {
    const updatedPlace = await Place.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedPlace);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ========================
// TRIPS
// ========================
app.get('/api/trips', async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};
    const trips = await Trip.find(query).sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/trips', async (req, res) => {
  if (!req.body.userId) {
    return res.status(401).json({ message: 'Authentication required to save trips' });
  }
  const trip = new Trip(req.body);
  try {
    const newTrip = await trip.save();
    res.status(201).json(newTrip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ========================
// GEMINI AI
// ========================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

app.post('/api/ai/generate', async (req, res) => {
  const { query, userId } = req.body;
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ message: 'Gemini API Key missing' });
  try {
    const prompt = `You are a professional travel planner. Generate a high-fidelity travel itinerary in JSON format. The JSON should have exactly this structure: { "title": "Trip Title", "duration": "Duration in days", "budget": "Estimated budget with currency", "itinerary": [ { "day": 1, "title": "Day Title", "desc": "Detailed description" } ] }. Do not include any markdown formatting or extra text, just the raw JSON. Query: ${query}`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    if (userId) await AiQueryLog.create({ userId, query, model: 'gemini-1.5-pro' });
    res.json(JSON.parse(cleanJson));
  } catch (err) {
    console.error('Gemini Error:', err);
    res.status(500).json({ message: 'Failed to generate AI plan' });
  }
});

app.post('/api/ai/suggestions', async (req, res) => {
  const { places } = req.body;
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ message: 'Gemini API Key missing' });
  try {
    const prompt = `You are a local travel guide. I am traveling to: ${places.join(', ')}. Give me exactly 4 top suggestions of famous things to do, see, or eat at these places. Return ONLY a JSON array of objects with 'title' and 'desc'. Example: [{"title": "Meenakshi Temple", "desc": "Historic Hindu temple located on the southern bank of the Vaigai River in Madurai."}]. Do not include markdown formatting.`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(cleanJson));
  } catch (err) {
    console.error('Gemini Error:', err);
    res.status(500).json({ message: 'Failed to generate suggestions' });
  }
});

// ========================
// STATS
// ========================
app.get('/api/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    const tripQuery = userId ? { userId } : {};
    
    const trips = await Trip.countDocuments(tripQuery);
    const places = await Place.countDocuments();
    const users = await User.countDocuments();
    res.json({ trips, places, users, points: trips * 200 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========================
// ADMIN ROUTES
// ========================
app.use('/api/admin', adminRouter);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
