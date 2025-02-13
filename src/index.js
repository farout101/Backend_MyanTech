require('dotenv').config();
const express = require('express');
const pool = require('../config/db');
const mysql = require('mysql2/promise');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "MyanTech ERP API is running!" });
});


const productRoutes = require("./routes/products");
const AuthMiddleware = require('./middlewares/AuthMiddleware');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const customerRoutes = require('./routes/customers');
const deliveryRoutes = require('./routes/deliveries');
const orderRoutes = require('./routes/orders');
const returnRoutes = require('./routes/return');
const { loginLimiter, defaultLimiter } = require('./middlewares/LimitterMiddleware');
const truckRoutes = require('./routes/trucks');
const driverRoutes = require('./routes/drivers');
const invoiceRoutes = require('./routes/invoice');
const tacticalNuke = require('./routes/tacticalNuke');

app.use("/auth", loginLimiter, authRoutes)
// app.use(AuthMiddleware);
//app.use(defaultLimiter)
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/trucks", truckRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/invoices", invoiceRoutes);

//beware not to use carelessly (use wisely)
app.use("/tacticalNuke", tacticalNuke);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});