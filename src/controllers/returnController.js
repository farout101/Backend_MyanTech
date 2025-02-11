const pool = require("../../config/db");
const { checkPrivilege } = require('../helpers/jwtHelperFunctions')

const getAllReturns = (req,res) => {
    return res.json({message : "From return route"})
}


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


module.exports = {
    getAllReturns,
    createReturn
};
  