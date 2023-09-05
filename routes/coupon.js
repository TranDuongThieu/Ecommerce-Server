const router = require("express").Router();
const { verifyToken, isAdmin } = require("../middleware/verifyToken");
const coupon = require("../controller/couponController");

router.get("/", coupon.getCoupons);
router.post("/", [verifyToken, isAdmin], coupon.createCoupon);
router.put("/:cpip", [verifyToken, isAdmin], coupon.updateCoupon);
router.delete("/:cpip", [verifyToken, isAdmin], coupon.deleteCoupon);

module.exports = router;
