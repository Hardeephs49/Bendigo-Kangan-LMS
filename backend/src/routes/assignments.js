const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const mongoose = require('mongoose');

// Debug log to see if the assignments router is being hit
router.use((req, res, next) => {
    console.log(`[ASSIGNMENTS ROUTER] Request: ${req.method} ${req.originalUrl}`);
    next();
});

// Get all assignments for a course
router.get('/course/:courseId', auth, async (req, res) => {
    try {
        const assignments = await Assignment.find({ course: req.params.courseId })
            .populate({
                path: 'submissions.student',
                select: 'firstName lastName email studentId'
            })
            .populate('course', 'title code');
        res.json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all assignments for a student's enrolled courses (students only)
router.get('/student', auth, auth.checkRole(['student']), async (req, res) => {
    try {
        console.log('Fetching assignments for student:', req.user.userId, 'with role:', req.user.role); // Debug log
        const user = await User.findById(req.user.userId).populate('enrolledCourses');
        if (!user) {
            console.log('User not found for ID:', req.user.userId); // Debug log
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('User enrolled courses:', user.enrolledCourses); // Debug log
        const courseIds = user.enrolledCourses.map(course => course._id);
        console.log('Enrolled course IDs:', courseIds); // Debug log
        if (courseIds.length === 0) {
            return res.json([]);
        }
        const assignments = await Assignment.find({ course: { $in: courseIds } })
            .populate('submissions.student', 'firstName lastName email')
            .populate('course', 'title code');
        console.log('Assignments before sending to frontend:', assignments); // Debug log
        res.json(assignments);
    } catch (error) {
        console.error('Error fetching student assignments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get recently viewed assignments
router.get('/recently-viewed', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const validRecentlyViewedAssignmentIds = user.recentlyViewedAssignments?.filter(id => mongoose.isValidObjectId(id)) || [];
        if (validRecentlyViewedAssignmentIds.length === 0) {
            return res.json([]);
        }

        const assignments = await Assignment.find({
            _id: { $in: validRecentlyViewedAssignmentIds },
        })
        .populate('course', 'title code')
        .populate({
            path: 'submissions.student',
            select: 'firstName lastName email studentId'
        })
        .populate('submissions.files', 'title fileUrl');

        const limit = parseInt(req.query.limit) || 3;
        console.log('Recently viewed assignments before sending to frontend:', assignments); // Debug log
        res.json(assignments.slice(0, limit));
    } catch (error) {
        console.error('Error fetching recently viewed assignments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get assignment by ID
router.get('/:id', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid assignment ID' });
        }

        const assignment = await Assignment.findById(req.params.id)
            .populate('submissions.student', 'firstName lastName email studentId')
            .populate('course', 'title code');
        
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Update recently viewed assignments for the user
        const user = await User.findById(req.user.userId);
        user.recentlyViewedAssignments = user.recentlyViewedAssignments || [];
        user.recentlyViewedAssignments = [
            assignment._id,
            ...user.recentlyViewedAssignments.filter(id => id.toString() !== assignment._id.toString()),
        ].slice(0, 3);
        await user.save();

        res.json(assignment);
    } catch (error) {
        console.error('Error fetching assignment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new assignment (teachers and admins only)
router.post('/',
    auth,
    auth.checkRole(['teacher', 'admin']),
    upload.single('brief'),
    [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('course').trim().notEmpty().withMessage('Course ID is required'),
        body('dueDate').isISO8601().withMessage('Valid due date is required'),
        body('maxScore').isInt({ min: 1 }).withMessage('Maximum score must be a positive number'),
        body('description').optional().trim(),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Ensure either description or brief is provided
            const { description } = req.body;
            const brief = req.file ? `/uploads/${req.file.filename}` : undefined;
            if (!description && !brief) {
                return res.status(400).json({ message: 'Either description or brief file is required' });
            }

            // Check if course exists and user is authorized
            const course = await Course.findById(req.body.course);
            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }

            if (course.instructor.toString() !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to create assignments for this course' });
            }

            const assignment = new Assignment({
                title: req.body.title,
                description: req.body.description,
                brief,
                course: req.body.course,
                dueDate: req.body.dueDate,
                maxScore: req.body.maxScore,
            });
            await assignment.save();

            // Add assignment to course
            course.assignments = course.assignments || [];
            course.assignments.push(assignment._id);
            await course.save();

            res.status(201).json(assignment);
        } catch (error) {
            console.error('Error creating assignment:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Update assignment (teachers and admins only)
router.put('/:id',
    auth,
    auth.checkRole(['teacher', 'admin']),
    [
        body('title').optional().trim(),
        body('description').optional().trim(),
        body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
        body('maxScore').optional().isInt({ min: 1 }).withMessage('Maximum score must be a positive number'),
    ],
    async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({ message: 'Invalid assignment ID' });
            }

            const assignment = await Assignment.findById(req.params.id);
            
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found' });
            }

            // Check if user is authorized
            const course = await Course.findById(assignment.course);
            if (course.instructor.toString() !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to update this assignment' });
            }

            // Update fields
            if (req.body.title) assignment.title = req.body.title;
            if (req.body.description !== undefined) assignment.description = req.body.description;
            if (req.body.dueDate) assignment.dueDate = req.body.dueDate;
            if (req.body.maxScore) assignment.maxScore = req.body.maxScore;
            if (req.file) assignment.brief = `/uploads/${req.file.filename}`;

            // Ensure either description or brief is provided after update
            if (!assignment.description && !assignment.brief) {
                return res.status(400).json({ message: 'Either description or brief file is required' });
            }

            await assignment.save();
            
            res.json(assignment);
        } catch (error) {
            console.error('Error updating assignment:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Delete assignment (teachers and admins only)
router.delete('/:id',
    auth,
    auth.checkRole(['teacher', 'admin']),
    async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({ message: 'Invalid assignment ID' });
            }

            const assignment = await Assignment.findById(req.params.id);
            
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found' });
            }

            // Check if user is authorized
            const course = await Course.findById(assignment.course);
            if (course.instructor.toString() !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to delete this assignment' });
            }

            // Remove assignment from course
            course.assignments = course.assignments.filter(
                assignmentId => assignmentId.toString() !== assignment._id.toString()
            );
            await course.save();

            await Assignment.deleteOne({ _id: req.params.id });
            res.json({ message: 'Assignment deleted successfully' });
        } catch (error) {
            console.error('Error deleting assignment:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Submit assignment (students only)
router.post('/:id/submit', auth, auth.checkRole(['student']), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid assignment ID' });
        }

        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const { files } = req.body; // Expecting an array of { title, fileUrl } from frontend
        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ message: 'No files submitted' });
        }

        // Check if student already submitted for this assignment
        const existingSubmission = assignment.submissions.find(
            (sub) => sub.student.toString() === req.user.userId
        );

        if (existingSubmission) {
            // If submission exists, update it
            existingSubmission.submittedAt = new Date();
            existingSubmission.files = files;
            existingSubmission.score = undefined; // Reset score if re-submitting
            existingSubmission.feedback = undefined; // Reset feedback if re-submitting
        } else {
            // Create new submission
            assignment.submissions.push({
                student: req.user.userId,
                submittedAt: new Date(),
                files,
                score: undefined,
                feedback: undefined,
            });
        }

        await assignment.save();

        res.status(200).json({ message: 'Assignment submitted successfully' });
    } catch (error) {
        console.error('Error submitting assignment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Grade assignment (teachers and admins only)
router.post('/:id/grade/:submissionId',
    auth,
    auth.checkRole(['teacher', 'admin']),
    [
        body('score').isFloat({ min: 0 }).withMessage('Score must be a non-negative number'),
        body('feedback').optional().trim()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.submissionId)) {
                return res.status(400).json({ message: 'Invalid assignment or submission ID' });
            }

            const assignment = await Assignment.findById(req.params.id);
            
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found' });
            }

            // Check if user is authorized
            const course = await Course.findById(assignment.course);
            if (course.instructor.toString() !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to grade this assignment' });
            }

            const submission = assignment.submissions.id(req.params.submissionId);
            if (!submission) {
                return res.status(404).json({ message: 'Submission not found' });
            }

            submission.score = req.body.score;
            submission.feedback = req.body.feedback;
            submission.status = 'graded';

            await assignment.save();
            res.json({ message: 'Assignment graded successfully' });
        } catch (error) {
            console.error('Error grading assignment:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Update submission score and feedback (teachers only)
router.put('/:assignmentId/submissions/:submissionId', auth, auth.checkRole(['teacher', 'admin']), async (req, res) => {
    try {
        const { assignmentId, submissionId } = req.params;
        const { score, feedback } = req.body;

        if (!mongoose.isValidObjectId(assignmentId) || !mongoose.isValidObjectId(submissionId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if the teacher is authorized for this course
        const course = await Course.findById(assignment.course);
        if (course.instructor.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to grade this assignment' });
        }

        const submission = assignment.submissions.id(submissionId);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        submission.score = score;
        submission.feedback = feedback;

        await assignment.save();

        res.json({ message: 'Submission updated successfully', submission });

    } catch (error) {
        console.error('Error updating submission score:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;