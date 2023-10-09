const AuctionProduct = require("../models/auctionProduct");
const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const productCategory = require("../models/productCategory");
const cloudinary = require("cloudinary");
const sendMail = require("../ultis/sendmail");
const productPopulate = ["title", "price", "thumbnail", "category"];
const auctionProductPopulate = ["title", "thumbnail", "brand", "maxPrice", "reservePrice", "expire", "highestBidder"]
const createAuctionProduct = asyncHandler(async (req, res) => {
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

    let expire;
    if (req.body.expire) {
        expire = parseInt(req.body.expire) * 1000;
        // Convert the 'time' from seconds to milliseconds and add it to the current date
        const timeInSeconds = parseInt(req.body.expire);
        const expirationTimeInMilliseconds = Date.now() + (timeInSeconds * 1000);

        // Create a new Date object with the calculated expiration time
        req.body.expire = new Date(expirationTimeInMilliseconds);
    }

    const product = await AuctionProduct.create(req.body);
    if (product) {
        setTimeout(async () => { // Use async function for user retrieval
            const finalProduct = await AuctionProduct.findById(product._id.toString());
            if (finalProduct.auctionHistory.length > 0) {
                const userId = finalProduct.auctionHistory[0].bidedBy.toString();
                const user = await User.findById(userId); // Use await to retrieve user
                if (user) {
                    const html = `Dear ${user.firstname} ${user.lastname}, you won the auction for ${finalProduct.title}. Please contact us for more information.`;
                    const email = user.email;
                    const data = {
                        email,
                        html,
                        subject: "You won the auction",
                    };
                    sendMail(data);
                } else {
                    console.error("User not found"); // Handle the case when the user is not found
                }
            }
        }, expire)
    }
    res.status(200).json({
        success: product ? true : false,
        product,
    });
});

const getAuctionProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const product = await AuctionProduct.findById(pid)
        .populate("category").populate("auctionHistory.bidedBy", "firstname lastname avatar _id")
    return res.status(200).json({
        success: product ? true : false,
        product: product ? product : "Not Found",
    });
});

//filtering, paging,
const getAllAuctionProduct = asyncHandler(async (req, res) => {
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
    // if (queries?.title)
    //     queryStr.title = { $regex: queries.title, $options: "i" };
    if (req.query.title)
        // queryStr.name = { $regex: queries.name, $options: "i" };
        queryStr["$or"] = [
            { title: { $regex: req.query.title, $options: "i" } },
            { brand: { $regex: req.query.title, $options: "i" } },
        ];

    let query = AuctionProduct.find(queryStr).populate("category", "title brand");
    //sort. truyen vao string "abc,avs"
    if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query = query.sort(sortBy);
    } else query = query.sort("-expire -createdAt");
    //get fields
    if (req.query.fields) {
        const fields = req.query.fields.split(",").join(" ");
        query = query.select(fields);
    } else query = query.select("-__v");
    const total = await AuctionProduct.countDocuments(query);
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

const deleteAuctionProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const response = await AuctionProduct.findByIdAndDelete(pid);
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

const updateAuctionProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params;
    let image
    let thumb
    if (req.body.auctionHistory) delete req.body.auctionHistory;
    if (req.body.image) delete req.body.image;
    if (req.body.thumbnail) delete req.body.thumbnail;
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

    const product = await AuctionProduct.findById(pid);
    if (product.thumbnail.filename && req.body.thumbnail)
        await cloudinary.v2.uploader.destroy(product.thumbnail.filename);
    if (req?.files?.image?.length > 0)
        product.image.forEach(async (item) => {
            if (item.filename)
                await cloudinary.v2.uploader.destroy(item.filename)
        })
    else delete req.body.image
    if (req.body.expire) {
        expire = parseInt(req.body.expire) * 1000;
        // Convert the 'time' from seconds to milliseconds and add it to the current date
        const timeInSeconds = parseInt(req.body.expire);
        const expirationTimeInMilliseconds = Date.now() + (timeInSeconds * 1000);

        // Create a new Date object with the calculated expiration time
        req.body.expire = new Date(expirationTimeInMilliseconds);
    }
    const response = await AuctionProduct.findByIdAndUpdate(pid, req.body);
    res.status(200).json({
        success: response ? true : false,
        message: response ? "Update successfully" : "Not Found"
    })
});


const bidProduct = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { price, pid } = req.body;
    if (!price || !pid) throw new Error("Missing Input");
    const productFields = ["title", "price", "thumbnail", "category"];

    const product = await AuctionProduct.findById(pid)
        .populate("category")
    const user = await User.findById(_id).populate("cart.product", productFields)
    const alreadyBid = user.auction.find(item => item.product._id.toString() === pid);
    const bidedAt = new Date();
    if (product.expire < bidedAt) return res.status(400).json({
        success: false,
        message: "This product has been unavailable !"
    });

    if (price - product.maxPrice >= product.stepPrice) {
        product.auctionHistory.unshift({
            price,
            bidedBy: _id,
            bideddAt: bidedAt
        })
        product.maxPrice = price;
        product.highestBidder = _id;
    }
    else return res.status(400).json({
        success: false,
        message: "Invalid Price"
    })
    if (alreadyBid) {
        user.auction.forEach((item) => {
            if (item.product._id.toString() === pid) {
                item.price = price
                item.bidedAt = bidedAt;
            }
        })
    }
    else {
        user.auction.unshift({
            product: pid,
            price: price,
            bidedAt: bidedAt
        })
    }
    await product.populate("auctionHistory.bidedBy", "firstname lastname avatar _id");
    await user.populate("auction.product", auctionProductPopulate);
    user.auction.forEach(item => {
        if (item.product._id.toString() === pid) {
            item.product.maxPrice = price;
            item.product.highestBidder = _id;
        }
    })

    await user.populate("auction.product.highestBidder", "firstname lastname _id ");
    await user.save();
    await product.save();

    return res.status(200).json({
        success: true,
        product,
        user,
    });
});
module.exports = {
    createAuctionProduct,
    getAuctionProduct,
    getAllAuctionProduct,
    deleteAuctionProduct,
    updateAuctionProduct,
    bidProduct,
};
