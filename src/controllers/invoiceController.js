const pool = require("../../config/db");
const { checkPrivilege } = require('../helpers/jwtHelperFunctions');

// Create new invoice
const createInvoice = async (req, res) => {
    
    checkPrivilege(req, res, ['Admin','Warehouse']);
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        

        const { order_id } = req.params;

        // Calculate total amount from order items
        const [items] = await connection.query(
            "SELECT SUM(unit_price_at_time * quantity) AS total FROM OrderItems WHERE order_id = ?",
            [order_id]
        );


        console.log({items});
        if (items.length === 0 || items[0].total === null) {
            await connection.rollback();
            return res.status(404).json({ error: "Order not found" });
        }

        const totalAmount = items[0].total;

        const [result] = await connection.query(
            "INSERT INTO Invoices (order_id, invoice_date, total_amount, status) VALUES (?, NOW(), ?, 'pending')",
            [order_id, totalAmount]
        );

        // Fetch order details
        const [orderResults] = await connection.query(`
            SELECT 
                O.order_id,
                O.order_date,
                O.status AS order_status,
                O.total_amount AS order_total,
                C.customer_id,
                C.name AS customer_name,
                C.contact_number1,
                C.contact_number2,
                C.address,
                C.township,
                C.region,
                I.invoice_id,
                I.invoice_date,
                I.total_amount AS invoice_total,
                I.status AS invoice_status
            FROM Orders O
            JOIN Customers C ON O.customer_id = C.customer_id
            LEFT JOIN Invoices I ON O.order_id = I.order_id
            WHERE O.order_id = ?
        `, [order_id]);

        if (orderResults.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Order not found" });
        }

        const order = orderResults[0];

        // Fetch order items separately
        const [orderItems] = await connection.query(`
            SELECT 
                OI.order_item_id,
                OI.product_id,
                P.name AS product_name,
                P.category,
                P.brand,
                P.price AS current_price,
                OI.unit_price_at_time AS price_at_order,
                OI.quantity,
                OI.status AS order_item_status
            FROM OrderItems OI
            JOIN products P ON OI.product_id = P.product_id
            WHERE OI.order_id = ?
        `, [order_id]);

        // Add type to order items
        const orderItemsWithType = orderItems.map(item => ({
            ...item,
            type: 'OrderItem'
        }));

        // Fetch returns with product details from OrderItems
        const [returns] = await connection.query(`
            SELECT 
                R.return_id,
                R.order_item_id,
                R.return_reason,
                R.return_status,
                R.return_date,
                R.resolved_date,
                OI.product_id,
                P.name AS product_name,
                P.category,
                P.brand,
                R.quantity
            FROM Returns R
            JOIN OrderItems OI ON R.order_item_id = OI.order_item_id
            JOIN products P ON OI.product_id = P.product_id
            WHERE OI.order_id = ?
        `, [order_id]);

        // Add type to returns
        const returnsWithType = returns.map(ret => ({
            ...ret,
            type: 'Return'
        }));

        // Combine order items and returns
        const combinedResults = [{ invoice_id: result.insertId }, ...orderItemsWithType, ...returnsWithType];

        await connection.commit();
        res.json({ order, details: combinedResults });

    } catch (error) {
        await connection.rollback();
        console.error("Error fetching order:", error);
        res.status(500).json({ error: "Database query failed" });
    } finally {
        connection.release();
    }
};

const changeInvoiceStatus = async (req, res) => {

    checkPrivilege(req, res, ['Admin', 'Warehouse']);

    const connection = await pool.getConnection();
    try {
        

        await connection.beginTransaction();

        const { inv, status } = req.body;
        //invoice_id = inv

        // Update invoice status
        const [result] = await connection.query(
            "UPDATE Invoices SET status = ? WHERE invoice_id = ?",
            [status, inv]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Invoice not found" });
        }

        await connection.commit();
        res.json({ inv, status });

    } catch (error) {
        await connection.rollback();
        console.error("Error updating invoice status:", error);
        res.status(500).json({ error: "Database query failed" });
    } finally {
        connection.release();
    }
};

// Get all invoices
const getAllInvoices = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        checkPrivilege(req, res, ['Admin', 'Warehouse']);

        const [results] = await connection.query(`
            SELECT 
                I.invoice_id AS inv,
                O.order_id,
                C.name AS customer_name,
                C.contact_number1 AS contact_no,
                I.total_amount AS amount,
                I.status
            FROM Invoices I
            JOIN Orders O ON I.order_id = O.order_id
            JOIN Customers C ON O.customer_id = C.customer_id
        `);

        res.json(results);

    } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ error: "Database query failed" });
    } finally {
        connection.release();
    }
};


module.exports = {
    changeInvoiceStatus,
    createInvoice,
    getAllInvoices
};