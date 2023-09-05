const router = require("express").Router();
const { verifyToken, isAdmin } = require("../middleware/verifyToken");
const productController = require("../controller/productController");
const uploader = require("../config/cloudinary.config");
const { insertData } = require("../controller/insertData");

router.post("/", [verifyToken, isAdmin], uploader.fields([
    { name: 'image', maxCount: 10 },
    { name: 'thumb', maxCount: 1 }
]), productController.createProduct);
router.get("/:pid", productController.getProduct);
router.get("/", productController.getAllProduct);
router.delete("/:pid", productController.deleteProduct);
router.put("/:pid", [verifyToken, isAdmin], uploader.fields([
    { name: 'image', maxCount: 10 },
    { name: 'thumb', maxCount: 1 }
]), productController.updateProduct);
router.post("/rating", verifyToken, productController.ratingProduct);
router.post("/insert", [verifyToken, isAdmin], insertData);
router.put(
    "/upload-image/:pid",
    [verifyToken, isAdmin],
    uploader.array("images", 10),
    productController.uploadImgProduct
);

module.exports = router;
