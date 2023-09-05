const router = require("express").Router();
const { verifyToken, isAdmin } = require("../middleware/verifyToken");
const blogCategory = require("../controller/blogCategoryController");

router.get("/", blogCategory.getBlogCategorys);
router.post("/", [verifyToken, isAdmin], blogCategory.createBlogCategory);
router.put("/:bcid", [verifyToken, isAdmin], blogCategory.updateBlogCategory);
router.delete("/:bcid", [verifyToken, isAdmin], blogCategory.deleteBlogCategory);



module.exports = router;