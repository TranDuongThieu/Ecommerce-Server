const router = require("express").Router();
const { verifyToken, isAdmin } = require("../middleware/verifyToken");
const productController = require("../controller/auctionProductController");
const uploader = require("../config/cloudinary.config");
const { insertAuction } = require("../controller/insertData");

router.post("/", [verifyToken, isAdmin], uploader.fields([
    { name: 'image', maxCount: 10 },
    { name: 'thumb', maxCount: 1 }
]), productController.createAuctionProduct);
router.get("/:pid", productController.getAuctionProduct);
router.get("/", productController.getAllAuctionProduct);
router.delete("/:pid", productController.deleteAuctionProduct);
router.put("/:pid", [verifyToken, isAdmin], uploader.fields([
    { name: 'image', maxCount: 10 },
    { name: 'thumb', maxCount: 1 }
]), productController.updateAuctionProduct);

router.post("/bid", verifyToken, productController.bidProduct);

router.post("/insert", [verifyToken, isAdmin], insertAuction);

module.exports = router;
