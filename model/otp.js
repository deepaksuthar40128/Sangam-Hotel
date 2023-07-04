const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const OTP = new mongoose.Schema({
    email: {
        type: String
    },
    otp: {
        type: Number,
    },
    expireAt: {
        type: Date,
        default: Date.now,
        index: { expires: Date.now + 5 * 60 * 1000 },
    },
});

module.exports = mongoose.model('otp', OTP);