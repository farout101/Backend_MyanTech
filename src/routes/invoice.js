const express = require('express');
const {
    createInvoice
} = require("../controllers/invoiceController")

const router = express.Router();


router.post("/:order_id", createInvoice);

module.exports = router;