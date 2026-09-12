import { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const parsePagination = (query) => {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100)
    return { page, limit }
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const getAllVideos = asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query)
    const { query, userId } = req.query
    const filter = { isPublished: true }
    if (query?.trim()) {
        const expression = { $regex: escapeRegex(query.trim()), $options: "i" }
        filter.$or = [{ title: expression }, { description: expression }]
    }
    if (userId) {
        if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid userId")
        filter.owner = userId
    }

    const allowedSortFields = ["createdAt", "updatedAt", "views", "title"]
    const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : "createdAt"
    const sort = req.query.sortType === "asc" ? 1 : -1
    const [videos, total] = await Promise.all([
        Video.find(filter)
            .populate("owner", "fullName username avatar")
            .sort({ [sortBy]: sort })
            .skip((page - 1) * limit)
            .limit(limit),
        Video.countDocuments(filter),
    ])
    return res.status(200).json(new ApiResponse(200, {
        videos,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }, "Videos retrieved successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, duration } = req.body || {}
    if (!title?.trim() || !description?.trim()) throw new ApiError(400, "Title and description are required")
    const videoPath = req.files?.videoFile?.[0]?.path || req.files?.video?.[0]?.path
    const thumbnailPath = req.files?.thumbnail?.[0]?.path
    if (!videoPath || !thumbnailPath) throw new ApiError(400, "Video file and thumbnail are required")
    const parsedDuration = Number(duration)
    if (!Number.isFinite(parsedDuration) || parsedDuration < 0) throw new ApiError(400, "A valid duration is required")

    const [videoUpload, thumbnailUpload] = await Promise.all([
        uploadOnCloudinary(videoPath),
        uploadOnCloudinary(thumbnailPath),
    ])
    if (!videoUpload || !thumbnailUpload) throw new ApiError(400, "Failed to upload video or thumbnail")

    const video = await Video.create({
        title: title.trim(),
        description: description.trim(),
        duration: parsedDuration,
        videoFile: videoUpload.secure_url || videoUpload.url,
        thumbnail: thumbnailUpload.secure_url || thumbnailUpload.url,
        owner: req.user._id,
        isPublished: req.body.isPublished !== "false" && req.body.isPublished !== false,
    })
    return res.status(201).json(new ApiResponse(201, video, "Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")
    const video = await Video.findOneAndUpdate(
        { _id: videoId, isPublished: true },
        { $inc: { views: 1 } },
        { new: true },
    ).populate("owner", "fullName username avatar")
    if (!video) throw new ApiError(404, "Video not found")

    if (req.user?._id) {
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { watchHistory: video._id },
        })
        await User.findByIdAndUpdate(req.user._id, {
            $push: { watchHistory: video._id },
        })
    }
    return res.status(200).json(new ApiResponse(200, video, "Video retrieved successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")
    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")
    if (video.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "You are not authorized to update this video")

    const { title, description, duration, isPublished } = req.body || {}
    if (title !== undefined) {
        if (!title.trim()) throw new ApiError(400, "Title cannot be empty")
        video.title = title.trim()
    }
    if (description !== undefined) video.description = description.trim()
    if (duration !== undefined) {
        if (!Number.isFinite(Number(duration)) || Number(duration) < 0) throw new ApiError(400, "Invalid duration")
        video.duration = Number(duration)
    }
    if (isPublished !== undefined) video.isPublished = isPublished === true || isPublished === "true"
    if (req.file) {
        const uploaded = await uploadOnCloudinary(req.file.path)
        if (!uploaded) throw new ApiError(400, "Failed to upload thumbnail")
        video.thumbnail = uploaded.secure_url || uploaded.url
    }
    await video.save()
    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")
    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")
    if (video.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "You are not authorized to delete this video")
    await Video.deleteOne({ _id: videoId })
    await User.updateMany({ watchHistory: videoId }, { $pull: { watchHistory: videoId } })
    return res.status(200).json(new ApiResponse(200, null, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")
    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")
    if (video.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "You are not authorized to change publish status")
    video.isPublished = !video.isPublished
    await video.save()
    return res.status(200).json(new ApiResponse(200, video, "Video publish status updated successfully"))
})

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus }
