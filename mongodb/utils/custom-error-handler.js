class customError extends Error {
    constructor(message,statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // to distinguish between operational and programming errors
        // capture stack trace to exclude the constructor call from the stack trace
        // this keyword is having current error object
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = customError;