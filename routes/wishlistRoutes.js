const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const { getWishList, addWishList, updateWishList, deleteWishList } = require("../controllers/wishlistController");

router.post("/create", auth, roleCheck(["admin"]), addWishList);
router.post("/update", auth, roleCheck(["admin"]), updateWishList);
router.post("/delete", auth, roleCheck(["admin"]), deleteWishList);
router.post("/list", auth, roleCheck(["admin", "customer"]), getWishList);
//router.post("/restore", auth, roleCheck(["admin"]), restoreCategory);
//router.post("/list/delete", auth, roleCheck(["admin"]), getDeletedCategories);
//router.post("/:id", auth, roleCheck(["admin","customer"]), getCategoryById);

module.exports = router;