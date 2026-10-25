import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
}

const generateAccessAndRefreshTokens = async (userId) => {
    const user = await User.findById(userId)
    if (!user) throw new ApiError(404, "User not found")

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body || {}
    if (![fullName, email, username, password].every((value) => typeof value === "string" && value.trim())) {
        throw new ApiError(400, "Full name, email, username and password are required")
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedUsername = username.trim().toLowerCase()
    if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters")

    const existingUser = await User.findOne({
        $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    })
    if (existingUser) throw new ApiError(409, "User with email or username already exists")

    const avatarPath = req.files?.avatar?.[0]?.path
    if (!avatarPath) throw new ApiError(400, "Avatar file is required")
    const avatar = await uploadOnCloudinary(avatarPath)
    if (!avatar) throw new ApiError(400, "Failed to upload avatar")

    const coverPath = req.files?.coverImage?.[0]?.path
    const coverImage = coverPath ? await uploadOnCloudinary(coverPath) : null
    const user = await User.create({
        fullName: fullName.trim(),
        email: normalizedEmail,
        username: normalizedUsername,
        password,
        avatar: avatar.secure_url || avatar.url,
        coverImage: coverImage?.secure_url || coverImage?.url || "",
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body || {}
    if ((!email && !username) || !password) throw new ApiError(400, "Username/email and password are required")

    const identity = (email || username).trim().toLowerCase()
    const user = await User.findOne({
        $or: [{ email: identity }, { username: identity }],
    })
    if (!user || !(await user.isPasswordCorrect(password))) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"))
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } })
    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, null, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken
    if (!incomingToken) throw new ApiError(401, "Refresh token is required")

    try {
        const decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decoded?._id)
        if (!user || user.refreshToken !== incomingToken) throw new ApiError(401, "Invalid or expired refresh token")

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed"))
    } catch (error) {
        if (error instanceof ApiError) throw error
        throw new ApiError(401, "Invalid or expired refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body || {}
    if (!oldPassword || !newPassword) throw new ApiError(400, "Old and new passwords are required")
    if (newPassword.length < 6) throw new ApiError(400, "New password must be at least 6 characters")

    const user = await User.findById(req.user._id)
    if (!user || !(await user.isPasswordCorrect(oldPassword))) throw new ApiError(400, "Invalid old password")
    user.password = newPassword
    user.refreshToken = undefined
    await user.save()
    return res.status(200).json(new ApiResponse(200, null, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body || {}
    if (!fullName?.trim() || !email?.trim()) throw new ApiError(400, "Full name and email are required")
    const normalizedEmail = email.trim().toLowerCase()
    const duplicate = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user._id } })
    if (duplicate) throw new ApiError(409, "Email is already in use")

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { fullName: fullName.trim(), email: normalizedEmail } },
        { new: true, runValidators: true },
    ).select("-password -refreshToken")
    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const localPath = req.file?.path
    if (!localPath) throw new ApiError(400, "Avatar file is missing")
    const uploaded = await uploadOnCloudinary(localPath)
    if (!uploaded) throw new ApiError(400, "Failed to upload avatar")

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar: uploaded.secure_url || uploaded.url } },
        { new: true },
    ).select("-password -refreshToken")
    return res.status(200).json(new ApiResponse(200, user, "User avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const localPath = req.file?.path
    if (!localPath) throw new ApiError(400, "Cover image file is missing")
    const uploaded = await uploadOnCloudinary(localPath)
    if (!uploaded) throw new ApiError(400, "Failed to upload cover image")

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { coverImage: uploaded.secure_url || uploaded.url } },
        { new: true },
    ).select("-password -refreshToken")
    return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const username = req.params.username?.trim().toLowerCase()
    if (!username) throw new ApiError(400, "Username is required")

    const channel = await User.aggregate([
        { $match: { username } },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $project: {
                fullName: 1, username: 1, avatar: 1, coverImage: 1,
                subscribersCount: { $size: "$subscribers" },
                channelsSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: { $in: [req.user._id, "$subscribers.subscriber"] },
            },
        },
    ])
    if (!channel.length) throw new ApiError(404, "Channel does not exist")
    return res.status(200).json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate({ path: "watchHistory", populate: { path: "owner", select: "fullName username avatar" } })
        .select("watchHistory")
    return res.status(200).json(new ApiResponse(200, user?.watchHistory || [], "Watch history fetched successfully"))
})

export {
    registerUser, loginUser, logoutUser, refreshAccessToken,
    changeCurrentPassword, getCurrentUser, updateAccountDetails,
    updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory,
}
