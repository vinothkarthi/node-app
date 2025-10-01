const mongoose = require('mongoose')
const fs = require('fs');
const validator = require('validator');
// create schema and model
const movieSchema = new mongoose.Schema({
     name: {
        type: String,
        required: [true, 'Name is required field!'],
        unique: true,
        maxlength: [100, "Movie name must not have more than 100 characters"],
        minlength: [4, "Movie name must have at least 4 charachters"],
        trim: true,
        // validate: [validator.isAlpha, 'Movie name must only contain letters']
    },
    description: {
        type: String,
        required: [true, 'Description is required field!'],
        trim: true
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required field!']
    },
    ratings: {
        type: Number,
        // min: [1, "rating should be at least 1"],
        // max: 10,
        // validate: function(val) {
        //     return val >= 1 && val <= 10;
        // }
        validate: {
            validator: function(val) {
                //if we use this.ratings, it will not work when updating the document
                //so we use val instead of this.ratings
                return val >= 1 && val <= 10;                
            },
            //how to use val here            
            message: 'Rating ({VALUE}) should be between 1 and 10'
        }
    },
    totalRating: {
        type: Number
    },
    releaseYear: {
        type: Number,
        required: [true, 'Release year is required field!']
    },
    releaseDate:{
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    genres: {
        type: [String],
        required: [true, 'Genres is required field!'],
        enum: {
            values: ['Action', 'Adventure', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation', 'Documentary', 'Fantasy'],
            message: 'Genre is either: Action, Adventure, Comedy, Drama, Horror, Romance, Sci-Fi, Thriller, Animation, Documentary, Fantasy'
        }
    },
    directors: {
        type: [String],
        required: [true, 'Directors is required field!']
    },
    coverImage:{
        type: String,
        require: [true, 'Cover image is required field!']
    },
    actors: {
        type: [String],
        require: [true, 'actors is required field!']
    },
    price: {
        type: Number,
        require: [true, 'Price is required field!']
    },
    createdBy: {
        type: String
    }
},
{toJSON:{virtuals: true}, toObject: {virtuals: true}}
)

//create pre hook
//document middleware
movieSchema.pre('save', function(next) {
    // we can't use arrow function here because we need to use this keyword
    //arrow functions do not have their own this context
    this.createdBy = this.createdBy || 'admin'; // set default createdBy to 'admin' if not provided
    next();
})
//query middleware
movieSchema.pre(/^find/, function(next) {
    this.find({releaseDate: {$lte: Date.now()}}); // filter out movies released in the future
    this.startTime = Date.now();
    next();
})
//aggregation middleware
movieSchema.pre('aggregate',function(next) {
    this.pipeline().unshift({$match: {releaseDate: {$lte: new Date()}}}); // filter out movies released in the future
    //.pipeline() gives you direct access to the array of aggregation stages you passed into aggregate()
    //unshift() adds a new element to the beginning of the pipeline array.
    //why we use new Date() instead of Date.now()?
    //because Date.now() returns a timestamp, but we need a Date object for the $match stage
    this.startTime = Date.now();
    next();
})

// create post hook
//document middleware
movieSchema.post('save', function(doc, next) {
    fs.writeFileSync('./logs/movie-logs.txt', `Movie ${doc.name} created by ${doc.createdBy} on ${new Date()}\n`, {flag: 'a'}, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
    next();
})
//query middleware
movieSchema.post(/^find/, function(docs, next) {
    const duration = Date.now() - this.startTime;
    fs.appendFileSync('./logs/movie-logs.txt', `Query executed in ${duration}ms\n`, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
    next();
})
//aggregation middleware
movieSchema.post('aggregate', function(docs, next) {
    const duration = Date.now() - this.startTime;
    fs.appendFileSync('./logs/movie-logs.txt', `Aggregation executed in ${duration}ms\n`, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
    next();
})

// virtual property to get duration in hours
movieSchema.virtual('durationInHrs').get(function() {
    return +(this.duration / 60).toFixed(2);
})

const Movie = mongoose.model('Movie', movieSchema)

module.exports = Movie;