const express = require('express');

const router = express.Router();

const {
    createReturn,
    getAllItemsInServiceCenter,
    assignServiceCenter,
} = require("../controllers/returnController")

// Define your routes here
router.post('/', createReturn);
router.get('/service', getAllItemsInServiceCenter)
router.post('/assign', assignServiceCenter)
// {
//     "return_id": 3,
//     "service_center_id": 2,
// }
// return_reason must be "damage"
// return_status must be "picked_up"

// Export the router
module.exports = router;