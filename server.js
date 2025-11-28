require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use("/api/users", require("./routes/user"));


// connect DB
connectDB();

// routes
app.get("/", (req, res) => {
  res.send("Mini BitTorrent Tracker Backend Running");
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/tracker", require("./routes/tracker"));

// start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
