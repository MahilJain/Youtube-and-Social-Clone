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
    } else {
        const like = await Like.create({
            comment: commentId,
            likedBy: userId
        })
        return res.status(201).json(
            new ApiResponse(201, like, "Comment liked successfully")
        )
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    //steps for toggling like on tweet:
    //1. validate tweetId
    //2. check if like already exists for the tweet and user
    //3. if like exists, remove it and return response
    //4. if like does not exist, create it and return response

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }
    const userId = req.user?._id;
    const likeExists = await Like.findOne({
        tweet: tweetId,
        user:userId
    })
    if(likeExists) {
        await Like.findByIdAndDelete(likeExists._id)
        return res.status(200).json(
            new ApiResponse(200, null, "Like removed successfully")
        )
    } else {
        const like = await Like.create({
            tweet: tweetId,
            likedBy: userId
        })
        return res.status(201).json(
            new ApiResponse(201, like, "Tweet liked successfully")
        )
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //steps to get all liked videos:
    //1. get user ID from request
    //2. find all likes for the user where video field is not null
    //3. populate the video field to get video details
    //4. return the list of liked videos in response
    
    const userId = req.user?._id
    const likedVideos = await Like.find({
        likedBy: userId,
        video: { $ne: null }
    }).populate("video")
    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos retrieved successfully")
    )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}