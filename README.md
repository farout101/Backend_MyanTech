# MyanTech ERP API

This document provides instructions on how to set up the development environment for the MyanTech ERP API.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (version 14.x or later)
- [MySQL](https://www.mysql.com/) (version 5.7 or later)

## Installation

1. **Clone the repository**:
    ```sh
    git clone https://github.com/your-repo/api.git
    cd api
    ```

2. **Install dependencies**:
    ```sh
    npm install
    ```

3. **Set up the MySQL database**:
    - Create a new MySQL database.
    - Update the database connection details in [db.js](http://_vscodecontentref_/1):
      ```js
      require('dotenv').config();
      const mysql = require('mysql2/promise');

      const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      module.exports = pool;
      ```

4. **Create a [.env](http://_vscodecontentref_/2) file** in the root directory and add your database credentials:
    ```env
    DB_HOST=localhost
    DB_USER=your-username
    DB_PASS=your-password
    DB_NAME=your-database
    JWT_SECRET=your-jwt-secret
    PORT=4000
    ```

5. **Run database migrations**:
    - If you have any migration scripts, run them to set up the database schema.

6. **Seed the database**:
    - Run the seed script to populate the database with initial data:
      ```sh
      npm run seed
      ```

## Development

To start the development server, run:
```sh
npm run dev
```

## API Endpoints

### Authentication
- **POST /auth/login**: Login a user

### Users
- **GET /api/users**: Get all users with pagination
- **GET /api/users/searchUser**: Get a user by name
- **POST /api/users**: Create a new user
- **PUT /api/users/:id**: Update a user by ID

### Customers
- **GET /api/customers**: Get all customers with pagination
- **GET /api/customers/search**: Get a customer by name
- **POST /api/customers**: Create a new customer
- **PUT /api/customers**: Update a customer
- **DELETE /api/customers**: Delete a customer

### Products
- **GET /api/products**: Get all products with pagination
- **GET /api/products/search**: Search products
- **GET /api/products/brand-names**: Get all brand names
- **GET /api/products/:id**: Get a product by ID
- **POST /api/products**: Add a new product
- **PUT /api/products/:id**: Update a product by ID
- **DELETE /api/products/:id**: Delete a product by ID

### Orders
- **GET /api/orders/yearly-breakup**: Get yearly breakup of orders
- **GET /api/orders/current-year-breakup**: Get current year's breakup of orders
- **GET /api/orders/monthly-earnings/:year**: Get monthly earnings for a specific year
- **GET /api/orders/warehouse**: Get all orders for warehouse with pagination
- **GET /api/orders/sale**: Get all orders for sale with pagination
- **GET /api/orders/pendings**: View pending orders with pagination
- **GET /api/orders/:id**: Get an order by ID
- **PUT /api/orders/:id**: Update an order by ID
- **DELETE /api/orders/:id**: Delete an order by ID
- **POST /api/orders**: Add products to an order

### Deliveries
- **GET /api/deliveries**: Get all deliveries with pagination
- **GET /api/deliveries/:id**: Get a delivery by ID
- **POST /api/deliveries**: Create a new delivery
- **PUT /api/deliveries/:id**: Update a delivery by ID
- **PUT /api/deliveries/update/:id**: Update delivery status
- **DELETE /api/deliveries/:id**: Delete a delivery by ID

## Testing

To run tests, use:
```sh
npm test
```

## Linting

To lint the code, use:
```sh
npm run lint
```
