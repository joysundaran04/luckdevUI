
const express = require("express");
const router = express.Router();
const Agent = require("../models/agent");


// ================= CREATE AGENT =================
router.post("/", async (req, res) => {
  try {
    const { name, place, mobileNumber } = req.body;

    if (!name || !place || !mobileNumber) {
      return res.status(400).json({
        message: "Name, place, and mobile number are required"
      });
    }

    const agent = await Agent.create({ name, place, mobileNumber });

    res.status(201).json({
      message: "Agent created successfully",
      data: agent
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ================= GET ALL AGENTS =================
router.get("/", async (req, res) => {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 });

    res.json({
      total: agents.length,
      data: agents
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ================= GET AGENT BY ID =================
router.get("/:id", async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        message: "Agent not found"
      });
    }

    res.json(agent);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ================= UPDATE AGENT =================
router.put("/:id", async (req, res) => {
  try {
    const { name, place, mobileNumber } = req.body;

    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      { $set: { name, place, mobileNumber } },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({
        message: "Agent not found"
      });
    }

    res.json({
      message: "Agent updated successfully",
      data: agent
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ================= DELETE AGENT =================
router.delete("/:id", async (req, res) => {
  try {
    const agent = await Agent.findByIdAndDelete(req.params.id);

    if (!agent) {
      return res.status(404).json({
        message: "Agent not found"
      });
    }

    res.json({
      message: "Agent deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;