const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Fee = require('../models/Fee');
const { body, validationResult } = require('express-validator');

// Development route to create test fees
router.post('/create-test-fees', auth, async (req, res) => {
  try {
    console.log('Creating test fees for user:', req.user.id);
    // Delete existing test fees for this student
    await Fee.deleteMany({ student: req.user.id });

    // Create new test fees
    const testFees = [
      {
        name: 'Tuition Fee - Semester 1',
        amount: 5000,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        student: req.user.id,
        status: 'pending'
      },
      {
        name: 'Library Fee',
        amount: 200,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        student: req.user.id,
        status: 'pending'
      },
      {
        name: 'Laboratory Fee',
        amount: 300,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        student: req.user.id,
        status: 'overdue'
      }
    ];

    console.log('Creating test fees:', testFees);
    const createdFees = await Fee.insertMany(testFees);
    console.log('Created fees:', createdFees);
    res.status(201).json(createdFees);
  } catch (error) {
    console.error('Error creating test fees:', error);
    res.status(500).json({ error: 'Failed to create test fees' });
  }
});

// Get all fees for the authenticated student
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching fees for user:', req.user.id);
    const fees = await Fee.find({ student: req.user.id })
      .sort({ dueDate: 1 }); // Sort by due date
    console.log('Found fees:', fees);
    res.json(fees);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

// Create a new fee (admin only)
router.post('/', [
  auth,
  body('name').notEmpty().withMessage('Fee name is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('dueDate').isISO8601().withMessage('Invalid due date'),
  body('studentId').isMongoId().withMessage('Invalid student ID'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to create fees' });
    }

    const { name, amount, dueDate, studentId } = req.body;
    const fee = new Fee({
      name,
      amount,
      dueDate,
      student: studentId,
    });

    await fee.save();
    res.status(201).json(fee);
  } catch (error) {
    console.error('Error creating fee:', error);
    res.status(500).json({ error: 'Failed to create fee' });
  }
});

// Update fee payment status
router.post('/pay', [
  auth,
  body('feeId').isMongoId().withMessage('Invalid fee ID'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { feeId, amount } = req.body;
    const fee = await Fee.findOne({ _id: feeId, student: req.user.id });

    if (!fee) {
      return res.status(404).json({ error: 'Fee not found' });
    }

    if (fee.status === 'paid') {
      return res.status(400).json({ error: 'Fee already paid' });
    }

    if (Math.abs(fee.amount - amount) > 0.01) { // Allow for small floating-point differences
      return res.status(400).json({ error: 'Payment amount does not match fee amount' });
    }

    fee.status = 'paid';
    fee.paymentDate = new Date();
    await fee.save();

    res.json(fee);
  } catch (error) {
    console.error('Error updating fee payment:', error);
    res.status(500).json({ error: 'Failed to update fee payment' });
  }
});

module.exports = router; 