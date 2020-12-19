const mongoose = require('mongoose');

const ActionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    price: {
        type: Number,
        required: true,
    },
    type: {
        type: Boolean,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    date: {
        type: Date,
        default: Date.now,
    }
});

module.exports = Action = mongoose.model('action', ActionSchema);
