import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Container, Typography } from '@mui/material';
import { format } from 'date-fns';

const Best = () => {
  const [nextStep, setNextStep] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await axios.get('/api/assignments/current');
        const assignments = response.data;

        if (assignments.length === 0) {
          setNextStep({
            type: 'study',
            message: 'No upcoming assignments. Focus on reviewing lecture materials and notes.'
          });
        } else {
          // Sort assignments by due date
          const sortedAssignments = assignments.sort((a, b) => 
            new Date(a.dueDate) - new Date(b.dueDate)
          );

          const nextDue = sortedAssignments[0];
          setNextStep({
            type: 'assignment',
            message: `Focus on completing "${nextDue.title}"`,
            dueDate: nextDue.dueDate
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography>Loading your next best step...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Your Best Next Step
      </Typography>
      
      <Card sx={{ p: 3, mt: 2, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h5" gutterBottom>
          {nextStep?.type === 'assignment' ? '📚 Assignment Due Soon' : '📖 Study Time'}
        </Typography>
        
        <Typography variant="body1">
          {nextStep?.message}
        </Typography>
        
        {nextStep?.dueDate && (
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Due: {format(new Date(nextStep.dueDate), 'PPP')}
          </Typography>
        )}
      </Card>
    </Container>
  );
};

export default Best;
