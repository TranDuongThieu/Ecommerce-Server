const asyncHandler = require("express-async-handler");
const BlogCategory = require("../models/blogCategory");
const createBlogCategory = asyncHandler(async (req, res) => {
    const { title } = req.body;
    if (!title) throw new Error("Missing title");
    const response = await BlogCategory.create({ title });
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});

const getBlogCategorys = asyncHandler(async (req, res) => {
    const response = await BlogCategory.find().select("_id title");
    const total = response.length;
    return res.status(200).json({
        success: response ? true : false,
        total: total,
        response,
    });
});

const updateBlogCategory = asyncHandler(async (req, res) => {
    const { bcid } = req.params;
    const { title } = req.body;
    if (!title || !bcid) throw new Error("Missing inputs");
    const response = await BlogCategory.findByIdAndUpdate(
        bcid,
        { title },
        { new: true }
    );
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});
const deleteBlogCategory = asyncHandler(async (req, res) => {
    const { bcid } = req.params;
    if (!bcid) throw new Error("Missing inputs");
    const response = await BlogCategory.findByIdAndDelete(bcid);
    return res.status(200).json({
        success: response ? true : false,
        message: `${response.title} deleted`,
    });
});

module.exports = {
    createBlogCategory,
    getBlogCategorys,
    updateBlogCategory,
    deleteBlogCategory,
};
