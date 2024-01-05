const mongoose = require('mongoose');

const couponsSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        default: null
    },
    discountPercentage: {
        type: Number,
        default: null
    },
    minimumAmount: {
        type: Number,
        default: null
    },
    maximumAmount: {
        type: Number,
        default: null
    },
    couponExpiry: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
  
    maxUsesPerUser: {
        type: Number,
        default: null
    },
    redemptionHistory: [
        {
            userId: {
                type: String
            },
            redeemedAt: {
                type: Date,
            }
        }
    ],
 
});

module.exports = mongoose.model('Coupon', couponsSchema);
