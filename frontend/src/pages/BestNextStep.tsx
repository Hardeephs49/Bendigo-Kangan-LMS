import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  course: { _id: string; title: string; code: string; };
  submissions: Array<{ student: { _id: string; }; files: Array<any>; }>;
}

interface Fee {
  _id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: string;
}

interface NextStepItem {
  id: string;
  type: 'assignment' | 'fee' | 'study';
  title: string;
  message: string;
  dueDate: Date;
  link?: string;
}

const BestNextStep: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nextSteps, setNextSteps] = useState<NextStepItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBestNextSteps = async () => {
      try {
        let fetchedSteps: NextStepItem[] = [];

        // 1. Fetch Assignments
        try {
          const assignmentResponse = await api.get<Assignment[]>('/assignments/student');
          const assignments: Assignment[] = assignmentResponse.data;

          const pendingAssignments = assignments.filter(assignment => {
            const hasSubmitted = assignment.submissions.some(
              (submission: any) => submission.student._id === user?._id && submission.files.length > 0
            );
            return new Date(assignment.dueDate) >= new Date() && !hasSubmitted;
          });

          pendingAssignments.forEach(assignment => {
            fetchedSteps.push({
              id: assignment._id,
              type: 'assignment',
              title: `Assignment: ${assignment.title}`,
              message: `Due soon: "${assignment.title}" for ${assignment.course.title}.`,
              dueDate: new Date(assignment.dueDate),
              link: `/assignments/${assignment._id}` // Example link
            });
          });
          console.log('Next due course:', assignments); // Debug log
        } catch (assignmentError) {
          console.error('Error fetching assignments:', assignmentError);
          // Don't set error here, allow fees to be fetched even if assignments fail
        }

        // 2. Fetch Fees
        try {
          const feeResponse = await api.get<Fee[]>('/fees');
          const pendingFees = feeResponse.data.filter(fee => fee.status === 'pending' || fee.status === 'overdue');

          pendingFees.forEach(fee => {
            fetchedSteps.push({
              id: fee._id,
              type: 'fee',
              title: `Fee: ${fee.name}`,
              message: `Pending fee: "${fee.name}" of $${fee.amount}.`,
              dueDate: new Date(fee.dueDate),
              link: `/fees-payment` // Corrected link to fees payment page
            });
          });
        } catch (feeError) {
          console.error('Error fetching fees:', feeError);
          // Don't set error here, allow assignments to be fetched even if fees fail
        }

        // 3. Sort and set steps
        if (fetchedSteps.length === 0) {
          // If no assignments or fees, suggest studying
          setNextSteps([{
            id: 'study',
            type: 'study',
            title: 'Study Time',
            message: 'No upcoming assignments or pending fees. Best step is to Study.',
            dueDate: new Date()
          } as NextStepItem]); // Cast to NextStepItem as 'study' type is handled differently
        } else {
          // Sort: assignments first, then fees, then by due date
          fetchedSteps.sort((a, b) => {
            if (a.type === 'assignment' && b.type === 'fee') return -1;
            if (a.type === 'fee' && b.type === 'assignment') return 1;
            return a.dueDate.getTime() - b.dueDate.getTime();
          });
          setNextSteps(fetchedSteps);
        }
        setLoading(false);
      } catch (err: any) {
        console.error('Overall error fetching best next steps:', err);
        setError(err.response?.data?.message || 'Failed to fetch best next steps.');
        setLoading(false);
      }
    };

    fetchBestNextSteps();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading your best next steps...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Best Next Steps
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Alert severity="info">
          Welcome, {user?.firstName}! Here's your personalized recommendation.
        </Alert>
      </Box>

      {nextSteps.length > 0 ? (
        <Grid container spacing={3}>
          {nextSteps.map((step) => (
            <Grid item xs={12} key={step.id}>
              <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'primary.main' }}>
                    {step.type === 'assignment' ? '📚 Assignment' : step.type === 'fee' ? '💸 Fee' : '📖 Study'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {step.message}
                  </Typography>
                  {step.dueDate && (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Due: {format(step.dueDate, 'PPP')}
                    </Typography>
                  )}
                </CardContent>
                {step.link && (
                  <CardActions>
                    <Button 
                      size="small" 
                      color="primary" 
                      onClick={() => navigate(step.link!)}
                    >
                      {step.type === 'assignment' ? 'View Assignment' : 'Pay Fee'}
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>No best next steps available at the moment. Enjoy your free time!</Typography>
      )}
    </Container>
  );
};

export default BestNextStep; 