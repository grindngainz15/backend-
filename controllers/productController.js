const Product = require("../models/Product");
const ProductDetail = require("../models/ProductDetail");
const Category = require("../models/Category");
const User = require("../models/User");
const mongoose = require("mongoose");
const slugify = require("slugify");
const { successResponse, errorResponse } = require("../utils/response");
const Brand = require("../models/Brand");

// CREATE PRODUCT + DETAIL
const createProduct = async (req, res) => {
    try {
        const {
            title,
            brand,
            category,
            price,
            discountPrice,
            description,
            specifications,
            stock,
            warranty,
            shippingInfo,
            returnPolicy,
        } = req.body;

        if (!title || !price) {
            return res.status(400).json(errorResponse("Title and price are required"));
        }
        if(brand){
            const brandExists = await Brand.findById(brand);
            if (!brandExists) {
                return res.status(400).json(errorResponse("Provided brand does not exist"));
            }
        }
        const createdBy = req.user.userId;

        /* CATEGORY VALIDATION */
        let normalizedCategory = null;
        if (category && category.trim() !== "") {
            const catExists = await Category.findById(category);
            if (!catExists) {
                return res.status(400).json(errorResponse("Provided category does not exist"));
            }
            normalizedCategory = category;
        }

        const slug = slugify(title, { lower: true, strict: true });

        if (await Product.findOne({ slug })) {
            return res.status(400).json(errorResponse("Product with this title already exists"));
        }

        const user = await User.findById(createdBy);
        if (!user || !["admin", "seller"].includes(user.role)) {
            return res.status(403).json(errorResponse("Unauthorized action"));
        }

        let thumbnailUrl = "";
        let imageUrls = [];

        if (req.files?.thumbnail?.length) {
            thumbnailUrl = req.files.thumbnail[0].path; // Cloudinary URL
        }

        if (req.files?.images?.length) {
            imageUrls = req.files.images.map((file) => file.path);
        }

        const product = await Product.create({
            title,
            slug,
            brand,
            category: normalizedCategory,
            thumbnail: thumbnailUrl,
            images: imageUrls,
            price,
            discountPrice,
            createdBy,
        });

        await ProductDetail.create({
            productId: product._id,
            description,
            specifications,
            stock,
            warranty,
            shippingInfo,
            returnPolicy,
        });

        return res.json(
            successResponse("Product created successfully", product)
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse(err.message));
    }
};

// UPDATE PRODUCT + DETAIL
const updateProduct = async (req, res) => {
    try {
        const { id, update } = req.body;

        const product = await Product.findById(id);
        if (!product)
            return res.status(404).json(errorResponse("Product not found"));

        // Update product fields
        Object.keys(update).forEach((key) => {
            if (key !== "detail") product[key] = update[key];
        });

        // Regenerate slug if title updated
        if (update.title) {
            product.slug = slugify(update.title, { lower: true });
        }

        await product.save();

        // Update product detail if provided
        if (update.detail) {
            await ProductDetail.findOneAndUpdate(
                { productId: id },
                update.detail,
                { new: true }
            );
        }

        return res.json(successResponse({ message: "Product updated successfully" }));
    } catch (err) {
        return res.status(500).json(errorResponse(err.message));
    }
};

// SOFT DELETE PRODUCT
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json(errorResponse("User not found"));
        if (user.role !== "admin")
            return res.status(403).json(errorResponse("Unauthorized action"));

        const product = await Product.findById(id);
        if (!product)
            return res.status(404).json(errorResponse("Product not found"));

        product.isActive = false;
        product.deletedAt = new Date();
        product.deletedBy = userId;

        await product.save();

        return res.json(successResponse({ message: "Product deleted successfully" }));
    } catch (err) {
        return res.status(500).json(errorResponse(err.message));
    }
};

// GET ACTIVE PRODUCTS (Pagination)
const getProducts = async (req, res) => {
    try {
        let { page = 1, size = 10, category = "all", search = "" } = req.body;

        page = parseInt(page);
        size = parseInt(size);

        const matchStage = { isActive: true };

        

        // 🔍 Search filter
        if (search) {
            matchStage.$or = [
                { title: { $regex: search, $options: "i" } },
                { brand: { $regex: search, $options: "i" } },
                { slug: { $regex: search, $options: "i" } },
            ];
        }

        const categoryObjectId =
            category !== "all" ? new mongoose.Types.ObjectId(category) : null;

        const pipeline = [
            { $match: matchStage },

            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category",
                },
            },

            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true,
                },
            },

            ...(category !== "all"
                ? [
                    {
                        $match: {
                            $or: [
                                { "category._id": categoryObjectId },
                                { "category.parentCategory": categoryObjectId },
                            ],
                        },
                    },
                ]
                : []),

            {
                $project: {
                    title: 1,
                    slug: 1,
                    brand: 1,
                    price: 1,
                    discountPrice: 1,
                    thumbnail: 1,
                    images: 1,
                    category: 1,
                    createdBy: 1,
                    createdAt: 1,
                },
            },

            { $skip: (page - 1) * size },
            { $limit: size },
        ];

        const products = await Product.aggregate(pipeline);

        // ✅ Correct total count (same filters as list)
        const countPipeline = pipeline.filter(
            stage => !stage.$skip && !stage.$limit && !stage.$project
        );
        countPipeline.push({ $count: "count" });

        const totalResult = await Product.aggregate(countPipeline);
        const total = totalResult[0]?.count || 0;

        return res.json(
            successResponse("Fetched successfully", products, {
                page,
                size,
                total,
            })
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse(err.message));
    }
};

// GET DELETED PRODUCTS
const getDeletedProducts = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.body;
        page = parseInt(page);
        limit = parseInt(limit);

        const products = await Product.find({ isActive: false })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Product.countDocuments({ isActive: false });

        return res.json(
            successResponse(products, { page, limit, total })
        );
    } catch (err) {
        return res.status(500).json(errorResponse(err.message));
    }
};

// RESTORE PRODUCT
const restoreProduct = async (req, res) => {
    try {
        const { id } = req.body;
        const product = await Product.findById(id);
        if (!product)
            return res.status(404).json(errorResponse("Product not found"));

        product.isActive = true;
        product.deletedAt = null;
        product.deletedBy = null;

        await product.save();

        return res.json(successResponse({ message: "Product restored successfully" }));
    } catch (err) {
        return res.status(500).json(errorResponse(err.message));
    }
};

// GET SINGLE PRODUCT + DETAIL
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id).populate("category createdBy");
        if (!product)
            return res.status(404).json(errorResponse("Product not found"));

        const detail = await ProductDetail.findOne({ productId: id });

        return res.json(
            successResponse({
                ...product.toObject(),
                detail: detail || {},
            })
        );
    } catch (err) {
        return res.status(500).json(errorResponse(err.message));
    }
};

module.exports = {
    createProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    getDeletedProducts,
    restoreProduct,
    getProductById,
};
