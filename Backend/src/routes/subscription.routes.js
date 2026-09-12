import { Router } from "express"
import {
    getSubscribedChannels, getUserChannelSubscribers, toggleSubscription,
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)
router.post("/toggle/:channelId", toggleSubscription)
router.get("/channel/:channelId/subscribers", getUserChannelSubscribers)
router.get("/user/:subscriberId/channels", getSubscribedChannels)
router.post("/c/:channelId", toggleSubscription)
router.get("/c/:channelId", getUserChannelSubscribers)
router.get("/u/:subscriberId", getSubscribedChannels)

export default router
