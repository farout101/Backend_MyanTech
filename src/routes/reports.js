const express = require("express");
const {
    mostProfitProducts,
    slowProducts,
    getThisMonthSaleReport,
    showStats
} = require("../controllers/reportsController");
const router = express.Router();

// Product search route
router.get('/profitproduct', mostProfitProducts)
router.get('/slowproduct', slowProducts)
router.get('/getThisMonthSaleReport', getThisMonthSaleReport)
router.get('/stats', showStats)

module.exports = router;