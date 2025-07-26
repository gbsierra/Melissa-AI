const express = require('express');
const router = express.Router();
const { generateRecipe } = require('../controllers/recipeController');

// POST /api/generate-recipe
router.post('/generate-recipe', generateRecipe);

module.exports = router;