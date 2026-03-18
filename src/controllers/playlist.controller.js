import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name) {
        throw new ApiError(400, "Playlist name is required")
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,  // assuming JWT middleware sets req.user
        videos: []             // default empty
    })
    return res
        .status(201)
        .json(new ApiResponse(201, playlist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!userId) {
        throw new ApiError(400, "User ID is required")
    }

    const videos = await Playlist.find({ owner: userId }).populate("videos")
    return res
        .status(200)
        .json({ message: "Playlists fetched successfully", data: videos })

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId) {
        throw new ApiError(400, "Playlist id not exists")
    }
    const playlist = await Playlist.findById(playlistId)
    return res
        .status(200)
        .json({ message: "Playlist fetched successfully", data: playlist })
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId) {
        throw new ApiError(400, "Playlist id not exists")
    }

    const playlist = await Playlist.findById(playlistId,
        {
            $push: { videos: videoId }
        },
        { new: true }
    )
    return res
        .status(200)
        .json({ message: "Video added to playlist successfully", data: playlist })
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    
    if (!playlistId) {
        throw new ApiError(400, "Playlist id not exists")
    }
    const playlist = await Playlist.findById(playlistId,
        {
            $pull: { videos: videoId }
        },
        { new: true }
    )
    return res
        .status(200)
        .json({ message: "Video removed from playlist successfully", data: playlist })

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    
    if (!playlistId) {
        throw new ApiError(400, "Playlist id not exists")
    }

    const deletion = await Playlist.findByIdAndDelete(playlistId)
    return res
        .status(200)
        .json({ message: "Playlist deleted successfully", data: deletion })
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    
    if (!playlistId) {
        throw new ApiError(400, "Playlist id not exists")
    }
    const update = await Playlist.findByIdAndUpdate(playlistId,{
        name,
        description,
        owner: req.user?._id,  // assuming JWT middleware sets req.user
    }, { new: true })

    return res
        .status(200)
        .json({ message: "Playlist updated successfully", data: update })
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}