import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assignmentAPI } from '../services/api';
import { Assignment } from '../types';
import Layout from '../components/layout/Layout';

const Assignments: React.FC = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const assignments = await assignmentAPI.getStudentAssignments();
                setAssignments(assignments);
            } catch (error) {
                console.error('Error fetching assignments:', error);
            }
        };
        fetchAssignments();
    }, []);

    if (!user) return null;

    return (
        <Layout>
            <Box sx={{ flex: 1, p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    My Assignments
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {assignments.length > 0 ? (
                        assignments.map(assignment => (
                            <Card key={assignment.id} sx={{ width: 300 }}>
                                <CardContent>
                                    <Typography variant="h6">{assignment.title}</Typography>
                                    <Typography variant="body2">Due: {new Date(assignment.dueDate).toLocaleDateString()}</Typography>
                                    <Typography variant="body2">Max Score: {assignment.maxScore}</Typography>
                                    <Button component={RouterLink} to={`/assignments/${assignment._id}`} sx={{ mt: 1 }}>
                                        View Assignment
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Typography>No assignments found.</Typography>
                    )}
                </Box>
            </Box>
        </Layout>
    );
};

export default Assignments;