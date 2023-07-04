const express = require('express');
const passport = require('passport');
const user = require('../model/user');
const bcryptjs = require('bcryptjs');
const app = express();
require('./passportLocal')(passport);
require('./googleAuth')(passport);
const userRoutes = require('./accountRoutes');
const mainRoutes = require('./mainRoutes')
const adminRoutes = require('./adminRoutes')
const otps = require('../model/otp')
const jwt = require("jsonwebtoken");
const { sendOTPEmail } = require('./sendMail');
const dotenv = require('dotenv');
const { myPasswordPower } = require('../utils/password');
const { isAdmin } = require('../utils/admin');
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

const cheakAdmin = (req, res, next) => {
    if (req.isAuthenticated() && isAdmin(req.user.email)) next();
    else {
        req.flash('error_messages', "Action Not allowed");
        res.redirect('/');
    }
}

const roomPrice = () => {
    return new Promise(async (resolve, reject) => {
        let data = await axios.get('/roomPrice');
        data = data.data;
        resolve(data);
    })
}

app.get('/', async (req, res) => {
    if (req.isAuthenticated()) {
        if (isAdmin(req.user.email)) {
            return res.redirect('/admin');
        }
        res.redirect('/home')
    } else {
        res.render("index", { logged: false, amount: (await roomPrice()).amount });
    }
})

app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/');
    }
    else
        res.render("login");
})
app.get('/register', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    let mode = req.query.mode;
    if (mode)
        res.render("register", { type: true });
    else
        res.render("register", { type: false });
})

app.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        failureRedirect: '/login',
        successRedirect: '/',
        failureFlash: true,
    })(req, res, next);
})

app.post('/register', async (req, res) => {
    try {
        if (req.body.username.length < 3) {
            req.flash('error_messages', "Username length should be atleast 3");
            res.redirect(`/register?mode=otp`);
            return;
        }
        let data = await user.findOne({ email: req.body.email });
        if (data) {
            req.flash('error_messages', "User Already exist");
            res.redirect(`/register`);
        }
        else {
            var check = await otps.findOne({ email: req.body.email, otp: parseInt(req.body.otp) });
            if (check) {
                let power = myPasswordPower(req.body.password);
                if (power.success) {
                    bcryptjs.genSalt(12, (err, salt) => {
                        if (err) throw err;
                        bcryptjs.hash(req.body.password, salt, async (err, hash) => {
                            if (err) throw err;
                            newData = new user({
                                username: req.body.username,
                                email: req.body.email,
                                password: hash,
                                googleId: null,
                                provider: 'email',
                            })
                            newData = await newData.save();
                            await otps.findOneAndDelete({ email: req.body.email, otp: parseInt(req.body.otp) });
                            req.flash('success_messages', "Account Created,Now Login!");
                            res.redirect('/login');
                        })
                    });
                } else {
                    req.flash('error_messages', power.error);
                    res.redirect(`/register?mode=otp`);
                }
            } else {
                req.flash('error_messages', "Wrong OTP or Email!");
                res.redirect(`/register?mode=otp`);
            }
        }
    } catch (err) {
        req.flash('error_messages', "Something went Wrong!");
        res.redirect(`/register?mode=otp`);
    }
})

app.post('/registerBase', async (req, res) => {
    try {
        let data = await user.findOne({ email: req.body.email });
        if (data) {
            req.flash('error_messages', "user already exist!");
            res.redirect('/register');
        } else {
            const otp = Math.floor(1000 + Math.random() * 8999);
            await otps({ otp, email: req.body.email }).save();
            sendOTPEmail(req.body.email, otp);
            req.flash('success_messages', "OTP Sent!");
            res.redirect(`/register?mode=otp`);
        }
    } catch (err) {
        req.flash('error_messages', "Something went Wrong!");
        res.redirect('/register');
    }
})



app.get('/logout', (req, res) => {
    req.logout(function (err) {
        req.session.destroy(function (err) {
            res.redirect('/');
        });
    });
});

app.get('/home', checkAuth, async (req, res) => {
    res.render('home', { username: req.user.username, amount: (await roomPrice()).amount });
})

app.get('/admin', checkAuth, cheakAdmin, (req, res) => {
    res.render('admin');
})

app.get('/google', passport.authenticate('google', { scope: ['profile', 'email',] }));

app.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/home');
})

app.get('/help', (req, res) => {
    res.render('help');
})

app.use(userRoutes);
app.use(adminRoutes);
app.use(mainRoutes);

module.exports = app;