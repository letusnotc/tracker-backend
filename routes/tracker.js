const express = require("express");
const router = express.Router();
const File = require("../models/File");
const Peer = require("../models/Peer");
const Activity = require("../models/Activity");
const auth = require("../middleware/auth");
const crypto = require("crypto");
const logActivity = require("../utils/logActivity");

// helper: generate fake infoHash
function generateInfoHash() {
  return crypto.randomBytes(10).toString("hex");
}

/**
 * GET /api/tracker/files
 * Return all files with seeder/leecher counts
 */
router.get("/files", auth, async (req, res) => {
  try {
    const files = await File.find().lean();
    const fileIds = files.map((f) => f._id);

    const peers = await Peer.find({ file: { $in: fileIds } }).lean();

    const statsMap = {};
    peers.forEach((p) => {
      const id = p.file.toString();
      if (!statsMap[id]) statsMap[id] = { seeders: 0, leechers: 0 };
      if (p.status === "seeder") statsMap[id].seeders += 1;
      else statsMap[id].leechers += 1;
    });

    const result = files.map((f) => ({
      ...f,
      seeders: statsMap[f._id.toString()]?.seeders || 0,
      leechers: statsMap[f._id.toString()]?.leechers || 0
    }));

    return res.json(result);
  } catch (err) {
    console.error("Get files error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/tracker/file
 * Create a new "torrent file" in tracker.
 */
router.post("/file", auth, async (req, res) => {
  try {
    const { name, sizeMB } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const infoHash = generateInfoHash();
    const numericSize = Number(sizeMB) || 0;
    const pieceSizeMB = 10;
    const pieceCount =
      numericSize > 0 ? Math.max(1, Math.ceil(numericSize / pieceSizeMB)) : 1;

    const file = await File.create({
      name,
      sizeMB: numericSize,
      infoHash,
      createdBy: req.user.id,
      pieceSizeMB,
      pieceCount
    });

    await logActivity({
      userId: req.user.id,
      fileId: file._id,
      message: `Created file "${file.name}" with ${file.pieceCount} pieces`
    });

    return res.status(201).json(file);
  } catch (err) {
    console.error("Create file error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/tracker/join
 * body: { fileId, clientName, status }
 */
router.post("/join", auth, async (req, res) => {
  try {
    const { fileId, clientName, status } = req.body;
    if (!fileId || !clientName || !status)
      return res.status(400).json({ message: "Missing fields" });

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });

    const initialProgress = status === "seeder" ? 100 : 0;

    const peer = await Peer.create({
      file: fileId,
      user: req.user.id,
      clientName,
      status,
      progress: initialProgress,
      downloadSpeed: 5 + Math.random() * 10
    });

    await logActivity({
      userId: req.user.id,
      fileId,
      message: `${clientName} joined swarm as ${status}`
    });

    return res.status(201).json(peer);
  } catch (err) {
    console.error("Join error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/tracker/leave
 * body: { peerId }
 */
router.post("/leave", auth, async (req, res) => {
  try {
    const { peerId } = req.body;
    if (!peerId) return res.status(400).json({ message: "peerId required" });

    const peer = await Peer.findById(peerId);
    if (!peer) return res.status(404).json({ message: "Peer not found" });

    await Peer.deleteOne({ _id: peerId });

    await logActivity({
      userId: req.user.id,
      fileId: peer.file,
      message: `${peer.clientName} left the swarm`
    });

    return res.json({ message: "Peer left swarm" });
  } catch (err) {
    console.error("Leave error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/tracker/peers/:fileId
 * Get all peers for a file
 */
router.get("/peers/:fileId", auth, async (req, res) => {
  try {
    const peers = await Peer.find({ file: req.params.fileId }).lean();
    return res.json(peers);
  } catch (err) {
    console.error("Get peers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/tracker/tick
 * Simulate download progress for all leechers
 */
router.post("/tick", auth, async (req, res) => {
  try {
    const leechers = await Peer.find({ status: "leecher" });
    for (const p of leechers) {
      const delta = 5 + Math.random() * 15; // 5–20%
      let newProg = Math.min(100, p.progress + delta);
      const becameSeeder = newProg >= 100;

      p.progress = newProg;
      if (becameSeeder) {
        p.status = "seeder";
        await logActivity({
          userId: p.user,
          fileId: p.file,
          message: `${p.clientName} completed download and became a seeder`
        });
      }
      await p.save();
    }
    return res.json({ updated: leechers.length });
  } catch (err) {
    console.error("Tick error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/tracker/activity/:fileId?limit=50
 */
router.get("/activity/:fileId", auth, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const acts = await Activity.find({ file: req.params.fileId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return res.json(acts);
  } catch (err) {
    console.error("Activity error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
