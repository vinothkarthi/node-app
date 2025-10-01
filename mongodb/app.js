const express = require('express')
const rateLimit = require('express-rate-limit')
const movieRouter = require('./route/movie-router')
const authRouter = require('./route/auth-router')
const userRouter = require('./route/user-router')
const customErrorHandler = require('./utils/custom-error-handler')
const gobalErrorHandler = require('./controller/error-controller')
const helmet = require('helmet')
const sanitize = require('express-mongo-sanitize')
const xssClean = require('xss-clean')
const hpp = require('hpp')

const app = express()
app.use(helmet()) // set security HTTP headers like content-security-policy, X-Frame-Options, X-XSS-Protection etc.
// why we need rate limiting in our app

// Prevent brute-force attacks
    // Stops attackers from trying thousands of login attempts in a short time.
    // Example: Only allow 5 login attempts per IP in 15 minutes.

// prevent Denial of Servcie (DoS) attacks
    // Protects your app from accidental or intentional flooding.
    // Prevents a single user from consuming too many resources.
    //An evil regex is one that looks harmless but can lock up your app by making the regex engine do exponential backtracking on malicious input.
const limiter = rateLimit({
    max: 10,
    windowMs: 60 * 60 * 1000,
    message: "Reached maximum of request! please try again after an hour!" //429 status code
})
app.use('/api',limiter)
//middleware
app.use(express.json({limit: '10kb'})) // to prevent DoS attack use limit to mention the size of req.body
app.use(sanitize()) // to prevent no-sql query injection attack in req.body i.e removes $ and .
app.use(xssClean()) // to prevent HTML script injection attack in req.body i.e removes <script>
//parameter pollution - ?sort=price&sort=ratings => will get error
app.use(hpp({whitelist: ['sort']})) // to prevent parameter polution
// mount the movie router on the app
app.use('/api/v1/movies', movieRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', userRouter)

// if no route matches, send a 404 error
// app.use((req, res, next) => {
//     res.status(404).json({
//         status: 'fail',
//         message: `Route ${req.originalUrl} not found`
//     })
// })
app.all('*', (req, res, next) => {
    // const error = new Error(`Route ${req.originalUrl} not found`)
    // error.status = 'fail'
    // error.statusCode = 404
    const error = new customErrorHandler(`Route ${req.originalUrl} not found`, 404)
    next(error)
})
//global error handling middleware
// this will catch any error that is passed to next() in the route handlers
app.use(gobalErrorHandler)

module.exports = app