const Brand = require("../models/Brand");
const User = require("../models/User");
const slugify = require("slugify");
const mongoose = require("mongoose");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * CREATE BRAND
 * POST /brands
 */
const createBrand = async (req, res) => {
  try {
    const { name, description, website, seo } = req.body;
    const createdBy = req.user.userId;
    console.log("Creating brand by user:", createdBy);
    if (!name)
      return res.status(400).json(errorResponse("Brand name is required"));

    const user = await User.findById(createdBy);
    

    const slug = slugify(name, { lower: true, strict: true });

    const exists = await Brand.findOne({ slug, isDeleted: false });
    if (exists) {
      return res
        .status(400)
        .json(errorResponse("Brand already exists"));
    }

    let logoUrl = null;
    if (req.file?.path) {
      logoUrl = req.file.path; // Cloudinary / S3
    }

    const brand = await Brand.create({
      name,
      slug,
      description,
      website,
      logo: logoUrl,
      seo,
      createdBy
    });

    return res.json(
      successResponse("Brand created successfully", brand)
    );
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

/**
 * UPDATE BRAND
 * PUT /brands
 */
const updateBrand = async (req, res) => {
  try {
    const { id, update } = req.body;
    const userId = req.user.userId;

    if (!id)
      return res.status(400).json(errorResponse("Brand ID is required"));

    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json(errorResponse("Unauthorized action"));
    }

    const brand = await Brand.findById(id);
    if (!brand || brand.isDeleted) {
      return res.status(404).json(errorResponse("Brand not found"));
    }

    // Regenerate slug if name updated
    if (update?.name) {
      brand.name = update.name;
      brand.slug = slugify(update.name, { lower: true, strict: true });
    }

    // Update logo if uploaded
    if (req.file?.path) {
      brand.logo = req.file.path;
    }

    // Update remaining fields
    Object.keys(update || {}).forEach((key) => {
      if (key !== "name") brand[key] = update[key];
    });

    await brand.save();

    return res.json(
      successResponse("Brand updated successfully", brand)
    );
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

/**
 * SOFT DELETE BRAND
 * DELETE /brands/:id
 */
const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json(errorResponse("Unauthorized action"));
    }

    const brand = await Brand.findById(id);
    if (!brand || brand.isDeleted) {
      return res.status(404).json(errorResponse("Brand not found"));
    }

    brand.isActive = false;
    brand.isDeleted = true;
    brand.deletedAt = new Date();
    brand.deletedBy = userId;

    await brand.save();

    return res.json(
      successResponse("Brand deleted successfully")
    );
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

/**
 * GET ACTIVE BRANDS (PAGINATION + SEARCH)
 * POST /brands/list
 */
const getBrands = async (req, res) => {
  try {
    let { page = 1, size = 10, search = "" } = req.body;
    page = parseInt(page);
    size = parseInt(size);

    const matchStage = {
      isActive: true,
      isDeleted: false
    };

    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } }
      ];
    }

    const pipeline = [
      { $match: matchStage },
      {
        $project: {
          name: 1,
          slug: 1,
          logo: 1,
          website: 1,
          createdAt: 1
        }
      },
      { $skip: (page - 1) * size },
      { $limit: size }
    ];

    const brands = await Brand.aggregate(pipeline);

    const countPipeline = [
      { $match: matchStage },
      { $count: "count" }
    ];

    const totalResult = await Brand.aggregate(countPipeline);
    const total = totalResult[0]?.count || 0;

    return res.json(
      successResponse("Fetched successfully", brands, {
        page,
        size,
        total
      })
    );
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

/**
 * GET DELETED BRANDS
 */
const getDeletedBrands = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.body;
    page = parseInt(page);
    limit = parseInt(limit);

    const brands = await Brand.find({ isDeleted: true })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Brand.countDocuments({ isDeleted: true });

    return res.json(
      successResponse(brands, { page, limit, total })
    );
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

/**
 * RESTORE BRAND
 */
const restoreBrand = async (req, res) => {
  try {
    const { id } = req.body;

    const brand = await Brand.findById(id);
    if (!brand)
      return res.status(404).json(errorResponse("Brand not found"));

    brand.isActive = true;
    brand.isDeleted = false;
    brand.deletedAt = null;
    brand.deletedBy = null;

    await brand.save();

    return res.json(
      successResponse("Brand restored successfully")
    );
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

/**
 * GET BRAND BY SLUG
 * GET /brands/:slug
 */
const getBrandBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const brand = await Brand.findOne({
      slug,
      isActive: true,
      isDeleted: false
    });

    if (!brand)
      return res.status(404).json(errorResponse("Brand not found"));

    return res.json(
      successResponse("Fetched successfully", brand)
    );
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

module.exports = {
  createBrand,
  updateBrand,
  deleteBrand,
  getBrands,
  getDeletedBrands,
  restoreBrand,
  getBrandBySlug
};
