const express = require("express");
const router = express.Router();
const auth  = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const {
  createUser,
  loginUser,
  updateUser,
  deleteUser,
  restoreUser,
  getUsers,
  getDeletedUsers,
  forgotPassword,
  resetPassword
} = require("../controllers/userController");
const {cartController} = require("../controllers/cartController");
const {getOrUpdateProfile} = require("../controllers/profileController")

// Public login
router.post("/login", loginUser);
router.post("/forget-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Only admin can create/update/delete/restore users
router.post("/create",  createUser);
router.post("/update", auth, roleCheck(["admin"]), updateUser);
router.post("/delete", auth, roleCheck(["admin"]), deleteUser);
router.post("/restore", auth, roleCheck(["admin"]), restoreUser);

// List users - admin + authenticated roles
router.post("/list", auth, roleCheck(["admin","customer"]), getUsers);
router.post("/list/delete", auth, roleCheck(["admin","customer","supplier","manufacturer","transporter"]), getDeletedUsers);

// Get or Update Profile - authenticated users
router.post("/profile", auth, getOrUpdateProfile);

// Cart 
router.post("/cart", auth, roleCheck(["customer", "admin"]), cartController);

module.exports = router;