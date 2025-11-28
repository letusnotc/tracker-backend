const mongoose = require("mongoose");

/**
 * status: "seeder" or "leecher"
 * progress: 0–100 (% download done)
 */
const peerSchema = new mongoose.Schema(
  {
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    clientName: { type: String, required: true },
    status: { type: String, enum: ["seeder", "leecher"], required: true },
    progress: { type: Number, default: 0 },         // download %
    downloadSpeed: { type: Number, default: 5 }     // abstract units
  },
  { timestamps: true }
);

module.exports = mongoose.model("Peer", peerSchema);
