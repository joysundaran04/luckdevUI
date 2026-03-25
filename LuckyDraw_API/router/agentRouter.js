
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
    const page = parseInt(req.query.page) || 1;
    let limit = 10;
    if (req.query.limit !== undefined && req.query.limit !== '') {
        limit = parseInt(req.query.limit);
        if (isNaN(limit) || limit < 0) limit = 10;
    }
    const search = req.query.search || "";
    
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { place: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } }
      ];
    }

    const [totalItems, agents] = await Promise.all([
      Agent.countDocuments(query),
      Agent.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);

    res.json({
      totalItems,
      totalPages: limit > 0 ? Math.ceil(totalItems / limit) : 1,
      currentPage: page,
      data: agents
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ================= GET AGENT BY ID =================
router.get("/:id", async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).lean();

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