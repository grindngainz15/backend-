const express = require("express");
const router = express.Router();
const auth  = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const { uploadCategoryImage } = require("../middleware/upload");

const {
    createCategory,
    updateCategory,
    deleteCategory,
    getCategories,
    getDeletedCategories,
    restoreCategory,
    getCategoryById,
    getCategoriesWithSubcategories
} = require("../controllers/categoryController");

// Category Routes
router.post(
  "/create",
  auth,
  roleCheck(["admin"]),
  uploadCategoryImage.single("image"),   
  createCategory
);
router.post("/update", auth, roleCheck(["admin"]), updateCategory);
router.post("/delete", auth, roleCheck(["admin"]), deleteCategory);
router.post("/restore", auth, roleCheck(["admin"]), restoreCategory);
router.post("/list",  getCategories);
router.post("/list/delete", auth, roleCheck(["admin"]), getDeletedCategories);
router.get("/with-subcategories", getCategoriesWithSubcategories);
router.get("/:id", auth, roleCheck(["admin","customer","seller"]), getCategoryById);

module.exports = router;