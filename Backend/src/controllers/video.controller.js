import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    //steps for getting all videos:
    //1. build filter object based on query parameters (like title, description, tags)
    //2. build sort object based on sortBy and sortType
    //3. use pagination with page and limit

    const filter = {
        isPublished: true
    }

    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId")
        }
        filter.owner = userId
    }

    const sort = {}
    if (sortBy && sortType) {
        sort[sortBy] = sortType === "asc" ? 1 : -1
    }

    const videos = await Video.find(filter).sort(sort).limit(parseInt(limit)).skip((page - 1) * parseInt(limit))
    return res.status(200).json(
        new ApiResponse(200, videos, "Videos retrieved successfully")
    )

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    //steps for publishing a video:
    //1. validate input data (title, description, video file)
    //2. upload video file to cloudinary and get the URL
    //3. create a new video document in the database with the details and cloudinary URL

    const videoLocalPath = req.files?.videoFile[0].path
    const thumbnailLocalPath = req.files?.thumbnail[0].path

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file and thumbnail are required")
    }

    const videoUploadResponse = await uploadOnCloudinary(videoLocalPath)
    const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoUploadResponse || !thumbnailUploadResponse) {
        throw new ApiError(400, "Failed to upload video or thumbnail")
    }

    const newVideo = await Video.create({
        title,
        description,
        videoUrl: videoUploadResponse.url,
        thumbnail: thumbnailUploadResponse.url,
        owner: req.user?._id,
        isPublished: true,
        views: 0,
    })
    return res.status(201).json(
        new ApiResponse(201, newVideo, "Video published successfully")
    )
})
    
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    //steps for getting video by ID:
    //1. validate videoId
    //2. find video by ID and populate owner details
    //3. return video details in response
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }
    const video = await Video.findById(videoId).populate("owner", "name email")
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    return res.status(200).json(
        new ApiResponse(200, video, "Video retrieved successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //steps for updating video:
    //1. validate videoId
    //2. validate input data (title, description, thumbnail)
    //3. find video by ID and update the details
    //4. return updated video details in response
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    if(video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }
    const { title, description , duration} = req.body;
    if(title) video.title = title
    console.log("Current title: ", video.title)
    if(description !== undefined) video.description = description;

    if(duration) video.duration = duration;

    if(req.file){
        const thumbnailLocalPath = req.file.path
        const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath)
        if(!thumbnailUploadResponse) {
            throw new ApiError(400, "Failed to upload thumbnail")
        }
        video.thumbnail = thumbnailUploadResponse.secure_url || thumbnailUploadResponse.url;
    }

    try {
        await video.save();
        console.log("Updated video: ", video)
    } catch (error) {
        console.error("Error saving video: ", error)
        throw new ApiError(500, error.message)
    }
    return res.status(200).json(
        new ApiResponse(200, video, "Video updated successfully")
    );
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //steps for deleting a video:
    //1. validate videoId
    //2. find video by ID and delete it
    //3. return success message in response
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }
    if(video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video")
    }
    await Video.findByIdAndDelete(videoId)
    return res.status(200).json(
        new ApiResponse(200, null, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }
    if(video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to change publish status of this video")
    }
    video.isPublished = !video.isPublished;
    await video.save();
    return res.status(200).json(
        new ApiResponse(200, video, "Video publish status toggled successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}