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
        res.status(500).json({ error: "Internal server error" });
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
        res.status(500).json({ error: "Internal server error" });
    } finally {
        connection.release();
    }
};

module.exports = {
    mostProfitProducts,
    slowProducts
}