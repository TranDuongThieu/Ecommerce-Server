const router = require("express").Router();
const { verifyToken, isAdmin } = require("../middleware/verifyToken");
const blogController = require("../controller/blogController");
const uploader = require("../config/cloudinary.config")
router.get("/", blogController.getBlogs);
router.get("/detail/:bid", blogController.getDetailBlog);

router.post("/", [verifyToken, isAdmin], blogController.createBlog);
router.put("/:bid", [verifyToken, isAdmin], blogController.updateBlog);
router.delete("/:bid", [verifyToken, isAdmin], blogController.deleteBlog);


router.put("/like/:bid", verifyToken, blogController.likeBlog);
router.put("/dislike/:bid", verifyToken, blogController.disLikeBlog);

router.put("/upload-image/:bid",[verifyToken, isAdmin],uploader.single("image"), blogController.uploadImgBlog);

module.exports = router;
