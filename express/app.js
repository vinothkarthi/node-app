const express = require('express')
const fs = require('fs')
const morgan = require('morgan')
const movieRouter = require('./route/movie-router')

const app = express()
//middleware
app.use(express.json())
//custom middleware
const logger = (req,res,next)=>{
    console.log('custom middleware creatd')
    next()
}
app.use(logger)
//3rd party middleware
if(process.env.NODE_ENV == 'dev')
app.use(morgan('dev'))
// Mount the movie router on the app
app.use('/api/v1/movies', movieRouter)
//to serve static file i.e HTML,CSS
app.use(express.static('./public'))

//get api
app.get('/',(req,res)=>{
    res.status(200).send('Welcome to Express JS')
})

// app.get('/api/v1/movies', getAllMovies)

//get api with params
// app.get('/api/v1/movies/:id/:name?', getMovie)

//post api
// app.post('/api/v1/movies', createMovie)

//patch api
// app.patch('/api/v1/movies/:id', updateMovie)

//delete api
// app.delete('/api/v1/movies/:id', deleteMovie)

module.exports = app
