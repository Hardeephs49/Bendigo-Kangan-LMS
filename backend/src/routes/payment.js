const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Create a payment intent
router.post('/create-payment-intent', [
  auth,
  body('amount').isNumeric().withMessage('Amount must be a number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure amount is an integer
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: req.user.id,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    });
  }
});

// Handle successful payment
router.post('/payment-success', [
  auth,
  body('paymentIntentId').notEmpty().withMessage('Payment Intent ID is required'),
  body('feeId').notEmpty().withMessage('Fee ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentIntentId, feeId } = req.body;

    // Verify the payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update the fee status in your database
      // This is where you would update your fee record to mark it as paid
      // await Fee.findByIdAndUpdate(feeId, { 
      //   status: 'paid',
      //   paymentIntentId,
      //   paymentDate: new Date()
      // });
      
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Payment not successful' });
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).json({ 
      error: 'Failed to process payment success',
      details: error.message 
    });
  }
});

module.exports = router; 