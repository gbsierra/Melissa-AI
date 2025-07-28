const express = require('express');
const router = express.Router();
const multer = require('multer');

// Centralized config
const MAX_PHOTOS = parseInt(process.env.MAX_PHOTOS ?? '0', 10);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: MAX_PHOTOS },
});

const { generateRecipe, adjustRecipe } = require('../controllers/recipeController');

// generate new recipe with up to MAX_PHOTOS
router.post(
  '/generate-recipe',
  upload.array('photos', MAX_PHOTOS),
  generateRecipe
);

// adjust existing recipe with up to MAX_PHOTOS
router.post(
  '/adjust-recipe',
  upload.array('photos', MAX_PHOTOS),
  adjustRecipe
);

module.exports = router;