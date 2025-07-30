const express = require('express');
const router = express.Router();
const { getSuggestedIngredients, getSwapAmount } = require('../controllers/ingredientController');

router.get('/suggest/:ingredient', getSuggestedIngredients);

router.post('/suggest/swap-amount', getSwapAmount);

module.exports = router;