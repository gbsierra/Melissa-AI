const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser'); // still fine if you prefer it
const multer = require('multer'); // required for file uploads
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json()); // parses JSON bodies
app.use(express.urlencoded({ extended: true })); // parses URL-encoded form data

// Root route
app.get('/', (req, res) => {
  res.send('👨‍🍳 Melissa backend is running!');
});

// API routes
const recipeRoutes = require('./routes/recipe');
app.use('/api/recipes', recipeRoutes);

const transcribeRoutes = require('./routes/transcribe');
app.use('/api/transcribe', transcribeRoutes);

const ingredientRoutes = require('./routes/ingredient');
app.use('/api/ingredient', ingredientRoutes);

const cookbookRoutes = require('./routes/cookbook');
app.use('/api', cookbookRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`[Melissa-Backend] 🚀 Server running at http://localhost:${PORT}`);
});