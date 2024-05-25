const express = require("express");
const Photo = require("../db/photoModel");
const router = express.Router();
const User = require("../db/userModel");
const mongoose = require("mongoose");
const upload = require("../config/cloudinary");
const authenticateToken = require("../Middleware/authenticateToken");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

router.post("/", async (req, res) => {});

router.get("/", async (req, res) => {});

router.get("/photosOfUser/:id", async (req, res) => {
  console.log(req.body);
  const userId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const photos = await Photo.find({ user_id: userId }).populate({
      path: "comments",
      select: "comment date_time user",
      populate: {
        path: "user",
        select: "_id first_name last_name",
      },
    });

    const photoData = photos.map((photo) => {
      return {
        _id: photo._id,
        user_id: photo.user_id,
        file_name: photo.file_name,
        date_time: photo.date_time,
        comments: photo.comments.map((comment) => ({
          _id: comment._id,
          comment: comment.comment,
          date_time: comment.date_time,
          user: comment.user,
        })),
      };
    });

    res.json(photoData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/new", upload.single("photo"), async (req, res) => {
  const { userId } = req.body; 
  console.log(userId);
  // if (!mongoose.Types.ObjectId.isValid(userId)) {
  //   return res.status(400).json({ message: "Invalid user ID" });
  // }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const newPhoto = new Photo({
      file_name: req.file.path,
      user_id: userId,
      date_time: new Date(),
      comments: [],
    });

    const savedPhoto = await newPhoto.save();

    res
      .status(200)
      .json({ _id: savedPhoto._id, message: "Photo uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/addComment", async (req, res) => {
  const { photo_id, comment, user_id } = req.body;
  console.log(req.body);

  try {
    const photo = await Photo.findById(photo_id);
    if (!photo) {
      return res.status(404).send("Photo not found");
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const newComment = {
      comment: comment,
      user_id: user._id.toString(),
      date_time: new Date(),
    };

    console.log(user_id);
    console.log(newComment.user_id);

    photo.comments.push(newComment);

    await photo.save();

    res.status(200).send(photo);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
