const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  markOrderPaid,
  updateOrderStatus,
  cancelOrder,
  requestReturn,
} = require("../controllers/orderController");

// Create order (checkout)
router.post("/create", auth, roleCheck(["customer", "admin"]), createOrder);

// Get logged-in user's orders
router.post("/my", auth, roleCheck(["customer", "admin"]), getMyOrders);

// Get single order
router.get("/:id", auth, roleCheck(["customer", "admin"]), getOrderById);

// Mark order as paid
router.post("/:id/pay", auth, roleCheck(["customer", "admin"]), markOrderPaid);

// Update order status (Admin only)
router.post("/:id/status", auth, roleCheck(["admin"]), updateOrderStatus);

// Cancel order
router.post("/:id/cancel", auth, roleCheck(["customer", "admin"]), cancelOrder);

// Request return
router.post("/:id/return", auth, roleCheck(["customer", "admin"]), requestReturn);

module.exports = router;
