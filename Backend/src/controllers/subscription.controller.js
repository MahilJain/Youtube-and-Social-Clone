/**
 * Subscription Controller Module
 * Handles all subscription-related operations including:
 * - Toggling user subscriptions (subscribe/unsubscribe)
 * - Retrieving channel subscribers
 * - Retrieving subscribed channels for a user
 */

import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

/**
 * Toggles subscription status for a user to a channel
 * If subscription exists, it removes it (unsubscribe)
 * If subscription doesn't exist, it creates it (subscribe)
 * 
 * @route POST /api/v1/subscriptions/toggle/:channelId
 * @param {string} channelId - The ID of the channel to subscribe/unsubscribe from
 * @returns {object} Object with subscribed boolean status
 */
const toggleSubscription = asyncHandler(async (req, res) => {
    // Extract channel ID from URL parameters
    const { channelId } = req.params;
    // Get the current user ID from authenticated session
    const userId = req.user?._id;

    // Validate that the channel ID is a valid MongoDB ObjectId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    // Check if subscription already exists for this user and channel
    const subscriptionInstance = await Subscription.findOne({
        subscriber: userId,
        channel: channelId,
    });

    if (subscriptionInstance) {
        // Subscription exists, so remove it (Unsubscribe)
        await Subscription.findByIdAndDelete(subscriptionInstance._id);

        return res
            .status(200)
            .json(new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully"));
    } else {
        // Subscription doesn't exist, so create it (Subscribe)
        const newSubscription = await Subscription.create({
            subscriber: userId,
            channel: channelId,
        });

        return res
            .status(200)
            .json(new ApiResponse(200, { subscribed: true }, "Subscribed successfully"));
    }
});


/**
 * Retrieves list of subscribers for a specific channel
 * Uses aggregation pipeline to fetch subscriber details from user collection
 * 
 * @route GET /api/v1/subscriptions/channel/:channelId/subscribers
 * @param {string} channelId - The ID of the channel
 * @returns {array} Array of subscriber objects with user details
 */
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    // Extract channel ID from URL parameters
    const { channelId } = req.params
    // Get current user ID from authenticated session
    const userId = req.user?._id;

    // Verify user is authenticated
    if (!userId) {
        throw new ApiError(400, "Please login to view subscribers")
    }

    // Use aggregation pipeline to fetch and format subscriber data
    const subscribers = await Subscription.aggregate([
        // Step 1: Match subscriptions where the channel matches the given channelId
        {
            $match: { channel: new mongoose.Types.ObjectId(channelId) }
        },
        // Step 2: Lookup user details from users collection using subscriber ID
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        // Step 3: Project only the subscriber details (remove subscription metadata)
        {
            $project: {
                _id: 0,
                subscriber: { $arrayElemAt: ["$subscriberDetails", 0] }
            }
        }
    ])
    
    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
})

/**
 * Retrieves list of channels that a user is subscribed to
 * Uses aggregation pipeline to fetch channel details from user collection
 * 
 * @route GET /api/v1/subscriptions/user/:subscriberId/channels
 * @param {string} subscriberId - The ID of the subscriber user
 * @returns {array} Array of channel objects with channel details
 */
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // Extract subscriber ID from URL parameters
    const { subscriberId } = req.params

    // Use aggregation pipeline to fetch and format channel data
    const subscribedTo = await Subscription.aggregate([
        // Step 1: Match subscriptions where the subscriber matches the given subscriberId
        {
            $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) }
        },
        // Step 2: Lookup channel details from users collection using channel ID
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        // Step 3: Flatten the array (converts array of size 1 to single object)
        {
            $unwind: "$channelDetails"
        },
        // Step 4: Project only the channel details (remove subscription metadata)
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