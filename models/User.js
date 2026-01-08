const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Allowed roles in supply chain
const roles = ["admin", "customer", "seller"];

const userSchema = new mongoose.Schema({
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

  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^[6-9]\d{9}$/, "Please enter a valid mobile number"]
  },

  password: {
    type: String,
    required: true,
    minlength: 6
  },

  role: {
    type: String,
    enum: roles,
    default: "customer",
    required: true
  },

  resetOtp: String,
  resetOtpExpire: Date,

  isActive: {
    type: Boolean,
    default: true
  },

  Wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ],

  cart: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart"
    }
  ],

  deletedAt: {
    type: Date,
    default: null
  },

  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }

}, { timestamps: true });


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);