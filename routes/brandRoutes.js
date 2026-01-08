const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const { uploadBrandLogo } = require("../middleware/upload");

const {
    createBrand,
    updateBrand,
    deleteBrand,
    getBrands,
    getDeletedBrands,
    restoreBrand,
    getBrandBySlug
} = require("../controllers/brandController");

/**
 * CREATE BRAND
 */
router.post(
    "/create",
    auth,
    roleCheck(["admin"]),
    uploadBrandLogo.single("logo"),
    createBrand
);

/**
 * UPDATE BRAND (ID FROM BODY)
 */
router.post(
    "/update",
    auth,
    roleCheck(["admin"]),
    uploadBrandLogo.single("logo"),
    updateBrand
);

/**
 * DELETE BRAND (SOFT DELETE)
 */
router.post(
    "/delete",
    auth,
    roleCheck(["admin"]),
    deleteBrand
);

/**
 * RESTORE BRAND
 */
router.post(
    "/restore",
    auth,
    roleCheck(["admin"]),
    restoreBrand
);

/**
 * LIST ACTIVE BRANDS (PAGINATION + SEARCH)
 */
router.post(
    "/list",
    getBrands
);

/**
 * LIST DELETED BRANDS
 */
router.post("/list/deleted",
    auth,
    roleCheck(["admin"]),
    getDeletedBrands
);

/**
 * GET BRAND BY SLUG
 */
router.get("/:slug", getBrandBySlug);

module.exports = router;
