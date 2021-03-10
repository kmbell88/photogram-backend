const express = require('express');
const router = express.Router();
const PostsController = require('../controllers/posts');
const uploadImg = require('../middleware/upload-img');

router.get("/", PostsController.posts_get_all_posts);
router.get("/:postId", PostsController.posts_get_post_by_id);
router.post("/createPost", uploadImg.single('postImg'), PostsController.posts_create_post);
router.patch("/addComment", PostsController.posts_add_comment);
router.patch("/deletePost", PostsController.posts_delete_post);
router.patch("/likePost", PostsController.posts_update_like);

module.exports = router;