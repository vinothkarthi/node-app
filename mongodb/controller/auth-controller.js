const User = require('../model/user-model');
const asyncErrorHandler = require('../utils/aync-error-handler');
const APIFeature = require('../utils/apit-feature');
const jwt = require('jsonwebtoken');
const customErrorHandler = require('../utils/custom-error-handler');
const util = require('util');
const sendMail = require('../utils/email');
const crypto = require('crypto');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { 
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const MAX_ATTEMPTS = 3;
const LOCK_TIME = 5 * 60 * 1000; // 5 minutes

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const options = {
        expires: new Date(Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000),
        maxAge: Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "prod"
    }
    // to avoid cross site script attack (XSS) sent & receive token through cookie
    //cross site scripting attack is a type of attack where the attacker tries to inject script into our web page to run some malicious code
    res.cookie('jwt',token,options)

    user.password = undefined

    res.status(statusCode).json({
        status: 'success',
        // token, // send the token in the response will lead cross-site script attack 
        data: {
            user // envelope the user data in a data object
        }   
    });
}

exports.signup = asyncErrorHandler(async (req, res, next) => {
    const user = await User.create(req.body);
    // Generate a JWT token for the user
    createSendToken(user, 201, res);
})

exports.login = asyncErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;
    // Check if email and password are provided
    if (!email || !password) {
        return next(new customErrorHandler('Please provide email and password', 400));
    }
    // Find the user by email
    const user = await User.findOne({ email }).select('+password');
    // Check if user exists
    if (!user) {
        return next(new customErrorHandler('User not found', 401));
    }
    // check password matches
    const isMatch = await user.correctPassword(password, user.password)
    // Check lock
    if (user.isLocked) {
        return next(new customErrorHandler(`Account locked. Try again after ${Math.ceil(
            (user.lockUntil - Date.now()) / 1000
        )} seconds.`,429))
    }
      if (!isMatch) {
        await User.findOneAndUpdate(
            { _id: user._id },
            { $inc: { loginAttempts: 1 } },
            { new: true } // return updated doc
            );

        if (user.loginAttempts >= MAX_ATTEMPTS) {
        await User.updateOne(
            { _id: user._id },
            {
            $set: {
                loginAttempts: 0,
                lockUntil: new Date(Date.now() + LOCK_TIME),
            },
            }
        );
        return next(new customErrorHandler("Too many attempts. Locked for 5 min." ,429));
        }

        return next(new customErrorHandler(`Wrong password. Attempts left: ${MAX_ATTEMPTS - user.loginAttempts}`, 401));
    }
    await User.updateOne(
    { _id: user._id },
    { $set: { loginAttempts: 0, lockUntil: null } }
    );
    // Generate a JWT token for the user
    createSendToken(user, 200, res);
})

exports.protect = asyncErrorHandler(async (req, res, next) => {
    // 1.Check if the token is provided in the headers
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new customErrorHandler('You are not logged in! Please log in to get access.', 401));
    }
    
    // 2.Verify the token
    const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3.Check if the user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
        return next(new customErrorHandler('The user belonging to this token does no longer exist.', 401));
    }

    // 4.Check if the user changed the password after the token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
        return next(new customErrorHandler('User recently changed password! Please log in again.', 401));
    }
    // 5.Grant access to the protected route
    req.user = user; // Attach the user to the request object
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // Check if the user has the required role
        if (!roles.includes(req.user.role)) {
            return next(new customErrorHandler('You do not have permission to perform this action', 403));
        }
        next();
    };
}

exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
    // check if the email is provided
    const { email } = req.body;
    if (!email) {
        return next(new customErrorHandler('Please provide your email', 400));
    }
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
        return next(new customErrorHandler('There is no user with this email address', 404));
    }
    // Generate a reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    // Create the reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    // Define the email options
    const options = {
        email: user.email,
        subject: 'Your password reset token (valid for 10 minutes)',
        text: `Forgot your password? Submit a request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`
    };
    // Send the email
    try {
        await sendMail(options);
        res.status(200).json({
            status: 'success',
            message: 'Reset password link sent to your email!'
        });
    } catch (err) {
        user.resetPasswordToken = undefined; // Remove the reset token from the user document
        user.resetPasswordExpires = undefined; // Remove the expiration time from the user document
        await user.save({ validateBeforeSave: false }); // Save the changes to the user document
        return next(new customErrorHandler('There was an error sending the email. Try again later!', 500));
    }
})

exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
    // Get the token from the URL
    const { token } = req.params;
    // Hash the token to compare with the stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    // Find the user by the hashed token and check if the token is still valid
    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() } // Check if the token is not expired
    });
    if (!user) {
        return next(new customErrorHandler('Token is invalid or has expired', 400));
    }
    // Update the user's password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.resetPasswordToken = undefined; // Remove the reset token
    user.resetPasswordExpires = undefined; // Remove the expiration time
    user.isPasswordChangedAt = Date.now(); // Update the password changed timestamp
    await user.save(); // Save the updated user document
    // Generate a new JWT token for the user
    createSendToken(user, 200, res);
});

