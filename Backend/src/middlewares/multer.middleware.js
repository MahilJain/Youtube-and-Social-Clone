import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDirectory = path.resolve("public", "temp")
fs.mkdirSync(uploadDirectory, { recursive: true })
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDirectory)
    },
    filename: function (req, file, cb) {
      const extension = path.extname(file.originalname)
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`)
    }
  })
  
export const upload = multer({ 
    storage, 
    limits: { fileSize: 500 * 1024 * 1024 },
})