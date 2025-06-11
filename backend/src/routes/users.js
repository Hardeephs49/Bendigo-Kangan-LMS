const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const Department = require('../models/Department');
const { generateStudentId, sendWelcomeEmail } = require('../utils/studentId');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// Get all users (allow any authenticated user)
router.get('/', auth, async (req, res) => {
    try {
        // Allow any authenticated user (student or teacher) to access this endpoint
        const users = await User.find().select('-password'); // Exclude password field
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password')
            .populate('department', 'name')
            .populate('enrolledCourses', 'title code')
            .populate('teachingCourses', 'title code')
            .populate('notifications', 'title content createdAt');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.department) {
            return res.status(400).json({ message: 'Department is required. Please update your profile.' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put(
    '/profile',
    auth,
    [
        body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
        body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
        body('email').optional().isEmail().withMessage('Please enter a valid email'),
        body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
        body('studentId').optional().trim(),
        body('phoneNumber').optional().trim().isMobilePhone('any').withMessage('Please enter a valid phone number'),
        body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            Object.keys(req.body).forEach((key) => {
                if (req.body[key] !== undefined) {
                    user[key] = req.body[key];
                }
            });

            await user.save();
            res.json({ message: 'Profile updated successfully' });
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Update user online status (any authenticated user)
router.put('/status', auth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !['online', 'offline'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.onlineStatus = status;
        user.lastSeen = new Date(); // Update last seen when status changes
        await user.save();

        res.json({ message: 'Status updated successfully', onlineStatus: user.onlineStatus });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload profile picture
router.post('/profile/picture', auth, upload.single('profilePicture'), async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        user.profilePicture = `/uploads/${req.file.filename}`;
        await user.save();

        res.json(user);
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change password
router.put(
    '/change-password',
    auth,
    [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const isMatch = await user.comparePassword(req.body.currentPassword);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }

            user.password = req.body.newPassword;
            await user.save();

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Error changing password:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Get users by department and role (admin only)
router.get('/department', auth, auth.checkRole(['admin']), async (req, res) => {
    try {
        const admin = await User.findById(req.user.userId).populate('department');
        if (!admin || !admin.department) {
            return res.status(400).json({ message: 'Admin department not found' });
        }

        const departmentId = admin.department._id;
        const role = req.query.role;

        if (!['student', 'teacher'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role parameter' });
        }

        const users = await User.find({
            role: role,
            department: departmentId,
        })
            .select('-password')
            .populate('enrolledCourses', 'title code')
            .populate('teachingCourses', 'title code')
            .populate('department', 'name');

        res.json(users);
    } catch (error) {
        console.error('Error fetching users by department:', error);
        res.status(500).json({ 
            message: 'Failed to fetch users',
            error: error.message 
        });
    }
});

// Get user by ID (admin only)
router.get('/:id', auth, auth.checkRole(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('enrolledCourses', 'title code')
            .populate('teachingCourses', 'title code')
            .populate('department', 'name');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a user by ID (admin only)
router.put(
    '/:id',
    auth,
    auth.checkRole(['admin']),
    [
        body('role')
            .optional()
            .isIn(['student', 'teacher', 'admin'])
            .withMessage('Invalid role'),
        body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
        body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
        body('email').optional().isEmail().withMessage('Please enter a valid email'),
        body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
        body('studentId').optional().trim(),
        body('phoneNumber').optional().trim().isMobilePhone('any').withMessage('Please enter a valid phone number'),
        body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userId = req.params.id;
            const updates = req.body;

            if (userId === req.user.userId) {
                return res.status(400).json({ message: 'Cannot update your own role via this endpoint' });
            }

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updates },
                { new: true }
            )
                .populate('department', 'name')
                .populate('enrolledCourses', 'title code')
                .populate('teachingCourses', 'title code')
                .select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Delete user (admin only)
router.delete('/:id', auth, auth.checkRole(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.remove();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send email to user (admin only)
router.post('/:id/email', auth, auth.checkRole(['admin']), async (req, res) => {
    const { subject, message } = req.body;

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { sendEmail } = require('../utils/email');
        await sendEmail(user.email, subject, message);

        res.json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user status for course participants
router.get('/status/course/:courseId', auth, async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const user = await User.findById(req.user.userId).populate('teachingCourses', '_id');
        if (!user || !user.teachingCourses.some(c => c._id.toString() === courseId)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const participants = await User.find({
            _id: { $in: (await User.findOne({ teachingCourses: courseId })).enrolledCourses },
        }).select('onlineStatus lastSeen _id firstName lastName');

        res.json(participants);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Exile user (admin only)
router.delete('/:id/exile', auth, auth.checkRole(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent exiling other admins
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot exile an admin user' });
        }

        // Prevent exiling yourself
        if (user._id.toString() === req.user.userId) {
            return res.status(403).json({ message: 'Cannot exile yourself' });
        }

        // Remove user from all courses
        if (user.role === 'student') {
            await User.updateMany(
                { enrolledCourses: user._id },
                { $pull: { enrolledCourses: user._id } }
            );
        } else if (user.role === 'teacher') {
            await User.updateMany(
                { teachingCourses: user._id },
                { $pull: { teachingCourses: user._id } }
            );
        }

        // Delete the user
        await User.deleteOne({ _id: user._id });

        res.json({ message: 'User exiled successfully' });
    } catch (error) {
        console.error('Error exiling user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new user (admin only)
router.post('/',
    auth,
    auth.checkRole(['admin']),
    [
        body('firstName').trim().notEmpty().withMessage('First name is required'),
        body('lastName').trim().notEmpty().withMessage('Last name is required'),
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('role').isIn(['student', 'teacher']).withMessage('Invalid role'),
        body('department').notEmpty().withMessage('Department is required'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { firstName, lastName, email, password, role, department } = req.body;
            const normalizedEmail = email.toLowerCase();

            // Check if user already exists
            let user = await User.findOne({ email: normalizedEmail });
            if (user) {
                return res.status(400).json({ message: 'User already exists' });
            }

            // Validate department exists
            const dept = await Department.findById(department);
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

            await user.save();

            // Send welcome email
            await sendWelcomeEmail(user);

            res.status(201).json({
                message: 'User created successfully',
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    studentId: user.studentId,
                }
            });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ 
                message: 'Failed to create user',
                error: error.message 
            });
        }
    }
);

module.exports = router;