const sampleRoutes = (req, res) => {
  res.json({
    message: "MyanTech ERP API By --TEAM PIXELS-- is running!",
    endpoints: [
      {
        category: "Authentication",
        routes: [
          { method: "POST", path: "/auth/login", description: "Login a user" },
          { method: "POST", path: "/auth/logout", description: "Logout a user" }
        ]
      },
      {
        category: "Users",
        routes: [
          { method: "GET", path: "/api/users", description: "Get all users with pagination" },
          { method: "GET", path: "/api/users/searchUser", description: "Get a user by name" },
          { method: "POST", path: "/api/users", description: "Create a new user" },
          { method: "PUT", path: "/api/users/:id", description: "Update a user by ID" }
        ]
      },
      {
        category: "Customers",
        routes: [
          { method: "GET", path: "/api/customers", description: "Get all customers with pagination" },
          { method: "GET", path: "/api/customers/search", description: "Get a customer by name" },
          { method: "POST", path: "/api/customers", description: "Create a new customer" },
          { method: "PUT", path: "/api/customers", description: "Update a customer" },
          { method: "DELETE", path: "/api/customers", description: "Delete a customer" }
        ]
      },
      {
        category: "Products",
        routes: [
          { method: "GET", path: "/api/products", description: "Get all products with pagination" },
          { method: "GET", path: "/api/products/search", description: "Search products" },
          { method: "GET", path: "/api/products/brand-names", description: "Get all brand names" },
          { method: "GET", path: "/api/products/:id", description: "Get a product by ID" },
          { method: "POST", path: "/api/products", description: "Add a new product" },
          { method: "PUT", path: "/api/products/:id", description: "Update a product by ID" },
          { method: "DELETE", path: "/api/products/:id", description: "Delete a product by ID" }
        ]
      },
      {
        category: "Orders",
        routes: [
          { method: "GET", path: "/api/orders/yearly-breakup", description: "Get yearly breakup of orders" },
          { method: "GET", path: "/api/orders/current-year-breakup", description: "Get current year's breakup of orders" },
          { method: "GET", path: "/api/orders/monthly-earnings/:year", description: "Get monthly earnings for a specific year" },
          { method: "GET", path: "/api/orders/warehouse", description: "Get all orders for warehouse with pagination" },
          { method: "GET", path: "/api/orders/sale", description: "Get all orders for sale with pagination" },
          { method: "GET", path: "/api/orders/pendings", description: "View pending orders with pagination" },
          { method: "GET", path: "/api/orders/:id", description: "Get an order by ID" },
          { method: "PUT", path: "/api/orders/:id", description: "Update an order by ID" },
          { method: "DELETE", path: "/api/orders/:id", description: "Delete an order by ID" },
          { method: "POST", path: "/api/orders", description: "Add products to an order" }
        ]
      },
      {
        category: "Deliveries",
        routes: [
          { method: "GET", path: "/api/deliveries", description: "Get all deliveries with pagination" },
          { method: "GET", path: "/api/deliveries/:id", description: "Get a delivery by ID" },
          { method: "POST", path: "/api/deliveries", description: "Create a new delivery" },
          { method: "PUT", path: "/api/deliveries/:id", description: "Update a delivery by ID" },
          { method: "PUT", path: "/api/deliveries/update/:delivery_id", description: "Update delivery status" },
          { method: "DELETE", path: "/api/deliveries/:id", description: "Delete a delivery by ID" },
          { method: "GET", path: "/api/deliveries/delivery-count", description: "Get delivery count" }
        ]
      },
      {
        category: "Returns",
        routes: [
          { method: "GET", path: "/api/returns", description: "Get all returns with pagination" },
          { method: "GET", path: "/api/returns/joined", description: "Get all returns with joined tables" },
          { method: "POST", path: "/api/returns", description: "Create a new return" },
          { method: "PUT", path: "/api/returns/assign-service-center", description: "Assign a service center to a return" },
          { method: "PUT", path: "/api/returns/assign-transportation", description: "Assign transportation to a return" },
          { method: "PUT", path: "/api/returns/free-driver-and-update-status", description: "Free driver and update return status" },
          { method: "PUT", path: "/api/returns/resolve", description: "Resolve a return" }
        ]
      },
      {
        category: "Drivers",
        routes: [
          { method: "GET", path: "/api/drivers", description: "Get all drivers with pagination" },
          { method: "GET", path: "/api/drivers/available", description: "Get available drivers" },
          { method: "GET", path: "/api/drivers/search", description: "Get a driver by name" },
          { method: "POST", path: "/api/drivers", description: "Create a new driver" },
          { method: "PUT", path: "/api/drivers", description: "Update a driver" },
          { method: "DELETE", path: "/api/drivers", description: "Delete a driver" },
          { method: "GET", path: "/api/drivers/available-tanglement", description: "Get available drivers based on delivery status" }
        ]
      },
      {
        category: "Trucks",
        routes: [
          { method: "GET", path: "/api/trucks", description: "Get available trucks" },
          { method: "GET", path: "/api/trucks/all", description: "Get all trucks with pagination" },
          { method: "GET", path: "/api/trucks/search", description: "Get a truck by license plate" },
          { method: "POST", path: "/api/trucks", description: "Create a new truck" },
          { method: "PUT", path: "/api/trucks", description: "Update a truck" },
          { method: "DELETE", path: "/api/trucks", description: "Delete a truck" }
        ]
      },
      {
        category: "Invoices",
        routes: [
          { method: "GET", path: "/api/invoices", description: "Get all invoices" },
          { method: "POST", path: "/api/invoices/:order_id", description: "Create a new invoice" },
          { method: "PUT", path: "/api/invoices/status", description: "Change invoice status" }
        ]
      },
      {
        category: "Service Centers",
        routes: [
          { method: "GET", path: "/api/serviceCenter", description: "Get all service centers with pagination" }
        ]
      },
      {
        category: "Reports",
        routes: [
          { method: "GET", path: "/api/report/profitproduct", description: "Get most profitable products" },
          { method: "GET", path: "/api/report/slowproduct", description: "Get slow-moving products" },
          { method: "GET", path: "/api/report/getThisMonthSaleReport", description: "Get sales for the current month" },
          { method: "GET", path: "/api/report/stats", description: "Show statistics" }
        ]
      },
      {
        category: "Tactical Nuke",
        routes: [
          { method: "DELETE", path: "/tacticalNuke/tactical/Nuke/incomming/doNotUseCarelessly", description: "Delete all data and reset statuses" }
        ]
      },
      {
        category: "Sample",
        routes: [
          { method: "GET", path: "/", description: "Sample route showing available endpoints" }
        ]
      }
    ]
  });
}

module.exports = sampleRoutes;