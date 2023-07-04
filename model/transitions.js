const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const trainsition = new mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    amount: Number,
    nights: Number,
    discount: Number,
    rooms: Number,
    cheakIn: {
        type: Boolean,
        default: false
    },
    otp: Number,
    razorpay_payment_id: String,
    razorpay_order_id: String,
    razorpay_signature: String,
}, { timestamps: true }
);

module.exports = mongoose.model('trainsition', trainsition);