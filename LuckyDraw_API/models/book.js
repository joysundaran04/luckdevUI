const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({

    bookNumber: {
        type: String,
        required: true,
        unique: true
    },

    name: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },
    whatsappNumber: {
        type: String,
        default: null
    },
    address: {
        type: String,
        default: null
    },
    prizeNumber: {
        type: Number,
        default: null
    },

    priceDistributionStatus: {
        type: String,
        enum: ["Distribution", "Pending","Claimed" ,"NotClaimed"],
        default: "NotClaimed"
    },

    // ✅ Agent Reference
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Agent",
        required: false,
        default: null
    },

    monthlyAmount: {
        type: Number,
        default: 500
    },

    totalMonths: {
        type: Number,
        default: 10
    },

    contributionStatus: {
        type: String,
        enum: ["Active", "Discontinued", "Completed"],
        default: "Active"
    },

    payments: [
        {
            monthNumber: {
                type: Number,
                min: 1,
                max: 10
            },
            paid: {
                type: Boolean,
                default: false
            },
            amount: {
                type: Number,
                default: 0
            },
            paidDate: Date
        }
    ],

    luckyDrawStatus: {
        type: String,
        enum: ["NotDraw", "Won"],
        default: "NotDraw"
    },

    wonDate: {
        type: Date,
        default: null
    },
     wonMonth: {
        type: String,
        default: null
    },
    

}, { timestamps: true });


// 🔥 Important Indexes for Performance
bookSchema.index({ bookNumber: 1 });
bookSchema.index({ agentId: 1 });
bookSchema.index({ luckyDrawStatus: 1 });

module.exports = mongoose.model("Book", bookSchema);