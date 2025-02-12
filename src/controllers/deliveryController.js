const pool = require("../../config/db");
const { checkPrivilege } = require('../helpers/jwtHelperFunctions')

// Get all deliveries
const getAllDeliveries = async (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    try {
        checkPrivilege(req, res, ['Admin','Warehouse','Sale']);

        const [deliveries] = await pool.query("SELECT * FROM Deliveries LIMIT ? OFFSET ?", [limit, offset]);
        res.json(deliveries);
    } catch (error) {
        console.error("Error fetching deliveries:", error);
        res.status(500).json({ error: "Database query failed" });
    }
};

// Get single delivery by ID
const getDeliveryById = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin','Warehouse','Sale']);

        const { id } = req.params;
        const [delivery] = await pool.query("SELECT * FROM Deliveries WHERE delivery_id = ?", [id]);
        if (delivery.length === 0) return res.status(404).json({ error: "Delivery not found" });
        res.json(delivery[0]);
    } catch (error) {
        console.error("Error fetching delivery:", error);
        res.status(500).json({ error: "Database query failed" });
    }
};

const createDelivery = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        checkPrivilege(req, res, ['Admin', 'Warehouse']);

        const { driverId, truckId } = req.query;
        const { order_ids } = req.body; // Expecting { "order_ids": [1, 2, 3, 4] }

        if (!driverId || !truckId) {
            return res.status(400).json({ message: "Missing driverId or truckId in query params." });
        }

        if (!Array.isArray(order_ids) || order_ids.length === 0) {
            return res.status(400).json({ message: "Payload must contain an array of order_ids." });
        }

        // Validate driver and truck exist and are available
        const [driverCheck] = await connection.query(
            "SELECT driver_id FROM Drivers WHERE driver_id = ? AND status = 'available'",
            [driverId]
        );
        const [truckCheck] = await connection.query(
            "SELECT truck_id FROM Trucks WHERE truck_id = ? AND status = 'available'",
            [truckId]
        );

        if (driverCheck.length === 0) {
            return res.status(400).json({ message: "Invalid or unavailable driver." });
        }
        if (truckCheck.length === 0) {
            return res.status(400).json({ message: "Invalid or unavailable truck." });
        }

        // Validate all order_ids exist and are not already assigned
        const [validOrders] = await connection.query(
            "SELECT order_id FROM Orders WHERE order_id IN (?) AND delivery_id IS NULL",
            [order_ids]
        );

        if (validOrders.length !== order_ids.length) {
            return res.status(400).json({ message: "Some order_ids are invalid or already assigned." });
        }

        // Insert into Deliveries table
        const [result] = await connection.query(
            "INSERT INTO Deliveries (driver_id, truck_id, departure_time) VALUES (?, ?, NOW())",
            [driverId, truckId]
        );

        const deliveryId = result.insertId;

        // Update driver and truck status
        const [driverUpdate] = await connection.query(
            "UPDATE Drivers SET status = 'working' WHERE driver_id = ?",
            [driverId]
        );
        const [truckUpdate] = await connection.query(
            "UPDATE Trucks SET status = 'working' WHERE truck_id = ?",
            [truckId]
        );

        if (driverUpdate.affectedRows === 0 || truckUpdate.affectedRows === 0) {
            throw new Error("Driver or truck status update failed.");
        }

        // Update Orders in a single query
        await connection.query(
            "UPDATE Orders SET delivery_id = ?, status = 'delivering' WHERE order_id IN (?)",
            [deliveryId, order_ids]
        );

        await connection.commit();
        res.status(200).json({
            message: "Delivery created successfully",
            deliveryId,
            driverId,
            truckId,
            assignedOrderIds: order_ids
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error creating delivery:", error);

        // Handle MySQL-specific errors
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({ message: "Invalid driver or truck." });
        }

        res.status(500).json({ message: "Internal Server Error" });
    } finally {
        connection.release();
    }
};


// Update delivery
const updateDelivery = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin','Warehouse']);

        const { id } = req.params;
        const { driver_id, truck_id, departure_time, status } = req.body;
        const [result] = await pool.query(
            "UPDATE Deliveries SET driver_id=?, truck_id=?, departure_time=?, status=? WHERE delivery_id=?",
            [driver_id, truck_id, departure_time, status, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Delivery not found" });
        res.json({ message: "Delivery updated" });
    } catch (error) {
        console.error("Error updating delivery:", error);
        res.status(500).json({ error: "Database update failed" });
    }
};

// Delete delivery
const deleteDelivery = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin','Warehouse']);

        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM Deliveries WHERE delivery_id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Delivery not found" });
        res.json({ message: "Delivery deleted" });
    } catch (error) {
        console.error("Error deleting delivery:", error);
        res.status(500).json({ error: "Database delete failed" });
    }
};

// Function to validate status
const isValidStatus = (status) => {
    const validStatuses = ['pending', 'delivering', 'delivered', 'cancelled'];
    return validStatuses.includes(status);
};

// Update delivery status
const updateDeliveryStatus = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin','Warehouse','Sale']);

        const { id } = req.params;
        const { status } = req.body;

        if (!isValidStatus(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const [result] = await pool.query(
            "UPDATE Deliveries SET status=? WHERE delivery_id=?",
            [status, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Delivery not found" });
        res.json({ message: "Delivery status updated" });
    } catch (error) {
        console.error("Error updating delivery status:", error);
        res.status(500).json({ error: "Database update failed" });
    }
};

module.exports = {
    getAllDeliveries,
    getDeliveryById,
    createDelivery,
    updateDelivery,
    deleteDelivery,
    updateDeliveryStatus
};