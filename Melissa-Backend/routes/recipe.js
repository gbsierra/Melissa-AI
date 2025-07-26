const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); // You can configure storage if needed later

const { generateRecipe } = require('../controllers/recipeController');

// Multer middleware parses form-data including files
router.post(
  '/generate-recipe',
  upload.fields([{ name: 'image1' }, { name: 'image2' }]),
  generateRecipe
);

module.exports = router;