const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");

// ================= CREATE USER =================
router.post("/register", async (req, res) => {
  try {
    const { userName, password, role } = req.body;

    const existingUser = await User.findOne({ userName });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userName,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      message: "User created successfully",
      data: user
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ================= LOGIN (No Token) =================
router.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body;

    const user = await User.findOne({ userName }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        userName: user.userName,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ================= GET ALL USERS =================
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments();
    const users = await User.find().skip(skip).limit(limit);

    res.json({
      data: users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ================= GET USER BY ID =================
router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});


// ================= UPDATE USER =================
router.put("/:id", async (req, res) => {
  try {

    const updates = { ...req.body };

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ================= DELETE USER =================
router.delete("/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted successfully" });
});

module.exports = router;