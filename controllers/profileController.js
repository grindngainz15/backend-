const Profile = require("../models/Profile");
const { successResponse, errorResponse } = require("../utils/response");

const getOrUpdateProfile = async (req, res) => {
  try {
    const { userId, ...updateData } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json(errorResponse("userId is required"));
    }

    // 1️⃣ Fetch profile only
    if (Object.keys(updateData).length === 0) {
      const profile = await Profile
        .findOne({ user: userId })
        .populate("wishlist")
        .populate("orders");

      if (!profile) {
        return res
          .status(404)
          .json(errorResponse("Profile not found"));
      }

      return res
        .status(200)
        .json(successResponse("Profile fetched successfully", profile));
    }

    // 2️⃣ Update profile
    const updatedProfile = await Profile.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res
        .status(404)
        .json(errorResponse("Profile not found"));
    }

    return res
      .status(200)
      .json(successResponse("Profile updated successfully", updatedProfile));

  } catch (error) {
    console.error("Profile Error:", error);
    return res
      .status(500)
      .json(errorResponse("Server error", error.message));
  }
};

module.exports = { getOrUpdateProfile };
