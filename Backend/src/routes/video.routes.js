import { Router } from "express"
import {
    deleteVideo, getAllVideos, getVideoById, publishAVideo,
    togglePublishStatus, updateVideo,
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

router.get("/", getAllVideos)
router.post(
    "/publish",
    verifyJWT,
    upload.fields([{ name: "videoFile", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]),
    publishAVideo,
)
router.patch("/toggle-publish/:videoId", verifyJWT, togglePublishStatus)
router.patch("/:videoId", verifyJWT, upload.single("thumbnail"), updateVideo)
router.delete("/:videoId", verifyJWT, deleteVideo)
router.get("/:videoId", getVideoById)

export default router
