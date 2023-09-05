const router = require("express").Router();
const { verifyToken, isAdmin } = require("../middleware/verifyToken");
const branController = require("../controller/brandController");

router.get("/", branController.getBrands);
router.post("/", [verifyToken, isAdmin], branController.createBrand);
router.put("/:brid", [verifyToken, isAdmin], branController.updateBrand);
router.delete("/:brid", [verifyToken, isAdmin], branController.deleteBrand);


module.exports = router;