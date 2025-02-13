const pool = require("../../config/db");
const { checkPrivilege } = require('../helpers/jwtHelperFunctions')

// Get all returns with pagination
const getAllReturns = async (req, res) => {

    checkPrivilege(req, res, ['Admin', 'Warehouse', 'Sale']);

    const connection = await pool.getConnection();
    try {

        // Get limit and offset from query parameters, default to limit 100 and offset 0
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        // Fetch total count of returns
        const [countResult] = await connection.query("SELECT COUNT(*) AS total FROM Returns");
        const total = countResult[0].total;

        // Fetch returns with limit and offset
        const [results] = await connection.query(
            "SELECT * FROM Returns LIMIT ? OFFSET ?",
            [limit, offset]
        );

        res.json({
            total,
            limit,
            offset,
            results
        });
    } catch (error) {
        console.error("Error fetching returns:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    } finally {
        connection.release();
    }
};

//getAllRetrun While Joining the table
const getAllReturnsWithJoin = async (req, res) => {

    checkPrivilege(req, res, ['Admin', 'Warehouse', 'Sale']);

    const connection = await pool.getConnection();
    try {

        // Get limit and offset from query parameters, default to limit 100 and offset 0
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        // Fetch total count of returns
        const [countResult] = await connection.query("SELECT COUNT(*) AS total FROM Returns");
        const total = countResult[0].total;

        // Fetch returns with limit and offset
        const [results] = await connection.query(
            `SELECT 
                C.name AS customer_name,
                P.name AS product_name,
                R.return_id,
                R.quantity AS qty,
                R.return_reason,
                R.return_status AS status,
                OI.order_id,
                R.return_date,
                R.resolved_date,
                OI.order_item_id
            FROM Returns R
            JOIN OrderItems OI ON R.order_item_id = OI.order_item_id
            JOIN Orders O ON OI.order_id = O.order_id
            JOIN Customers C ON O.customer_id = C.customer_id
            JOIN products P ON OI.product_id = P.product_id;`,
            [limit, offset]
        );

        res.json({
            total,
            limit,
            offset,
            results
        });
    } catch (error) {
        console.error("Error fetching returns:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    } finally {
        connection.release();
    }
};

//createReturnForm
const createReturn = async (req, res) => {

    checkPrivilege(req, res, ['Admin', 'Warehouse', 'Sale']);

    const connection = await pool.getConnection();
    try {

        await connection.beginTransaction();

        const returns = req.body; // Expecting an array of returns

        if (!Array.isArray(returns) || returns.length === 0) {
            return res.status(400).json({ error: "Invalid input" });
        }

        for (const returnItem of returns) {
            const { order_item_id, return_reason, quantity, return_date } = returnItem;

            if (!order_item_id || !return_reason || !quantity) {
                return res.status(400).json({ error: "Wrong body request" });
            }

            // Check if order item exists and its quantity
            const [orderItem] = await connection.query(
                "SELECT quantity FROM OrderItems WHERE order_item_id = ?",
                [order_item_id]
            );

            if (orderItem.length === 0) {
                return res.status(400).json({ error: "Order item not found" });
            }

            const orderItemQuantity = orderItem[0].quantity;

            // Check if there is already a return row with the same order_item_id
            const [existingReturn] = await connection.query(
                "SELECT quantity FROM Returns WHERE order_item_id = ?",
                [order_item_id]
            );

            let totalReturnQuantity = quantity;

            if (existingReturn.length > 0) {
                totalReturnQuantity += existingReturn[0].quantity;
            }

            if (totalReturnQuantity > orderItemQuantity) {
                return res.status(400).json({ error: "Return quantity exceeds order item quantity" });
            }

            const returnDate = return_date ? return_date : new Date();

            if (existingReturn.length > 0) {
                // Update existing return row
                await connection.query(
                    "UPDATE Returns SET quantity = ?, return_date = ? WHERE order_item_id = ?",
                    [totalReturnQuantity, returnDate, order_item_id]
                );
            } else {
                // Insert new return row
                await connection.query(
                    "INSERT INTO Returns (order_item_id, return_reason, return_date, quantity) VALUES (?, ?, ?, ?)",
                    [order_item_id, return_reason, returnDate, quantity]
                );
            }
        }

        await connection.commit();
        res.json({ message: "Returns processed" });
    } catch (error) {
        await connection.rollback();
        console.error("Error creating returns:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database Insert Failed" });
        }
    } finally {
        connection.release();
    }
};

const getAllItemsInServiceCenter = async (req, res) => {

    checkPrivilege(req, res, ['Admin', 'Warehouse']);

    const connection = await pool.getConnection();
    try {

        const [results] = await connection.query(
            `SELECT 
                R.return_id,
                P.name AS product_name,
                OI.quantity,
                SC.name AS service_center_name,
                R.return_status,
                R.return_date
            FROM Returns R
            JOIN OrderItems OI ON R.order_item_id = OI.order_item_id
            JOIN products P ON OI.product_id = P.product_id
            LEFT JOIN ServiceCenters SC ON R.service_center_id = SC.service_center_id
            WHERE R.service_center_id IS NOT NULL 
            AND R.return_status IN ('pending', 'picked_up');`
        );

        await connection.commit();
        res.json(results);
    } catch (error) {
        await connection.rollback();
        console.error("Error fetching items in service centers:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error" });
        }
    } finally {
        connection.release();
    }
};

// Assign service center
const assignServiceCenter = async (req, res) => {

    checkPrivilege(req, res, ['Admin', 'Warehouse']);

    const connection = await pool.getConnection();
    try {

        const { return_id, service_center_id, driver_id, truck_id } = req.body;

        if (!return_id || !service_center_id || !driver_id || !truck_id) {
            return res.status(400).json({ error: "Invalid input" });
        }

        // Check if the return exists and meets the criteria
        const [returnItem] = await connection.query(
            "SELECT * FROM Returns WHERE return_id = ? AND return_reason = 'damage'",
            [return_id]
        );

        if (returnItem.length === 0) {
            return res.status(404).json({ error: "Return not found or does not meet the criteria" });
        }

        // Check if the driver exists and is available
        const [driver] = await connection.query(
            "SELECT * FROM Drivers WHERE driver_id = ? AND status = 'available'",
            [driver_id]
        );

        if (driver.length === 0) {
            return res.status(400).json({ error: "Driver not available" });
        }

        // Check if the truck exists and is available
        const [truck] = await connection.query(
            "SELECT * FROM Trucks WHERE truck_id = ? AND status = 'available'",
            [truck_id]
        );

        if (truck.length === 0) {
            return res.status(400).json({ error: "Truck not available" });
        }

        // Assign the return to the service center, driver, and truck and update the return status to 'service'
        await connection.query(
            "UPDATE Returns SET service_center_id = ?, driver_id = ?, pickup_truck_id = ?, return_status = 'service' WHERE return_id = ?",
            [service_center_id, driver_id, truck_id, return_id]
        );

        // Update the status of the driver and truck to 'working'
        await connection.query(
            "UPDATE Drivers SET status = 'working' WHERE driver_id = ?",
            [driver_id]
        );

        await connection.query(
            "UPDATE Trucks SET status = 'working' WHERE truck_id = ?",
            [truck_id]
        );

        await connection.commit();
        res.json({ message: "Return assigned to service center and status updated to service" });
    } catch (error) {
        await connection.rollback();
        console.error("Error assigning return to service center:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database Update Failed" });
        }
    } finally {
        connection.release();
    }
};

// Assign transportation
const assignTransportation = async (req, res) => {

    checkPrivilege(req, res, ['Admin', 'Warehouse']);

    const connection = await pool.getConnection();
    try {

        const { return_id, driver_id, truck_id } = req.body;

        if (!return_id || !driver_id || !truck_id) {
            return res.status(400).json({ error: "Invalid input" });
        }

        // Check if the return exists
        const [returnItem] = await connection.query(
            "SELECT * FROM Returns WHERE return_id = ?",
            [return_id]
        );

        if (returnItem.length === 0) {
            return res.status(404).json({ error: "Return not found" });
        }

        // Check if the driver exists and is available
        const [driver] = await connection.query(
            "SELECT * FROM Drivers WHERE driver_id = ? AND status = 'available'",
            [driver_id]
        );

        if (driver.length === 0) {
            return res.status(400).json({ error: "Driver not available" });
        }

        // Check if the truck exists and is available
        const [truck] = await connection.query(
            "SELECT * FROM Trucks WHERE truck_id = ? AND status = 'available'",
            [truck_id]
        );

        if (truck.length === 0) {
            return res.status(400).json({ error: "Truck not available" });
        }

        // Assign the return to the driver and truck and update the return status to 'picked_up'
        await connection.query(
            "UPDATE Returns SET driver_id = ?, pickup_truck_id = ?, return_status = 'picked_up' WHERE return_id = ?",
            [driver_id, truck_id, return_id]
        );

        // Update the status of the driver and truck to 'working'
        await connection.query(
            "UPDATE Drivers SET status = 'working' WHERE driver_id = ?",
            [driver_id]
        );

        await connection.query(
            "UPDATE Trucks SET status = 'working' WHERE truck_id = ?",
            [truck_id]
        );

        await connection.commit();
        res.json({ message: "Transportation assigned to return and status updated to picked_up" });
    } catch (error) {
        await connection.rollback();
        console.error("Error assigning transportation to return:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database Update Failed" });
        }
    } finally {
        connection.release();
    }
};

// Free driver and update status
const freeDriverAndUpdateStatus = async (req, res) => {

    checkPrivilege(req, res, ['Admin', 'Warehouse']);

    const connection = await pool.getConnection();
    try {

        const { return_id } = req.body;

        if (!return_id) {
            return res.status(400).json({ error: "Invalid input" });
        }

        // Check if the return exists
        const [returnItem] = await connection.query(
            "SELECT * FROM Returns WHERE return_id = ?",
            [return_id]
        );

        if (returnItem.length === 0) {
            return res.status(404).json({ error: "Return not found" });
        }

        const { driver_id, pickup_truck_id, return_reason, order_item_id, quantity } = returnItem[0];

        // Free the driver and truck
        if (driver_id) {
            await connection.query(
                "UPDATE Drivers SET status = 'available' WHERE driver_id = ?",
                [driver_id]
            );
        }

        if (pickup_truck_id) {
            await connection.query(
                "UPDATE Trucks SET status = 'available' WHERE truck_id = ?",
                [pickup_truck_id]
            );
        }

        // Update the return status to 'collected' and set driver_id and pickup_truck_id to NULL
        await connection.query(
            "UPDATE Returns SET return_status = 'collected', driver_id = NULL, pickup_truck_id = NULL WHERE return_id = ?",
            [return_id]
        );

        // If the return reason is 'wrong_item', update the OrderItems and products tables
        if (return_reason === 'wrong_item') {
            const [orderItem] = await connection.query(
                "SELECT product_id, quantity FROM OrderItems WHERE order_item_id = ?",
                [order_item_id]
            );

            if (orderItem.length > 0) {
                const { product_id, quantity: orderQuantity } = orderItem[0];

                // Update the stock quantity in the products table
                await connection.query(
                    "UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?",
                    [orderQuantity, product_id]
                );
            }
        }

        await connection.commit();
        res.json({ message: "Driver and truck freed, return status updated to collected" });
    } catch (error) {
        await connection.rollback();
        console.error("Error freeing driver and updating status:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database update Failed" });
        };
    } finally {
        connection.release();
    }
};

// Resolve return
const returnResolve = async (req, res) => {

    checkPrivilege(req, res, ['Admin', 'Warehouse']);

    const connection = await pool.getConnection();
    try {

        const { return_id } = req.body;

        if (!return_id) {
            return res.status(400).json({ error: "Invalid input" });
        }

        // Check if the return exists
        const [returnItem] = await connection.query(
            "SELECT * FROM Returns WHERE return_id = ?",
            [return_id]
        );

        if (returnItem.length === 0) {
            return res.status(404).json({ error: "Return not found" });
        }

        const { driver_id, pickup_truck_id } = returnItem[0];

        // Free the driver and truck
        if (driver_id) {
            await connection.query(
                "UPDATE Drivers SET status = 'available' WHERE driver_id = ?",
                [driver_id]
            );
        }

        if (pickup_truck_id) {
            await connection.query(
                "UPDATE Trucks SET status = 'available' WHERE truck_id = ?",
                [pickup_truck_id]
            );
        }

        // Update the return status to 'resolved', set driver_id and pickup_truck_id to NULL, and set resolved_date to current date and time
        await connection.query(
            "UPDATE Returns SET return_status = 'resolved', driver_id = NULL, pickup_truck_id = NULL, resolved_date = NOW() WHERE return_id = ?",
            [return_id]
        );

        await connection.commit();
        res.json({ message: "Return resolved, driver and truck freed" });
    } catch (error) {
        await connection.rollback();
        console.error("Error resolving return:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database Insert Failed" });
        }
    } finally {
        connection.release();
    }
};

module.exports = {
    createReturn,
    getAllItemsInServiceCenter,
    assignServiceCenter,
    assignTransportation,
    freeDriverAndUpdateStatus,
    returnResolve,
    getAllReturns,
    getAllReturnsWithJoin
};
