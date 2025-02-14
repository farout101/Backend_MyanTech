const pool = require("../../config/db");
const jwt = require('jsonwebtoken');
const { checkPrivilege } = require("../helpers/jwtHelperFunctions");

// Get all orders with pagination
// const getAllOrdersforSale = async (req, res) => {
//     checkPrivilege(req, res, ['Warehouse', 'Sale']);

//     try {
//         const limit = parseInt(req.query.limit) || 100;
//         const offset = parseInt(req.query.offset) || 0;

//         const [orders] = await pool.query(`
//             SELECT 
//                 O.order_date,
//                 I.invoice_id,
//                 C.name AS customer_name,
//                 O.status AS status,
//                 I.status AS finance_status,
//                 O.order_id,
//                 (SELECT SUM(OI.quantity * OI.unit_price_at_time) 
//                  FROM OrderItems OI 
//                  WHERE OI.order_id = O.order_id) AS total_amount
//             FROM Orders O
//             LEFT JOIN Invoices I ON O.order_id = I.order_id
//             JOIN Customers C ON O.customer_id = C.customer_id
//             ORDER BY O.order_date DESC
//             LIMIT ? OFFSET ?
//         `, [limit, offset]);

//         res.json(orders);
//     } catch (error) {
//         console.error("Error fetching orders:", error);
//         res.status(500).json({ error: "Database query failed" });
//     }
// };

//Get all order for sale view
const getAllOrdersforSale = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin', 'Sale']);

        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        // Fetch orders
        const [orders] = await pool.query(`
            SELECT 
                O.order_id,
                O.order_date,
                I.invoice_id,
                C.name AS customer_name,
                O.status AS status,
                I.status AS finance_status,
                (SELECT SUM(OI.quantity * OI.unit_price_at_time) 
                 FROM OrderItems OI 
                 WHERE OI.order_id = O.order_id) AS total_amount
            FROM Orders O
            LEFT JOIN Invoices I ON O.order_id = I.order_id
            JOIN Customers C ON O.customer_id = C.customer_id
            ORDER BY O.order_date DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        // Fetch products for each order
        const orderIds = orders.map(order => order.order_id);
        const [orderItems] = await pool.query(`
            SELECT 
                OI.order_id,
                OI.product_id,
                OI.order_item_id,
                P.name AS product_name,
                OI.quantity,
                OI.unit_price_at_time
            FROM OrderItems OI
            JOIN products P ON OI.product_id = P.product_id
            WHERE OI.order_id IN (?)
        `, [orderIds]);

        // Group products by order_id
        const productsByOrderId = orderItems.reduce((acc, item) => {
            if (!acc[item.order_id]) {
                acc[item.order_id] = [];
            }
            acc[item.order_id].push({
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                order_item_id: item.order_item_id,
                unit_price_at_time: item.unit_price_at_time
            });
            return acc;
        }, {});

        // Attach products to orders
        const ordersWithProducts = orders.map(order => ({
            ...order,
            total_qty: productsByOrderId[order.order_id].reduce((acc, item) => acc + item.quantity, 0),
            products: productsByOrderId[order.order_id] || []
        }));

        res.json(ordersWithProducts);
    } catch (error) {
        console.error("Error fetching orders:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database query failed" });
        }
    }
};

//Get All Orders for Warehouse View
const getAllOrdersforWarehouse = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin', 'Warehouse']);

        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        const [orders] = await pool.query(`
            SELECT 
                O.order_date,
                I.invoice_id,
                I.invoice_date,
                I.total_amount as invoice_total,
                I.status AS invoice_status,
                C.name AS customer_name,
                C.township,
                C.region,
                C.address,
                C.contact_number1 AS phone,
                D.driver_name,
                D.driver_id,
                OI.order_id,
                P.name AS product_name,
                OI.quantity,
                OI.unit_price_at_time AS unit_price,
                OI.status AS order_item_status
            FROM Orders O
            LEFT JOIN Invoices I ON O.order_id = I.order_id
            JOIN Customers C ON O.customer_id = C.customer_id
            JOIN OrderItems OI ON O.order_id = OI.order_id
            JOIN products P ON OI.product_id = P.product_id
            LEFT JOIN Deliveries DL ON O.delivery_id = DL.delivery_id
            LEFT JOIN Drivers D ON DL.driver_id = D.driver_id
            WHERE O.status = 'pending' AND I.invoice_id IS NOT NULL
            ORDER BY O.order_date DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database query failed" });
        }
    }
};

// Get Specifc order for sale details
const getOrder = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin','Warehouse', 'Sale']);

        // Fetch order details
        const [orderResults] = await pool.query(`
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
        `, [req.params.id]);

        if (orderResults.length === 0) return res.status(404).json({ error: "Order not found" });

        const order = orderResults[0];

        // Fetch order items separately
        const [orderItems] = await pool.query(`
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
        `, [req.params.id]);

        // Add type to order items
        const orderItemsWithType = orderItems.map(item => ({
            ...item,
            type: 'OrderItem'
        }));

        // Combine order items and returns (excluding returns)
        const combinedResults = [...orderItemsWithType];

        res.json({ order, details: combinedResults });

    } catch (error) {
        console.error("Error fetching order:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database query failed" });
        }
    }
};


// Update order status by order_id for warehouse
const updateOrder = async (req, res) => {

    checkPrivilege(req, res, ['Admin', 'Warehouse']);

    try {
        const { status } = req.body;
        const [result] = await pool.query(
            "UPDATE Orders SET status=? WHERE order_id=?",
            [status, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Order not found" });
        res.json({ message: "Order updated" });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ error: "Database update failed" });
    }
};

// Delete order
const deleteOrder = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin', 'Warehouse', 'Sale']);

        const [result] = await pool.query("DELETE FROM Orders WHERE order_id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Order not found" });
        res.json({ message: "Order deleted" });
    } catch (error) {
        console.error("Error deleting order:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database delete failed" });
        }
    }
};


// // Add products to order
// const addProductToOrder = async (req, res) => {
//     console.log("went into order controller");
//     let { customer_id, order_date, total_amount, products } = req.body;

//     if (!order_date) {
//         order_date = new Date();
//     }

//     if (!Array.isArray(products) || products.length === 0) {
//         return res.status(400).json({ error: "Products array is required" });
//     }

//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();

//         const [orderResult] = await connection.query(
//             "INSERT INTO Orders (customer_id, order_date, total_amount) VALUES (?, ?, ?)",
//             [customer_id, order_date, total_amount]
//         );

//         const orderId = orderResult.insertId;

//         for (const product of products) {
//             const { product_id, quantity } = product;

//             // Get the price and stock of the product from the Products table
//             const [productResult] = await connection.query(
//                 "SELECT price, stock_quantity FROM products WHERE product_id = ?",
//                 [product_id]
//             );

//             if (productResult.length === 0) {
//                 await connection.rollback();
//                 return res.status(404).json({ error: `Product with id ${product_id} not found` });
//             }

//             const { price: unit_price_at_time, stock_quantity } = productResult[0];

//             if (stock_quantity < quantity) {
//                 await connection.rollback();
//                 return res.status(400).json({ error: `Insufficient stock_quantity for product with id ${product_id}` });
//             }

//             await connection.query(
//                 "INSERT INTO OrderItems (order_id, product_id, quantity, unit_price_at_time) VALUES (?, ?, ?, ?)",
//                 [orderId, product_id, quantity, unit_price_at_time]
//             );

//             // Reduce the ordered quantity from the stock
//             await connection.query(
//                 "UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?",
//                 [quantity, product_id]
//             );
//         }

//         await connection.commit();
//         res.json({ message: "Order and products added", order_id: orderId });
//     } catch (error) {
//         await connection.rollback();
//         console.error("Error adding products to order:", error);
//         res.status(500).json({ error: "Database transaction failed" });
//     } finally {
//         connection.release();
//     }
// };

// Add products to order and order_items
const addProductToOrder = async (req, res) => {

    checkPrivilege(req, res, ['Admin', 'Sale']);

    console.log("went into order controller");
    let { customer_id, order_date, products } = req.body;

    if (!order_date) {
        order_date = new Date();
    }

    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: "Products array is required" });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Calculate total_amount
        let total_amount = 0;

        for (const product of products) {
            const { product_id, quantity } = product;

            // Get the price and stock of the product from the Products table
            const [productResult] = await connection.query(
                "SELECT price, stock_quantity FROM products WHERE product_id = ?",
                [product_id]
            );

            if (productResult.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: `Product with id ${product_id} not found` });
            }

            const { price: unit_price_at_time, stock_quantity } = productResult[0];

            if (stock_quantity < quantity) {
                await connection.rollback();
                return res.status(400).json({ error: `Insufficient stock_quantity for product with id ${product_id}` });
            }

            total_amount += unit_price_at_time * quantity;
        }

        const [orderResult] = await connection.query(
            "INSERT INTO Orders (customer_id, order_date, total_amount) VALUES (?, ?, ?)",
            [customer_id, order_date, total_amount]
        );

        const orderId = orderResult.insertId;

        for (const product of products) {
            const { product_id, quantity } = product;

            const [productResult] = await connection.query(
                "SELECT price FROM products WHERE product_id = ?",
                [product_id]
            );

            const unit_price_at_time = productResult[0].price;

            await connection.query(
                "INSERT INTO OrderItems (order_id, product_id, quantity, unit_price_at_time) VALUES (?, ?, ?, ?)",
                [orderId, product_id, quantity, unit_price_at_time]
            );

            // Reduce the ordered quantity from the stock
            await connection.query(
                "UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?",
                [quantity, product_id]
            );
        }

        await connection.commit();
        res.json({ message: "Order and products added", order_id: orderId });
    } catch (error) {
        await connection.rollback();
        console.error("Error adding products to order:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database transaction failed" });
        }
    } finally {
        connection.release();
    }
};

// all years's breakup
const getYearlyBreakup = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin', 'Warehouse', 'Sale']);

        const currentYear = new Date().getFullYear();
        const [yearlyBreakup] = await pool.query(`
            SELECT 
                YEAR(order_date) AS year,
                COUNT(*) AS total_orders,
                SUM(total_amount) AS total_amount
            FROM Orders
            WHERE YEAR(order_date) BETWEEN ? AND ?
            GROUP BY YEAR(order_date)
            ORDER BY YEAR(order_date) DESC
        `, [currentYear - 5, currentYear]);

        res.json(yearlyBreakup);
    } catch (error) {
        console.error("Error fetching yearly breakup data:", error);
        res.status(500).json({ error: "Database query failed" });
    }
};

//current year's breakup
const getCurrentYearBreakup = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin', 'Warehouse', 'Sale']);

        const [yearlyBreakup] = await pool.query(`
            SELECT 
                YEAR(order_date) AS year,
                COUNT(*) AS total_orders,
                SUM(total_amount) AS total_amount
            FROM Orders
            WHERE YEAR(order_date) = YEAR(CURDATE())
            GROUP BY YEAR(order_date)
            ORDER BY YEAR(order_date) DESC
        `);

        res.json(yearlyBreakup);
    } catch (error) {
        console.error("Error fetching yearly breakup data:", error);
        res.status(500).json({ error: "Database query failed" });
    }
};

//monthly earnings
const getMonthlyEarnings = async (req, res) => {
    checkPrivilege(req, res, ['Admin', 'Warehouse', 'Sale']);

    const { year } = req.params;
    try {
        const [monthlyEarnings] = await pool.query(`
            SELECT 
                YEAR(order_date) AS year,
                MONTH(order_date) AS month,
                COUNT(*) AS total_orders,
                SUM(total_amount) AS total_amount
            FROM Orders
            WHERE YEAR(order_date) = ?
            GROUP BY YEAR(order_date), MONTH(order_date)
            ORDER BY YEAR(order_date) DESC, MONTH(order_date) DESC
        `, [year]);

        //use this for calculating monthly earnings with invoices
            // SELECT 
            //     YEAR(i.invoice_date) AS year,
            //     MONTH(i.invoice_date) AS month,
            //     COUNT(*) AS total_orders,
            //     SUM(i.total_amount) AS total_amount
            // FROM Orders o
            // JOIN Invoices i ON o.order_id = i.order_id
            // WHERE YEAR(i.invoice_date) = 2025 AND i.status = 'paid'
            // GROUP BY YEAR(i.invoice_date), MONTH(i.invoice_date)
            // ORDER BY YEAR(i.invoice_date) DESC, MONTH(i.invoice_date) DESC;

        res.json(monthlyEarnings);
    } catch (error) {
        console.error("Error fetching monthly earnings data:", error);
        res.status(500).json({ error: "Database query failed" });
    }
};



// View pending orders with pagination
const viewPendingOrders = async (req, res) => {
    try {
        checkPrivilege(req, res, ['Admin', 'Warehouse', 'Sale']);

        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        const [pendingOrders] = await pool.query(`
            SELECT 
            Orders.order_id,
            Orders.customer_id,
            Orders.order_date,
            Orders.status AS order_status,
            Orders.total_amount,
            OrderItems.product_id,
            OrderItems.quantity,
            OrderItems.unit_price_at_time,
            OrderItems.status AS item_status
            FROM Orders
            JOIN OrderItems ON Orders.order_id = OrderItems.order_id
            WHERE Orders.status = 'pending'
            GROUP BY Orders.customer_id, Orders.order_date, Orders.status, Orders.total_amount, OrderItems.product_id, OrderItems.quantity, OrderItems.unit_price_at_time, OrderItems.status
            ORDER BY Orders.order_date DESC;
        `, [limit, offset]);

        res.json(pendingOrders);
    } catch (error) {
        console.error("Error fetching pending orders:", error);
        res.status(500).json({ error: "Database query failed" });
    }
};


module.exports = {
    getOrder,
    updateOrder,
    deleteOrder,
    addProductToOrder,
    getYearlyBreakup,
    getMonthlyEarnings,
    getCurrentYearBreakup,
    getAllOrdersforSale,
    getAllOrdersforWarehouse,
    viewPendingOrders
};