const User = require("../models/User");
const Product = require("../models/Product");
const WishList = require("../models/WishList");
const { successResponse, errorResponse } = require("../utils/response");
const { default: mongoose } = require("mongoose");

const addWishList = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(errorResponse("User not found"));
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json(errorResponse("Product not found"));
    }
    if (user.Wishlist.includes(productId)) {
      return res.status(400).json(errorResponse("Product already in wishlist"));
    }
    user.Wishlist.push(productId);
    await user.save();

    return res.status(201).json(
      successResponse("Product added to wishlist", {
        Wishlist: user.Wishlist
      })
    );

  } catch (error) {
    console.error(error);
    return res.status(500).json(errorResponse("Server error", error.message));
  }
};

const getWishList = async (req, res) => {
  try {
    const userId = req.user.id;

    let { page = 1, limit = 10 } = req.query;
    page = Number(page);
    limit = Number(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const user = await User.findById(userId)
      .populate("Wishlist");

    if (!user) {
      return res.status(404).json(errorResponse("User not found"));
    }

    const totalItems = user.Wishlist.length;

    const start = (page - 1) * limit;
    const end = start + limit;

    const paginatedWishlist = user.Wishlist.slice(start, end);

    return res.json(
      successResponse(
        "Fetched user wishlist successfully",
        paginatedWishlist,
        {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit)
        }
      )
    );

  } catch (error) {
    console.error(error);
    return res.status(500).json(errorResponse("Server error", error.message));
  }
};


const updateWishList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json(errorResponse("productId is required"));
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json(errorResponse("Invalid productId"));
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(errorResponse("User not found"));
    }

    const index = user.Wishlist.findIndex(
      (id) => id.toString() === productId
    );

    if (index === -1) {
      return res.status(404).json(errorResponse("Product not found in wishlist"));
    }

    user.Wishlist.splice(index, 1);

    await user.save();

    return res.json(
      successResponse("Product removed from wishlist", {
        Wishlist: user.Wishlist,
      })
    );

  } catch (error) {
    console.error(error);
    return res.status(500).json(errorResponse("Server error", error.message));
  }
};


const deleteWishList = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(errorResponse("User not found"));
    }

    user.Wishlist = [];

    await user.save();

    return res.json(
      successResponse("Wishlist cleared successfully", {
        Wishlist: user.Wishlist
      })
    );

  } catch (error) {
    console.error(error);
    return res.status(500).json(errorResponse("Server error", error.message));
  }
};

module.exports = {
  addWishList,
  updateWishList,
  deleteWishList,
  getWishList
};