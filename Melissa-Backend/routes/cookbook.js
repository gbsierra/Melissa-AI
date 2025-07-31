const express = require('express');
const { generateCookbook } = require('../controllers/cookbookController');

const router = express.Router();
router.post('/cookbook/generate', generateCookbook);

module.exports = router;
