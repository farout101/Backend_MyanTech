const pool = require("../../config/db");
const { checkPrivilege } = require('../helpers/jwtHelperFunctions');
const express = require('express');

const router = express.Router();


const tacticalNuke = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        checkPrivilege(req, res, ['Admin']);

        // Delete all items in Invoices, Returns, Deliveries, and Orders tables
        await connection.query("DELETE FROM Invoices");
        await connection.query("DELETE FROM Returns");
        await connection.query("DELETE FROM Deliveries");
        await connection.query("DELETE FROM Orders");

        console.log("deleted all the rows in the dabases, Invoices, Returns, Delivieries, Orders");
        // Set all Drivers status to 'available'
        await connection.query("UPDATE Drivers SET status = 'available'");

        console.log("Set all the drivers status to available");

        // Set all Trucks status to 'available'
        await connection.query("UPDATE Trucks SET status = 'available'");

        console.log("Set all the trucks status to available");

        // Update stock in Products table to 100
        await connection.query("UPDATE products SET stock = 100");

        console.log("Updated all the stock in the products table to 100");

        console.log("All data deleted and statuses reset successfully");

        await connection.commit();
        res.status(200).json({ message: "All data deleted and statuses reset successfully" });

    } catch (error) {
        await connection.rollback();
        console.error("Error executing tactical nuke:", error);
        res.status(500).json({ message: "Internal Server Error" });
    } finally {
        connection.release();
    }
};


router.delete("/tactical/Nuke/incomming/doNotUseCarelessly", tacticalNuke);

module.exports = router;
