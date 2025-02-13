const {
    getAllServiceCenters
} = require('../controllers/serviceCenterController');
const express = require('express');
const router = express.Router();
router.get('/', getAllServiceCenters);


module.exports = router;