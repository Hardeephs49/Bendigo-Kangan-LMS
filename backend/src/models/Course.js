const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    credits: {
        type: Number,
        required: true,
        min: 2,
        max: 6,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    semester: {
        type: String,
        required: true,
        trim: true,
    },
    schedule: {
        type: String,
        required: true,
        trim: true,
    },
    room: {
        type: String,
        required: true,
        trim: true,
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    materials: [{ type: String, trim: true }], // Added materials field as an array of strings
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Course', courseSchema);