const asyncHandler = require("express-async-handler");
const Blog = require("../models/blog");
const _ = require("lodash");
const createBlog = asyncHandler(async (req, res) => {
    const { title, description, category } = req.body;
    if (!title || !description || !category) throw new Error("Missing input");
    const response = await Blog.create(req.body);
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});

const getBlogs = asyncHandler(async (req, res) => {
    const response = await Blog.find();
    const total = response.length;
    return res.status(200).json({
        success: response ? true : false,
        total: total,
        response,
    });
});

const updateBlog = asyncHandler(async (req, res) => {
    const { bid } = req.params;
    if (Object.keys(req.body).length === 0)
        throw new Error("Nothing to Update");
    const response = await Blog.findByIdAndUpdate(bid, req.body, {
        new: true,
    });
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});
const deleteBlog = asyncHandler(async (req, res) => {
    const { bid } = req.params;
    const response = await Blog.findByIdAndDelete(bid);
    return res.status(200).json({
        success: response ? true : false,
        message: `${response.title} deleted`,
    });
});

const likeBlog = asyncHandler(async (req, res) => {
    const { bid } = req.params;
    const { _id } = req.user;
    const blog = await Blog.findById(bid);
    const alreadyLiked = blog.likes.some((l) => l.toString() === _id);
    if (!alreadyLiked) blog.likes.push(_id);
    else {
        const deletedLike = blog.likes.filter(
            (userId) => userId.toString() !== _id
        );
        blog.likes = [...deletedLike];
    }

    if (blog.isDisliked) blog.isDisliked = false;
    const deletedDislike = blog.dislikes.filter(
        (user) => user.toString() !== _id
    );
    blog.dislikes = [...deletedDislike];

    if (alreadyLiked) blog.isLiked = false;
    else blog.isLiked = true;

    const response = await blog.save();
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});

const disLikeBlog = asyncHandler(async (req, res) => {
    const { bid } = req.params;
    const { _id } = req.user;
    const blog = await Blog.findById(bid);
    const alreadyDisliked = blog.dislikes.some((l) => l.toString() === _id);
    if (!alreadyDisliked) blog.dislikes.push(_id);
    else {
        const deletedDislike = blog.dislikes.filter(
            (userId) => userId.toString() !== _id
        );
        blog.dislikes = [...deletedDislike];
    }

    if (blog.isLiked) blog.isLiked = false;
    const deleteLike = blog.likes.filter((user) => user.toString() !== _id);
    blog.likes = [...deleteLike];

    if (alreadyDisliked) blog.isDisliked = false;
    else blog.isDisliked = true;

    const response = await blog.save();
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});

const getDetailBlog = asyncHandler(async (req, res) => {
    const fields = "_id firstname lastname email";
    const { bid } = req.params;
    const response = await Blog.findByIdAndUpdate(
        bid,
        {
            $inc: { viewNumber: 1 },
        },
        { new: true }
    )
        .populate("likes", fields)
        .populate("dislikes", fields);
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});
const uploadImgBlog = asyncHandler(async (req, res) => {
    const { bid } = req.params;
    if (!req.file) throw new Error("Missing Input");
    const response = await Blog.findByIdAndUpdate(
        bid,
        {
            image: req.file.path,
        },
        { new: true }
    );

    return res.status(200).json({ message: "ok", response });
});

module.exports = {
    createBlog,
    getBlogs,
    updateBlog,
    deleteBlog,
    likeBlog,
    disLikeBlog,
    getDetailBlog,
    uploadImgBlog
};
