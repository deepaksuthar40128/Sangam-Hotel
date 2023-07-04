const GoogleStrategy = require('passport-google-oauth20').Strategy;
const user = require('../model/user');

module.exports = function (passport) { 
    passport.use(new GoogleStrategy({
        clientID: process.env.GoogleclientId,
        clientSecret: process.env.GoogleclientSecret,
        callbackURL: "https://sangaminternationalhotel.com/google/callback"
    }, (accessToken, refreshToken, profile, done) => {
        user.findOne({ email: profile.emails[0].value }).then((data) => {
            if (data) {
                return done(null, data);
            }
            else {
                user({
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    password: null,
                    provider: 'google',
                }).save(function (err, data) {
                    return done(null, data);
                });
            }
        })
    }
));


    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        user.findById(id, function (err, user) {
            done(err, user);
        });
    });
}
