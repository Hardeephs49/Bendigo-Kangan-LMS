const User = require('../models/User');
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'rawaan10111998@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password-or-gmail-password',
    },
});

// Generate a unique student ID
const generateStudentId = async () => {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const studentId = `${currentYear}${randomNum}`;

    // Check if the generated ID already exists
    const existingUser = await User.findOne({ studentId });
    if (existingUser) {
        // If ID exists, generate a new one recursively
        return generateStudentId();
    }

    return studentId;
};

// Send welcome email to new user
const sendWelcomeEmail = async (user) => {
    const { email, firstName, role, studentId } = user;

    let emailContent;
    if (role === 'student') {
        emailContent = `
            <h2>Welcome to Kangan LMS, ${firstName}!</h2>
            <p>We are excited to have you as a student. Your account has been successfully created.</p>
            <p><strong>Your Student ID:</strong> ${studentId}</p>
            <p>Login to your account to start exploring your courses!</p>
            <p>Best regards,<br>Kangan LMS Team</p>
        `;
    } else {
        emailContent = `
            <h2>Welcome to Kangan LMS, ${firstName}!</h2>
            <p>We are excited to have you as a ${role}. Your account has been successfully created.</p>
            <p>Login to your account to start managing your courses!</p>
            <p>Best regards,<br>Kangan LMS Team</p>
        `;
    }

    const mailOptions = {
        from: '"Kangan LMS" <rawaan10111998@gmail.com>',
        to: email,
        subject: `Welcome to Kangan LMS, ${firstName}!`,
        html: emailContent,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome email sent to ${email}:`, info.messageId);
    } catch (error) {
        console.error(`❌ Error sending email to ${email}:`, error);
        // Don't throw the error, just log it
        // This way, user creation won't fail if email sending fails
    }
};

module.exports = {
    generateStudentId,
    sendWelcomeEmail
}; 