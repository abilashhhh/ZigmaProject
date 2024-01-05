const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            }
            
        }
    ]
});

module.exports = mongoose.model('Wishlist', wishlistSchema);
