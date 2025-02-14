const express = require("express");
const {
    mostProfitProducts,
    slowProducts,
    getLast7DaysSales,
    showStats
} = require("../controllers/reportsController");
const router = express.Router();

// Product search route
router.get('/profitproduct', mostProfitProducts)
router.get('/slowproduct', slowProducts)
router.get('/getlast7daysale', getLast7DaysSales)
router.get('/stats', showStats)

module.exports = router;