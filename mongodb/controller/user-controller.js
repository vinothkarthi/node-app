const User = require('../model/user-model');
const APIFeature = require('../utils/apit-feature');
const asyncErrorHandler = require('../utils/aync-error-handler')
const customErrorHandler = require('../utils/custom-error-handler')
const authController = require('../controller/auth-controller')
const {createSendToken} = authController


const filterFields = (fields, ...allFields) => {
    const filteredFields = {}
    Object.keys(fields).forEach(prop => {
        if(allFields.includes(prop))
            filteredFields[prop] = fields[prop]
    })
    return filteredFields;
}

exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
    const feature = new APIFeature(User.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const query = await feature.query;
    const users = await query;
    res.status(200).json({
        status: 'success',
        length: users.length,
        data: {
            users
        }
    });
})

exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
    // Get the user from the collection
    const user = await User.findById(req.user._id).select('+password');
    // Check if the current password is correct
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
        return next(new customErrorHandler('Your current password is wrong.', 401));
    }
    // If so, update the password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.isPasswordChangedAt = Date.now(); // Update the password changed timestamp
    await user.save(); // Save the updated user document
    // Log the user in, send JWT
    createSendToken(user, 200, res);
});

exports.updateMe = asyncErrorHandler(async (req,res,next) => {
    if(req.body.password || req.body.confirmPassword){
        return next(new customErrorHandler('You are not allowed to update the password by using this endpoint!', 400))
    }
    //update the name,emai field
    const filteredFilelds = filterFields(req.body, 'name', 'email')
    const updatedUser = await User.findByIdAndUpdate( req.user.id,filteredFilelds, {runValidators: true, new: true})
    res.status(200).json({
        status: "SUCCESS",
        data: {
            user: updatedUser
        }
    })
})

exports.deleteMe = asyncErrorHandler(async (req,res,next) => {
    //soft delete - not deleting from DB
    await User.findByIdAndUpdate( req.user._id, {active: false})
    res.status(204).json({
        status: "SUCCESS",
        data: null
    })
})