const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const verifyToken = asyncHandler(async (req, res, next) => {
    if (req?.headers?.authorization?.startsWith("Bearer")) {
        const token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
            if (err)
                return res.status(401).json({
                    success: false,
                    message: "Invalid Access Token",
                });
            req.user = decode;
            next();
        });
    } else
        return res.status(401).json({
            success: false,
            message: "Required Access Token",
        });
});
const isAdmin = asyncHandler(async (req, res, next) => {
    const { role } = req.user;
    if (role !== 5) throw new Error("Require Admin Role");
    next();
});

module.exports = {
    verifyToken,
    isAdmin,
};
