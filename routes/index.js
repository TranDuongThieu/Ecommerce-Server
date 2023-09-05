const userRouter = require("./user");
const productRouter = require("./product");
const productCategoryRouter = require("./productCategory");
const blogCategoryRouter = require("./blogCategory");
const blogRouter = require("./blog");
const brandRouter = require("./brand");
const couponRouter = require("./coupon");
const orderRouter = require("./order");
const { notFound, errHandler } = require("../middleware/errorHandler");
const initRoutes = (app) => {
    app.use("/api/user", userRouter);
    app.use("/api/product", productRouter);
    app.use("/api/product-category", productCategoryRouter);
    app.use("/api/blog-category", blogCategoryRouter);
    app.use("/api/blog", blogRouter);
    app.use("/api/brand", brandRouter);
    app.use("/api/coupon", couponRouter);
    app.use("/api/order", orderRouter);

    app.use(notFound);
    app.use(errHandler);
};

module.exports = initRoutes;
