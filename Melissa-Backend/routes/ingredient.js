const express = require('express');
const router = express.Router();
const { getSuggestedIngredients, getSwapAmount } = require('../controllers/ingredientController');

router.get('/suggest/:ingredient', getSuggestedIngredients);

router.post('/swap-amount', getSwapAmount);

module.exports = router;