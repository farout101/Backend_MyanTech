const express = require('express');
const {
    getAllDrivers,
    getDriverByName,
    createDriver,
    updateDriver,
    deleteDriver
} = require("../controllers/driverController");

const router = express.Router();

router.get("/search", getDriverByName); // GET /api/drivers/search?driver_name=JohnDoe
router.get("/", getAllDrivers); // GET /api/drivers?limit=100&offset=0
router.post("/", createDriver); // POST /api/drivers
router.put("/", updateDriver); // PUT /api/drivers
router.delete("/", deleteDriver); // DELETE /api/drivers

module.exports = router;