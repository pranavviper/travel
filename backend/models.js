const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: { type: String, default: 'password123' },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' },
  location: String,
  address: String,
  interests: { type: Array, default: [] },
  preferredBudget: { type: String, default: 'Moderate' },
  bio: String,
  role: { type: String, enum: ['user', 'moderator', 'admin', 'superadmin'], default: 'user' },
  isBanned: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now }
});

const PlaceSchema = new mongoose.Schema({
  name: String,
  location: String,
  image: String,
  rating: { type: Number, default: 4.5 },
  category: String,
  price: String,
  description: String,
  isHidden: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const TripSchema = new mongoose.Schema({
  title: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  places: [{ type: String }],
  vehicle: String,
  distance: String,
  dates: String,
  duration: String,
  budget: String,
  notes: String,
  itinerary: Array,
  status: { type: String, enum: ['planned', 'ongoing', 'completed'], default: 'planned' },
  createdAt: { type: Date, default: Date.now }
});

const FuelPriceSchema = new mongoose.Schema({
  city: String,
  state: String,
  petrol: Number,
  diesel: Number,
  cng: Number,
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: String
});

const TollPlazaSchema = new mongoose.Schema({
  name: String,
  highway: String,
  state: String,
  location: { lat: Number, lng: Number },
  rates: { car: Number, lcv: Number, bus: Number, truck: Number },
  lastUpdated: { type: Date, default: Date.now }
});

const ReportSchema = new mongoose.Schema({
  reporterId: String,
  reportedType: { type: String, enum: ['user', 'trip', 'place'] },
  reportedId: String,
  reason: String,
  description: String,
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
  reviewedBy: String,
  createdAt: { type: Date, default: Date.now }
});

const AnnouncementSchema = new mongoose.Schema({
  title: String,
  message: String,
  type: { type: String, enum: ['info', 'warning', 'maintenance', 'promotion'], default: 'info' },
  target: { type: String, default: 'all' },
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true },
  createdBy: String,
  createdAt: { type: Date, default: Date.now }
});

const AuditLogSchema = new mongoose.Schema({
  adminId: String,
  adminName: String,
  action: String,
  targetType: String,
  targetId: String,
  details: String,
  ipAddress: String,
  timestamp: { type: Date, default: Date.now }
});

const SettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'MeetMind' },
  maintenanceMode: { type: Boolean, default: false },
  features: {
    ai: { type: Boolean, default: true },
    groupTrips: { type: Boolean, default: true },
    tripSharing: { type: Boolean, default: true },
    evMode: { type: Boolean, default: false }
  },
  apiLimits: { gemini: { type: Number, default: 100 }, ors: { type: Number, default: 500 } },
  defaultTollRate: { type: Number, default: 2.4 },
  allowSignups: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: String
});

const AiQueryLogSchema = new mongoose.Schema({
  userId: String,
  query: String,
  model: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Place: mongoose.model('Place', PlaceSchema),
  Trip: mongoose.model('Trip', TripSchema),
  FuelPrice: mongoose.model('FuelPrice', FuelPriceSchema),
  TollPlaza: mongoose.model('TollPlaza', TollPlazaSchema),
  Report: mongoose.model('Report', ReportSchema),
  Announcement: mongoose.model('Announcement', AnnouncementSchema),
  AuditLog: mongoose.model('AuditLog', AuditLogSchema),
  Settings: mongoose.model('Settings', SettingsSchema),
  AiQueryLog: mongoose.model('AiQueryLog', AiQueryLogSchema)
};
