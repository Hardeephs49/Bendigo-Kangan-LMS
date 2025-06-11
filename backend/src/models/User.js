const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ['student', 'teacher', 'admin'],
        default: 'student',
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
    },
    studentId: {
        type: String,
        required: function() {
            return this.role === 'student';
        },
        unique: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    teachingCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    pastCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    recentlyViewedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    recentlyViewedAssignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
    profilePicture: {
        type: String,
        trim: true,
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Announcement' }],
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
    onlineStatus: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline',
    },
    lastSeen: {
        type: Date,
    },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Validate ObjectIds in arrays
userSchema.pre('save', async function (next) {
    const invalidEnrolled = this.enrolledCourses.filter(id => !mongoose.isValidObjectId(id));
    const invalidPast = this.pastCourses.filter(id => !mongoose.isValidObjectId(id));
    const invalidRecentlyViewed = this.recentlyViewedCourses.filter(id => !mongoose.isValidObjectId(id));
    const invalidNotifications = this.notifications.filter(id => !mongoose.isValidObjectId(id));

    if (invalidEnrolled.length > 0 || invalidPast.length > 0 || invalidRecentlyViewed.length > 0 || invalidNotifications.length > 0) {
        const error = new Error('Invalid ObjectId in enrolledCourses, pastCourses, recentlyViewedCourses, or notifications');
        return next(error);
    }

    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;