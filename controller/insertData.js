const Product = require("../models/product");
const AuctionProduct = require("../models/auctionProduct");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const data = require("../data/ecommerce2.json");
const cateData = require("../data/cateData");
const ProductCategory = require("../models/productCategory");
const insertData = asyncHandler(async (req, res) => {
    data.forEach(async (product) => {
        const categoryId = await ProductCategory.findOne({
            title: product.category[1],
        }).select("_id");
        const variants = {};
        product.variants.forEach((variant) => {
            variants[variant.label] = variant.variants;
        });
        const insertData = {
            title: product.name,
            slug: slugify(product.name, {
                replacement: "-",
                remove: undefined,
                lower: false,
                strict: false,
                locale: "vi",
                trim: true,
            }),
            thumbnail: product.thumb,
            category: categoryId,
            brand: product.brand,
            totalRating: 0,
            price: product?.price
                ? Math.round(
                    Number(product?.price?.match(/\d/g).join("")) / 100
                )
                : 0,
            description: product?.description,
            image: product.images,
            quantity: Math.round(Math.random() * 1000),
            sold: Math.round(Math.random() * 100),
            variants: variants,
            info: product?.infomations,
        };
        await Product.create(insertData);
    });
    res.status(200).json("ok");
});

const insertCategory = asyncHandler(async (req, res) => {
    cateData.forEach(async (cate) => {
        await ProductCategory.create({
            title: cate.cate,
            brand: cate.brand,
        });
    });
    res.status(200).json("OK");
});


const insertAuction = asyncHandler(async (req, res) => {
    data.forEach(async (product) => {
        const categoryId = await ProductCategory.findOne({
            title: product.category[1],
        }).select("_id");
        const variants = {};
        product.variants.forEach((variant) => {
            variants[variant.label] = variant.variants;
        });
        const insertData = {
            title: product.name,
            slug: slugify(product.name, {
                replacement: "-",
                remove: undefined,
                lower: false,
                strict: false,
                locale: "vi",
                trim: true,
            }),
            thumbnail: product.thumb,
            category: categoryId,
            brand: product.brand,
            reservePrice: product?.price
                ? Math.round(
                    Number(product?.price?.match(/\d/g).join("")) / 100
                )
                : 0,
            stepPrice: 500,
            description: product?.description,
            expire: new Date(Date.now() + (Math.floor(Math.random() * 10) + 1) * 24 * 60 * 60 * 1000),
            image: product.images,
            variants: variants,
        };
        await AuctionProduct.create(insertData);
    });
    res.status(200).json("ok");
});
module.exports = { insertData, insertCategory, insertAuction };
