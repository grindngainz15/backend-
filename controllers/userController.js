const mongoose = require("mongoose");
const User = require("../models/User");
const Profile = require("../models/Profile");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");
const { successResponse, errorResponse } = require("../utils/response");

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const createUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, password, mobile } = req.body;

   
    const role = "customer";

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(errorResponse("User already exists"));
    }

    const [user] = await User.create(
      [{ name, email, password, role, mobile }],
      { session }
    );

    await Profile.create(
      [{
        user: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: "",
        phone: user.mobile,
        gender: null,
        dateOfBirth: null,
        addresses: [],
        wishlist: [],
        bio: "",
        kycVerified: false
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.json(
      successResponse("User created successfully", {
        user,
        token: generateToken(user)
      })
    );

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Create User Error:", err);
    return res.status(500).json(errorResponse("Server Error", err.message));
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json(errorResponse("User not found"));
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json(errorResponse("Invalid credentials"));
    }

    return res.json(
      successResponse("Login successful", {
        token: generateToken(user),
        user
      })
    );
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

const updateUser = async (req, res) => {
  try {
    const { id, update } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(errorResponse("User not found"));
    }

    const allowedFields = ["name", "email"];
    allowedFields.forEach((field) => {
      if (update[field] !== undefined) {
        user[field] = update[field];
      }
    });

    await user.save();
    return res.json(successResponse("User updated successfully"));

  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(errorResponse("User not found"));
    }

    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();

    return res.json(
      successResponse(`User soft deleted: ${user.name}`)
    );
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

const restoreUser = async (req, res) => {
  try {
    const { id } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(errorResponse("User not found"));
    }

    user.isActive = true;
    user.deletedAt = null;
    await user.save();

    return res.json(successResponse("User restored successfully"));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

const getUsers = async (req, res) => {
  try {
    let { page = 1, size = 10 } = req.body;
    page = Number(page);
    size = Number(size);

    const users = await User.find({ isActive: true })
      .skip((page - 1) * size)
      .limit(size);

    const total = await User.countDocuments({ isActive: true });

    return res.json(
      successResponse("Fetched successfully", users, {
        page,
        size,
        total
      })
    );
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

const getDeletedUsers = async (req, res) => {
  try {
    let { page = 1, size = 10 } = req.body;
    page = Number(page);
    size = Number(size);

    const users = await User.find({ isActive: false })
      .skip((page - 1) * size)
      .limit(size);

    const total = await User.countDocuments({ isActive: false });

    return res.json(
      successResponse("Fetched deleted users", {
        users,
        page,
        size,
        total
      })
    );
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: true }); // security best practice
    }

    const otp = generateOtp();

    user.resetOtp = otp;
    user.resetOtpExpire = Date.now() + 5 * 60 * 1000; // 5 min
    await user.save();

    await sendEmail({
      to: email,
      subject: "Password Reset OTP",
      html: `
  <div style="
    max-width: 480px;
    margin: 0 auto;
    font-family: Arial, Helvetica, sans-serif;
    background-color: #f4f6f8;
    padding: 24px;
  ">
    <div style="
      background-color: #ffffff;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    ">
      <h2 style="
        margin-bottom: 16px;
        color: #333333;
      ">
        Password Reset Request
      </h2>

      <p style="
        color: #555555;
        font-size: 14px;
        margin-bottom: 24px;
      ">
        Use the OTP below to reset your password.
        This OTP is valid for <strong>5 minutes</strong>.
      </p>

      <div style="
        background-color: #f1f5ff;
        color: #1a3cff;
        font-size: 28px;
        letter-spacing: 6px;
        padding: 14px 0;
        border-radius: 6px;
        font-weight: bold;
        margin-bottom: 24px;
      ">
        ${otp}
      </div>

      <p style="
        color: #777777;
        font-size: 12px;
        margin-bottom: 16px;
      ">
        If you did not request a password reset, please ignore this email.
      </p>

      <hr style="
        border: none;
        border-top: 1px solid #eeeeee;
        margin: 20px 0;
      " />

      <p style="
        color: #999999;
        font-size: 11px;
      ">
        © ${new Date().getFullYear()} Ecom App. All rights reserved.
      </p>
    </div>
  </div>`
    });

    res.json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};


const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({
    email,
    resetOtp: otp,
    resetOtpExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  user.password = newPassword;
  user.resetOtp = undefined;
  user.resetOtpExpire = undefined;

  await user.save();

  res.json({
    success: true,
    message: "Password reset successful",
  });
};


module.exports = {
  createUser,
  loginUser,
  updateUser,
  deleteUser,
  restoreUser,
  getUsers,
  getDeletedUsers,
  forgotPassword,
  resetPassword
};
