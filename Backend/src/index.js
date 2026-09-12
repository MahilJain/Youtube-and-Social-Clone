import "dotenv/config"
import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
.then(() => {
    const port = process.env.PORT || 8000
    app.listen(port, () => {
        console.log(`Server is running at port :${port}`);
    })
} )
.catch((err) => {
    console.log("MONGO db connection failes!!!",err);
})






/*
import express from "express"
const app = express()

const connectDB = ( async (mongoURL) => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error" ,(error) => {
            console.log("ERROR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);  
        })
    } catch (error) {
        console.log("Error while connecting to DB ", error);
        throw err;
    }
})()
*/