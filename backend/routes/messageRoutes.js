const express = require("express");
const Message = require("../models/MessageModel");
const { protect } = require("../middlewares/authMiddleware");
const messageRouter = express.Router();

// send message
messageRouter.post("/", protect, async (req, res) => {
  try {
    const { content, groupId } = req.body;
    const message = await Message.create({
      content,
      sender: req.user._id,
      group: groupId,
    });

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "username email"
    );

    res.json(populatedMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// delete message
messageRouter.delete("/:messageId", protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only delete your own messages",
      });
    }

    await message.deleteOne();

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//get messages for a group
messageRouter.get("/:groupId", protect, async (req, res) => {
  try {
    const messages = await Message.find({ group: req.params.groupId }).populate("sender", "username email").sort({ createdAt: 1 });
    res.json(messages);
      //.populate("sender", "username email")
      //.sort({ createdAt: 1 });    
  }
  catch (error) {
    res.status(400).json({ message: error.message });
  }
});
module.exports = messageRouter;

