const Product = require("../models/product");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const productCategory = require("../models/productCategory");
const cloudinary = require("cloudinary");

const createProduct = asyncHandler(async (req, res) => {
    const image = req.files?.image?.map(item => ({ filename: item.filename, path: item.path }));
    const thumb = { filename: req?.files.thumb[0]?.filename, path: req?.files.thumb[0]?.path };
    if (thumb)
        req.body.thumbnail = thumb;
    if (image)
        req.body.image = image
    const categoryId = await productCategory.findOne({
        title: req.body.category,
    }).select("_id");
    req.body.category = categoryId;
    if (Object.keys(req.body).length === 0) throw new Error("Missing Input");
    if (!req.body.title) throw new Error("Missing Title");
    else
        req.body.slug = slugify(req.body.title, {
            replacement: "-",
            remove: undefined,
            lower: false,
            strict: false,
            locale: "vi",
            trim: true,
        });
    Object.keys(req.body).forEach(key => {
        if (key.startsWith("variants"))
            if (typeof req.body[key] === "string")
                req.body[key] = [req.body[key]];
    })
    const product = await Product.create(req.body);
    res.status(200).json({
        success: product ? true : false,
        product,
    });
});

const getProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const product = await Product.findById(pid)
        .populate("category")
        .populate("rating.postedBy", "firstname lastname avatar");
    return res.status(200).json({
        success: product ? true : false,
        product: product ? product : "Not Found",
    });
});

//filtering, paging,
const getAllProduct = asyncHandler(async (req, res) => {
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    const queries = { ...req.query };
    const excludeFields = ["page", "limit", "sort", "fields", "title"];
    excludeFields.forEach((el) => delete queries[el]);

    let queryStr = JSON.stringify(queries);
    queryStr = queryStr.replace(
        /\b(gt|gte|lt|lte|in)\b/g,
        (matched) => `$${matched}`
    );
    queryStr = JSON.parse(queryStr);

    const variantQuery = {};
    for (const key in queries) {
        if (key.startsWith("variants.")) {
            const variantKey = key.split(".")[1];
            if (!variantQuery[variantKey]) {
                variantQuery[variantKey] = [];
            }
            variantQuery[variantKey].push(queries[key]);
            delete queryStr[key];
        }
    }
    if (Object.keys(variantQuery).length > 0) {
        //format thanh object có value la mang 1 chieu
        Object.keys(variantQuery).forEach((key) => {
            if (Array.isArray(variantQuery[key])) {
                variantQuery[key] = variantQuery[key].flat();
            }
        });

        //query product phai chua tat ca cac key
        const requireVariant = Object.keys(variantQuery).map((key) => ({
            [`variants.${capitalizeFirstLetter(key)}`]: { $exists: true },
        }));
        queryStr["$and"] = requireVariant;
        
        //format in hoa cac value
        const newVariantQuery = {};
        Object.keys(variantQuery).forEach((key) => {
            newVariantQuery[key] = variantQuery[key].map((value) =>
                value.toUpperCase()
            );
        });
        queryStr["$or"] = Object.keys(newVariantQuery).map((key) => ({
            [`variants.${capitalizeFirstLetter(key)}`]: {
                $in: newVariantQuery[key],
            },
        }));
    }
    // if (queries?.title)
    //     queryStr.title = { $regex: queries.title, $options: "i" };
    if (req.query.title)
        // queryStr.name = { $regex: queries.name, $options: "i" };
        queryStr["$or"] = [
            { title: { $regex: req.query.title, $options: "i" } },
            { brand: { $regex: req.query.title, $options: "i" } },
        ];

    let query = Product.find(queryStr).populate("category", "title brand");
    //sort. truyen vao string "abc,avs"
    if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query = query.sort(sortBy);
    } else query = query.sort("-createdAt");
    //get fields
    if (req.query.fields) {
        const fields = req.query.fields.split(",").join(" ");
        query = query.select(fields);
    } else query = query.select("-__v");
    const total = await Product.countDocuments(query);
    //paging
    const page = +req.query.page || 1;
    const limit = +req.query.limit || process.env.PRODUCT_LIMIT;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    //executing
    // cloudinary.uploader.destroy()
    const products = await query;
    return res.status(200).json({
        success: products ? true : false,
        total: total,
        products,
    });
});

const deleteProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const response = await Product.findByIdAndDelete(pid);
    if (response.thumbnail.filename)
        await cloudinary.v2.uploader.destroy(response.thumbnail.filename);
    response.image.forEach(async (item) => {
        if (item.filename)
            await cloudinary.v2.uploader.destroy(item.filename)
    })
    return res.status(200).json({
        success: response ? true : false,
        message: `${response.title} deleted`,
    });
});

const updateProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params;

    let image
    let thumb
    if (Object.keys(req.files).length > 0) {
        if (req?.files?.thumb && req.files?.thumb[0])
            thumb = { filename: req?.files?.thumb[0]?.filename, path: req?.files?.thumb[0]?.path };
        if (req?.files?.image && req?.files?.image?.length > 0)
            image = req.files?.image?.map(item => ({ filename: item?.filename, path: item?.path }));
    }
    if (thumb)
        req.body.thumbnail = thumb;
    delete req.body.thumb;

    if (image)
        req.body.image = image
    const categoryId = await productCategory.findOne({
        title: req.body.category,
    }).select("_id");
    req.body.category = categoryId;
    if (Object.keys(req.body).length === 0) throw new Error("Missing Input");
    if (!req.body.title) throw new Error("Missing Title");
    else
        req.body.slug = slugify(req.body.title, {
            replacement: "-",
            remove: undefined,
            lower: false,
            strict: false,
            locale: "vi",
            trim: true,
        });
    Object.keys(req.body).forEach(key => {
        if (key.startsWith("variants"))
            if (typeof req.body[key] === "string")
                req.body[key] = [req.body[key]];
    })
    const product = await Product.findById(pid);
    if (product.thumbnail.filename && req.body.thumbnail)
        await cloudinary.v2.uploader.destroy(product.thumbnail.filename);
    if (req?.files?.image?.length > 0)
        product.image.forEach(async (item) => {
            if (item.filename)
                await cloudinary.v2.uploader.destroy(item.filename)
        })
    else delete req.body.image
    const response = await Product.findByIdAndUpdate(pid, req.body);
    res.status(200).json({
        success: response ? true : false,
        message: response ? "Update successfully" : "Not Found"
    })
});

const ratingProduct = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { star, pid, comment } = req.body;
    if (!star || !pid) throw new Error("Missing Input");

    const product = await Product.findById(pid);
    const postedAt = new Date();
    const { alreadyRating, indexRating } = product.rating.reduce(
        (result, rating, index) => {
            if (!result.alreadyRating && rating.postedBy.toString() === _id) {
                result.alreadyRating = true;
                result.indexRating = index;
            }
            return result;
        },
        { alreadyRating: false, indexRating: -1 }
    );
    if (alreadyRating) {
        product.rating[indexRating] = {
            star,
            postedBy: _id,
            comment,
            postedAt,
        };
    } else product.rating.push({ star, postedBy: _id, comment, postedAt });

    let totalStar = product.rating.reduce(
        (result, rating) => (result += rating.star),
        0
    );
    totalStar = (totalStar / product.rating.length).toFixed(1);
    product.totalRating = totalStar;
    await product.populate("rating.postedBy", "firstname lastname avatar");
    await product.save();
    return res.status(200).json({
        success: true,
        product,
    });
});
const uploadImgProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params;
    if (req.files.length === 0) throw new Error("Missing Input");
    const response = await Product.findByIdAndUpdate(
        pid,
        {
            $push: {
                image: {
                    $each: req.files.map((item) => item.path),
                },
            },
        },
        { new: true }
    );

    return res.status(200).json({ message: "ok", response });
});

module.exports = {
    createProduct,
    getProduct,
    getAllProduct,
    deleteProduct,
    updateProduct,
    ratingProduct,
    uploadImgProduct,
};
