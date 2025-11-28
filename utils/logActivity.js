const Activity = require("../models/Activity");

async function logActivity({ userId, fileId, message }) {
  try {
    await Activity.create({
      user: userId || null,
      file: fileId || null,
      message
    });
  } catch (err) {
    console.error("Activity log error:", err.message);
  }
}

module.exports = logActivity;
