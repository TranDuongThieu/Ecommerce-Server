const router = require("express").Router();
const userController = require("../controller/userController");
const { verifyToken, isAdmin } = require("../middleware/verifyToken");
const uploader = require("../config/cloudinary.config");

router.post("/register", userController.register);
router.post("/confirm", userController.confirmRegistration);
router.post("/create", [verifyToken, isAdmin], userController.createAccount);

router.post("/login", userController.login);
router.post("/refreshtoken", userController.refreshAccessToken);
router.post("/logout", userController.logout);

router.post("/forgot", userController.forgotPassword);
router.put("/resetpassword", userController.resetPassword);

router.get("/current", verifyToken, userController.getCurrentUser);

router.delete("/", [verifyToken, isAdmin], userController.deleteUser);
router.get("/", [verifyToken, isAdmin], userController.getUsers);

router.put("/addtocart", verifyToken, userController.addtoCart);
router.put("/updatecart", verifyToken, userController.updateCart);

router.put("/updateuser-admin", [verifyToken, isAdmin], userController.updateUserByAdmin);
router.put("/", verifyToken, uploader.single("avatar"), userController.updateUser);

module.exports = router;
