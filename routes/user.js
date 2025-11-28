const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const File = require("../models/File");
const Peer = require("../models/Peer");

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const filesCreated = await File.countDocuments({ createdBy: req.user.id });
    const peersSimulated = await Peer.countDocuments({ user: req.user.id });

    return res.json({
      id: user._id,
      name: user.name,
      rollNumber: user.rollNumber,
      email: user.email,
      stats: {
        filesCreated,
        peersSimulated
      }
    });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
