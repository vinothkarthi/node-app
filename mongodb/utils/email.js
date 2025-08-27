const nodemailer = require('nodemailer');

const sendMail = async (options) => {
    // Create a transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    // Define the email options
    const mailOptions = {
        from: 'CineFlex <' + process.env.EMAIL_USERNAME + '>',
        to: options.email,
        subject: options.subject,
        text: options.text
    }
    // Send the email
    await transporter.sendMail(mailOptions)
}

module.exports = sendMail;