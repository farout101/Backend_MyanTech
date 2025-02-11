const express = require('express');
const {
    getOrder,
    updateOrder,
    deleteOrder,
    addProductToOrder,
    getYearlyBreakup,
    getMonthlyEarnings,
    getCurrentYearBreakup,
    getAllOrdersforWarehouse,
    getAllOrdersforSale
} = require("../controllers/orderController");

const router = express.Router();

router.get("/yearly-breakup", getYearlyBreakup)
router.get("/current-year-breakup", getCurrentYearBreakup)
router.get("/monthly-earnings/:year", getMonthlyEarnings) // FIX

router.get("/warehouse", getAllOrdersforWarehouse); // GET /api/orders/warehouse?limit=100&offset=0
router.get("/sale", getAllOrdersforSale); // GET /api/orders/sale?limit=100&offset=0

router.get("/:id", getOrder);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);
router.post("/", addProductToOrder);


module.exports = router;