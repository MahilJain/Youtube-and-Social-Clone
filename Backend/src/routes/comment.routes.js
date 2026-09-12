import { Router } from "express"
import {
    addComment, deleteComment, getVideoComments, updateComment,
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.get("/:videoId", getVideoComments)
router.post("/:videoId", verifyJWT, addComment)
router.patch("/c/:commentId", verifyJWT, updateComment)
router.delete("/c/:commentId", verifyJWT, deleteComment)

export default router
