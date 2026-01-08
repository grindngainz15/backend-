const Category = require("../models/Category");
const { successResponse, errorResponse } = require("../utils/response");
const User = require("../models/User");
// Create 

const createCategory = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            parentCategory,
            isFeatured = false,
            sortOrder = 0,
        } = req.body;

        if (!name) {
            return res
                .status(400)
                .json(errorResponse("Category name is required"));
        }

        const existingCategory = await Category.findOne({
            $or: [{ name }, { slug }],
        });

        if (existingCategory) {
            return res
                .status(400)
                .json(errorResponse("Category with same name or slug already exists"));
        }

        let image = null;
        if (req.file) {
            image = req.file.path; // Cloudinary URL
        }

        const category = await Category.create({
            name,
            slug,
            description,
            image,
            parentCategory: parentCategory || null,
            isFeatured,
            sortOrder,
        });

        return res.status(201).json(
            successResponse({
                message: "Category created successfully",
                category,
            })
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse(err.message));
    }
};

// UPDATE CATEGORY
const updateCategory = async (req, res) => {
    try {
        const { id, update } = req.body;
        const category = await Category.findById(id);
        if (!category) return res.status(404).json(errorResponse("Category not found"));
        Object.keys(update).forEach((key) => {
            category[key] = update[key];
        });
        await category.save();
        res.json(successResponse({ message: "Category updated successfully" }));
    } catch (err) {
        res.status(500).json(errorResponse(err.message));
    }
};

// Soft Delete
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.body;
        const userId = req.user.userId;
        console.log("User ID performing delete:", userId);
        const category = await Category.findById(id);
        const user = await User.findById(userId);
        if (!user) return res.status(404).json(errorResponse("User not found"));
        if (user.role !== 'admin') return res.status(403).json(errorResponse("Unauthorized action"));
        const deletedBy = userId;
        if (!category) return res.status(404).json(errorResponse("Category not found"));
        category.isActive = false;
        category.deletedAt = new Date();
        category.deletedBy = deletedBy;
        await category.save();
        res.json(successResponse({ message: "Category deleted successfully" }));
    } catch (err) {
        res.status(500).json(errorResponse(err.message));
    }
};

const getCategories = async (req, res) => {
    try {
        let { page = 1, size = 10, search = "" } = req.body;

        page = parseInt(page);
        size = parseInt(size);

        // Build search filter
        const filter = { isActive: true };

        if (search && search.trim() !== "") {
            filter.name = { $regex: search, $options: "i" };
        }

        // Fetch categories using filter
        const categories = await Category.find(filter)
            .skip((page - 1) * size)
            .limit(size);

        const total = await Category.countDocuments(filter);

        return res.json(
            successResponse(
                "Fetched successfully",
                categories, { page, size, total }
            )
        );

    } catch (err) {
        console.error("Category Fetch Error:", err);
        return res.status(500).json(errorResponse("Failed to fetch Categories", err.message));
    }
};

const restoreCategory = async (req, res) => {
    try {
        const { id } = req.body;
        const category = await Category.findById(id);
        if (!category) return res.status(404).json(errorResponse("Category not found"));
        category.isActive = true;
        category.deletedAt = null;
        category.deletedBy = null;
        await category.save();
        res.json(successResponse({ message: "Category restored successfully" }));
    } catch (err) {
        res.status(500).json(errorResponse(err.message));
    }
};

// LIST DELETED CATEGORIES (pagination)
const getDeletedCategories = async (req, res) => {
    try {
        let { page = 1, size = 10 } = req.body;
        page = parseInt(page);
        size = parseInt(size);
        const categories = await Category.find({ isActive: false })
            .skip((page - 1) * size)
            .limit(size);
        const total = await Category.countDocuments({ isActive: false });
        res.json(successResponse(categories, { page, size, total, }));
    } catch (err) {
        res.status(500).json(errorResponse(err.message));
    }
};

// Get Category By ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        console.log("Fetched Category:", category);
        res.status(200).json(category);
    } catch (err) {
        res.status(500).json({ error: "Error fetching category: " + err.message });
    }
};

const getCategoriesWithSubcategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        // Only parent categories
        $match: {
          parentCategory: null,
          isActive: true,
        },
      },
      {
        // Join subcategories
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "parentCategory",
          as: "subCategories",
        },
      },
      {
        // Filter active subcategories
        $addFields: {
          subCategories: {
            $filter: {
              input: "$subCategories",
              as: "sub",
              cond: { $eq: ["$$sub.isActive", true] },
            },
          },
        },
      },
      {
        // Sort
        $sort: { sortOrder: 1, name: 1 },
      },
      {
        // Shape response
        $project: {
          name: 1,
          slug: 1,
          image: 1,
          subCategories: {
            _id: 1,
            name: 1,
            slug: 1,
            image: 1,
          },
        },
      },
    ]);

    return res.json(
      successResponse( "Categories fetched successfully", categories,
      )
    );
  } catch (err) {
    console.error("Category Tree Error:", err);
    return res
      .status(500)
      .json(errorResponse("Failed to fetch categories", err.message));
  }
};

module.exports = {
    createCategory,
    updateCategory,
    deleteCategory,
    getCategories,
    restoreCategory,
    getDeletedCategories,
    getCategoryById,
    getCategoriesWithSubcategories,
};