const express = require("express");
const {
    mostProfitProducts,
    slowProducts,
    getThisMonthSaleReport
} = require("../controllers/reportsController");
const router = express.Router();

// Product search route
router.get('/profitproduct', mostProfitProducts)
router.get('/slowproduct', slowProducts)
router.get('/getThisMonthSaleReport', getThisMonthSaleReport)

module.exports = router;