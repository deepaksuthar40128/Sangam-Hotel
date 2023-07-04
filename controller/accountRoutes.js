const express = require('express');
const app = express();
const otps = require('../model/otp');
const user = require('../model/user');
const bcryptjs = require('bcryptjs');
const mailer = require('./sendMail');
const { myPasswordPower } = require('../utils/password');


app.post('/verifyotpReset', async (req, res) => {
    const { email, otp, password } = req.body;
    if (otp) {
        var check = await otps.findOne({ email: email, otp: parseInt(otp) });
        if (check) {
            let power = myPasswordPower(password);
            if (power.success) {
                await otps.findOneAndDelete({ email: email, otp: parseInt(otp) });
                bcryptjs.genSalt(12, (err, salt) => {
                    if (err) throw err;
                    bcryptjs.hash(password, salt, async (err, hash) => {
                        if (err) throw err;
                        await user.findOneAndUpdate({ email: email }, { password: hash });
                        req.flash('success_messages', "Password Updated Successfully!");
                        res.redirect('/login');
                    })
                });
            }
            else {
                req.flash('error_messages', power.error);
                res.redirect(`/forgot-password?mode=otp`)
            }
        }
        else {
            req.flash('error_messages', "Wrong OTP or Email!");
            res.redirect(`/forgot-password?mode=otp`)
        }
    }
    else {
        res.redirect('/login');
    }
})

app.get('/forgot-password', async (req, res) => {
    let mode = req.query.mode;
    if (mode) {
        res.render('forgot-password.ejs', { msg: "OTP SENT!", type: true });
    } else {
        res.render('forgot-password.ejs', { type: false });
    }
});

app.post('/forgot-password', async (req, res) => {
    const email = req.body.email;
    var userData = await user.findOne({ email: email });
    if (userData) {
        if (userData.provider == 'google') {
            req.flash('error_messages', "User exists with Google account. Try resetting your google account password or logging using it");
            res.redirect('/login');
        }
        else {
            const otp = Math.floor(1000 + Math.random() * 8999);
            await otps({ otp, email: email }).save();
            mailer.sendOTPEmail(email, otp);
            req.flash('success_messages', "OTP Sent!");
            res.redirect(`/forgot-password?mode='otp'`)
        }
    } else {
        req.flash('error_messages', "No user Exists with this email.");
        res.redirect(`/forgot-password`)
    }
})

module.exports = app;