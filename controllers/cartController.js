const mongoose = require("mongoose");
const Cart = require("../models/cartModal");
const Product = require("../models/Product");
const ProductDetail = require("../models/ProductDetail");
const User = require("../models/User");
const { sucessResponse, errorResponse } = require("../utils/response");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const cartController = async (req, res) => {
  const userId = req.user.userId;
  const { productId, quantity } = req.body;

  if (!userId || !isValidId(userId)) {
    return res.status(400).json({ message: "Valid userId is required" });
  }

  try {
    /* ---------------------------
       USER + CART
    --------------------------- */
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
      user.cart = cart._id;
      await user.save();
    }

    /* ---------------------------
       GET CART ONLY
    --------------------------- */
    if (!productId && quantity === undefined) {
      const populated = await Cart.findById(cart._id)
        .populate({
          path: "items.product",
          populate: [
            {
              path: "detail",
              model: "ProductDetail",
            },
            // {
            //   path: "category",
            //   model: "Category",
            // },
          ],
        });

      let totalPrice = 0;
      populated.items.forEach((item) => {
        const price =
          item.product.discountPrice ?? item.product.price;
        totalPrice += price * item.quantity;
      });

      return res.status(200).json({
        success: true,
        cart: populated,
        totalPrice,
      });
    }

    /* ---------------------------
       ADD / UPDATE ITEM
    --------------------------- */
    if (!isValidId(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const change = parseInt(quantity, 10);
    if (!Number.isInteger(change)) {
      return res.status(400).json({ message: "Quantity must be an integer" });
    }

    // Fetch product + detail
    const product = await Product.findById(productId)
    const productDetail = await ProductDetail.findOne({ productId: productId });
    if (!product || !productDetail) {
      console.log("Product or ProductDetail not found", product);
      console.log("ProductDetail:", productDetail);
      return res.status(404).json({ message: "Product detail not found" });
    }

    const availableStock = productDetail.stock;

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    const currentQty =
      itemIndex > -1 ? cart.items[itemIndex].quantity : 0;

    const newQty = currentQty + change;

    /* ---------------------------
       STOCK VALIDATION
    --------------------------- */
    if (newQty > availableStock) {
      return res.status(400).json({
        message: `Only ${availableStock} items available in stock`,
      });
    }

    if (newQty <= 0) {
      if (itemIndex > -1) {
        cart.items.splice(itemIndex, 1);
      }
    } else {
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = newQty;
      } else {
        cart.items.push({ product: productId, quantity: newQty });
      }
    }

    await cart.save();

    const populated = await Cart.findById(cart._id)
      .populate({
        path: "items.product",
        populate: {
          path: "detail",
          model: "ProductDetail",
        },
      });

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart: populated,
    });

  } catch (error) {
    console.error("Cart Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = { cartController };
