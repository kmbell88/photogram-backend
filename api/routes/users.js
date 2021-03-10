const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/users');
const uploadImg = require('../middleware/upload-img');

// Handle GET methods: Get all, get by username, get by userId
router.get('/', UsersController.user_get_all);
router.get('/id/:userId', UsersController.user_get_by_id);
router.get('/username/:username', UsersController.user_get_by_username);

// Handle POST methods: Signup, login, deactivate, update follow, update bookmark
router.post('/register', UsersController.user_register);
router.post('/login', UsersController.user_login);
router.post('/updateFollow', UsersController.user_update_follow);
router.post('/updatePic', uploadImg.single('postImg'), UsersController.user_upload_profile_picture);
router.patch('/updateBookmark', UsersController.user_update_bookmark);

// Handle PATCH method: Update password, deactivate user
router.patch('/updateUsername', UsersController.user_update_username);
router.patch('/updateDisplayName', UsersController.user_update_display_name);
router.patch('/updateDescription', UsersController.user_update_description);
// router.patch('/updatePassword', UsersController.user_update_password);
router.patch('/deactivate', UsersController.user_deactivate_account);

// Handle DELETE method: Delete user
router.delete('/:userId', UsersController.user_delete);

module.exports = router;
