const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bookRoutes = require("./router/bookRouter.js");
const userRoutes = require("./router/userRouter.js");
const agentRoutes = require("./router/agentRouter.js");
const dashboardRoutes = require("./router/dashboardRouter.js");
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());


const URL = "mongodb+srv://joysundaran15_db_user:UserJo@cluster0.vnyn4ug.mongodb.net/Lucky?retryWrites=true&w=majority"

mongoose.connect(URL)


  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log(err);
  });



app.use("/api/book", bookRoutes);
app.use("/api/user", userRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Start Server
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
