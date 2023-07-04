const mongoose = require('mongoose');
const price = new mongoose.Schema({
    price: Number
}, {
    timestamps: true
});

module.exports = mongoose.model('price', price);