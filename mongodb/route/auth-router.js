const express = require('express')
const router = express.Router();
const authController = require('../controller/auth-controller');
const { signup, getAllUsers, login , forgotPassword, resetPassword } = authController;
// Define the route

router.route('/signup').post(signup)
router.post('/login', login)
router.route('/forgotpassword').post(forgotPassword)
router.route('/resetpassword/:token').patch(resetPassword)

// Export the auth router to be used in the main app
module.exports = router;