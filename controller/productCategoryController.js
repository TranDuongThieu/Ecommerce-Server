const asyncHandler = require("express-async-handler");
const ProductCategory = require("../models/productCategory");
const createPCategory = asyncHandler(async (req, res) => {
    const { title } = req.body;
    if (!title) throw new Error("Missing title");
    const response = await ProductCategory.create({ title });
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});

const getPCategorys = asyncHandler(async (req, res) => {
    const response = await ProductCategory.find().select("_id title brand");
    const total = response.length;
    return res.status(200).json({
        success: response ? true : false,
        total: total,
        response,
    });
});

const getCategoryById = asyncHandler(async (req, res) => {
    const { pcid } = req.params;
    const response = await ProductCategory.findById(pcid).select(
        "_id title brand"
    );
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});

const updatePCategory = asyncHandler(async (req, res) => {
    const { pcid } = req.params;
    const { title } = req.body;
    if (!title || !pcid) throw new Error("Missing inputs");
    const response = await ProductCategory.findByIdAndUpdate(
        pcid,
        { title },
        { new: true }
    );
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});
const deletePCategory = asyncHandler(async (req, res) => {
    const { pcid } = req.params;
    if (!pcid) throw new Error("Missing inputs");
    const response = await ProductCategory.findByIdAndDelete(pcid);
    return res.status(200).json({
        success: response ? true : false,
        message: `${response.title} deleted`,
    });
});

module.exports = {
    createPCategory,
    getPCategorys,
    updatePCategory,
    deletePCategory,
    getCategoryById,
};
