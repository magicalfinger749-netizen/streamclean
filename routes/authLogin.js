const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ✅ LOGIN ENDPOINT + ANTI‑SHARING CHECK
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check inputs
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please fill in all fields' });
    }

    // Find user + get password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Check password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Create new session token
    const newToken = user.getSignedJwtToken();

    // 🔒 ANTI‑SHARING KICK LOGIC
    // If user is already logged in elsewhere → kick old session
    if (user.current_session_token && user.current_session_token !== newToken) {
      user.current_session_token = newToken;
      await user.save();
      return res.json({
        success: false,
        error: '⚠️ Account was logged in elsewhere — you have been reconnected, other devices were signed out for security'
      });
    }

    // Save current session token
    user.current_session_token = newToken;
    await user.save();

    res.json({
      success: true,
      token: newToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.subscription_status,
        expiry: user.subscription_end_date
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error — try again later' });
  }
});

module.exports = router;