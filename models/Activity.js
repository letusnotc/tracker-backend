const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
    message: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
