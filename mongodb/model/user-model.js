const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs'); 
const crypto = require('crypto'); // built-in module

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'A user name must have less or equal than 50 characters'],
        minlength: [3, 'A user name must have more or equal than 3 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [4, 'A user password must have more or equal than 8 characters'],
        select: false // Do not return the password in queries
    },
    confirmPassword: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This only works on CREATE and SAVE
            validator: function(el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    isPasswordChangedAt: {
        type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    // Track login attempts
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null }
})

userSchema.pre('save', async function(next) {
    // Hash the password before saving it to the database
    if (!this.isModified('password')) return next();
    // hash means encrypt
    //salt means random string to make the hash more secure
    this.password = await bcrypt.hash(this.password, 12); // 12 is the number of rounds for hashing
    this.confirmPassword = undefined; // Remove confirmPassword from the document
    next();
});

userSchema.pre(/^find/, function(next) {
    this.find({active: {$ne: false}})
    next()
})

userSchema.methods.correctPassword = async function(reqpassword, dbpassword) {
    // Compare the password in req with the password in the database
    return await bcrypt.compare(reqpassword, dbpassword);
}

// Helper: check if account is locked
userSchema.virtual("isLocked").get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    // Check if the password was changed after the token was issued 
    if (this.isPasswordChangedAt) {
        const changedTimestamp = Math.floor(this.isPasswordChangedAt.getTime() / 1000); // Convert to seconds
        return JWTTimestamp < changedTimestamp; // If the token was issued before the password was changed, return true
    }
    return false; // If the password was not changed, return false
}

userSchema.methods.createPasswordResetToken = function() {
    // Create a reset token for password reset
    const resetToken = crypto.randomBytes(32).toString('hex'); // Generate a random token (plain text)
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // Hash the token and save it to the database
    this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Set the expiration time for the token (10 minutes)
    return resetToken; // Return the plain text token to send to the user
}

const User = mongoose.model('User', userSchema);
module.exports = User;