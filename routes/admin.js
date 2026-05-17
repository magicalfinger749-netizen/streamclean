const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ✅ MIDDLEWARE: CHECK IF USER IS ADMIN
const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.subscription_status !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied — Admin only' });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

// ✅ GET ALL USERS
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password -current_session_token');
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load users' });
  }
});

// ✅ EDIT USER PLAN / RESET LIMIT
router.put('/user/:id', isAdmin, async (req, res) => {
  try {
    const { subscription_status, subscription_end_date, usage_count } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (subscription_status) user.subscription_status = subscription_status;
    if (subscription_end_date) user.subscription_end_date = subscription_end_date;
    if (usage_count !== undefined) user.usage_count = usage_count;

    await user.save();
    res.json({ success: true, message: '✅ User updated successfully', user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// ✅ DELETE USER
router.delete('/user/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (user.email === process.env.ADMIN_EMAIL) {
      return res.status(400).json({ success: false, error: 'Cannot delete main admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '🗑️ User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

module.exports = router;