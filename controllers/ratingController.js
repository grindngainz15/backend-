const User = require("../models/User");
const Product = require("../models/Product");
const Rating = require("../models/Rating");
const { successResponse } = require("../utils/response");

// Create

const createRating = async (req, res) => {
  try {
    const { productId, rating, title, review, images } = req.body;
    const userId = req.user.id;
    const product = await Product.findById(productId);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const existingRating = await Rating.findOne({ productId, userId });
    if (existingRating) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }
    const newRating = await Rating.create({
      productId,
      userId,
      rating,
      title,
      review,
      images,
      verifiedPurchase: true,
    });
    res.status(201).json(successResponse("Rating created successfully", { newRating }));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update
const updateRating = async (req, res) => {
  try {
    const { id, update } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const rating = await Rating.findById(id);
    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }
    if (rating.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized action" });
    }
    Object.keys(update).forEach((key) => {
      rating[key] = update[key];
    });
    await rating.save();
    res.json({ message: "Rating updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Soft Delete
const deleteRating = async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const rating = await Rating.findById(id);
    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }
    if (rating.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized action" });
    }
    rating.isDeleted = true;
    rating.deletedAt = new Date();
    rating.deletedBy = userId;
    await rating.save();
    res.json({ message: "Rating deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get
const getRatings = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.body;
    page = parseInt(page);
    limit = parseInt(limit);
    const ratings = await Rating.find({ isDeleted: false })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Rating.countDocuments({ isDeleted: false });
    res.json(successResponse("Fetched successfully",
      ratings,
      { page, limit, total },
    ));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Route
const deletedList = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.body;
    page = parseInt(page);
    limit = parseInt(limit);
    const ratings = await Rating.find({ isDeleted: true })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Rating.countDocuments({ isDeleted: true });
    res.json(successResponse("Fetched successfully",
      ratings,
      { page, limit, total },
    ));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Restore
const restoreRating = async (req, res) => {
  try {
    const { id } = req.body;
    const rating = await Rating.findById(id);
    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }
    rating.isDeleted = false;
    rating.deletedAt = null;
    rating.deletedBy = null;
    await rating.save();
    res.json({ message: "Rating restored successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createRating,
  updateRating,
  deleteRating,
  getRatings,
  deletedList,
  restoreRating,
};