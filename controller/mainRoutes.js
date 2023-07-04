const express = require('express');
const Razorpay = require('razorpay')
const jwt = require('jsonwebtoken');
const { sendPaymentEmail, sendFeedback } = require('./sendMail');
const transitions = require('../model/transitions');
const Coupons = require('../model/coupon');
const app = express();
const timeago = require('timeago.js');
const dotenv = require('dotenv');
const crypto = require('crypto');
const price = require('../model/price');
const { default: axios } = require('axios');
dotenv.config({ path: ".env" });

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        next();
    } else {
        req.flash('error_messages', "Please Login to continue !");
        res.redirect('/login');
    }
}

const roomPrice = () => {
    return new Promise(async (resolve, reject) => {
        let data = await axios.get('/roomPrice');
        data = data.data;
        resolve(data);
    })
}

app.get('/showRooms', async (req, res) => {
    if (req.isAuthenticated())
        res.render('room', { logged: true, username: req.user.username, email: req.user.email, amount: (await roomPrice()).amount })
    else
        res.render('room', { logged: false, amount: (await roomPrice()).amount })
})


const calculate_discount = (discount, nights, rooms, roomPrice2) => {
    let intital_value = nights * roomPrice2 * rooms;
    if (discount.discount_type == "percent") {
        return (intital_value * discount.discount) / 100;
    } else {
        return discount.amount;
    }
}


app.post('/makePayment', checkAuth, async (req, res) => {
    try {
        const { amount, nights, discount, rooms } = req.body;
        let roomPrice2 = (await roomPrice()).amount;
        let p_value = Math.floor((nights * roomPrice2 * rooms * 112) / 100); 
        if (discount != 0) {
            if (!req.cookies.discount_details) {
                return res.status(200).json({
                    success: false,
                    msz: "Invalid Discount Details"
                });
            }
            else {
                let data = jwt.verify(req.cookies.discount_details, process.env.JWT);
                let discount_value = calculate_discount(data, nights, rooms, roomPrice2);
                if (discount != discount_value) {
                    return res.status(200).json({
                        success: false,
                        msz: "Invalid Discount Details"
                    });
                }
                else p_value = Math.floor(((nights * roomPrice2 * rooms - discount_value) * 112) / 100);
            }
        }
        if (amount != p_value) {
            return res.status(200).json({
                success: false,
                msz: "Amount Mismatched!"
            });
        }
        var instance = new Razorpay({ key_id: process.env.RozerKey, key_secret: process.env.RozerPassword })

        let order = await instance.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: "receipt#1"
        })
        let token = jwt.sign({
            amount,
            nights,
            discount,
            rooms,
            orderId: order.id
        }, process.env.JWT);
        res.cookie("order_details", token, { maxAge: 10 * 60 * 1000, httpOnly: true }).status(201).json({
            success: true,
            order,
            amount,
            nights,
            discount,
            rooms
        })
    } catch (err) {
        console.log(err);
        res.status(200).json({ success: false });
    }
})

function verifySignature(orderId, paymentId, signature) {
    const generatedSignature = crypto
        .createHmac('sha256', process.env.RozerPassword)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    return signature === generatedSignature;
}

app.post('/cheak', checkAuth, async (req, res) => {
    try {
        jwt.verify(req.cookies.order_details, process.env.JWT, async (err, data) => {
            if (err) {
                res.redirect(500, '/payment');
            } else {
                if (verifySignature(data.orderId, req.body.razorpay_payment_id, req.body.razorpay_signature)) {
                    const otp = Math.floor(100000 + Math.random() * 899999);
                    sendPaymentEmail(req.user.email, {
                        ...req.body,
                        ...data,
                        username: req.user.username,
                        email: req.user.email,
                        time: new Date(),
                        otp
                    })
                    await (new transitions({
                        user: req.user._id,
                        ...data,
                        ...req.body,
                        otp
                    })).save()
                    res.redirect('/payment');
                } else {
                    res.redirect(500, '/payment');
                }
            }
        })
    } catch (err) {
        res.redirect(500, '/payment');
    }
})


app.get('/payment', checkAuth, async (req, res) => {
    try {
        if (req.cookies.order_details) {
            res.render('payment', { success: true });
        }
        else {
            res.render('payment', { success: false, error: "Something went Wrong!" });
        }
    } catch (err) {
        res.render('payment', { success: false, error: "Something went Wrong!" });
    }
})

app.get('/roomPrice', async (req, res) => {
    try {
        let roomPrice = (await price.find())[0].price;
        res.status(200).json({ success: true, amount: roomPrice })
    } catch (err) {
        res.status(200).json({ success: false, error: "Could not Reach server at this moment!" })
    }
})

app.get('/contactUs', (req, res) => {
    let val = (req.query.msz == 'sent');
    if (req.isAuthenticated())
        res.render('contact', { logged: true, feedback_status: val });
    else
        res.render('contact', { logged: false, feedback_status: val });
})

app.get('/allTransitions', checkAuth, (req, res) => {
    res.render('allTransitions');
})
app.post('/allTransition', checkAuth, async (req, res) => {
    let data = await transitions
        .find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .populate('user')
        .exec();
    data = data.map(item => {
        item = item._doc
        return {
            ...item,
            createdAt: timeago.format(item.createdAt)
        }
    })
    res.status(200).json(data);
})
app.post('/verifyCoupon', async (req, res) => {
    let coupon = req.body.coupon;
    let data = await Coupons.findOne({ value: coupon });
    if (data) {
        data = data._doc;
        let token = jwt.sign(data, process.env.JWT);
        res.cookie("discount_details", token, { maxAge: 10 * 60 * 1000, httpOnly: true }).status(200).json({
            success: true,
            ...data
        })
    } else {
        res.status(200).json({ success: false });
    }
})

app.post('/feedback_msz', async (req, res) => {
    sendFeedback(process.env.FEEDBACK_EMAIL, req.body);
    res.redirect('/contactUs?msz=sent');
})

app.get('/privacy', (req, res) => {
    res.render('policy', { logged: req.isAuthenticated() });
})
app.get('/terms', (req, res) => {
    res.render('terms', { logged: req.isAuthenticated() });
})

app.get('*', (req, res) => {
    if (req.isAuthenticated())
        res.render('404', { logged: true });
    else
        res.render('404', { logged: false });
})

module.exports = app;