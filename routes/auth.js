const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { validateRegister } = require('../middleware/validator');

// ✅ REGISTER ENDPOINT
router.post('/signup', validateRegister, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'This email is already registered'
      });
    }

    // Auto‑set ADMIN status if it's your email
    let subscription_status = 'free';
    if (email === process.env.ADMIN_EMAIL) {
      subscription_status = 'admin';
    }

    // Create new user — password gets hashed automatically by the model
    const user = await User.create({
      username,
      email,
      password,
      subscription_status
    });

    // Return safe data only
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.subscription_status
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server error — please try again later'
    });
  }
});

module.exports = router;