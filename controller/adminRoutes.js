const express = require('express');
const Coupons = require('../model/coupon');
const app = express();
const timeago = require('timeago.js');
const dotenv = require('dotenv');
const user = require('../model/user');
const transitions = require('../model/transitions');
const { isAdmin } = require('../utils/admin');
const coupon = require('../model/coupon');
const price = require('../model/price');
dotenv.config({ path: ".env" });

const cheakAdmin = (req, res, next) => {
    if (req.isAuthenticated() && isAdmin(req.user.email)) next();
    else {
        req.flash('error_messages', "Action Not allowed");
        res.redirect('/');
    }
}

app.get('/adminInfo', cheakAdmin, async (req, res) => {
    let data = {
        users: await user.count(),
        rooms: (await transitions.aggregate([
            {
                $match: { cheakIn: false }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    count: 1
                }
            }
        ]))[0].count,
        coupons: await Coupons.count(),
        price: (await price.find())[0].price || 0
    }
    res.status(200).json(data);

})

app.get('/cheakIn', cheakAdmin, async (req, res) => {
    res.render('cheakIn');
})

app.post('/updatePrice', cheakAdmin, async (req, res) => {
    try {
        let { newPrice } = req.body;
        newPrice = parseInt(newPrice);
        if (newPrice < 10 || newPrice > 100000) {
            return res.status(200).json({ success: false, error: `Invalid Amount!` })
        }
        await price.deleteMany({});
        newPrice = await (new price({ price: newPrice })).save();
        return res.status(200).json({ success: true, msz: "Amount Updated", amount: newPrice.price, });

    } catch (err) {
        console.log(err);
        return res.status(200).json({ success: false, error: `Action Not possible at this moment!` })
    }
})

app.post('/cheakIn', cheakAdmin, async (req, res) => {
    try {
        const { email, otp } = req.body;
        let data = await transitions.findOne({ user: (await user.findOne({ email }))?._doc?._id, otp: parseInt(otp) });
        if (data) {
            if (data.cheakIn) {
                req.flash('error_messages', "Expired Booking");
                res.redirect('/cheakIn');
            }
            else {
                await transitions.findByIdAndUpdate(data._id, { cheakIn: true })
                req.flash('success_messages', "Booking Confirmed!");
                res.redirect('/cheakIn');
            }
        } else {
            req.flash('error_messages', "Wrong email or/and otp");
            res.redirect('/cheakIn');
        }
    } catch (err) {
        console.log(err);
        req.flash('error_messages', "Something Wrong!");
        res.redirect('/cheakIn');
    }
})

app.get('/allBooking', cheakAdmin, (req, res) => {
    res.render('allBooking');
})



app.get('/filterdata', cheakAdmin, async (req, res) => {
    let query = {
        search: req.query.search || "",
        sort: parseInt(req.query.sort) || 1,
        cheakIn: parseInt(req.query.cheakIn) || 0,
        time: parseInt(req.query.time) || 0,
    };

    let pipeline = [];

    if (query.search !== "") {
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        }, {
            $match: {
                $or: [
                    { "user.username": { $regex: query.search, $options: "i" } }, { "user.email": { $regex: query.search, $options: "i" } }
                ]
            }
        });
    } else {
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        });
    }

    if (query.cheakIn !== 0) {
        pipeline.push({
            $match: {
                cheakIn: query.cheakIn === 1
            }
        });
    }

    if (query.time !== 0) {
        const currentDate = new Date();
        const pastDate = new Date();

        pastDate.setMonth(pastDate.getMonth() - query.time);

        pipeline.push({
            $match: {
                createdAt: { $gte: pastDate, $lte: currentDate }
            }
        });
    }

    pipeline.push({
        $sort: {
            createdAt: -1 * query.sort
        }
    });
    let data = await transitions.aggregate(pipeline);
    data = data.map(transition => {
        return {
            ...transition,
            createdAt: timeago.format(transition.createdAt)
        }
    })
    res.json(data);

})


app.get('/loadTransition/:id', cheakAdmin, async (req, res) => {
    let data = await transitions.findById(req.params.id).populate('user');
    res.status(200).json(data);
})


app.get('/coupons', cheakAdmin, async (req, res) => {
    res.render('coupon');
})

app.get('/allCoupons', cheakAdmin, async (req, res) => {
    try {
        let data = await coupon.aggregate([
            {
                $sort: {
                    createdAt: 1,
                }
            }
        ]).exec();
        data = data.map((item) => {
            return {
                ...item,
                createdAt: timeago.format(item.createdAt)
            }
        })
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json(err);
    }
})

app.post('/addCoupon', cheakAdmin, async (req, res) => {
    try {
        const { value, discount_type, discount } = req.body;
        let data = await coupon.findOne({ value });
        if (data) {
            return res.status(200).json({ success: false, error: `Already Coupone Exist of ${value}` })
        }
        data = await (new coupon({
            value,
            discount: parseInt(discount),
            discount_type
        })).save();
        data = data._doc,
            res.status(200).json({
                success: true,
                ...data,
                createdAt: timeago.format(data.createdAt),
            })
    } catch (err) {
        res.status(500).json(err);
    }
})

app.get('/deleteCoupon/:id', cheakAdmin, async (req, res) => {
    try {
        await coupon.findByIdAndDelete(req.params.id);
        res.json({ success: true })
    } catch (err) {
        res.json({ success: false });
    }
})

module.exports = app;