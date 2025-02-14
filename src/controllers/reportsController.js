const pool = require("../../config/db");
const { checkPrivilege } = require('../helpers/jwtHelperFunctions')

const mostProfitProducts = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        checkPrivilege(req, res, ['Admin', 'Warehouse', 'Sale']);

        // Get limit and offset from query parameters, default to limit 100 and offset 0
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        // Fetch total count of distinct products in OrderItems
        const [countResult] = await connection.query("SELECT COUNT(DISTINCT product_id) AS total FROM OrderItems");
        const total = countResult[0].total;

        // Query to get the products by their order rate with pagination
        const [results] = await connection.query(`
            SELECT 
                OI.product_id,
                P.name AS product_name,
                SUM(OI.quantity) AS total_quantity_sold,
                SUM(OI.quantity * OI.unit_price_at_time) AS total_revenue
            FROM OrderItems OI
            JOIN products P ON OI.product_id = P.product_id
            GROUP BY OI.product_id, P.name
            ORDER BY total_quantity_sold DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        res.json({
            total,
            limit,
            offset,
            results
        });
    } catch (error) {
        console.error("Error fetching most profit products:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        };
    } finally {
        connection.release();
    }
};

const slowProducts = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        checkPrivilege(req, res, ['Admin', 'Warehouse', 'Sale']);

        // Get limit and offset from query parameters, default to limit 100 and offset 0
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        // Fetch total count of distinct products in OrderItems
        const [countResult] = await connection.query("SELECT COUNT(DISTINCT product_id) AS total FROM OrderItems");
        const total = countResult[0].total;

        // Query to get the products by their order rate with pagination
        const [results] = await connection.query(`
            SELECT 
                OI.product_id,
                P.name AS product_name,
                SUM(OI.quantity) AS total_quantity_sold,
                SUM(OI.quantity * OI.unit_price_at_time) AS total_revenue
            FROM OrderItems OI
            JOIN products P ON OI.product_id = P.product_id
            GROUP BY OI.product_id, P.name
            ORDER BY total_quantity_sold ASC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        res.json({
            total,
            limit,
            offset,
            results
        });
    } catch (error) {
        console.error("Error fetching slow products:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        };
    } finally {
        connection.release();
    }
};


// Get sales for the last 7 days
const getThisMonthSaleReport = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        checkPrivilege(req, res, ['Admin', 'Warehouse', 'Sale']);

        const [results] = await connection.query(`
            WITH RECURSIVE DateSeries AS (
                SELECT DATE_FORMAT(CURDATE(), '%Y-%m-01') AS invoice_date
                UNION ALL
                SELECT invoice_date + INTERVAL 1 DAY
                FROM DateSeries
                WHERE invoice_date < CURDATE()
            )
            SELECT 
                ds.invoice_date, 
                COALESCE(SUM(oi.quantity * oi.unit_price_at_time), 0) AS total_sales
            FROM DateSeries ds
            LEFT JOIN Invoices i ON DATE(i.invoice_date) = ds.invoice_date AND i.status = 'paid'
            LEFT JOIN Orders o ON i.order_id = o.order_id
            LEFT JOIN OrderItems oi ON o.order_id = oi.order_id
            GROUP BY ds.invoice_date
            ORDER BY ds.invoice_date ASC
        `);

        res.json(results);
    } catch (error) {
        console.error("Error fetching sales for the last 7 days:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        };
    } finally {
        connection.release();
    }
};

const showStats = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        checkPrivilege(req, res, ['Admin', 'Warehouse', 'Sale']);

        // Fetch total number of orders
        const [totalOrdersResult] = await connection.query("SELECT COUNT(*) AS totalOrders FROM Orders");
        const totalOrders = totalOrdersResult[0].totalOrders;

        // Fetch number of pending orders
        const [pendingOrdersResult] = await connection.query("SELECT COUNT(*) AS pendingOrders FROM Orders WHERE status = 'pending'");
        const pendingOrders = pendingOrdersResult[0].pendingOrders;

        // Fetch number of completed deliveries
        const [deliveriesCompletedResult] = await connection.query("SELECT COUNT(*) AS deliveriesCompleted FROM Deliveries WHERE status = 'completed'");
        const deliveriesCompleted = deliveriesCompletedResult[0].deliveriesCompleted;

        // Fetch number of return orders
        const [returnOrdersResult] = await connection.query("SELECT COUNT(*) AS returnOrders FROM Returns");
        const returnOrders = returnOrdersResult[0].returnOrders;

        // Fetch total number of invoices
        const [totalInvoicesResult] = await connection.query("SELECT COUNT(*) AS totalInvoices FROM Invoices");
        const totalInvoices = totalInvoicesResult[0].totalInvoices;

        // Fetch total number of customers
        const [totalCustomersResult] = await connection.query("SELECT COUNT(*) AS totalCustomers FROM Customers");
        const totalCustomers = totalCustomersResult[0].totalCustomers;

        // Fetch total revenue from products
        const [totalRevenueResult] = await connection.query(`SELECT 
                YEAR(order_date) AS year,
                COUNT(*) AS total_orders,
                SUM(total_amount) AS total_amount
            FROM Orders
            WHERE YEAR(order_date) = YEAR(CURDATE())
            GROUP BY YEAR(order_date)
            ORDER BY YEAR(order_date) DESC`);
        const totalRevenue = totalRevenueResult[0].total_amount;   

        // Fetch total number of products
        const [totalProductsResult] = await connection.query("SELECT COUNT(*) AS totalProducts FROM products");
        const totalProducts = totalProductsResult[0].totalProducts;

        res.json({
            totalOrders,
            pendingOrders,
            deliveriesCompleted,
            returnOrders,
            totalInvoices,
            totalCustomers,
            totalRevenue,
            totalProducts
        });
    } catch (error) {
        console.error("Error fetching statistics:", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        connection.release();
    }
};

module.exports = {
    mostProfitProducts,
    slowProducts,
    showStats,
    getThisMonthSaleReport
}