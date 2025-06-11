const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: false // Made optional since either description or brief is required
    },
    brief: {
        type: String, // URL to the uploaded brief file
        required: false
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    maxScore: {
        type: Number,
        required: true
    },
    attachments: [{
        title: String,
        fileUrl: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    submissions: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        submittedAt: {
            type: Date,
            default: Date.now
        },
        files: [{
            title: String,
            fileUrl: String
        }],
        score: {
            type: Number,
            min: 0
        },
        feedback: String,
        status: {
            type: String,
            enum: ['submitted', 'graded', 'late'],
            default: 'submitted'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying
assignmentSchema.index({ course: 1, dueDate: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;