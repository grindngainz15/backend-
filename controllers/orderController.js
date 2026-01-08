const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/cartModal");
const ProductDetail = require("../models/ProductDetail");

/**
 * CREATE ORDER (Checkout)
 * POST /orders/create
 */
const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
  
    const { shippingAddress, payment } = req.body;
    console.log("Order body",req.body);
    console.log("User ID",userId);
    // 1. Fetch user's cart
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 2. Build order items snapshot
    const orderItems = cart.items.map((item) => {
      const price = item.product.discountPrice || item.product.price;

      return {
        product: item.product._id,
        productDetail: item.product.productDetail,
        title: item.product.title,
        thumbnail: item.product.thumbnail,
        price,
        quantity: item.quantity,
        subtotal: price * item.quantity,
      };
    });

    // 3. Pricing calculation
    const itemsTotal = orderItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
// pricing
    const shippingFee = 50;
    const tax = Number((itemsTotal * 0.18).toFixed(2));
    const grandTotal = itemsTotal + shippingFee + tax;

    // 4. Create order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      payment,
      pricing: {
        itemsTotal,
        shippingFee,
        tax,
        discount: 0,
        grandTotal,
      },
    });

    // 5. Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET MY ORDERS
 * POST /orders/my
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET SINGLE ORDER
 * GET /orders/:id
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Owner or admin only
    if (
      order.user._id.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * MARK ORDER AS PAID
 * POST /orders/:id/pay
 */
const markOrderPaid = async (req, res) => {
  try {
    const { transactionId } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.isPaid = true;
    order.payment.status = "SUCCESS";
    order.payment.transactionId = transactionId;
    order.payment.paidAt = Date.now();

    await order.save();

    res.json({
      success: true,
      message: "Payment recorded successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * UPDATE ORDER STATUS (Admin)
 * POST /orders/:id/status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.orderStatus = status;

    if (status === "DELIVERED") {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    await order.save();

    res.json({
      success: true,
      message: "Order status updated",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * CANCEL ORDER (User)
 * POST /orders/:id/cancel
 */
const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.orderStatus !== "PLACED") {
      return res.status(400).json({
        message: "Order cannot be cancelled at this stage",
      });
    }

    order.orderStatus = "CANCELLED";
    order.cancelledAt = Date.now();
    order.cancellationReason = reason;

    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * REQUEST RETURN
 * POST /orders/:id/return
 */
const requestReturn = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.orderStatus !== "DELIVERED") {
      return res.status(400).json({
        message: "Return not allowed for this order",
      });
    }

    order.orderStatus = "RETURN_REQUESTED";

    await order.save();

    res.json({
      success: true,
      message: "Return request submitted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  markOrderPaid,
  updateOrderStatus,
  cancelOrder,
  requestReturn,
};
