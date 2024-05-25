const express = require("express");
const User = require("../db/userModel");
const router = express.Router();

router.post("/", async (req, res) => {
  console.log("hihi");
});

router.get("/", async (req, res) => {
  res.send("Hello");
  //   console.log("hihi");
});

router.get("/list", async (req, res) => {
  try {
    const users = await User.find({}, "_id first_name last_name").exec();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to handle /user/:id
router.get("/:id", async (req, res) => {
  const userId = req.params.id.toString();
  console.log(userId);
  try {
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      location: user.location,
      description: user.description,
      occupation: user.occupation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
