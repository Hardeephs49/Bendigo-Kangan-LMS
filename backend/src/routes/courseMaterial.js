const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CourseMaterial = require('../models/CourseMaterial');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User'); // Import User model
const Course = require('../models/Course'); // Import Course model

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', '..', 'uploads', 'courseMaterials');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

// @route   POST /api/course-material/upload
// @desc    Upload new course material
// @access  Private (Teacher only)
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        const user = await User.findById(req.user.userId); // req.user.userId is set by auth middleware
        if (!user || user.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied. Only teachers can upload materials.' });
        }

        const { courseId, title, description, isPublic } = req.body;
        const fileUrl = req.file ? `/uploads/courseMaterials/${req.file.filename}` : null;

        if (!courseId || !title || !description || !fileUrl) {
            return res.status(400).json({ message: 'Please provide courseId, title, description, and a file.' });
        }

        // Verify the teacher is associated with the course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        if (course.instructor.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. You are not the instructor of this course.' });
        }

        const newMaterial = new CourseMaterial({
            courseId,
            title,
            description,
            fileUrl,
            fileType: req.file.mimetype,
            uploadedBy: user._id,
            uploadDate: new Date(),
            isPublic: isPublic === 'true',
        });

        await newMaterial.save();
        res.status(201).json(newMaterial);
    } catch (error) {
        console.error('Error uploading course material:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/course-material/course/:courseId
// @desc    Get course materials for a specific course
// @access  Private (Students can view public materials, Teachers can view all)
router.get('/course/:courseId', auth, async (req, res) => {
    try {
        const { courseId } = req.params;
        const user = await User.findById(req.user.userId); // req.user.userId is set by auth middleware
        console.log(`[Backend] Fetching materials for courseId: ${courseId} by user: ${user?.role} (${user?._id})`);

        if (!user) {
            console.log('[Backend] User not found.');
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch the course to check enrollment/instructor status
        const course = await Course.findById(courseId);
        if (!course) {
            console.log(`[Backend] Course not found for courseId: ${courseId}`);
            return res.status(404).json({ message: 'Course not found.' });
        }

        let query = { courseId };

        if (user.role === 'student') {
            console.log(`[Backend] User is student. Checking enrollment for course ${courseId}. Student ID: ${user._id}, Course students: ${course.students}`);
            const isEnrolled = course.students.some(student => student.toString() === user._id.toString());
            if (!isEnrolled) {
                console.log('[Backend] Access denied: Student not enrolled.');
                return res.status(403).json({ message: 'Access denied. You are not enrolled in this course.' });
            }
            // Students can only see public materials
            query.isPublic = true;
            console.log('[Backend] Query for student (public materials only):', query);
        } else if (user.role === 'teacher') {
            console.log(`[Backend] User is teacher. Checking instructor status for course ${courseId}. Teacher ID: ${user._id}, Course instructor: ${course.instructor}`);
            // Teachers can see all materials for their courses, but only if they are the instructor
            if (course.instructor.toString() !== user._id.toString()) {
                console.log('[Backend] Access denied: Teacher not instructor of this course.');
                return res.status(403).json({ message: 'Access denied. You are not the instructor of this course.' });
            }
            console.log('[Backend] Query for teacher (all materials):', query);
        } else {
            // Admins or other roles might have different access, for now, deny unless explicitly allowed
            console.log('[Backend] Access denied: Invalid role for this action.');
            return res.status(403).json({ message: 'Access denied. Invalid role for this action.' });
        }

        const materials = await CourseMaterial.find(query).populate('uploadedBy', 'firstName lastName');
        console.log(`[Backend] Found ${materials.length} materials for courseId: ${courseId}`);
        res.json(materials);
    } catch (error) {
        console.error('Error fetching course materials:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/course-material/:id
// @desc    Delete a course material
// @access  Private (Teacher only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || user.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied. Only teachers can delete materials.' });
        }

        const material = await CourseMaterial.findById(req.params.id);
        if (!material) {
            return res.status(404).json({ message: 'Course material not found.' });
        }

        // Ensure the teacher deleting the material is the one who uploaded it or is the course instructor
        const course = await Course.findById(material.courseId);
        if (!course || (material.uploadedBy.toString() !== user._id.toString() && course.instructor.toString() !== user._id.toString())) {
            return res.status(403).json({ message: 'Access denied. You can only delete materials you uploaded or materials from courses you instruct.' });
        }

        // Delete the file from the uploads folder
        const filePath = path.join(__dirname, '..', '..', material.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await material.remove();
        res.json({ message: 'Course material removed' });
    } catch (error) {
        console.error('Error deleting course material:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 