const express = require('express');
const {
    getAllTrucks,
    getTruckByLicensePlate,
    createTruck,
    updateTruck,
    deleteTruck
} = require("../controllers/truckController");

const router = express.Router();

router.get("/search", getTruckByLicensePlate); // GET /api/drivers/search?license_plate=XYZ123
router.get("/", getAllTrucks); // GET /api/drivers?limit=100&offset=0
router.post("/", createTruck); // POST /api/drivers
router.put("/", updateTruck); // PUT /api/drivers
router.delete("/", deleteTruck); // DELETE /api/drivers

module.exports = router;