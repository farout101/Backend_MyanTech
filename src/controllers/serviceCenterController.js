const pool = require("../../config/db");
const { checkPrivilege } = require('../helpers/jwtHelperFunctions');

// Get all service centers with pagination
const getAllServiceCenters = async (req, res) => {

    checkPrivilege(req, res, ['Admin', 'Warehouse']);

    const connection = await pool.getConnection();
    try {

        // Get limit and offset from query parameters, default to limit 100 and offset 0
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        // Fetch total count of service centers
        

        // Fetch service centers with limit and offset
        const [results] = await connection.query(
            "SELECT * FROM ServiceCenters LIMIT ? OFFSET ?",
            [limit, offset]
        );

        const total = results.length;
        res.json({
            total,
            limit,
            offset,
            results
        });
    } catch (error) {
        console.error("Error fetching service centers:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllServiceCenters
};