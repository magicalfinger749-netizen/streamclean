// ✅ FRONTEND + BACKEND VALIDATION RULES
exports.validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  // Username check
  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }

  // Email format check
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }

  // Password strength check
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  next(); // Pass to next step if all good
};