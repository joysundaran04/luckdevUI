const express = require("express");
const router = express.Router();

const Book = require("../models/book");
const Agent = require("../models/agent");
const Prize = require("../models/prize");


// ================= CREATE BOOK ================= 1
router.post("/", async (req, res) => {
  try {
    const { bookNumber, name, phone, whatsappNumber, address, agentId } = req.body;

    if (!bookNumber || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "bookNumber, name and phone are required"
      });
    }

    const existingBook = await Book.findOne({ bookNumber });
    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: "Book number already exists"
      });
    }

    // if (agentId) {
    //   const agentExists = await Agent.findById(agentId);
    //   if (!agentExists) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Invalid agentId"
    //     });
    //   }
    // }

    const totalMonths = 10;
    const monthNames = ["July", "August", "September", "October", "November", "December", "January", "February", "March", "April"];

    const payments = monthNames.map((month, i) => ({
      monthNumber: i + 1,
      monthName: month,
      paid: false,
      amount: 0
    }));

    const newBook = await Book.create({
      bookNumber,
      name,
      phone,
      whatsappNumber: whatsappNumber || null,
      address: address || null,
      agentId: agentId || null,
      monthlyAmount: 500,
      totalMonths,
      payments
    });

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: newBook
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate book number"
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= GET BOOK BY ID ================= 1
router.get("/books/:id", async (req, res) => {
  try {

    const book = await Book.findById(req.params.id)
      .populate("agentId", "name mobileNumber whatsappNumber");

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    const paidMonths = book.payments.filter(p => p.paid).length;

    const totalPaidAmount = book.payments
      .filter(p => p.paid)
      .reduce((sum, p) => sum + p.amount, 0);

    const remainingMonths = book.totalMonths - paidMonths;

    const totalExpectedAmount = book.totalMonths * book.monthlyAmount;

    const remainingAmount = totalExpectedAmount - totalPaidAmount;

    const eligibleForDraw =
      book.contributionStatus !== "Discontinued" &&
      paidMonths === book.totalMonths;

    res.json({
      success: true,
      data: {
        bookId: book._id,
        bookNumber: book.bookNumber,
        name: book.name,
        phone: book.phone,
        whatsappNumber: book.whatsappNumber,
        address: book.address,
        monthlyAmount: book.monthlyAmount,
        contributionStatus: book.contributionStatus,
        luckyDrawStatus: book.luckyDrawStatus,
        wonDate: book.wonDate,
        wonMonth: book.wonMonth,
        prizeNumber: book.prizeNumber,
        priceDistributionStatus: book.priceDistributionStatus,
        agent: book.agentId,

        summary: {
          totalMonths: book.totalMonths,
          paidMonths,
          remainingMonths,
          totalPaidAmount,
          remainingAmount,
          eligibleForDraw
        },

        payments: book.payments
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ================= GET ALL BOOKS ================= 1
router.get("/books", async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const searchName = req.query.searchName || "";
    const searchPhone = req.query.searchPhone || "";
    const searchBookNo = req.query.searchBookNo || "";
    const status = req.query.status;
    const agentId = req.query.agentId;

    const query = { isDeleted: { $ne: true } };

    if (search) {
      query.$or = [
        { bookNumber: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { whatsappNumber: { $regex: search, $options: "i" } }
      ];
    }

    if (searchName) {
      query.name = { $regex: searchName, $options: "i" };
    }
    if (searchPhone) {
      query.phone = { $regex: searchPhone, $options: "i" };
    }
    if (searchBookNo) {
      query.bookNumber = { $regex: searchBookNo, $options: "i" };
    }

    if (status) {
      query.contributionStatus = status;
    }

    if (agentId) {
      query.agentId = agentId;
    }

    const [totalRecords, books] = await Promise.all([
      Book.countDocuments(query),
      Book.find(query)
        .populate("agentId", "name mobileNumber whatsappNumber")
        .select(
          "bookNumber name phone whatsappNumber address monthlyAmount contributionStatus luckyDrawStatus agentId totalMonths payments"
        )
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
    ]);

    const formattedBooks = books.map((book) => {
      const paidMonths = book.payments ? book.payments.filter(p => p.paid).length : 0;
      const totalMonths = book.totalMonths;
      delete book.payments;
      return {
        ...book,
        summary: {
          totalMonths,
          paidMonths
        }
      };
    });

    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      data: formattedBooks
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ================= DELETE BOOK ================= 1
router.delete("/:id", async (req, res) => {
  try {

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    await Book.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Book deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ================= UPDATE MONTHLY PAYMENT ================= 1
router.put("/:id/month/:monthNumber", async (req, res) => {
  try {

    const { id, monthNumber } = req.params;
    const { paid, amount } = req.body;

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    const month = book.payments.find(
      p => p.monthNumber === parseInt(monthNumber)
    );

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Invalid month number"
      });
    }

    if (month.paid && paid === true) {
      return res.status(400).json({
        success: false,
        message: "Month already marked as paid"
      });
    }

    month.paid = paid;

    if (paid) {
      month.amount = amount || book.monthlyAmount;
      month.paidDate = new Date();
    } else {
      month.amount = 0;
      month.paidDate = null;
    }

    // const paidMonths = book.payments.filter(p => p.paid).length;

    // Disabled auto-completion status update per user request
    // if (paidMonths === book.totalMonths) {
    //   book.contributionStatus = "Completed";
    // } else if (paidMonths === 0) {
    //   book.contributionStatus = "Active";
    // }

    await book.save();

    res.json({
      success: true,
      message: "Payment updated successfully",
      data: book
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ================= UPDATE BOOK ================= 1
router.put("/:id", async (req, res) => {
  try {

    const allowedFields = [
      "name",
      "phone",
      "whatsappNumber",
      "address",
      "monthlyAmount",
      "contributionStatus",
      "luckyDrawStatus",
      "agentId",
      "prizeNumber",
      "priceDistributionStatus",
      "wonDate",
      "wonMonth"
    ];

    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (req.body.luckyDrawStatus === "Won") {
      updates.wonDate = new Date();
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    // --- PRIZE SYNC LOGIC ---
    // If the book was given a prize, create/update the corresponding Prize document
    if (updatedBook.luckyDrawStatus === "Won" || updatedBook.prizeNumber) {
      if (updatedBook.prizeNumber && updatedBook.wonMonth) {
        const monthNamesMap = {
          1: "July 2026", 2: "August 2026", 3: "September 2026", 4: "October 2026",
          5: "November 2026", 6: "December 2026", 7: "January 2027", 8: "February 2027",
          9: "March 2027", 10: "April 2027"
        };
        const wonMonthNum = updatedBook.wonMonth;
        const mappedMonthName = monthNamesMap[wonMonthNum] || wonMonthNum.toString();

        // Update the existing Prize entry that matches the submitted prizeNumber
        await Prize.findOneAndUpdate(
          { prizeNumber: String(updatedBook.prizeNumber) },
          {
            priceDistributionStatus: updatedBook.priceDistributionStatus || "NotClaimed",
            monthName: mappedMonthName,
            bookId: updatedBook._id
          },
          { new: true }
        );
      }
    }
    // -------------------------

    res.json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// luck draw retuen book number list
router.get("/active/book-numbers", async (req, res) => {
  try {

    const books = await Book.find(
      {
        luckyDrawStatus: "NotDraw",
        isDeleted: { $ne: true }
      },
      { bookNumber: 1, name: 1, agentId: 1, _id: 0 }   // Projection
    )
      .populate("agentId", "name")
      .lean();

    const formattedBooks = books.map(b => ({
      bookNumber: b.bookNumber,
      name: b.name,
      agentName: b.agentId ? b.agentId.name : "No Agent"
    }));

    res.json({
      success: true,
      data: formattedBooks
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= GET WINNERS ================= 
router.get("/winners", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const monthFilter = req.query.monthFilter || "";

    const query = { luckyDrawStatus: "Won", isDeleted: { $ne: true } };

    if (monthFilter) {
      query.wonMonth = monthFilter;
    }

    const monthNamesMap = {
      1: "July 2026", 2: "August 2026", 3: "September 2026", 4: "October 2026",
      5: "November 2026", 6: "December 2026", 7: "January 2027", 8: "February 2027",
      9: "March 2027", 10: "April 2027"
    };

    if (search) {
      let matchedMonthKeys = Object.keys(monthNamesMap).filter(k => 
         monthNamesMap[k].toLowerCase().includes(search.toLowerCase())
      );

      query.$or = [
        { bookNumber: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { prizeNumber: { $regex: search, $options: "i" } },
        { wonMonth: { $regex: search, $options: "i" } }
      ];

      if (matchedMonthKeys.length > 0) {
        query.$or.push({ wonMonth: { $in: matchedMonthKeys } });
        query.$or.push({ wonMonth: { $in: matchedMonthKeys.map(Number) } });
      }
    }

    const [totalRecords, winners] = await Promise.all([
      Book.countDocuments(query),
      Book.find(query)
        .select("bookNumber name phone whatsappNumber wonDate wonMonth prizeNumber")
        .sort({ wonDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);

    const formattedWinners = winners.map(w => ({
      ...w,
      wonMonth: w.wonMonth ? (monthNamesMap[w.wonMonth] || w.wonMonth) : null
    }));

    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      data: formattedWinners
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;