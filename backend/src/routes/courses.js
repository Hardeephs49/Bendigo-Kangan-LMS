const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all courses
router.get('/', auth, async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('instructor', 'firstName lastName email')
            .populate('students', 'firstName lastName email')
            .populate('department', 'name');
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get courses for the logged-in teacher
router.get('/teacher', auth, async (req, res) => {
    try {
        const teacherId = req.user.userId;
        if (!teacherId) {
            return res.status(400).json({ message: 'Teacher ID not found in request' });
        }

        const courses = await Course.find({ instructor: teacherId })
            .populate('instructor', 'firstName lastName email')
            .populate('students', 'firstName lastName email studentId')
            .populate('department', 'name');
        
        if (!courses || courses.length === 0) {
            return res.status(404).json({ message: 'No teaching courses found for this teacher' });
        }

        res.json(courses);
    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get courses by department (admin only) 
router.get('/department', auth, auth.checkRole(['admin']), async (req, res) => {
    try {
        const admin = await User.findById(req.user.userId).populate('department');
        if (!admin || !admin.department) {
            return res.status(400).json({ message: 'Admin department not found' });
        }

        const departmentId = admin.department._id;
        const courses = await Course.find({ department: departmentId })
            .populate('instructor', 'firstName lastName email')
            .populate('students', 'firstName lastName email')
            .populate('department', 'name');

        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses by department:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get available courses for the logged-in student
router.get('/available', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const availableCourses = await Course.find({
            _id: { $nin: user.enrolledCourses }
        })
        .populate('instructor', 'firstName lastName email')
        .populate('department', 'name');
        res.json(availableCourses);
    } catch (error) {
        console.error('Error fetching available courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get enrolled courses for the logged-in student
router.get('/student', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('department');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.department) {
            return res.status(400).json({ message: 'User department not found' });
        }

        const courses = await Course.find({
            _id: { $in: user.enrolledCourses },
            department: user.department._id
        })
        .populate('instructor', 'firstName lastName email')
        .populate('department', 'name');

        res.json(courses);
    } catch (error) {
        console.error('Error fetching student courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get recently viewed courses
router.get('/recently-viewed', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const validRecentlyViewedCourseIds = user.recentlyViewedCourses?.filter(id => mongoose.isValidObjectId(id)) || [];
        if (validRecentlyViewedCourseIds.length === 0) {
            return res.json([]);
        }

        const courses = await Course.find({
            _id: { $in: validRecentlyViewedCourseIds },
        })
        .populate('instructor', 'firstName lastName email')
        .populate('department', 'name');

        const limit = parseInt(req.query.limit) || 3;
        res.json(courses.slice(0, limit));
    } catch (error) {
        console.error('Error fetching recently viewed courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get past courses for the logged-in student
router.get('/student/past', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('department');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.department) {
            return res.status(400).json({ message: 'User department not found' });
        }

        const courses = await Course.find({
            _id: { $in: user.pastCourses || [] },
            department: user.department._id
        })
        .populate('instructor', 'firstName lastName email')
        .populate('department', 'name');

        res.json(courses);
    } catch (error) {
        console.error('Error fetching past courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get course by ID
router.get('/:id', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'firstName lastName email')
            .populate({
                path: 'students',
                select: 'firstName lastName email studentId',
                model: 'User'
            })
            .populate('department', 'name');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const user = await User.findById(req.user.userId);
        user.recentlyViewedCourses = user.recentlyViewedCourses || [];
        user.recentlyViewedCourses = [
            course._id,
            ...user.recentlyViewedCourses.filter(id => id.toString() !== course._id.toString()),
        ].slice(0, 3);
        await user.save();
        res.json(course);
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new course (admins only)
router.post('/',
    auth,
    auth.checkRole(['admin']),
    [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('code').trim().notEmpty().withMessage('Course code is required'),
        body('description').trim().notEmpty().withMessage('Description is required'),
        body('department').trim().notEmpty().withMessage('Department is required'),
        body('semester').trim().notEmpty().withMessage('Semester is required'),
        body('credits').isInt({ min: 2, max: 6 }).withMessage('Credits must be between 2 and 6'),
        body('schedule').trim().notEmpty().withMessage('Schedule is required'),
        body('room').trim().notEmpty().withMessage('Room is required'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const admin = await User.findById(req.user.userId).populate('department');
            if (!admin || !admin.department) {
                return res.status(400).json({ message: 'Admin department not found' });
            }

            if (req.body.department !== admin.department._id.toString()) {
                return res.status(403).json({ message: 'Can only create courses in your own department' });
            }

            const course = new Course({
                ...req.body,
                instructor: null, // Admin will assign the instructor separately
            });

            await course.save();
            res.status(201).json(course);
        } catch (error) {
            console.error('Error creating course:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Update course (admins only)
router.put('/:id',
    auth,
    auth.checkRole(['admin']),
    [
        body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
        body('code').optional().trim().notEmpty().withMessage('Course code cannot be empty'),
        body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
        body('semester').optional().trim().notEmpty().withMessage('Semester cannot be empty'),
        body('credits').optional().isInt({ min: 2, max: 6 }).withMessage('Credits must be between 2 and 6'),
        body('schedule').optional().trim().notEmpty().withMessage('Schedule cannot be empty'),
        body('room').optional().trim().notEmpty().withMessage('Room cannot be empty'),
        body('materials').optional().isArray().withMessage('Materials must be an array'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({ message: 'Invalid course ID' });
            }

            const course = await Course.findById(req.params.id).populate('department');
            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }

            const admin = await User.findById(req.user.userId).populate('department');
            if (!admin || !admin.department) {
                return res.status(400).json({ message: 'Admin department not found' });
            }

            if (course.department._id.toString() !== admin.department._id.toString()) {
                return res.status(403).json({ message: 'Can only modify courses in your own department' });
            }

            Object.assign(course, req.body);
            await course.save();
            
            res.json(course);
        } catch (error) {
            console.error('Error updating course:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Delete course (admins only)
router.delete('/:id',
    auth,
    auth.checkRole(['admin']),
    async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({ message: 'Invalid course ID' });
            }

            const course = await Course.findById(req.params.id).populate('department');
            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }

            const admin = await User.findById(req.user.userId).populate('department');
            if (!admin || !admin.department) {
                return res.status(400).json({ message: 'Admin department not found' });
            }

            if (course.department._id.toString() !== admin.department._id.toString()) {
                return res.status(403).json({ message: 'Can only delete courses in your own department' });
            }

            // Remove course from students' enrolledCourses
            await User.updateMany(
                { enrolledCourses: course._id },
                { $pull: { enrolledCourses: course._id } }
            );

            // Remove course from teacher's teachingCourses
            if (course.instructor) {
                await User.updateOne(
                    { _id: course.instructor },
                    { $pull: { teachingCourses: course._id } }
                );
            }

            await Course.deleteOne({ _id: req.params.id });
            res.json({ message: 'Course deleted successfully' });
        } catch (error) {
            console.error('Error deleting course:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Assign student to course (admin only)
router.post('/:id/assign-student', auth, auth.checkRole(['admin']), async (req, res) => {
    const { studentId } = req.body;

    try {
        if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(studentId)) {
            return res.status(400).json({ message: 'Invalid course or student ID' });
        }

        const course = await Course.findById(req.params.id).populate('department');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const admin = await User.findById(req.user.userId).populate('department');
        if (!admin || !admin.department) {
            return res.status(400).json({ message: 'Admin department not found' });
        }

        if (course.department._id.toString() !== admin.department._id.toString()) {
            return res.status(403).json({ message: 'Can only assign students to courses in your own department' });
        }

        const student = await User.findById(studentId);
        if (!student || student.role !== 'student' || student.department.toString() !== admin.department._id.toString()) {
            return res.status(400).json({ message: 'Invalid student or student not in your department' });
        }

        if (course.students.some(s => s._id.toString() === student._id.toString())) {
            return res.status(400).json({ message: 'Student already enrolled in this course' });
        }

        const totalCredits = (await Promise.all(student.enrolledCourses.map(async (courseId) => {
            const c = await Course.findById(courseId);
            return c ? c.credits : 0;
        }))).reduce((sum, credits) => sum + credits, 0);

        if (totalCredits + course.credits > 25) {
            return res.status(400).json({ message: 'Student exceeds 25 credit hours' });
        }

        course.students.push(student._id);
        student.enrolledCourses.push(course._id);
        await course.save();
        await student.save();

        res.json({ message: 'Student assigned to course successfully' });
    } catch (error) {
        console.error('Error assigning student to course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Unassign student from course (admin only)
router.post('/:id/unassign-student', auth, auth.checkRole(['admin']), async (req, res) => {
    const { studentId } = req.body;

    try {
        if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(studentId)) {
            return res.status(400).json({ message: 'Invalid course or student ID' });
        }

        const course = await Course.findById(req.params.id).populate('department');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const admin = await User.findById(req.user.userId).populate('department');
        if (!admin || !admin.department) {
            return res.status(400).json({ message: 'Admin department not found' });
        }

        if (course.department._id.toString() !== admin.department._id.toString()) {
            return res.status(403).json({ message: 'Can only unassign students from courses in your own department' });
        }

        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(400).json({ message: 'Invalid student' });
        }

        course.students = course.students.filter(
            studentId => studentId.toString() !== student._id.toString()
        );
        student.enrolledCourses = student.enrolledCourses.filter(
            courseId => courseId.toString() !== course._id.toString()
        );

        await course.save();
        await student.save();
        res.json({ message: 'Student unassigned from course successfully' });
    } catch (error) {
        console.error('Error unassigning student from course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Assign teacher to course and set schedule (admin only)
router.post('/:id/assign-teacher', auth, auth.checkRole(['admin']), async (req, res) => {
    const { teacherId, day, startTime } = req.body;

    try {
        if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(teacherId)) {
            return res.status(400).json({ message: 'Invalid course or teacher ID' });
        }

        if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)) {
            return res.status(400).json({ message: 'Invalid day of the week' });
        }

        // Validate startTime (e.g., "09:00")
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime)) {
            return res.status(400).json({ message: 'Invalid start time format (use HH:MM)' });
        }

        const course = await Course.findById(req.params.id).populate('department');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const admin = await User.findById(req.user.userId).populate('department');
        if (!admin || !admin.department) {
            return res.status(400).json({ message: 'Admin department not found' });
        }

        if (course.department._id.toString() !== admin.department._id.toString()) {
            return res.status(403).json({ message: 'Can only assign teachers to courses in your own department' });
        }

        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== 'teacher' || teacher.department.toString() !== admin.department._id.toString()) {
            return res.status(400).json({ message: 'Invalid teacher or teacher not in your department' });
        }

        // Calculate end time (1.5 hours after start time)
        const [startHour, startMinute] = startTime.split(':').map(Number);
        let endHour = startHour + 1;
        let endMinute = startMinute + 30;
        if (endMinute >= 60) {
            endHour += 1;
            endMinute -= 60;
        }
        if (endHour >= 24) {
            return res.status(400).json({ message: 'Class end time exceeds 24:00' });
        }
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

        // Set the schedule
        course.schedule = `${day} ${startTime}-${endTime}`;

        // Remove the course from the previous teacher's teachingCourses if exists
        if (course.instructor) {
            await User.updateOne(
                { _id: course.instructor },
                { $pull: { teachingCourses: course._id } }
            );
        }

        // Assign the new teacher
        course.instructor = teacher._id;
        teacher.teachingCourses = teacher.teachingCourses || [];
        if (!teacher.teachingCourses.includes(course._id)) {
            teacher.teachingCourses.push(course._id);
        }

        await course.save();
        await teacher.save();

        res.json({ message: 'Teacher assigned and schedule set successfully' });
    } catch (error) {
        console.error('Error assigning teacher to course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Unassign teacher from course (admin only)
router.post('/:id/unassign-teacher', auth, auth.checkRole(['admin']), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        const course = await Course.findById(req.params.id).populate('department');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const admin = await User.findById(req.user.userId).populate('department');
        if (!admin || !admin.department) {
            return res.status(400).json({ message: 'Admin department not found' });
        }

        if (course.department._id.toString() !== admin.department._id.toString()) {
            return res.status(403).json({ message: 'Can only unassign teachers from courses in your own department' });
        }

        if (!course.instructor) {
            return res.status(400).json({ message: 'No teacher assigned to this course' });
        }

        const teacher = await User.findById(course.instructor);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        teacher.teachingCourses = teacher.teachingCourses.filter(
            courseId => courseId.toString() !== course._id.toString()
        );
        course.instructor = null;
        course.schedule = '';

        await teacher.save();
        await course.save();

        res.json({ message: 'Teacher unassigned successfully' });
    } catch (error) {
        console.error('Error unassigning teacher from course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Student enroll in course
router.post('/:id/enroll', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can enroll in courses' });
        }

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if student is already enrolled
        if (user.enrolledCourses.includes(course._id)) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        // Check if student is in the same department as the course
        if (user.department.toString() !== course.department.toString()) {
            return res.status(403).json({ message: 'Cannot enroll in a course from a different department' });
        }

        // Check credit hours limit
        const totalCredits = (await Promise.all(user.enrolledCourses.map(async (courseId) => {
            const c = await Course.findById(courseId);
            return c ? c.credits : 0;
        }))).reduce((sum, credits) => sum + credits, 0);

        if (totalCredits + course.credits > 25) {
            return res.status(400).json({ message: 'Cannot enroll: would exceed 25 credit hours limit' });
        }

        // Add course to student's enrolled courses
        user.enrolledCourses.push(course._id);
        await user.save();

        // Add student to course's students list
        course.students.push(user._id);
        await course.save();

        res.json({ message: 'Successfully enrolled in course' });
    } catch (error) {
        console.error('Error enrolling in course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Student unenroll from course
router.post('/:id/unenroll', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can unenroll from courses' });
        }

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if student is enrolled
        if (!user.enrolledCourses.includes(course._id)) {
            return res.status(400).json({ message: 'Not enrolled in this course' });
        }

        // Remove course from student's enrolled courses
        user.enrolledCourses = user.enrolledCourses.filter(id => id.toString() !== course._id.toString());
        await user.save();

        // Remove student from course's students list
        course.students = course.students.filter(id => id.toString() !== user._id.toString());
        await course.save();

        res.json({ message: 'Successfully unenrolled from course' });
    } catch (error) {
        console.error('Error unenrolling from course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Move course from enrolled to past courses (student only)
router.post('/:id/complete', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can complete courses' });
        }

        const courseId = req.params.id;
        
        // Check if the course is in enrolledCourses
        if (!user.enrolledCourses.includes(courseId)) {
            return res.status(400).json({ message: 'Course not found in enrolled courses' });
        }

        // Remove from enrolledCourses and add to pastCourses
        user.enrolledCourses = user.enrolledCourses.filter(id => id.toString() !== courseId);
        user.pastCourses = user.pastCourses || [];
        if (!user.pastCourses.includes(courseId)) {
            user.pastCourses.push(courseId);
        }

        await user.save();
        res.json({ message: 'Course moved to past courses successfully' });
    } catch (error) {
        console.error('Error completing course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;