const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sizeMB: { type: Number, default: 0 },
    infoHash: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // --- new fields for piece simulation ---
    pieceSizeMB: { type: Number, default: 10 }, // logical piece size
    pieceCount: { type: Number, default: 1 }    // computed from sizeMB
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);
