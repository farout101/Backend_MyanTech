const express = require('express');

const router = express.Router();

const {
    getAllReturns,
    createReturn
} = require("../controllers/returnController")

// Define your routes here
router.get('/', getAllReturns);
router.post('/', createReturn);

// Export the router
module.exports = router;