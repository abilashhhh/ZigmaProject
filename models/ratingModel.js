const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    username : { 
        type: String
    },
    orderId: {
        type: String
    },
    product: {
        productId: {
            type: String
        },
        productName: {
            type: String
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        review: {
            type: String,
            trim: true
        }
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Rating', ratingSchema);
