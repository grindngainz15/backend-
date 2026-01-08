// models/ProductDetail.js
const mongoose = require("mongoose");

const productDetailSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
    },

    description: {
      type: String,
      required: true,
    },

    specifications: {
      type: Object, // simple key-value object
      default: {},
      // Example: { color: "Red", size: "M", material: "Cotton" }
    },

    stock: {
      type: Number,
      default: 0,
    },

    warranty: {
      type: String, // "1 year", "6 months"
    },

    shippingInfo: {
      type: String,
    },

    returnPolicy: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductDetail", productDetailSchema);
