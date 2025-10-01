const Movie = require('../model/movie-model');
const APIFeature = require('../utils/apit-feature')
const asyncErrorHandler = require('../utils/aync-error-handler');
const customErrorHandler = require('../utils/custom-error-handler');

exports.highRatedMovies = (req, res,next) => {
    req.query.limit = 5;
    req.query.sort = '-ratings'; // - indicates descending order
    next();
}

exports.getAllMovies = asyncErrorHandler(async (req,res) => {    
    // let feature = new APIFeature(Movie.find(),req.query).sort().filter().paginate().limitFields()
    // let query = feature.query;
    // const movies = await query;
    let queryString = JSON.stringify(req.query);
    //add $ sign to the query field
    queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    const queryObject = JSON.parse(queryString);
    //const movies = await Movie.find(queryObject);
    //excluede the fields from the query
    let mongoQueryObject = { ...queryObject };
    const excludedFields = ['sort', 'page', 'limit', 'fields'];
    excludedFields.forEach(el => delete mongoQueryObject[el]);
    // if query has sort fields
    let query = Movie.find(mongoQueryObject)
    let sortBy = '-createdAt'; // default sort by createdAt in descending order
    let fields = '-__v'; //default fields to exclude
    //if query has multiple sort fields replace commas with spaces
    if(queryObject.sort) {
        sortBy = queryObject.sort.split(',').join(' ');
    }
    query = query.sort(sortBy)
    // if query has fields to select (projection)
    if(queryObject.fields) {
        fields = queryObject.fields.split(',').join(' ');
    }
    query = query.select(fields);
    //pagination
    const page = queryObject.page * 1 || 1;
    const limit = queryObject.limit * 1 || 10;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    if (queryObject.page) {
        const numMovies = await Movie.countDocuments();
        if (skip >= numMovies) {
            throw new Error('This page does not exist');
        }
    }    
    const movies = await query;
    // req.query.ratings = { $gte: req.query.ratings };
    // req.query.price = { $gte: req.query.price };
    // const movies = await Movie.find(req.query);
    // const movies = await Movie.find().where('ratings').lte(req.query.ratings);
    res.status(200).json({
        status: 'success',
        length: movies.length,
        data: {
            movies
        }
    })    
})

exports.getMovie = asyncErrorHandler(async (req,res, next) => {
    // Movie.findOne({_id: req.params.id})
    const movie = await Movie.findById(req.params.id)
    if (!movie) {
        // throw new Error(`Movie with id ${req.params.id} not found`);
        return next(new customErrorHandler(`Movie with id ${req.params.id} not found`, 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            movie
        }
    })
})

exports.createMovie = async (req,res, next) => {
    try {
        // Movie.save(req.body)
        const movie = await Movie.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                movie
            }
        });
    } catch (error) {
        return next (error);
    }
}

exports.updateMovie = async (req,res, next) => {
    try {
        const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
            new: true,  // return the updated document          
            runValidators: true // validate the updated document
        });
        if (!movie) {
            return next(new customErrorHandler(`Movie with id ${req.params.id} not found`, 404));
        } 
        res.status(200).json({
            status: 'success',
            data: {
                movie
            }
        }); 

    } catch (error) {        
        const err = new customErrorHandler(error.message, 500);
        // Pass the error to the global error handler   
        return next(err);       
    }
}

exports.deleteMovie = async (req,res, next) => {
    try {
        const movie = await Movie.findByIdAndDelete(req.params.id);        
        if (!movie) {
            return next(new customErrorHandler(`Movie with id ${req.params.id} not found`, 404));
        } 
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        // Pass the error to the global error handler
        return next(error);
    }
}

exports.deleteAllMovies = async (req,res) => {
    try {
        await Movie.deleteMany();
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

exports.getMovieState = async (req,res) => {
    try {
        const stats = await Movie.aggregate([
            {$match: {ratings: {$gte: 8.5}}},
            {$group:{
                _id: '$releaseYear',
                avgRatings: {$avg: '$ratings'},
                avgPrice: {$avg: '$price'},
                totalMovies: {$sum: 1},
                totalRatings: {$sum: '$ratings'},
                totalPrice: {$sum: '$price'},
                minRatings: {$min: '$ratings'},
                maxRatings: {$max: '$ratings'},
                minPrice: {$min: '$price'},
                maxPrice: {$max: '$price'}
            }},
            {$sort: {avgRatings: -1, avgPrice: -1}} // -1 indicates descending order
        ]);
        res.status(200).json({
            status: 'success',
            count: stats.length,
            data: {
                stats
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
}

exports.getMovieByGenre = async (req,res) => {
    try {
        const genre = req.params.genre;
        const movies = await Movie.aggregate([
            {$unwind: '$genres'}, // if a movie has multiple genres in an array, it will create a separate document for each genre
            {$group:{
                _id: '$genres',
                count: {$sum: 1},
                movies: {$push: '$name'}
            }},
            {$addFields: {genre: '$_id'}},
            {$project: {_id: 0}}, // exclude the _id field from the result
            {$match: { genre: { $regex: new RegExp(`^${genre}$`, 'i') } }},
            {$sort: {count: -1}}
        ]);
        res.status(200).json({
            status: 'success',
            count: movies.length,
            data: {
                movies
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
}