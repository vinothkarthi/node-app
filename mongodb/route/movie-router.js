const express = require('express');
const movieController = require('../controller/movie-controller');
const { getAllMovies, getMovie, createMovie, updateMovie, deleteMovie, deleteAllMovies, highRatedMovies, getMovieState, getMovieByGenre } = movieController;   
const authController = require('../controller/auth-controller');
const { protect, restrictTo } = authController;
// Create a router for movie-related routes
const router = express.Router();
router.route('/high-rated').get(highRatedMovies, getAllMovies);
router.route('/movie-stats').get(getMovieState);
router.route('/movies-by-genre/:genre').get(getMovieByGenre)
router.route('/').get(protect,getAllMovies).post(createMovie).delete(deleteAllMovies);
router.route('/:id').get(getMovie);
router.route('/:id').patch(updateMovie).delete(protect,restrictTo('admin'),deleteMovie);
// Export the movie router to be used in the main app
module.exports = router;