import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    
    const userId = req.user?._id
    
    const likeExists = await Like.findOne({
        video: videoId,
        user: userId
    })
    
    if (likeExists) {
        await Like.findByIdAndDelete(likeExists._id)
        return res.status(200).json(
            new ApiResponse(200, null, "Like removed successfully")
        )
    } else {
        const like = await Like.create({
            video: videoId,
            likedBy: userId
        })
        return res.status(201).json(
            new ApiResponse(201, like, "Video liked successfully")
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }
    const userId = req.user?._id
    const likeExists = await Like.findOne({
        comment: commentId,
        user: userId
    });
    if(likeExists) {
        await Like.findByIdAndDelete(likeExists._id)
        return res.status(200).json(
            new ApiResponse(200, null, "Like removed successfully")
        )
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}