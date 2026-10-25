import { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const pagination = (query) => ({
    page: Math.max(Number.parseInt(query.page, 10) || 1, 1),
    limit: Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100),
})

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")
    if (!(await Video.exists({ _id: videoId }))) throw new ApiError(404, "Video not found")

    const { page, limit } = pagination(req.query)
    const filter = { video: videoId }
    if (req.query.query?.trim()) filter.content = { $regex: escapeRegex(req.query.query.trim()), $options: "i" }
    const sort = req.query.sortType === "asc" ? 1 : -1
    const [comments, total] = await Promise.all([
        Comment.find(filter)
            .populate("owner", "username fullName avatar")
            .sort({ createdAt: sort })
            .skip((page - 1) * limit)
            .limit(limit),
        Comment.countDocuments(filter),
    ])
    return res.status(200).json(new ApiResponse(200, {
        comments,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }, "Comments retrieved successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")
    if (!(await Video.exists({ _id: videoId }))) throw new ApiError(404, "Video not found")
    const content = req.body?.content?.trim()
    if (!content) throw new ApiError(400, "Comment content is required")
    const comment = await Comment.create({ video: videoId, content, owner: req.user._id })
    await comment.populate("owner", "username fullName avatar")
    return res.status(201).json(new ApiResponse(201, comment, "Comment created successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid commentId")
    const content = req.body?.content?.trim()
    if (!content) throw new ApiError(400, "Comment content is required")
    const comment = await Comment.findById(commentId)
    if (!comment) throw new ApiError(404, "Comment not found")
    if (comment.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "You are not authorized to update this comment")
    comment.content = content
    await comment.save()
    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid commentId")
    const comment = await Comment.findById(commentId)
    if (!comment) throw new ApiError(404, "Comment not found")
    if (comment.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "You are not authorized to delete this comment")
    await Comment.deleteOne({ _id: commentId })
    return res.status(200).json(new ApiResponse(200, null, "Comment deleted successfully"))
})

export { getVideoComments, addComment, updateComment, deleteComment }
