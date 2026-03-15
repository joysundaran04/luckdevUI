const express = require("express");
const router = express.Router();

const Book = require("../models/book");
const Agent = require("../models/agent");

// ================= GET DASHBOARD STATS =================
router.get("/stats", async (req, res) => {
    try {
        const totalBooks = await Book.countDocuments({ isDeleted: { $ne: true } });
        const activeBooks = await Book.countDocuments({ contributionStatus: "Active", isDeleted: { $ne: true } });
        const discontinuedBooks = await Book.countDocuments({ contributionStatus: "Discontinued", isDeleted: { $ne: true } });

        // Prizes Claimed / Won
        const prizesClaimedBooks = await Book.countDocuments({ luckyDrawStatus: "Won", isDeleted: { $ne: true } });

        // Total Agents
        const totalAgents = await Agent.countDocuments();

        // Amount Calculations
        const books = await Book.find({ isDeleted: { $ne: true } }).select("monthlyAmount totalMonths payments contributionStatus");

        let collectionAmount = 0;
        let totalAmount = 0;
        let discontinuedAmount = 0;

        books.forEach(book => {
            if (book.contributionStatus !== "Discontinued") {
                totalAmount += (book.monthlyAmount * book.totalMonths);
            }

            let bookPaidAmount = 0;
            if (book.payments && book.payments.length > 0) {
                book.payments.forEach(payment => {
                    if (payment.paid) {
                        bookPaidAmount += payment.amount;
                    }
                });
            }

            collectionAmount += bookPaidAmount;

            if (book.contributionStatus === "Discontinued") {
                discontinuedAmount += bookPaidAmount;
            }
        });

        const upcomingAmount = totalAmount - (collectionAmount - discontinuedAmount);

        res.json({
            success: true,
            data: {
                totalBooks,
                activeBooks,
                discontinuedBooks,
                prizesClaimedBooks,
                totalAgents,
                totalAmount,
                collectionAmount,
                upcomingAmount,
                discontinuedAmount,
                price: 500 // Assuming base price is 500
            }
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});

module.exports = router;
