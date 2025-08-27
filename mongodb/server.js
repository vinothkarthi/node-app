const dotEnv = require('dotenv')
dotEnv.config({path: './config.env'})

const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Optionally, you can exit the process
    process.exit(1); //1 indicates an error occurred, 0 indicates success
});

const server = require('./app');

// mongoose connection
mongoose.connect(process.env.DB_CONN_STRING, {
    useNewUrlParser: true}).then((conn) => {
    console.log('Connected to MongoDB successfully')
})

//create server
const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    // Optionally, you can exit the process
    server.close(() => {
        process.exit(1); //1 indicates an error occurred, 0 indicates success
    });
});

// console.log(x); // This will throw an error if x is not defined, demonstrating uncaught exception handling