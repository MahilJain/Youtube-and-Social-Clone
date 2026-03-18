import mongoose from "mongoose"
import {Comment} from "../models/comments.model.js"
import {ApiErrors} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;
  if(!videoId)
 {
    throw new ApiErrors(404,"Video not found");
 }
  let filter = { video: videoId };
  if (query) {
    filter.text = { $regex: query, $options: "i" }; // search by text
  }
    const skip = (Number(page) - 1) * Number(limit);
      const comments = await Comment.find(filter)
    .populate("user", "username avatar") 
    .sort({ [sortBy]: sortType === "desc" ? -1 : 1 })
    .skip(skip)
    .limit(Number(limit));

      const totalComments = await Comment.countDocuments(filter);

  return res
    .status(200)
    .json(
      new ApiResponse(200, {
        comments,
        pagination: {
          total: totalComments,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalComments / Number(limit)),
        },
      })
    );



})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {content} = req.body
    const findVideo = await Video.findById(videoId);
    if(!findVideo) {
        throw new ApiErrors(404,"Video with the Id do not exists");
    }
    const comment = await Comment.create({
        video:videoId,
        content,
        user:req.user?._id,
    });
    return res.status(200).json(new ApiResponse({message: "Comment created successfully",data: comment}));
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId,videoId} = req.params
    const {content} = req.body
    const updateComment = await Comment.findByIdAndUpdate(commentId,
        {
        $set: {
            video:videoId,
           content,
           user:req.user?._id,
            }
        },{new : true}
    );
 return res.status(200).json(new ApiResponse({message:"Comment updated successfully",data:updateComment}))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const commentResponse = await Comment.findById(commentId);
    if(!commentResponse)
    {
        throw new ApiErrors(401,"Commnet not found");
    }
    await Comment.findByIdAndDelete(commentId);
  return res.status(200).json(new ApiResponse({message:"Coment deleted successfully",data:{}}))
});

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }