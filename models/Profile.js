const mongoose = require("mongoose");
const roles = ["admin", "customer", "seller"];

const userProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: roles,
      required: true,
    },
    // 📌 Basic Profile Info
    avatar: { type: String },
    phone: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    dateOfBirth: { type: Date },

    // 📌 Address Information (Array)
    addresses: [
      {
        label: { type: String, default: "Home" }, // home, work
        street: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        postalCode: { type: String },
        isDefault: { type: Boolean, default: false }
      }
    ],

    // 📌 Additional Ecommerce-Useful Fields
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      }
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
      }
    ],  
    // cart: [
    //   {
    //     product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    //     quantity: { type: Number, default: 1 }
    //   }
    // ],

    // Tracking & Metadata
    bio: { type: String, default: "" },
    kycVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserProfile", userProfileSchema);
