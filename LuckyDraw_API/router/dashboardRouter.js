const express = require("express");
const router = express.Router();

const Book = require("../models/book");
const Agent = require("../models/agent");

// ================= GET DASHBOARD STATS =================
router.get("/stats", async (req, res) => {
    try {
        // Fetch all stats concurrently to improve API response time
        // We use a single MongoDB Aggregation Pipeline for all Book metrics to minimize network overhead and processing time
        const [bookStatsData, totalAgents] = await Promise.all([
            Book.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                {
                    $addFields: {
                        bookPaidAmount: {
                            $reduce: {
                                input: {
                                    $filter: {
                                        input: { $ifNull: ["$payments", []] },
                                        as: "payment",
                                        cond: { $eq: ["$$payment.paid", true] }
                                    }
                                },
                                initialValue: 0,
                                in: { $add: ["$$value", "$$this.amount"] }
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalBooks: { $sum: 1 },
                        activeBooks: {
                            $sum: { $cond: [{ $eq: ["$contributionStatus", "Active"] }, 1, 0] }
                        },
                        discontinuedBooks: {
                            $sum: { $cond: [{ $eq: ["$contributionStatus", "Discontinued"] }, 1, 0] }
                        },
                        prizesClaimedBooks: {
                            $sum: { $cond: [{ $eq: ["$luckyDrawStatus", "Won"] }, 1, 0] }
                        },
                        prizeDistributedBooks: {
                            $sum: {
                                $cond: [
                                    {
                                        $or: [
                                            { $eq: ["$priceDistributionStatus", "Distributed"] },
                                            { $eq: ["$priceDistributionStatus", "Distribution"] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        totalAmount: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $ne: ["$contributionStatus", "Discontinued"] },
                                            { $ne: ["$contributionStatus", "Completed"] }
                                        ]
                                    },
                                    { $multiply: [{ $ifNull: ["$monthlyAmount", 0] }, { $ifNull: ["$totalMonths", 0] }] },
                                    "$bookPaidAmount"
                                ]
                            }
                        },
                        collectionAmount: { $sum: "$bookPaidAmount" },
                        discontinuedAmount: {
                            $sum: { $cond: [{ $eq: ["$contributionStatus", "Discontinued"] }, "$bookPaidAmount", 0] }
                        },
                        wonAmount: {
                            $sum: {
                                $cond: [
                                    {
                                        $or: [
                                            { $eq: ["$luckyDrawStatus", "Won"] },
                                            { $eq: ["$luckyDrawStatus", "Winner"] }
                                        ]
                                    },
                                    "$bookPaidAmount",
                                    0
                                ]
                            }
                        },
                        activeBooksAmount: {
                            $sum: { $cond: [{ $eq: ["$contributionStatus", "Active"] }, "$bookPaidAmount", 0] }
                        },
                        prizeDistributedAmount: {
                            $sum: {
                                $cond: [
                                    {
                                        $or: [
                                            { $eq: ["$priceDistributionStatus", "Distributed"] },
                                            { $eq: ["$priceDistributionStatus", "Distribution"] }
                                        ]
                                    },
                                    "$bookPaidAmount",
                                    0
                                ]
                            }
                        }
                    }
                }
            ]),
            Agent.countDocuments()
        ]);

        const {
            totalBooks = 0,
            activeBooks = 0,
            discontinuedBooks = 0,
            prizesClaimedBooks = 0,
            prizeDistributedBooks = 0,
            totalAmount = 0,
            collectionAmount = 0,
            discontinuedAmount = 0,
            wonAmount = 0,
            activeBooksAmount = 0,
            prizeDistributedAmount = 0
        } = bookStatsData[0] || {};

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
