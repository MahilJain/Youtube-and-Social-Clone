import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { ApiError } from "./utils/ApiError.js"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
}))

app.use(express.json({limit: "20kb"}))
app.use(express.urlencoded({extended: true, limit :'16kb'}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from './routes/comment.routes.js'
import likeRouter from './routes/like.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import healthcheckRouter from './routes/healthcheck.routes.js'


//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)

app.use((req, res, next) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
})

app.use((error, req, res, next) => {
    const statusCode = error.statusCode
        || (error.name === "ValidationError" || error.name === "CastError" || error.name === "MulterError" ? 400 : 0)
        || (error.code === 11000 ? 409 : 500)
    const message = statusCode === 500 ? "Internal server error" : error.message
    if (res.headersSent) return next(error)
    return res.status(statusCode).json({
        statusCode,
        success: false,
        message,
        errors: error.errors || [],
    })
})

//http://localhost:8000/api/v1/users/register
export {app}