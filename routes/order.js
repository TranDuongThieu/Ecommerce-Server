const router = require("express").Router();
const { verifyToken, isAdmin } = require("../middleware/verifyToken");
const order = require("../controller/orderController");

router.post("/", order.createOrder);
router.get("/getOTP/:email", order.sendOTPverifyOrder)
router.get("/get-one/:_id", order.getOrder);

router.get("/getall",[verifyToken, isAdmin], order.getOrders);
router.put("/cancel/:oid", order.cancelOrder);
router.put("/:oid", [verifyToken, isAdmin], order.updateStatus);
router.delete("/:bcid", [verifyToken, isAdmin], order.deleteOrder);


module.exports = router;