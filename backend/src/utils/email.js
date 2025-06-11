const nodemailer = require('nodemailer');

// Configure the email transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail', // You can replace this with your email service (e.g., SendGrid, AWS SES)
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com', // Replace with your email
        pass: process.env.EMAIL_PASS || 'your-email-password', // Replace with your email password or app-specific password
    },
});

// Function to send email
const sendEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to,
            subject,
            text,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

module.exports = { sendEmail };