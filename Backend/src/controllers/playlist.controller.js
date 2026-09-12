import { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const idOrError = (id, name) => {
    if (!isValidObjectId(id)) throw new ApiError(400, `Invalid ${name} ID`)
}

const ownedPlaylist = async (playlistId, userId) => {
    idOrError(playlistId, "playlist")
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, "Playlist not found")
    if (playlist.owner.toString() !== userId.toString()) throw new ApiError(403, "You are not authorized to modify this playlist")
    return playlist
}

const createPlaylist = asyncHandler(async (req, res) => {
    const name = req.body?.name?.trim()
    if (!name) throw new ApiError(400, "Playlist name is required")
    const playlist = await Playlist.create({ name, description: req.body.description?.trim() || "", owner: req.user._id })
    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    idOrError(userId, "user")
    const playlists = await Playlist.find({ owner: userId })
        .populate("videos")
        .sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    idOrError(req.params.playlistId, "playlist")
    const playlist = await Playlist.findById(req.params.playlistId).populate("videos")
    if (!playlist) throw new ApiError(404, "Playlist not found")
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const playlist = await ownedPlaylist(req.params.playlistId, req.user._id)
    idOrError(req.params.videoId, "video")
    if (!(await Video.exists({ _id: req.params.videoId }))) throw new ApiError(404, "Video not found")
    if (!playlist.videos.some((video) => video.toString() === req.params.videoId)) {
        playlist.videos.push(req.params.videoId)
        await playlist.save()
    }
    await playlist.populate("videos")
    return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const playlist = await ownedPlaylist(req.params.playlistId, req.user._id)
    idOrError(req.params.videoId, "video")
    playlist.videos = playlist.videos.filter((video) => video.toString() !== req.params.videoId)
    await playlist.save()
    await playlist.populate("videos")
    return res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    await ownedPlaylist(req.params.playlistId, req.user._id)
    await Playlist.deleteOne({ _id: req.params.playlistId })
    return res.status(200).json(new ApiResponse(200, null, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const playlist = await ownedPlaylist(req.params.playlistId, req.user._id)
    if (req.body.name !== undefined) {
        if (!req.body.name.trim()) throw new ApiError(400, "Playlist name cannot be empty")
        playlist.name = req.body.name.trim()
    }
    if (req.body.description !== undefined) playlist.description = req.body.description.trim()
    await playlist.save()
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"))
})

export {
    createPlaylist, getUserPlaylists, getPlaylistById, addVideoToPlaylist,
    removeVideoFromPlaylist, deletePlaylist, updatePlaylist,
}
