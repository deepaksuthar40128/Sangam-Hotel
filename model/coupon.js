const mongoose = require('mongoose');
const coupon = new mongoose.Schema({
    value: {
        type: String
    },
    discount: {
        type: Number
    },
    discount_type: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('coupon', coupon);