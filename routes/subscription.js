const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ CHECK USAGE & SUBSCRIPTION STATUS
router.get('/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Auto‑downgrade if subscription ended
    if (user.subscription_status === 'premium' && user.subscription_end_date && Date.now() > user.subscription_end_date) {
      user.subscription_status = 'free';
      await user.save();
    }

    res.json({
      success: true,
      status: user.subscription_status,
      usage: user.usage_count,
      endDate: user.subscription_end_date
    });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ✅ INCREASE USAGE COUNT ON EVERY STREAM
router.post('/use', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token' });

    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Block free users after 5 uses
    if (user.subscription_status === 'free' && user.usage_count >= 5) {
      return res.json({
        success: false,
        error: '⚠️ Free limit reached — subscribe for unlimited access',
        limitReached: true
      });
    }

    // Increase count (only for free users)
    if (user.subscription_status === 'free') {
      user.usage_count += 1;
      await user.save();
    }

    res.json({ success: true, newCount: user.usage_count });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ✅ UPGRADE TO PREMIUM (30 DAYS)
router.post('/upgrade', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Set subscription for 30 days
    user.subscription_status = 'premium';
    user.subscription_end_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    res.json({ success: true, message: '✅ Upgraded to Premium — 30 days unlimited access' });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
