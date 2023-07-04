const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
dotenv.config({ path: ".env" });

var smtpTransport = nodemailer.createTransport({
    service:"Hostinger",
    host: "smtp.hostinger.com",
    secure:true,
    auth: {
        user: process.env.EMAILUSER,
        pass: process.env.EMAILPASS,
    }
});
module.exports.sendOTPEmail = async (email, otp) => {
    try {
         await smtpTransport.sendMail({
            from: process.env.OTPEMAIL,
            to: email,
            subject: "OTP from Sangam Hotels",
            text: `Your OTP is ${otp}  Dont share this OTP and Email to others`,
             html: `Your OTP is <b>${otp}</b>  Dont share this OTP and Email to others`,
        });
    } catch (err) {
        console.log(err);
    }
}
module.exports.sendFeedback = async (email, data) => {
    await smtpTransport.sendMail({
        from: process.env.ADMINEMAIL,
        to: email,
        subject: "Feedback Email",
        text: `Some feedback is there`,
        html: `<!DOCTYPE html>
<html>
<head>
  <title>Feedback </title>
  <style>
    /* CSS Styling */
    .card {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      background-color: #fff;
      box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }
    
    .card-header {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    
    .card-field {
      margin-bottom: 10px;
    }
    
    .card-field label {
      display: block;
      font-weight: bold;
    }
    
    .card-field span {
      display: block;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2 class="card-header">Contact Information</h2>
    <div class="card-field">
      <label for="name">Name:</label>
      <span>${data.name}</span>
    </div>
    <div class="card-field">
      <label for="email">Email:</label>
      <span>${data.email}</span>
    </div>
    <div class="card-field">
      <label for="subject">Subject:</label>
      <span>${data.subject}</span>
    </div>
    <div class="card-field">
      <label for="message">Message:</label>
      <span>${data.msz}</span>
    </div>
  </div>
</body>
</html>
`,
    });
}
module.exports.sendPaymentEmail = async (email, data) => {
    await smtpTransport.sendMail({
        from: process.env.ADMINEMAIL,
        to: email,
        subject: "Payment Slip from Sangam Hotels",
        text: `Failed to Load!`,
        html: `<!DOCTYPE html>
<html>
<head>
    <style>
        .table-container {
            width: 50%;
            overflow-x: auto;
            margin: 0 auto;
        }

        table {
            border-collapse: collapse;
            width: 100%;
        }

        th, td {
            border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;
        }

        th {
            background-color: #f2f2f2;
        }

        @media only screen and (max-width: 600px) {
            .table-container {
                width: 100%;
            }

            table {
                width: 100%;
            }

            table td,
            table th {
                white-space: nowrap;
            }
        }
    </style>
</head>
<body>
    <div class="table-container">
        <table>
            <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Discount</th>
                <th>Total Amount</th>
            </tr>
            <tr>
                <td>${data.username}</td>
                <td>${data.email}</td>
                <td>${data.discount}/-</td>
                <td>${data.amount}/-</td>
            </tr>
            <tr>
                <th>Total Nights to Stay</th>
                <th>Total Rooms</th>
                <th>Payment ID</th>
                <th>Order ID</th>
            </tr>
            <tr>
                <td>${data.nights} nights</td>
                <td>${data.rooms}</td>
                <td>${data.razorpay_payment_id}</td>
                <td>${data.razorpay_order_id}</td>
            </tr>
            <tr>
                <th>Payment Time</th>
                <th>Razorpay Sign</th>
                <th></th>
            </tr>
            <tr>
                <td>${(data.time).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' })}</td>
                <td>${data.razorpay_signature}</td>
                <td></td>
            </tr>
        </table>
    </div>
    <h1>Check In Hotel Using your Email : ${data.email} and otp: ${data.otp}</h1>
</body>
</html>
`,
    });
}