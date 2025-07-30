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

// endpoint to generate new recipe with up to MAX_PHOTOS
router.post(
  '/generate-recipe',
  upload.array('photos', MAX_PHOTOS), //multer middleware, uploading passed images to req.files
  generateRecipe //uses req.body and req.files as input
);

// endpoint to adjust existing recipe with up to MAX_PHOTOS
router.post(
  '/adjust-recipe',
  upload.array('photos', MAX_PHOTOS), //multer middleware, uploading passed images to req.files
  adjustRecipe //uses req.body and req.files as input
);

module.exports = router;