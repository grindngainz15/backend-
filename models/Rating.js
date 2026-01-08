// models/Rating.js
const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    title: {
      type: String,
      trim: true,
    },

    review: {
      type: String,
      trim: true,
    },

    images: [
      {
        type: String, // optional review images
      },
    ],

    helpfulVotes: {
      type: Number,
      default: 0,
    },

    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deleteAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Ensure one review per user per product
ratingSchema.index({ productId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
