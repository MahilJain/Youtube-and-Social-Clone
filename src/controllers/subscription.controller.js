import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    //steps for toggle subscription:
    // 1. check if channelId is valid
    // 2. check if channelId exists in User collection
    // 3. check if subscription already exists for the user and channel
    // 4. if subscription exists, delete it and return response
    // 5. if subscription does not exist, create it and return response

    const userId = req.user?._id
    const channel = await Subscription.findOne({ channel: channelId })
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }
    const subscriber = await User.findById(userId)
    if (!subscriber) {
        throw new ApiError(400, "Please login to subscribe")
    }

    const subscribe = await Subscription.create({
        subscriber,
        channel,
    })

    return res.status(200).json({ message: "Channel subscribed successfully", data: subscribe })
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    //steps to get subscriber list of a channel:
    // 1. check if channelId is valid
    // 2. check if channelId exists in User collection
    // 3. find all subscriptions for the channel and populate subscriber details
    // 4. return subscriber list in response
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(400, "Please login to view subscribers")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: { channel: new mongoose.Types.ObjectId(channelId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        {
            $project: {
                _id: 0,
                subscriber: { $arrayElemAt: ["$subscriberDetails", 0] }
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
})
// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const subscribedTo = await Subscription.aggregate([
        {
            $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails" // flattens the array
        },
        {
            $project: {
                _id: 0,
                channel: "$channelDetails"
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, subscribedTo, "Subscribed channels fetched"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};