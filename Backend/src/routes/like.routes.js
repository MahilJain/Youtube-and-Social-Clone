import { Router } from "express"
import {
    getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike,
} from "../controllers/like.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)
router.post("/toggle/v/:videoId", toggleVideoLike)
router.post("/toggle/c/:commentId", toggleCommentLike)
router.post("/toggle/t/:tweetId", toggleTweetLike)
router.get("/videos", getLikedVideos)

export default router
