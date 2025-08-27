const express = require('express')
const router = express.Router();
const authController = require('../controller/auth-controller');
const userController = require('../controller/user-controller')
const {protect} = authController;
const {getAllUsers, updatePassword, updateMe,deleteMe} = userController;
router.route('/').get(getAllUsers)
router.route('/updatepassword').patch(protect, updatePassword)
router.route('/updateprofile').patch(protect, updateMe)
router.route('/deleteprofile').delete(protect, deleteMe)

module.exports = router