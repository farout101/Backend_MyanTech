const express = require('express');

const router = express.Router();

const {
    createReturn,
    getAllItemsInServiceCenter,
    assignServiceCenter,
    assignTransportation,
    freeDriverAndUpdateStatus,
    returnResolve,
    getAllReturns
} = require("../controllers/returnController");

// Define your routes here
router.get('/service', getAllItemsInServiceCenter)
router.put('/assign-service', assignServiceCenter)
router.put('/assign-pickup', assignTransportation)
router.put('/collect-free', freeDriverAndUpdateStatus)
router.put('/return-resolve', returnResolve)
router.get('/', getAllReturns)
router.post('/', createReturn);
// {
//     "return_id": 3,
//     "service_center_id": 2,
// }
// return_reason must be "damage"
// return_status must be "picked_up"

// Export the router
module.exports = router;