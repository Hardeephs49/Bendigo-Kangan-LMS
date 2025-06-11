const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

// GET /api/announcements/recent
router.get('/recent', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const limit = parseInt(req.query.limit) || 3;
        const announcements = await Announcement.find({
            $or: [
                { targetAudience: user.role },
                { targetAudience: 'both' },
            ],
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('createdBy', 'firstName lastName');

        res.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/announcements (admin only)
router.post('/', authMiddleware, authMiddleware.checkRole(['admin']), async (req, res) => {
    const { title, content, targetAudience } = req.body;

    try {
        if (!['students', 'teachers', 'both'].includes(targetAudience)) {
            return res.status(400).json({ message: 'Invalid target audience' });
        }

        const announcement = new Announcement({
            title,
            content,
            targetAudience,
            createdBy: req.user.userId,
        });

        await announcement.save();

        // Find users to notify based on target audience
        let query = {};
        if (targetAudience === 'students') {
            query = { role: 'student' };
        } else if (targetAudience === 'teachers') {
            query = { role: 'teacher' };
        } else {
            query = { role: { $in: ['student', 'teacher'] } };
        }

        const admin = await User.findById(req.user.userId);
        const users = await User.find(query);
        
        // Add announcement to users' notifications
        await User.updateMany(
            query,
            { $push: { notifications: announcement._id } }
        );

        // Send email notifications
        const emailPromises = users.map(user =>
            sendEmail(
                user.email,
                'New Announcement from Admin',
                `An announcement has been made by ${admin.firstName} ${admin.lastName}: ${announcement.title} - ${announcement.content}`
            )
        );
        await Promise.all(emailPromises);

        res.status(201).json(announcement);
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;