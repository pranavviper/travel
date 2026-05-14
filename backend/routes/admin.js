const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authMiddleware, roleMiddleware, JWT_SECRET } = require('../middleware/auth');
const { User, Place, Trip, FuelPrice, TollPlaza, Report, Announcement, AuditLog, Settings, AiQueryLog } = require('../models');

// --- Helper: create audit log ---
const audit = async (req, action, targetType, targetId, details) => {
  try {
    await AuditLog.create({
      adminId: req.admin?._id || req.admin?.id,
      adminName: req.admin?.name,
      action, targetType, targetId, details,
      ipAddress: req.ip
    });
  } catch (e) {}
};

// ========================
// AUTH
// ========================
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (password !== user.password) return res.status(401).json({ message: 'Invalid credentials' });
    if (!['admin', 'superadmin', 'moderator'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// All routes below require auth
router.use(authMiddleware);

// ========================
// DASHBOARD STATS
// ========================
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [totalUsers, totalTrips, totalPlaces, recentUsers, recentTrips, aiLogs] = await Promise.all([
      User.countDocuments(),
      Trip.countDocuments(),
      Place.countDocuments({ isHidden: false }),
      User.find().sort({ joinedAt: -1 }).limit(10).select('name email avatar role joinedAt'),
      Trip.find().sort({ createdAt: -1 }).limit(10),
      AiQueryLog.countDocuments()
    ]);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const usersThisMonth = await User.countDocuments({ joinedAt: { $gte: startOfMonth } });

    // Signups last 30 days
    const days30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const count = await User.countDocuments({ joinedAt: { $gte: d, $lt: next } });
      days30.push({ date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), users: count });
    }

    const categoryAgg = await Place.aggregate([{ $group: { _id: '$category', value: { $sum: 1 } } }]);

    res.json({
      stats: { totalUsers, totalTrips, totalPlaces, aiQueries: aiLogs, usersThisMonth },
      recentUsers, recentTrips, signupChart: days30,
      categoryChart: categoryAgg.map(c => ({ name: c._id || 'Unknown', value: c.value }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========================
// USER MANAGEMENT
// ========================
router.get('/users', async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role) query.role = role;
    if (status === 'banned') query.isBanned = true;
    if (status === 'active') query.isBanned = false;
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ joinedAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const trips = await Trip.find({ userId: req.params.id });
    res.json({ user, trips });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/users/:id', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await audit(req, 'UPDATE_USER', 'user', req.params.id, `Updated user ${updated.email}`);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/users/:id', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user?.role === 'superadmin') return res.status(400).json({ message: 'Cannot delete superadmin' });
    await User.findByIdAndDelete(req.params.id);
    await audit(req, 'DELETE_USER', 'user', req.params.id, `Deleted user ${user?.email}`);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/users/:id/ban', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isBanned = !user.isBanned;
    await user.save();
    await audit(req, user.isBanned ? 'BAN_USER' : 'UNBAN_USER', 'user', req.params.id, `${user.isBanned ? 'Banned' : 'Unbanned'} ${user.email}`);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/users', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    await audit(req, 'CREATE_USER', 'user', user._id, `Created user ${user.email}`);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ========================
// TRIP MANAGEMENT
// ========================
router.get('/trips', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = search ? { title: { $regex: search, $options: 'i' } } : {};
    const total = await Trip.countDocuments(query);
    const trips = await Trip.find(query).populate('userId', 'name email avatar').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ trips, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/trips/:id', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    await Trip.findByIdAndDelete(req.params.id);
    await audit(req, 'DELETE_TRIP', 'trip', req.params.id, 'Deleted trip');
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========================
// PLACES MANAGEMENT
// ========================
router.get('/places', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    const total = await Place.countDocuments(query);
    const places = await Place.find(query).skip((page - 1) * limit).limit(Number(limit));
    res.json({ places, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/places', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    const place = new Place(req.body);
    await place.save();
    await audit(req, 'CREATE_PLACE', 'place', place._id, `Added place ${place.name}`);
    res.status(201).json(place);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/places/:id', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    const place = await Place.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await audit(req, 'UPDATE_PLACE', 'place', req.params.id, `Updated place ${place.name}`);
    res.json(place);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/places/:id', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    const place = await Place.findByIdAndDelete(req.params.id);
    await audit(req, 'DELETE_PLACE', 'place', req.params.id, `Deleted place ${place?.name}`);
    res.json({ message: 'Place deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========================
// FUEL PRICES
// ========================
router.get('/fuel-prices', async (req, res) => {
  try {
    const prices = await FuelPrice.find().sort({ lastUpdated: -1 });
    res.json(prices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/fuel-prices', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    const price = new FuelPrice({ ...req.body, updatedBy: req.admin.name });
    await price.save();
    res.status(201).json(price);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/fuel-prices/:id', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    const price = await FuelPrice.findByIdAndUpdate(req.params.id, { ...req.body, lastUpdated: new Date(), updatedBy: req.admin.name }, { new: true });
    res.json(price);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/fuel-prices/:id', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    await FuelPrice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========================
// TOLL PLAZAS
// ========================
router.get('/tolls', async (req, res) => {
  try {
    const tolls = await TollPlaza.find();
    res.json(tolls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/tolls', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    const toll = new TollPlaza(req.body);
    await toll.save();
    res.status(201).json(toll);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/tolls/:id', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    const toll = await TollPlaza.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(toll);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/tolls/:id', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    await TollPlaza.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========================
// REPORTS
// ========================
router.get('/reports', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const reports = await Report.find(query).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { ...req.body, reviewedBy: req.admin.name }, { new: true });
    res.json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ========================
// ANNOUNCEMENTS
// ========================
router.get('/announcements', async (req, res) => {
  try {
    const list = await Announcement.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/announcements', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    const ann = new Announcement({ ...req.body, createdBy: req.admin.name });
    await ann.save();
    res.status(201).json(ann);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/announcements/:id', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ann);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/announcements/:id', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========================
// SETTINGS
// ========================
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/settings', roleMiddleware(['superadmin']), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    Object.assign(settings, req.body, { updatedAt: new Date(), updatedBy: req.admin.name });
    await settings.save();
    await audit(req, 'UPDATE_SETTINGS', 'settings', settings._id, 'Updated system settings');
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ========================
// AUDIT LOGS
// ========================
router.get('/logs', roleMiddleware(['admin', 'superadmin']), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find().sort({ timestamp: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ logs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========================
// AI STATS
// ========================
router.get('/ai/stats', async (req, res) => {
  try {
    const total = await AiQueryLog.countDocuments();
    const today = new Date(); today.setHours(0,0,0,0);
    const todayCount = await AiQueryLog.countDocuments({ timestamp: { $gte: today } });
    const recent = await AiQueryLog.find().sort({ timestamp: -1 }).limit(20);
    res.json({ total, today: todayCount, recent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========================
// ANALYTICS
// ========================
router.get('/analytics', async (req, res) => {
  try {
    const [totalUsers, totalTrips, totalPlaces] = await Promise.all([
      User.countDocuments(), Trip.countDocuments(), Place.countDocuments()
    ]);
    const roleBreakdown = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
    const categoryBreakdown = await Place.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    res.json({ totalUsers, totalTrips, totalPlaces, roleBreakdown, categoryBreakdown });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
