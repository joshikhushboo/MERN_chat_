const express = require("express");
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { protect } = require("../middlewares/authMiddleware");

const userRouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
});

//Register route
userRouter.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const user = await User.create({
      username,
      email,
      password,
    });

    res.status(201).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture,
});
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// *=====Login route=======//

userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Email received:", email);
    console.log("Password received:", password);

    const user = await User.findOne({ email });

    console.log("User found:", user);

    if (user) {
      const passwordMatch = await user.comparePassword(password);
      console.log("Password match:", passwordMatch);

      if (passwordMatch) {
        return res.json({
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user),
            profilePicture: user.profilePicture,
          },
        });
      }
    }

    return res.status(401).json({
      message: "Invalid email or password",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(400).json({
      message: error.message,
    });
  }
});
// *=====Get all users route=======//
const generateToken = (user) => {
    return jwt.sign({id: user._id, isAdmin: user.isAdmin}, process.env.JWT_SECRET, { expiresIn: '30d' });
}

userRouter.put(
    "/profile-picture",
    protect,
    upload.single("profilePicture"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    message: "No image uploaded",
                });
            }

            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "chat-app/profile-pictures",
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                stream.end(req.file.buffer);
            });

            req.user.profilePicture = result.secure_url;
            await req.user.save();

            res.json({
                message: "Profile picture updated",
                profilePicture: req.user.profilePicture,
            });
        } catch (error) {
            console.error("Profile picture upload error:", error);

            res.status(500).json({
                message: "Failed to upload profile picture",
            });
        }
    }
);
module.exports = userRouter;