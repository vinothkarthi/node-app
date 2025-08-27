const customErrorHandler = require('../utils/custom-error-handler');

const devErrror = (res,err) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err
    })      
}

const CastError = (err) => {
    err.message = `Invalid ${err.path}: ${err.value}`;
    err.statusCode = 400;
    return new customErrorHandler(err.message, err.statusCode);
}

const duplicateError = (err) => {
    err.message = `Duplicate field value: ${Object.keys(err.keyValue)[0]}: ${Object.values(err.keyValue)[0]}. Please use another value!`;
    err.statusCode = 400;
    return new customErrorHandler(err.message, err.statusCode);
}

const validatorError = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    err.message = `Invalid input data: ${errors.join('. ')}`;
    err.statusCode = 400;   
    return new customErrorHandler(err.message, err.statusCode);
}

const prodErrror = (res,err) => { 
    if(err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        res.status(err.statusCode).json({
        status: 'error',
        message: 'Internal Server Error'
        })  
    }        
}

const handleJWTError = (err) => {
    err.message = 'Invalid token. Please log in again!';
    err.statusCode = 401;
    return new customErrorHandler(err.message, err.statusCode);
}

const handleJWTExpiredError = (err) => {
    err.message = 'Your token has expired! Please log in again.';
    err.statusCode = 401;
    return new customErrorHandler(err.message, err.statusCode); 
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    err.stack = err.stack || 'No stack trace available'   
    console.log(err);
    if (process.env.NODE_ENV === 'dev') {
        devErrror(res, err);
    } else if (process.env.NODE_ENV === 'prod') {
        if(err.name === 'CastError') err = CastError(err); // handle invalid ObjectId errors
        if(err.code === 11000) err = duplicateError(err); // handle duplicate key errors
        if(err.name === 'ValidationError') err = validatorError(err); // handle validation errors
        if(err.name === 'JsonWebTokenError') err= handleJWTError(err); // handle JWT errors
        if(err.name === 'TokenExpiredError') err = handleJWTExpiredError(err); // handle expired JWT errors
        prodErrror(res, err);
    } 
}