const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bookRoutes = require("./router/bookRouter.js");
const userRoutes = require("./router/userRouter.js");
const agentRoutes = require("./router/agentRouter.js");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());



const URL = "mongodb://127.0.0.1:27017/LuckyDrawDevDb";

mongoose.connect(URL)
  .then(() => console.log("✅ Connected to Local MongoDB"))
  .catch(err => console.error("❌ Connection error:", err));

// Routes

app.use("/api/book", bookRoutes);
app.use("/api/user", userRoutes);
app.use("/api/agent", agentRoutes);

// Start Server
app.listen(5000, () => {
    console.log("🚀 Server running on http://localhost:5000");
});
