const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Department = require('../models/Department'); // Add this import

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify the transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error);
  } else {
    console.log('✅ Email transporter is ready to send emails');
  }
});

// Function to generate a unique studentId
const generateStudentId = async () => {
  let isUnique = false;
  let studentId;
  while (!isUnique) {
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4 digits for simplicity
    studentId = `S${randomNumber.toString().padStart(4, '0')}`; // Format: S0001, S0002, etc.
    const existingStudent = await User.findOne({ studentId });
    if (!existingStudent) {
      isUnique = true;
    }
  }
  return studentId;
};

// Function to send welcome email
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
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isIn(['student', 'teacher', 'admin']).withMessage('Invalid role'),
    body('department').notEmpty().withMessage('Department is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email, password, role, department } = req.body;
      console.log('Registration attempt:', { firstName, lastName, email, role, department }); // Debug log

      const normalizedEmail = email.toLowerCase();
      // Check if user already exists
      let user = await User.findOne({ email: normalizedEmail });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Validate department exists
      const dept = await Department.findById(department);
      console.log('Found department:', dept); // Debug log
      if (!dept) {
        return res.status(400).json({ message: 'Invalid department' });
      }

      // Generate studentId for students
      let studentId;
      if (role === 'student') {
        studentId = await generateStudentId();
      }

      // Create new user
      user = new User({
        firstName,
        lastName,
        email: normalizedEmail,
        password,
        role,
        department,
        studentId: role === 'student' ? studentId : undefined,
      });

      console.log('Created user object:', user); // Debug log

      // Save user (password will be hashed by the pre-save hook)
      await user.save();
      console.log('Saved user:', user); // Debug log

      // Send welcome email
      await sendWelcomeEmail(user);

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login user
router.post(
  '/login',
  [
      body('email').notEmpty().withMessage('Email or Student ID is required'),
      body('password').notEmpty().withMessage('Password is required'),
      body('role').isIn(['student', 'teacher', 'admin']).withMessage('Invalid role'),
  ],
  async (req, res) => {
      try {
          // Validate request
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
              console.log('Validation errors:', errors.array());
              return res.status(400).json({ errors: errors.array() });
          }

          const { email, password, role } = req.body;
          const normalizedEmail = email.toLowerCase();

          console.log(`Login attempt for email: ${normalizedEmail}, role: ${role}`);

          // Find user by email or studentId (for students)
          let user;
          if (role === 'student') {
              user = await User.findOne({
                  $or: [{ email: normalizedEmail }, { studentId: normalizedEmail }],
              }).populate('department');
          } else {
              user = await User.findOne({ email: normalizedEmail }).populate('department');
          }

          if (!user) {
              console.log(`User not found for email: ${normalizedEmail}`);
              return res.status(400).json({ message: 'Invalid credentials' });
          }

          // Check if the user's role matches the intended login role
          if (user.role.toLowerCase() !== role) {
              console.log(`Role mismatch: Expected ${role}, but user role is ${user.role}`);
              return res.status(403).json({
                  message: 'Invalid role. Please try to sign in as a different role.',
              });
          }

          // Check if department exists for student
          if (role === 'student' && !user.department) {
              console.log('Student has no department assigned');
              return res.status(400).json({
                  message: 'Your account is not properly configured. Please contact your administrator.',
              });
          }

          // Compare password using the model's method
          const isMatch = await user.comparePassword(password);
          if (!isMatch) {
              console.log('Password mismatch for user:', normalizedEmail);
              return res.status(400).json({ message: 'Invalid credentials' });
          }

          // Generate JWT
          const token = jwt.sign(
              { userId: user._id, role: user.role },
              process.env.JWT_SECRET,
              { expiresIn: '1h' }
          );

          // Remove password from user object
          const userResponse = user.toObject();
          delete userResponse.password;

          console.log('Login successful for user:', {
              id: user._id,
              email: user.email,
              role: user.role
          });

          res.json({
              token,
              user: {
                  id: user._id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                  role: user.role,
                  studentId: user.studentId,
                  department: user.department ? { _id: user.department._id, name: user.department.name } : null
              },
              message: 'Login successful'
          });
      } catch (error) {
          console.error('Login error:', error);
          res.status(500).json({ message: 'Server error during login' });
      }
  }
);

module.exports = router;