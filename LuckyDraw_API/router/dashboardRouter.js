const express = require("express");
const router = express.Router();

const Book = require("../models/book");
const Agent = require("../models/agent");

// ================= GET DASHBOARD STATS =================
router.get("/stats", async (req, res) => {
    try {
        // Fetch all stats concurrently to improve API response time
        const [
            totalBooks,
            activeBooks,
            discontinuedBooks,
            prizesClaimedBooks,
            prizeDistributedBooks,
            totalAgents,
            books
        ] = await Promise.all([
            Book.countDocuments({ isDeleted: { $ne: true } }),
            Book.countDocuments({ contributionStatus: "Active", isDeleted: { $ne: true } }),
            Book.countDocuments({ contributionStatus: "Discontinued", isDeleted: { $ne: true } }),
            Book.countDocuments({ luckyDrawStatus: "Won", isDeleted: { $ne: true } }),
            Book.countDocuments({ 
                priceDistributionStatus: { $in: ["Distributed", "Distribution"] }, 
                isDeleted: { $ne: true } 
            }),
            Agent.countDocuments(),
            // Use lean() for faster execution as we only need JS objects, not Mongoose documents
            Book.find({ isDeleted: { $ne: true } })
                .select("monthlyAmount totalMonths payments contributionStatus luckyDrawStatus priceDistributionStatus")
                .lean()
        ]);

        let collectionAmount = 0;
        let totalAmount = 0;
        let discontinuedAmount = 0;
        let wonAmount = 0;
        let activeBooksAmount = 0;
        let prizeDistributedAmount = 0;
        books.forEach(book => {
            let bookPaidAmount = 0;
            if (book.payments && book.payments.length > 0) {
                book.payments.forEach(payment => {
                    if (payment.paid) {
                        bookPaidAmount += payment.amount;
                    }
                });
            }

            if (book.contributionStatus !== "Discontinued" && book.contributionStatus !== "Completed") {
                totalAmount += (book.monthlyAmount * book.totalMonths);
            } else {
                totalAmount += bookPaidAmount;
            }

            collectionAmount += bookPaidAmount;

            if (book.contributionStatus === "Discontinued") {
                discontinuedAmount += bookPaidAmount;
            }

            if (book.luckyDrawStatus === "Won" || book.luckyDrawStatus === "Winner") {
                wonAmount += bookPaidAmount;
            }

            if (book.contributionStatus === "Active") {
                activeBooksAmount += bookPaidAmount;
            }

            if (book.priceDistributionStatus === "Distributed" || book.priceDistributionStatus === "Distribution") {
                prizeDistributedAmount += bookPaidAmount;
            }
        });

        // upcomingAmount equation remains the same or you might want totalAmount - collectionAmount
        // Using existing logic:
        const upcomingAmount = totalAmount - collectionAmount;

        res.json({
            success: true,
            data: {
                totalBooks,
                activeBooks,
                discontinuedBooks,
                prizesClaimedBooks,
                prizeDistributedBooks,
                totalAgents,
                totalAmount,
                collectionAmount,
                upcomingAmount,
                discontinuedAmount,
                wonAmount,
                activeBooksAmount,
                prizeDistributedAmount,
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
