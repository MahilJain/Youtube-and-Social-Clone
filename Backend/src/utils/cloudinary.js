import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

// Configuration
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath)
        //file has been uploaded successfully
        return response;

    } catch (error) {
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath)
        return null;
    }
}

export {uploadOnCloudinary};