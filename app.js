const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const folderRoutes = require('./routes/folderRoutes');
const fileRoutes = require('./routes/fileRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const passport = require('passport');
require('./config/passport'); // Initialize Passport
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(passport.initialize()); // Initialize Passport middleware

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/folders', authMiddleware, folderRoutes);
app.use('/api/files', authMiddleware, fileRoutes);

// Temporary success route for Google redirect
app.get('/auth/success', (req, res) => {
  const token = req.query.token;
  res.json({ token });
});

app.use(errorMiddleware);

module.exports = app;