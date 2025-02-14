require('dotenv').config();
const express = require('express');
const pool = require('../config/db');
const mysql = require('mysql2/promise');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { loginLimiter, defaultLimiter } = require('./middlewares/LimitterMiddleware');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(cors());

app.use(defaultLimiter);

const productRoutes = require("./routes/products");
const AuthMiddleware = require('./middlewares/AuthMiddleware');
const authRoutes = require('./routes/auth');

app.use("/auth", loginLimiter, authRoutes);

const userRoutes = require('./routes/user');
const customerRoutes = require('./routes/customers');
const deliveryRoutes = require('./routes/deliveries');
const orderRoutes = require('./routes/orders');
const returnRoutes = require('./routes/return');

const truckRoutes = require('./routes/trucks');
const driverRoutes = require('./routes/drivers');
const invoiceRoutes = require('./routes/invoice');
const serviceCenterRoutes = require('./routes/serviceCenter');
const reportRoutes = require('./routes/reports')
const tacticalNuke = require('./routes/tacticalNuke');
const sampleRoutes = require('./sample');

app.use(AuthMiddleware);
app.get("/", sampleRoutes);

app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/trucks", truckRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/serviceCenter", serviceCenterRoutes);
app.use("/api/report", reportRoutes)

//beware not to use carelessly (use wisely)
app.use("/tacticalNuke", tacticalNuke);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});