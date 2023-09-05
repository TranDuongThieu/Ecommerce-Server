const router = require("express").Router();
const { verifyToken, isAdmin } = require("../middleware/verifyToken");
const productCategoryController = require("../controller/productCategoryController");
const { insertCategory } = require("../controller/insertData");

router.get("/", productCategoryController.getPCategorys);
router.get("/:pcid", productCategoryController.getCategoryById);

router.post(
    "/",
    [verifyToken, isAdmin],
    productCategoryController.createPCategory
);
router.put(
    "/:pcid",
    [verifyToken, isAdmin],
    productCategoryController.updatePCategory
);
router.delete(
    "/:pcid",
    [verifyToken, isAdmin],
    productCategoryController.deletePCategory
);
router.post("/insert", [verifyToken, isAdmin], insertCategory);

module.exports = router;
