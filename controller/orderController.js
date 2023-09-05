const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const User = require("../models/user");
const Coupon = require("../models/coupon");
const createOrder = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { couponId } = req.body;
    const cart = await User.findById(_id)
        .select("cart")
        .populate("cart.product", "title slug price");

    const getCoupon = await Coupon.findById(couponId);

    const products = cart.cart.map((item) => {
        return {
            product: item.product._id,
            count: item.quantity,
            color: item.color,
        };
    });
    let total = cart.cart.reduce((total, item) => {
        return total + item.quantity * item.product.price;
    }, 0);

    total = getCoupon ? total - (total * getCoupon.discount) / 100 : total;
    const order = await Order.create({
        products,
        status: "Processing",
        coupon: getCoupon._id,
        total,
        orderedBy: _id,
    });
    return res.status(200).json({
        success: order ? true : false,
        order,
    });
});

const getOrders = asyncHandler(async (req, res) => {
    const response = await Order.find();
    const total = response.length;
    return res.status(200).json({
        success: response ? true : false,
        total: total,
        response,
    });
});
const getOrder = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const response = await Order.findOne({orderedBy : _id})
        .populate("orderedBy", "firstname lastname email mobile")
        .populate("coupon", "name discount expiry");
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});
const updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const { oid } = req.params;
    if (!status) throw new Error("Missing inputs");
    const response = await Order.findByIdAndUpdate(
        oid,
        { status },
        { new: true }
    );
    return res.status(200).json({
        success: response ? true : false,
        response,
    });
});
const deleteOrder = asyncHandler(async (req, res) => {
    const { bcid } = req.params;
    if (!bcid) throw new Error("Missing inputs");
    const response = await Order.findByIdAndDelete(bcid);
    return res.status(200).json({
        success: response ? true : false,
        message: `${response.title} deleted`,
    });
});

module.exports = {
    createOrder,
    getOrders,
    updateStatus,
    deleteOrder,
    getOrder,
};
