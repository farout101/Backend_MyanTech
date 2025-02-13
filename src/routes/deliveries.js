const express = require('express');
const {
    getAllDeliveries,
    getDeliveryById,
    createDelivery,
    updateDelivery,
    deleteDelivery,
    getDeliveryCount,
    updateDeliveryStatus
} = require("../controllers/deliveryController");

const router = express.Router();

router.get("/delivery-count", getDeliveryCount);
router.post("/", createDelivery);
router.get("/:id", getDeliveryById);
router.put("/update/:delivery_id", updateDeliveryStatus); //(Updating delivery status) to compltete
router.put("/:id", updateDelivery); // PUT /api/deliveries/1 (for updaing all the data in the delivery)
router.delete("/:id", deleteDelivery); // DELETE /api/deliveries/1

router.get("/", getAllDeliveries); // GET /api/deliveries?limit=100&offset=0

module.exports = router;