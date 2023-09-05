const router = require("express").Router();
const { verifyToken, isAdmin } = require("../middleware/verifyToken");
const order = require("../controller/orderController");

router.post("/", [verifyToken, isAdmin], order.createOrder);


router.get("/",[verifyToken], order.getOrder);
router.get("/getall",[verifyToken, isAdmin], order.getOrders);

router.put("/:oid", [verifyToken, isAdmin], order.updateStatus);

router.delete("/:bcid", [verifyToken, isAdmin], order.deleteOrder);


module.exports = router;