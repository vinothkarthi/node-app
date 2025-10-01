const express = require('express')
const movieController = require('../controller/movie-controller')
const { checkId, checkReqBody, getAllMovies, getMovie, createMovie, updateMovie, deleteMovie } = movieController 
// Create a router for movie-related routes  
const movieRouter = express.Router()
movieRouter.param('id', checkId)
movieRouter.route('/').get(getAllMovies).post(checkReqBody,createMovie)
movieRouter.route('/:id/:name?').get(getMovie) // name is optional parameter
movieRouter.route('/:id').patch(updateMovie).delete(deleteMovie)
// Export the movie router to be used in the main app
module.exports = movieRouter