// config envirnment variables
const dotEnv = require('dotenv')
dotEnv.config({path: './config.env'})

// create server
const server = require('./app');

const port = process.env.PORT || 3000

server.listen(port,()=>{
    console.log('server started')
})
