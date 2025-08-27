const fs = require('fs')
const movies = JSON.parse(fs.readFileSync('./data/movies.json'))

// check id params in the URL
exports.checkId = (req,res,next,value)=>{
    const movie = movies.find(movie => movie.id == value*1)
    if(!movie) {
        return res.status(404).json({
        status: "FAIL",
        message: `movie with id ${value} not found`
    })
    }
    next()
}

//check req has body
exports.checkReqBody = (req,res,next)=>{
    if(!req.body.name || !req.body.releaseYear) {
        return res.status(400).json({
        status: "FAIL",
        message: "Bad Request"
    })
    }
    next()
}

// route handlers for movie operations
exports.getAllMovies = (req,res)=>{
    res.status(200).json({
        status: "SUCCESS",
        data: {
            movies
        }
    })
}

exports.getMovie = (req,res)=>{
    const id = +req.params.id;
    const movie = movies.find(movie => movie.id == id)
    res.status(200).json({
        status: "SUCCESS",
        data: {
            movie
        }
    }) 
}

exports.createMovie = (req,res)=>{
    const id = movies[movies.length - 1].id + 1
    const movie = {
        id,
        ...req.body
    }
    movies.push(movie)
    fs.writeFile('./data/movies.json',JSON.stringify(movies),(err)=>{
        if(err) {
            return res.status(500).json({
                status: "ERROR",
                message: err.message
            })
        }
        res.status(201).json({
            status: "SUCCESS",
            data: {
                movie
            }
        })
    })
}

exports.updateMovie = (req,res)=>{
    const id = +req.params.id
    const movie = movies.find(movie => movie.id == id)
    const movieIndex = movies.indexOf(movie)
    const updatedMovie = {
        ...movie,
        ...req.body
    }
    movies[movieIndex] = updatedMovie
    fs.writeFile('./data/movies.json',JSON.stringify(movies),(err)=>{
        if(err) {
            return res.status(500).json({
                status: "ERROR",
                message: err.message
            })
        }
        res.status(200).json({
            status: "SUCCESS",
            data: {
                movie: updatedMovie
            }
        })
    })
}

exports.deleteMovie = (req,res)=>{
    const id = +req.params.id;
    const movieToDelete = movies.find(movie => movie.id == id);
    const movieIndex = movies.indexOf(movieToDelete)
    movies.splice(movieIndex,1)
    fs.writeFile('./data/movies.json',JSON.stringify(movies),(err)=>{
        if(err) {
            return res.status(500).json({
                status: "ERROR",
                message: err.message
            })
        }
        res.status(204).json({
            status: "SUCCESS",
            data: {
                movie: null
            }
        })
    })
}