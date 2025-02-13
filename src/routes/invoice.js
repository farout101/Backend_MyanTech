const express = require('express');
const {
    createInvoice,
    changeInvoiceStatus,
    getAllInvoices
} = require("../controllers/invoiceController");
const { route } = require('./customers');

const router = express.Router();

router.get("/", getAllInvoices);
router.post("/:order_id", createInvoice);
router.put("/status", changeInvoiceStatus);

module.exports = router;