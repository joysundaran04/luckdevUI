const express = require("express");
const router = express.Router();
const Prize = require("../models/prize");

// ================= CREATE PRIZE =================
router.post("/", async (req, res) => {
  try {
    const { prizeNumber, prizeName, priceDistributionStatus, monthName, bookId } = req.body;

    if (!prizeNumber || !prizeName) {
      return res.status(400).json({
        success: false,
        message: "prizeNumber and prizeName are required"
      });
    }

    const existingPrize = await Prize.findOne({ prizeNumber, monthName: monthName || null });
    if (existingPrize) {
      return res.status(400).json({
        success: false,
        message: `Prize number ${prizeNumber} already exists for this month (${monthName || 'No Month'})`
      });
    }

    const newPrize = await Prize.create({
      prizeNumber,
      prizeName,
      priceDistributionStatus: priceDistributionStatus || "NotClaimed",
      monthName: monthName || null,
      bookId: bookId || null
    });

    res.status(201).json({
      success: true,
      message: "Prize created successfully",
      data: newPrize
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= GET ALL PRIZES =================
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status;
    const monthName = req.query.monthName;

    const query = {};

    if (search) {
      const searchNum = parseInt(search);
      if (!isNaN(searchNum)) {
         query.$or = [
            { prizeName: { $regex: search, $options: "i" } },
            { prizeNumber: searchNum }
         ];
      } else {
         query.prizeName = { $regex: search, $options: "i" };
      }
    }

    if (status) {
      query.priceDistributionStatus = status;
    }
    
    if (monthName) {
      query.monthName = monthName;
    }

    const [totalRecords, prizes] = await Promise.all([
      Prize.countDocuments(query),
      Prize.find(query)
        .populate("bookId", "bookNumber phone whatsappNumber")
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
    ]);

    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      data: prizes
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= GET PRIZE BY ID =================
router.get("/:id", async (req, res) => {
  try {
    const prize = await Prize.findById(req.params.id)
      .populate("bookId", "bookNumber phone whatsappNumber");

    if (!prize) {
      return res.status(404).json({
        success: false,
        message: "Prize not found"
      });
    }

    res.json({
      success: true,
      data: prize
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= UPDATE PRIZE =================
router.put("/:id", async (req, res) => {
  try {
    const allowedFields = ["prizeNumber", "prizeName", "priceDistributionStatus", "monthName", "bookId"];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const currentPrize = await Prize.findById(req.params.id);
    if (!currentPrize) {
      return res.status(404).json({
        success: false,
        message: "Prize not found"
      });
    }

    const newPrizeNumber = updates.prizeNumber !== undefined ? updates.prizeNumber : currentPrize.prizeNumber;
    const newMonthName = updates.monthName !== undefined ? updates.monthName : currentPrize.monthName;

    const existingPrize = await Prize.findOne({ 
      prizeNumber: newPrizeNumber, 
      monthName: newMonthName || null,
      _id: { $ne: req.params.id }
    });

    if (existingPrize) {
      return res.status(400).json({
        success: false,
        message: `Prize number ${newPrizeNumber} already exists for this month (${newMonthName || 'No Month'})`
      });
    }

    const updatedPrize = await Prize.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    if (!updatedPrize) {
      return res.status(404).json({
        success: false,
        message: "Prize not found"
      });
    }

    res.json({
      success: true,
      message: "Prize updated successfully",
      data: updatedPrize
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= DELETE PRIZE =================
router.delete("/:id", async (req, res) => {
  try {
    const prize = await Prize.findById(req.params.id);

    if (!prize) {
      return res.status(404).json({
        success: false,
        message: "Prize not found"
      });
    }

    await Prize.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Prize deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
