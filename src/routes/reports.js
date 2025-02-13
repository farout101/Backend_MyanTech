const express = require("express");
const {
    mostProfitProducts,
    slowProducts
} = require("../controllers/reportsController");
const router = express.Router();

// Product search route
router.get('/profitproduct', mostProfitProducts)
router.get('/slowproduct', slowProducts)

module.exports = router;