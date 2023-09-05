const asyncHandler = require("express-async-handler");
const Coupon = require("../models/coupon");

const createCoupon = asyncHandler(async (req, res) => {
    const { name, discount, expiry } = req.body;
    if ((!name, !discount, !expiry)) throw new Error("Missing inputs");
    const response = await Coupon.create({
        ...req.body,
        expiry: Date.now() + expiry * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});

const getCoupons = asyncHandler(async (req, res) => {
    const response = await Coupon.find();
    const total = response.length;
    return res.status(200).json({
        success: response ? true : false,
        total: total,
        response,
    });
});

const updateCoupon = asyncHandler(async (req, res) => {
    const { cpip } = req.params;
    if (Object.keys(req.body).length === 0)
        throw new Error("Nothing to Update");
    if (req.body.expiry)
        req.body.expiry = Date.now() + req.body.expiry * 24 * 60 * 60 * 1000;
    const response = await Coupon.findByIdAndUpdate(cpip, req.body, {
        new: true,
    });
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});
const deleteCoupon = asyncHandler(async (req, res) => {
    const { cpip } = req.params;
    const response = await Coupon.findByIdAndDelete(cpip);
    return res.status(200).json({
        success: response ? true : false,
        message: `${response.name} deleted`,
    });
});

module.exports = {
    createCoupon,
    getCoupons,
    updateCoupon,
    deleteCoupon,
};
