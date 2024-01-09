const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    telephone: {
        type: Number,
    },
    email: {
        type: String,
    },
    subject: {
        type: String,
    },
    message: {
        type: String,

    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
