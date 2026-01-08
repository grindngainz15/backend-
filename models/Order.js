const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productDetail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductDetail",
    },
    title: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["COD", "CARD", "UPI", "NET_BANKING", "WALLET"],
      required: true,
    },
    provider: {
      type: String, // Razorpay / Stripe / PayPal etc.
    },
    transactionId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    paidAt: {
      type: Date,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      validate: [(val) => val.length > 0, "Order must have at least one item"],
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    payment: {
      type: paymentSchema,
      required: true,
    },

    pricing: {
      itemsTotal: { type: Number, required: true },
      shippingFee: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true },
    },

    orderStatus: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "PACKED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "RETURN_REQUESTED",
        "RETURNED",
      ],
      default: "PLACED",
      index: true,
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    isDelivered: {
      type: Boolean,
      default: false,
    },

    deliveredAt: {
      type: Date,
    },

    cancelledAt: {
      type: Date,
    },

    cancellationReason: {
      type: String,
    },

    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
