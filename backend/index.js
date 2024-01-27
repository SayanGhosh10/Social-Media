import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import mongoose, { Mongoose } from "mongoose";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import postRoutes from "./routes/posts.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";
import { google } from 'googleapis';

// Configurations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// File Storage
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, "public/assets");
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.originalname);
//     },
// });


// const multer = require('multer');

// Configure Google Drive API
const credentials = {
    client_id: process.env.CLIENT_ID,
    client_email: process.env.CLIENT_MAIL,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY,
};

const auth = new google.auth.GoogleAuth({
  credentials,
});

const drive = google.drive({ version: 'v3', auth });

// Create multer storage with in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes with File
app.post("/auth/register", upload.single("picture"), register); 
app.post("/posts", verifyToken, upload.single("picture"), createPost);

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

//Mongoose
const PORT = process.env.PORT || 6001;
mongoose
    .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        app.listen(PORT, () => console.log(`Server Port: ${PORT}`));

        // Data Import once
        // User.insertMany(users);
        // Post.insertMany(posts);
    })
    .catch((error) => console.log(`${error} did not connect`));