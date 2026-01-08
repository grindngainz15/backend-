const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    logo: {
      type: String, // Cloudinary / S3 URL
      default: null
    },
    website: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    seo: {
      metaTitle: {
        type: String,
        maxlength: 70
      },
      metaDescription: {
        type: String,
        maxlength: 160
      }
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

/* Prevent duplicate active brands */
brandSchema.index(
  { name: 1, isDeleted: 1 },
  { unique: true }
);

module.exports = mongoose.model("Brand", brandSchema);
