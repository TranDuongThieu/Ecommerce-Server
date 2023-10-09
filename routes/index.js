const userRouter = require("./user");
const productRouter = require("./product");
const productCategoryRouter = require("./productCategory");
const brandRouter = require("./brand");
const orderRouter = require("./order");
const auctionProductRouter = require('./auctionProduct')
const { notFound, errHandler } = require("../middleware/errorHandler");
const initRoutes = (app) => {
    app.use("/api/user", userRouter);
    app.use("/api/product", productRouter);
    app.use("/api/product-category", productCategoryRouter);
    app.use("/api/brand", brandRouter);
    app.use("/api/order", orderRouter);
    app.use("/api/auction", auctionProductRouter);

    app.use(notFound);
    app.use(errHandler);
};

module.exports = initRoutes;
