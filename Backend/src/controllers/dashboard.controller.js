import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized access");
    }

    // Aggregate total views & total videos
    const result = await Video.aggregate([
        { $match: { owner: userId } },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
                totalVideos: { $sum: 1 }
            }
        }
    ]);

    // Count likes across user’s videos
    const videoIds = await Video.find({ owner: userId }).distinct("_id");
    const lv = await Like.countDocuments({ video: { $in: videoIds } });

    // Count subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    const totalViews = result.length > 0 ? result[0].totalViews : 0;
    const totalVideos = result.length > 0 ? result[0].totalVideos : 0;

    const dashboard = {
        totalSubscribers,
        totalLikes: lv,
        totalVideos,
        totalViews
    };

    return res.status(200).json({
        message: "Channel details fetched successfully",
        data: dashboard
    });
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized access");
    }

    const getAllVideos = await Video.find({ owner: userId });

    return res.status(200).json({
        message: "Videos fetched successfully",
        data: getAllVideos
    });
});

export { getChannelStats, getChannelVideos };