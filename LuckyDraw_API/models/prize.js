const mongoose = require("mongoose");

const prizeSchema = new mongoose.Schema({
    prizeNumber: {
        type: String,
        required: true
    },
   prizeName: {
        type: String,
        required: true
    },
    priceDistributionStatus: {
        type: String,
        enum: ["Distribution", "Pending", "Claimed", "NotClaimed"],
        default: "NotClaimed"
    },
    monthName: {
        type: String,
        default: null
    },
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        default: null
    }
}, { timestamps: true });

// Indexes for performance
prizeSchema.index({ prizeNumber: 1 });
prizeSchema.index({ priceDistributionStatus: 1 });
prizeSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Prize", prizeSchema);
