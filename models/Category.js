// category.model.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,       // SEO-friendly URLs
    },

    description: {
      type: String,
    },

    // For icons/thumbnails on homepage or menus
    image: { type: String },

    // Parent → used for subcategories
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    isFeatured: { type: Boolean, default: false },

 
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    deletedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
