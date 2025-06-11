import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import api from '../api/api';

// Initialize Stripe
const stripePromise: Promise<Stripe | null> = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLIC_KEY || ''
);

interface Fee {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    try {
      const clientSecretResponse = await api.post('/payment/create-payment-intent', { amount: amount * 100 });
      const clientSecret = clientSecretResponse.data.clientSecret;

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      );

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      console.error('Payment submission error:', err);
      onError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#f9f9f9' }}>
      <Typography variant="h6" gutterBottom>Payment Details</Typography>
      <Box sx={{ mb: 3, p: 2, border: '1px solid #ccc', borderRadius: 1, backgroundColor: '#fff' }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </Box>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={!stripe || loading}
        fullWidth
        sx={{ py: 1.5 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : `Pay $${amount.toFixed(2)} Now`}
      </Button>
    </Box>
  );
};

const FeesPayment: React.FC = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const initializeFees = async () => {
      try {
        await api.post('/fees/create-test-fees');
        await fetchFees();
      } catch (err) {
        console.error('Error initializing fees:', err);
        setError('Failed to initialize fees');
      } finally {
        setLoading(false);
      }
    };

    initializeFees();
  }, []);

  const fetchFees = async () => {
    try {
      const response = await api.get('/fees');
      setFees(response.data);
    } catch (err) {
      console.error('Error fetching fees:', err);
      setError('Failed to fetch fees');
    }
  };

  const handlePaymentSuccess = async () => {
    if (selectedFee) {
      try {
        await api.post('/fees/pay', {
          feeId: selectedFee.id,
          amount: selectedFee.amount,
        });
        setPaymentSuccess(true);
        setSelectedFee(null);
        fetchFees();
      } catch (err) {
        setError('Failed to update payment status');
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Loading fees...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', mb: 4 }}>
        Fees Payment
      </Typography>

      {paymentSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Payment successful for {selectedFee?.name || 'fee'}!
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Outstanding Fees
        </Typography>
        {fees.length === 0 ? (
          <Alert severity="info">No outstanding fees to display.</Alert>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="fees table">
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fee Name</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow
                    key={fee.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'action.hover' } }}
                  >
                    <TableCell component="th" scope="row">
                      {fee.name}
                    </TableCell>
                    <TableCell align="right">${fee.amount.toFixed(2)}</TableCell>
                    <TableCell align="right">{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          color: 'white',
                          display: 'inline-block',
                          backgroundColor: fee.status === 'paid' ? 'success.main' : fee.status === 'pending' ? 'warning.main' : 'error.main',
                        }}
                      >
                        {fee.status.toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {fee.status === 'pending' || fee.status === 'overdue' ? (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => setSelectedFee(fee)}
                          size="small"
                        >
                          Pay Now
                        </Button>
                      ) : (
                        <Button variant="text" disabled size="small">Paid</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {selectedFee && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Paper elevation={2} sx={{ p: 3, maxWidth: 500, width: '100%', borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" gutterBottom>
                Complete Payment for {selectedFee.name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Amount: ${selectedFee.amount.toFixed(2)}
              </Typography>
              <Elements stripe={stripePromise}>
                <PaymentForm amount={selectedFee.amount} onSuccess={handlePaymentSuccess} onError={setError} />
              </Elements>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setSelectedFee(null)}
                fullWidth
                sx={{ mt: 2, py: 1.5 }}
              >
                Cancel
              </Button>
            </Paper>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default FeesPayment; 