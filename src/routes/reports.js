const express = require("express");
const {
    mostProfitProducts,
    slowProducts,
    showStats
} = require("../controllers/reportsController");
const router = express.Router();

// Product search route
router.get('/profitproduct', mostProfitProducts)
router.get('/slowproduct', slowProducts)
router.get('/stats', showStats)

module.exports = router;