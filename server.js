const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();



const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve FRONTEND files
app.use(express.static(path.join(__dirname)));

// Basic test route
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'StreamClean API is running' });
});

// Catch-all: serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Visit: http://localhost:${PORT}`);
});// ... your existing code ...

// ✅ ADD THIS NEW LINE HERE 👇
app.use('/api/auth', require('./routes/auth'));

// Catch-all: serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ... rest of your code ...// ... your existing code ...

app.use('/api/auth', require('./routes/auth'));
// 👇 ADD THIS NEW LINE HERE 👇
app.use('/api/auth', require('./routes/authLogin'));

// ... rest of code ...// ... your existing code ...

app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/authLogin'));
// 👇 ADD THIS NEW LINE HERE 👇
app.use('/api/subscription', require('./routes/subscription'));

// ... rest of code ...// ... your existing code ...

app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/authLogin'));
app.use('/api/subscription', require('./routes/subscription'));
// 👇 ADD THIS NEW LINE HERE 👇
app.use('/api/admin', require('./routes/admin'));

// ... rest of code ...
