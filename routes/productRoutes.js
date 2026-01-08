const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const { uploadProductImages } = require("../middleware/upload");

const {
    createProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    getDeletedProducts,
    restoreProduct,
    getProductById
} = require("../controllers/productController");

router.post(
  "/create",
  auth,
  roleCheck(["admin", "seller"]),
  uploadProductImages.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 2 },
  ]),
  createProduct
);
router.post("/update", auth, roleCheck(["admin","seller"]), updateProduct);
router.post("/delete", auth, roleCheck(["admin"]), deleteProduct);
router.post("/restore", auth, roleCheck(["admin"]), restoreProduct);
router.post("/list",  getProducts);
router.post("/list/deleted", auth, roleCheck(["admin"]), getDeletedProducts);
router.get("/:id", auth, roleCheck(["admin", "customer"]), getProductById);


module.exports = router;
