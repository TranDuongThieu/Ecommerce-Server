const User = require("../models/user");
const OTP = require("../models/OTP");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const sendMail = require("../ultis/sendmail");
const cloudinary = require("cloudinary");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
    generateAccessToken,
    generateRefreshToken,
} = require("../middleware/jwt");
const joi = require("joi");
const { email, name, mobile } = require("../ultis/joi")
// const register = asyncHandler(async (req, res) => {
//     const { email, password, firstname, lastname } = req.body;
//     if (!email || !password || !firstname || !lastname)
//         return res.status(400).json({
//             message: "Missing Input",
//         });

//     const user = await User.findOne({ email });
//     if (user) throw new Error("User has existed !"); //check exised User

//     const response = await User.create(req.body);
//     return res.status(200).json({
//         success: response ? true : false,
//         message: "Registed Successfully",
//     });
// });
// const register = asyncHandler(async (req, res) => {
//     const { email, password, firstname, lastname } = req.body;
//     if (!email || !password || !firstname || !lastname)
//         return res.status(400).json({
//             message: "Missing Input",
//         });
//     const otp = await OTP.create({
//         email,
//         code: Math.floor(100000 + Math.random() * 900000).toString(),
//         expiresAt: new Date(Date.now() + 15 * 60 * 1000),
//     });
//     return res.status(200).json({
//         success: true,
//         message: "Please check your email to get OTP",
//     });
// });
const productPopulate = ["title", "price", "thumbnail", "category"];
const auctionProductPopulate = ["title", "thumbnail", "brand", "maxPrice", "reservePrice", "expire", "highestBidder"]
const createAccount = asyncHandler(async (req, res) => {
    const { email, password, firstname, lastname } = req.body;
    if (!email || !password || !firstname || !lastname)
        return res.status(400).json({
            message: "Missing Input",
        });
    const user2 = await User.findOne({ email });
    if (user2) throw new Error("User has existed !"); //check exised User
    const user = await User.create(req.body);
    return res.status(200).json({
        success: user ? true : false,
        message: user ? "Registered Successfully" : "Register Failed",
    });
});

const register = asyncHandler(async (req, res) => {
    const { email, password, firstname, lastname } = req.body;
    if (!email || !password || !firstname || !lastname)
        return res.status(400).json({
            message: "Missing Input",
        });

    const user = await User.findOne({ email });
    if (user) throw new Error("User has existed !"); //check exised User

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
});

const confirmRegistration = asyncHandler(async (req, res) => {
    const { email, code, password, firstname, lastname, mobile } = req.body;

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) throw new Error("OTP not found !");
    if (otpRecord.expiresAt < new Date()) {
        // Remove the expired OTP
        await OTP.findByIdAndDelete(otpRecord._id);
        return res.status(400).json({ message: "OTP has expired" });
    }
    if (otpRecord.code !== code) {
        return res.status(400).json({ message: "Invalid OTP" });
    }
    const user = await User.create({
        email,
        password,
        firstname,
        lastname,
        mobile,
    });
    await OTP.findByIdAndDelete(otpRecord._id);
    return res.status(200).json({
        success: user ? true : false,
        message: user ? "Registered Successfully" : "Register Failed",
    });
});
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({
            message: "Missing Input",
        });
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found !");
    else if (user && bcrypt.compareSync(password, user.password)) {
        const { password, role, refreshToken, ...userData } = user.toObject();
        const newRefreshToken = generateRefreshToken(user._id);
        const token = generateAccessToken(user._id, role);

        await User.findByIdAndUpdate(
            user._id,
            { refreshToken: newRefreshToken },
            { new: true }
        );

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            accessToken: token,
            data: userData,
        });
    } else throw new Error("Wrong password !");
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const user = await User.findById(_id)
        .select("-refreshToken -password ")
        .populate("cart.product", productPopulate)
        .populate("auction.product", auctionProductPopulate)
    await user.populate("auction.product.highestBidder", "firstname lastname _id")
    return res.status(200).json({
        success: user ? true : false,
        response: user ? user : "User not found",
    });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie && !cookie.refreshToken) throw new Error("No Refresh Token");
    const newAccessToken = jwt.verify(
        cookie.refreshToken,
        process.env.JWT_SECRET
    );
    const response = await User.findOne({
        _id: newAccessToken._id,
        refreshToken: cookie.refreshToken,
    });
    return res.status(200).json({
        success: response ? true : false,
        newAccessToken: response
            ? generateAccessToken(response._id, response.role)
            : "Refresh Token not found",
    });
});

const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie || !cookie.refreshToken) throw new Error("No refreshToken");
    await User.findOneAndUpdate(
        { refreshToken: cookie.refreshToken },
        { refreshToken: "" },
        { new: true }
    );
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
    });
    return res.status(200).json({
        success: true,
        message: "Logout Successfully",
    });
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new Error("Missing Email");
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");
    const resetPasswordToken = user.createPasswordChangeToken();
    await user.save();
    const html = `Click <a href="${process.env.CLIENT_URL}/resetpassword/${resetPasswordToken}">Click Here</a> to reset your password. This link will be expired in 15min`;
    const data = {
        email,
        html,
        subject: "Reset password",
    };
    sendMail(data);
    return res.status(200).json({
        success: true,
        message: "Please check your email reset password",
    });
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) throw new Error("Missing Input");
    const passwordResetToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
    const user = await User.findOne({
        passwordResetToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) throw new Error("Invalid Token");
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangeAt = Date.now();
    await user.save();
    return res.status(200).json({
        success: user ? true : false,
        message: user ? "Change Password Successfully" : "Something went wrong",
    });
});

const getUsers = asyncHandler(async (req, res) => {
    const queries = { ...req.query };
    const excludeFields = ["page", "limit", "sort", "fields", "name"];
    excludeFields.forEach((el) => delete queries[el]);

    let queryStr = JSON.stringify(queries);
    queryStr = queryStr.replace(
        /\b(gt|gte|lt|lte|in)\b/g,
        (matched) => `$${matched}`
    );
    queryStr = JSON.parse(queryStr);

    if (req.query.name)
        // queryStr.name = { $regex: queries.name, $options: "i" };
        queryStr["$or"] = [
            { firstname: { $regex: req.query.name, $options: "i" } },
            { lastname: { $regex: req.query.name, $options: "i" } },
            { email: { $regex: req.query.name, $options: "i" } },
        ];
    let query = User.find(queryStr);

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
    const total = await User.countDocuments(query);

    //paging
    const page = +req.query.page || 1;
    const limit = +req.query.limit || process.env.PRODUCT_LIMIT;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    const users = await query;
    return res.status(200).json({
        success: users ? true : false,
        total: total,
        users,
    });
});

const deleteUser = asyncHandler(async (req, res) => {
    const { _id } = req.query;
    if (!_id) throw new Error("User not found");
    const response = await User.findByIdAndDelete(_id);
    return res.status(200).json({
        success: response ? true : false,
        deleteUser: response
            ? `User with email ${response.email} deleted successfully`
            : "User not found",
    });
});

const updateUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    if (req?.file)
        req.body.avatar = { filename: req?.file?.filename, path: req?.file?.path };
    else delete req.body.avatar;
    const user = await User.findById(_id);
    if (user?.avatar?.filename && req.body.avatar)
        await cloudinary.v2.uploader.destroy(user.avatar.filename);

    const { password, role, ...userData } = req.body;
    if (!_id || Object.keys(userData).length === 0)
        throw new Error("Missing Input");
    const response =
        await User.findByIdAndUpdate(_id, userData, { new: true })
            .select("-refreshToken -password ")
            .populate("cart.product", productPopulate)
            .populate("auction.product", auctionProductPopulate);
    await response.populate("auction.product.highestBidder", "firstname lastname _id")
    return res.status(200).json({
        success: response ? true : false,
        updateUser: response,
    });
});

const updateUserByAdmin = asyncHandler(async (req, res) => {
    const { uid, ...updateFields } = req.body;
    if (Object.keys(updateFields).length === 0)
        throw new Error("Missing Input");
    if (updateFields.email) {
        const { error } = joi.object({ email }).validate(updateFields);
        if (error) return res.status(400).json({
            success: false,
            message: "Invalid Email",
        });
    }
    // if (updateFields.lastname) {
    //     const { error } = joi.object({ name }).validate(updateFields);
    //     if (error) return res.status(400).json({
    //         success: false,
    //         message: `Invalid Name`,
    //     });
    // }
    // if (updateFields.firstname) {
    //     console.log(updateFields);
    //     const { error } = joi.object({ name }).validate(updateFields);
    //     if (error) return res.status(400).json({
    //         success: false,
    //         message: `Invalid Name`,
    //     });
    // }
    if (updateFields.mobile) {
        const { error } = joi.object({ mobile }).validate(updateFields);
        if (error) return res.status(400).json({
            success: false,
            message: "Invalid Mobile",
        });
    }
    if (updateFields.status) {
        if (updateFields.status === "Blocked")
            updateFields.isBlocked = true
        else updateFields.isBlocked = false;
        delete updateFields.status;
    }
    if (updateFields.role) {
        if (updateFields.role === "User")
            updateFields.role = 4
        else updateFields.role = 5;

    }
    const response = await User.findByIdAndUpdate(uid, updateFields, {
        new: true,
    });
    return res.status(200).json({
        success: response ? true : false,
        updateUser: response,
    });
});

const addtoCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { pid, quantity, variants } = req.body;
    if (!req.body) throw new Error("Missing Input");
    const user = await User.findById(_id);
    const cart = user.cart;
    let alreadyProduct;
    const check = (itemVariants) => {
        if (!itemVariants) return true;
        return Object.keys(itemVariants).every(
            (key) => itemVariants[key] === variants[key]
        );
    };
    if (cart.length === 0) alreadyProduct = false;
    else {
        alreadyProduct = cart.find(
            (item) => item.product.toString() === pid && check(item.variants)
        );
    }
    let response;
    if (alreadyProduct) {
        cart.forEach((item) => {
            if (item.product.toString() === pid && check(item.variants)) {
                item.quantity += +quantity;
            }
            return item;
        });
        cart.sort();
        response = await User.findByIdAndUpdate(
            _id,
            {
                cart: cart,
            },
            { new: true }
        )
            .populate("cart.product", productPopulate)
            .populate("auction.product", auctionProductPopulate)
            .select("-refreshToken -password ");
    } else {
        response = await User.findByIdAndUpdate(
            _id,
            {
                $push: {
                    cart: {
                        product: pid,
                        variants: variants,
                        quantity: quantity,
                    },
                },
            },
            { new: true }
        )
            .populate("cart.product", productPopulate)
            .populate("auction.product", auctionProductPopulate)
            .select("-refreshToken -password ");
    }
    await response.populate("auction.product.highestBidder", "firstname lastname _id")
    res.status(200).json({
        success: response ? true : false,
        updateCart: response,
    });
});

const updateCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { cart } = req.body;
    const response = await User.findByIdAndUpdate(_id, { cart }, { new: true })
        .populate("cart.product", productPopulate)
        .populate("auction.product", auctionProductPopulate)
        .select("-refreshToken -password ");
    await response.populate("auction.product.highestBidder", "firstname lastname _id")

    res.status(200).json({
        success: response ? true : false,
        updateCart: response,
    });
});
module.exports = {
    register,
    login,
    getCurrentUser,
    refreshAccessToken,
    logout,
    forgotPassword,
    resetPassword,
    getUsers,
    deleteUser,
    updateUser,
    updateUserByAdmin,
    addtoCart,
    confirmRegistration,
    updateCart,
    createAccount,
};
