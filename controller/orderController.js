const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const User = require("../models/user");
const OTP = require("../models/OTP");
const Product = require("../models/product");

const sendMail = require("../ultis/sendmail");

const sendOTPverifyOrder = asyncHandler(async (req, res) => {
    const { email } = req.params;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    let OTPRecord = await OTP.findOne({ email });
    if (OTPRecord) {
        OTPRecord.code = otpCode;
        OTPRecord.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await OTPRecord.save();
    } else {
        await OTP.create({
            email,
            code: otpCode,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });
    }
    const html = `Your OTP code is ${otpCode}. This code is valid for 15 minutes.`;
    const data = {
        email,
        html,
        subject: "OTP Verification",
    };
    sendMail(data);
    setTimeout(async () => {
        await OTP.deleteOne({ email });
    }, 15 * 60 * 1000);
    return res.status(200).json({
        success: true,
        message: "Please check your email to get OTP",
    });
})
const createOrder = asyncHandler(async (req, res) => {
    const { orderedBy } = req.body;
    let email;
    let order
    if (orderedBy) {
        order = await Order.create({
            products: req.body.products,
            total: req.body.total,
            orderedBy: orderedBy,
            paymentMethod: req.body.paymentMethod
        })
        const user = await User.findById(orderedBy.toString());
        user.orders.unshift(order._id);
        await user.save();
        email = user.email;
    }
    else {
        email = req.body.tempUser.email
        const otpRecord = await OTP.findOne({ email: req.body.tempUser.email });
        if (!otpRecord) throw new Error("OTP not found !");
        if (otpRecord.expiresAt < new Date()) {
            // Remove the expired OTP
            await OTP.findByIdAndDelete(otpRecord._id);
            return res.status(400).json({ message: "OTP has expired" });
        }
        if (otpRecord.code !== req.body.code) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        order = await Order.create({
            products: req.body.products,
            total: req.body.total,
            tempUser: req.body.tempUser,
            paymentMethod: req.body.paymentMethod
        })
    }
    if (order) {
        req.body.products.forEach(async (product) => {
            await Product.findByIdAndUpdate(product.product, {
                $inc: {
                    sold: product.quantity,
                    quantity: -product.quantity,
                },
            })

        })
    }
    const html = `Your order is successfully placed. Your Order code is ${order._id}. You can use this code to search your order.`;
    const data = {
        email,
        html,
        subject: "Order Confirmation",
    };
    sendMail(data);
    return res.status(200).json({
        success: order ? true : false,
        order,
    });
});

const getOrders = asyncHandler(async (req, res) => {
    const queries = { ...req.query };
    const excludeFields = ["page", "limit", "sort", "id"];
    if (req.query.id !== '') {
        const orders = await Order.findById(req.query.id.toString()).sort('-createdAt').populate("products.product", "title price thumbnail").populate("orderedBy", "email");;
        return res.status(200).json({
            success: orders ? true : false,
            orders,
            total: 1,
        })
    }
    excludeFields.forEach((el) => delete queries[el]);
    let queryStr = JSON.stringify(queries);
    queryStr = queryStr.replace(
        /\b(gt|gte|lt|lte|in)\b/g,
        (matched) => `$${matched}`
    );
    queryStr = JSON.parse(queryStr);


    let query = Order.find(queryStr).populate("products.product", "title price thumbnail").populate("orderedBy", "email");;

    //sort. truyen vao string "abc,avs"
    if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query = query.sort(sortBy);
    } else query = query.sort("-createdAt");

    const total = await Order.countDocuments(query);

    //paging
    const page = +req.query.page || 1;
    const limit = +req.query.limit || process.env.PRODUCT_LIMIT;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    const orders = await query;

    return res.status(200).json({
        success: orders ? true : false,
        total: total,
        orders,
    });
});
const getOrder = asyncHandler(async (req, res) => {
    const { _id } = req.params;
    const response = await Order.findById(_id.toString()).populate("products.product", "title price thumbnail").populate("orderedBy", "email");
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

const cancelOrder = asyncHandler(async (req, res) => {
    const { oid } = req.params;
    if (!oid) throw new Error("Missing inputs");
    const otpRecord = await OTP.findOne({ email: req.body.email });
    if (!otpRecord) throw new Error("OTP not found !");
    if (otpRecord.expiresAt < new Date()) {
        // Remove the expired OTP
        await OTP.findByIdAndDelete(otpRecord._id);
        return res.status(400).json({ message: "OTP has expired" });
    }
    if (otpRecord.code !== req.body.code) {
        return res.status(400).json({ message: "Invalid OTP" });
    }
    const order = await Order.findById(oid);
    const response = await Order.findByIdAndUpdate(oid, { status: "Cancelled" }, { new: true });
    if (response) {
        order.products.forEach(async (product) => {
            await Product.findByIdAndUpdate(product.product.toString(), {
                $inc: {
                    sold: -product.quantity,
                    quantity: product.quantity,
                },
            })

        })
    }
    return res.status(200).json({
        success: response ? true : false,
        message: `Order id :${response._id} has cancelled.`,
    });
});

module.exports = {
    createOrder,
    getOrders,
    updateStatus,
    deleteOrder,
    getOrder,
    sendOTPverifyOrder,
    cancelOrder
};
