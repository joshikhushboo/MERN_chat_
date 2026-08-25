const express = require("express");
const Group = require("../models/GroupModel");
const groupRouter = express.Router();
const { protect, isAdmin } = require("../middlewares/authMiddleware");

// create a new group
groupRouter.post("/", protect, async (req, res) => {
  try {
    const { name, description } = req.body;

    const creatorId = req.user._id;

    const group = await Group.create({
      name,
      description,
      admin: [creatorId],
      members: [creatorId],
    });

    const populatedGroup = await Group.findById(group._id)
      .populate("admin", "username email")
      .populate("members", "username email");

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Create group error:", error);

    res.status(400).json({
      message: error.message,
    });
  }
});

//get all routes
groupRouter.get("/", protect, async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("admin", "username email profilePicture")
      .populate("members", "username email profilePicture");

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a group - group admins and app admins only
groupRouter.delete("/:groupId", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isGroupAdmin = group.admin.some(
      (adminId) => adminId.toString() === req.user._id.toString()
    );

    if (req.user.isAdmin !== true && !isGroupAdmin) {
      return res.status(403).json({
        message: "Only group or app admins can delete this group",
      });
    }

    await group.deleteOne();

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


//?=====Join a group=========
groupRouter.post("/:groupId/join", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ message: "User is already a member of the group" });
    }

    group.members.push(req.user._id);
    await group.save();

    res.json({ message: "User joined the group successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}); 

// Leave a group
groupRouter.post("/:groupId/leave", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }   
    if (!group.members.includes(req.user._id)) {
      return res.status(400).json({ message: "User is not a member of the group" });
    }
    group.members = group.members.filter((id) => id.toString() !== req.user._id.toString());
    await group.save();
    res.json({ message: "User left the group successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = groupRouter;