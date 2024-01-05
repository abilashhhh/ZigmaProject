const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            productName: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            cancelReason: {
                type: String
            },
            cancelDate: {
                type: Date
            },
            canceledOrderPaymentStatus: {
                type: String,
                enum: ['Pending', 'Completed', 'Failed', 'Cancelled', 'Refunded'],
                default: 'Pending'
            },
            canceledOrderStatus: {
                type: String,
                enum: ['Order Placed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
                default: 'Order Placed'
            },
            refundedAmount:{
                type: Number
            }
        }
    ],
    orderid: {
        type: String,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    totalPrice: {
        type: Number,
        required: true
    },
    orderStatus: {
        type: String,
        enum: ['Order Placed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Multiple Statuses'],
        default: 'Order Placed'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Cancelled', 'Refunded'],
        default: 'Pending'
    },

    paymentMethod: {
        type: String,
        enum: ['RazorPay', 'Pay On Delivery', 'Wallet'],
    },
    couponApplied:{
        type: String
    },
    dicountAmount:{
        type : Number
    },
    address: {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        deliveryemail: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        street: {
            type: String,
            required: true,
        },
        addressLine2: {
            type: String,
        },
        zipCode: {
            type: String,
            required: true,
        }
    }
});

module.exports = mongoose.model('Order', orderSchema);
