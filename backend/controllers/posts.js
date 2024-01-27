import Post from "../models/Post.js";
import User from "../models/User.js";
import { google } from 'googleapis';

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

/* CREATE */
export const createPost = async (req, res) => {
    try {
        const { userId, description, picturePath } = req.body;

         // Handle file upload to Google Drive
         const fileBuffer = req.file.buffer;
         const fileName = req.file.originalname;
 
         const response = await drive.files.create({
             requestBody: {
                 name: fileName,
                 mimeType: 'application/octet-stream',
             },
             media: {
                 mimeType: 'application/octet-stream',
                 body: fileBuffer,
             },
         });
 
         console.log('File uploaded to Google Drive:', response.data);
 
        const user = await User.findById(userId);
        const newPost = new Post({
            userId,
            firstName: user.firstName,
            lastName: user.lastName,
            location: user.location,
            description,
            userPicturePath: user.picturePath,
            picturePath: response.data.id,
            likes: {},
            comments: [],
        });
        await newPost.save();

        const post = await Post.find();
        res.status(201).json(post);
    } catch (err) {
        res.status(409).json({ message: err.message });
    }
};

/* READ */
export const getFeedPosts = async (req, res) => {
    try {
        const post = await Post.find();
        res.status(200).json(post);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const post = await Post.find({ userId });
        res.status(200).json(post);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

/* UPDATE */
export const likePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const post = await Post.findById(id);
        const isLiked = post.likes.get(userId);

        if (isLiked) {
            post.likes.delete(userId);
        } else {
            post.likes.set(userId, true);
        }

        const updatedPost = await Post.findByIdAndUpdate(
            id,
            { likes: post.likes },
            { new: true }
        );

        res.status(200).json(updatedPost);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};
