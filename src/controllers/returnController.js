const pool = require("../../config/db");
const { checkPrivilege } = require('../helpers/jwtHelperFunctions')

//createReturnForm
const createReturn = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        checkPrivilege(req, res, ['Admin','Warehouse','Sale']);

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
        res.status(500).json({ error: "Database insert failed" });
    } finally {
        connection.release();
    }
};

const getAllItemsInServiceCenter = async (req, res) => {
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
        res.status(500).json({ error: "Internal server error" });
    } finally {
        connection.release();
    }
};

// Assign service center
const assignServiceCenter = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        checkPrivilege(req, res, ['Admin', 'Warehouse']);

        const { return_id, service_center_id } = req.body;

        if (!return_id || !service_center_id) {
            return res.status(400).json({ error: "Invalid input" });
        }

        // Check if the return exists and meets the criteria
        const [returnItem] = await connection.query(
            "SELECT * FROM Returns WHERE return_id = ? AND return_reason = 'damage' AND return_status = 'picked_up'",
            [return_id]
        );

        if (returnItem.length === 0) {
            return res.status(404).json({ error: "Return not found or does not meet the criteria" });
        }

        // Assign the return to the service center
        await connection.query(
            "UPDATE Returns SET service_center_id = ? WHERE return_id = ?",
            [service_center_id, return_id]
        );

        await connection.commit();
        res.json({ message: "Return assigned to service center" });
    } catch (error) {
        await connection.rollback();
        console.error("Error assigning return to service center:", error);
        res.status(500).json({ error: "Database update failed" });
    } finally {
        connection.release();
    }
};

module.exports = {
    createReturn,
    getAllItemsInServiceCenter,
    assignServiceCenter
};
  