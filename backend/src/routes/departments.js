const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const authMiddleware = require('../middleware/auth');

// GET /api/departments - Get all departments (Public)
router.get('/', async (req, res) => {
    try {
        const departments = await Department.find();
        console.log('Available departments:', departments); // Debug log
        res.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Other department routes (e.g., POST, PUT, DELETE) can still use authMiddleware if needed
// Example: router.post('/', authMiddleware, async (req, res) => { ... });

module.exports = router;