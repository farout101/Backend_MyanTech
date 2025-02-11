const express = require('express');

const router = express.Router();

const {
    getAllReturns,
} = require("../controllers/returnController")

// Define your routes here
router.get('/', getAllReturns);

// Export the router
module.exports = router;