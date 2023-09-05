const asyncHandler = require("express-async-handler");
const Brand = require("../models/brand");

const createBrand = asyncHandler(async (req, res) => {
    const { title } = req.body;
    if (!title) throw new Error("Missing title");
    const response = await Brand.create({ title });
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});

const getBrands = asyncHandler(async (req, res) => {
    const response = await Brand.find().select("_id title");
    const total = response.length;
    return res.status(200).json({
        success: response ? true : false,
        total: total,
        response,
    });
});

const updateBrand = asyncHandler(async (req, res) => {
    const { brid } = req.params;
    const { title } = req.body;
    if (!title || !brid) throw new Error("Missing inputs");
    const response = await Brand.findByIdAndUpdate(
        brid,
        { title },
        { new: true }
    );
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});
const deleteBrand = asyncHandler(async (req, res) => {
    const { brid } = req.params;
    if (!brid) throw new Error("Missing inputs");
    const response = await Brand.findByIdAndDelete(brid);
    return res.status(200).json({
        success: response ? true : false,
        message: `${response.title} deleted`,
    });
});

module.exports = {
    createBrand,
    getBrands,
    updateBrand,
    deleteBrand,
};
