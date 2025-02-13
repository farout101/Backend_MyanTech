const express = require('express');
const {
    createInvoice,
    changeInvoiceStatus
} = require("../controllers/invoiceController")

const router = express.Router();


router.post("/:order_id", createInvoice);
router.put("/status", changeInvoiceStatus);

module.exports = router;