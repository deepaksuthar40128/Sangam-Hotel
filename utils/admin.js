const dotenv = require('dotenv');
dotenv.config({ path: ".env" });

module.exports.isAdmin = (email) => {
    return (process.env.ADMINEMAIL === email);
}