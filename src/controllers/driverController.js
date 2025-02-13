const pool = require("../../config/db");
const { checkPrivilege } = require('../helpers/jwtHelperFunctions');

// Get all drivers with pagination
const getAllDrivers = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin','Warehouse']);

        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        const [drivers] = await pool.query("SELECT * FROM Drivers ORDER BY driver_name ASC LIMIT ? OFFSET ?", [limit, offset]);

        res.json(drivers);
    } catch (error) {
        console.error("Error fetching drivers:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database query failed" });
        }
    }
};

// Get available drivers
const getAvailableDrivers = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin','Warehouse']);

        const [drivers] = await pool.query("SELECT * FROM Drivers WHERE status = 'available'");
        res.json(drivers);
    } catch (error) {
        console.error("Error fetching available drivers:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database query failed" });
        }
    }
};

// Get single driver by name
const getDriverByName = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin','Warehouse']);

        const searchDriver = req.query.driver_name;
        const [driver] = await pool.query("SELECT * FROM Drivers WHERE driver_name = ?", [searchDriver]);
        if (driver.length === 0) return res.status(404).json({ error: "Driver not found" });
        res.json(driver[0]);
    } catch (error) {
        console.error("Error fetching driver:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database query failed" });
        }
    }
};

// Create new driver
const createDriver = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin','Warehouse']);

        const { driver_name, contact_number } = req.body;
        const [result] = await pool.query(
            "INSERT INTO Drivers (driver_name, contact_number) VALUES (?, ?)",
            [driver_name, contact_number]
        );
        res.json({ message: "Driver added", driver_id: result.insertId });
    } catch (error) {
        console.error("Error adding driver:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database insert failed" });
        }
    }
};

// Update driver
const updateDriver = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin','Warehouse']);

        const { driver_id, driver_name, contact_number } = req.body;
        const [result] = await pool.query(
            "UPDATE Drivers SET driver_name = ?, contact_number = ? WHERE driver_id = ?",
            [driver_name, contact_number, driver_id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Driver not found" });
        res.json({ message: "Driver updated" });
    } catch (error) {
        console.error("Error updating driver:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database update failed" });
        }
    }
};

// Delete driver
const deleteDriver = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin','Warehouse']);

        const { driver_id } = req.body;
        const [result] = await pool.query("DELETE FROM Drivers WHERE driver_id = ?", [driver_id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Driver not found" });
        res.json({ message: "Driver deleted" });
    } catch (error) {
        console.error("Error deleting driver:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database delete failed" });
        }
    }
};

// Get available drivers based on delivery status
const getAvailableDriversTanglement = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin', 'Warehouse']);

        const [drivers] = await pool.query(`
            SELECT D.*
            FROM Drivers D
            LEFT JOIN Deliveries DL ON D.driver_id = DL.driver_id AND DL.status = 'delivering'
            WHERE DL.driver_id IS NULL
        `);

        res.json(drivers);
    } catch (error) {
        console.error("Error fetching available drivers based on delivery status:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database query failed" });
        }
    }
};

module.exports = {
    getAllDrivers,
    getDriverByName,
    createDriver,
    updateDriver,
    deleteDriver,
    getAvailableDrivers,
    getAvailableDriversTanglement
};