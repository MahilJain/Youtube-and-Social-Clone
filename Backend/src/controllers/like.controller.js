import { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleLike = (field, Model, label) => asyncHandler(async (req, res) => {
    const id = req.params[`${field}Id`]
    if (!isValidObjectId(id)) throw new ApiError(400, `Invalid ${field}Id`)
    if (!(await Model.exists({ _id: id }))) throw new ApiError(404, `${label} not found`)

    const criteria = { [field]: id, likedBy: req.user._id }
    const existing = await Like.findOne(criteria)
    if (existing) {
        await Like.deleteOne({ _id: existing._id })
        return res.status(200).json(new ApiResponse(200, { liked: false }, `${label} unliked successfully`))
    }
    const like = await Like.create(criteria)
    return res.status(201).json(new ApiResponse(201, { liked: true, like }, `${label} liked successfully`))
})

const toggleVideoLike = toggleLike("video", Video, "Video")
const toggleCommentLike = toggleLike("comment", Comment, "Comment")
const toggleTweetLike = toggleLike("tweet", Tweet, "Tweet")

const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await Like.find({ likedBy: req.user._id, video: { $exists: true } })
        .populate({ path: "video", populate: { path: "owner", select: "username fullName avatar" } })
        .sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, likes.map((like) => like.video).filter(Boolean), "Liked videos retrieved successfully"))
})

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos }
