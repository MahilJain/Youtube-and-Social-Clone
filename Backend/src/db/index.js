import mongoose, { connect } from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n MongoDB connect !!  DB HOST:${connectionInstance}`);
    } catch (error) {
        console.log("MONGODB connection error" , error);
        process.exit(1)
    }
}

export default connectDB