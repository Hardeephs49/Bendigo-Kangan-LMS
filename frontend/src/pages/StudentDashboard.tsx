import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, List, ListItem, ListItemText, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseAPI, assignmentAPI, announcementAPI, communicationAPI, userAPI } from '../services/api';
import { Course, Assignment, Announcement, User } from '../types';
import CommunicationComponent from '../components/CommunicationComponent';
import Layout from '../components/layout/Layout';

const StudentDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [recentCourses, setRecentCourses] = useState<Course[]>([]);
    const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
    const [recentUpdates, setRecentUpdates] = useState<Announcement[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                if (!user) {
                    if (isMounted) setError('User not authenticated. Please log in to continue.');
                    return;
                }

                // Fetch enrolled courses
                try {
                    const courses = await courseAPI.getStudentCourses();
                    if (isMounted) {
                        setEnrolledCourses(courses);
                        if (courses.length === 0) {
                            setError('You are not enrolled in any courses yet. Visit the Courses page to enroll.');
                        }
                    }
                } catch (err: any) {
                    console.error('Error fetching enrolled courses:', err);
                    if (isMounted) setError('Failed to load enrolled courses. Please try again later.');
                }

                // Fetch recently viewed courses
                try {
                    const coursesData = await courseAPI.getRecentlyViewedCourses();
                    if (isMounted) setRecentCourses(coursesData);
                } catch (err: any) {
                    console.error('Error fetching recent courses:', err);
                    if (isMounted) setError(err.response?.data?.message || 'Failed to load recent courses. Please try again later.');
                }

                // Fetch recently viewed assignments
                try {
                    const assignments = await assignmentAPI.getRecentlyViewedAssignments();
                    if (isMounted && user) {
                        const unsubmittedAssignments = assignments.filter(assignment => {
                            // Check if there is any submission by the current user with actual files
                            const hasSubmitted = assignment.submissions.some(
                                (submission: any) => submission.student._id === user._id && submission.files.length > 0
                            );
                            return !hasSubmitted;
                        });
                        setRecentAssignments(unsubmittedAssignments);
                    }
                } catch (err: any) {
                    console.error('Error fetching recent assignments:', err);
                    if (isMounted) setError(err.response?.data?.message || 'Failed to load recent assignments. Please try again later.');
                }

                // Fetch recent updates
                try {
                    const updates = await announcementAPI.getRecentUpdates();
                    if (isMounted) setRecentUpdates(updates);
                } catch (err: any) {
                    console.error('Error fetching recent updates:', err);
                    if (isMounted) setError(err.response?.data?.message || 'Failed to load recent updates. Please try again later.');
                }
            } catch (error: any) {
                console.error('Error fetching dashboard data:', error);
                if (isMounted) setError(error.response?.data?.message || 'Failed to load dashboard data. Please try again later.');
            }
        };

        fetchData();

        // Set status to online on mount, only if user is available
        if (user) {
            console.log('Attempting to set user status to online...', user.firstName);
            userAPI.updateStatus('online').catch((err) => {
                console.warn('Failed to set status to online:', err.response?.data?.message || err.message);
            });
        }

        return () => {
            // Set status to offline on unmount, only if user is available
            if (user) {
                console.log('Attempting to set user status to offline on unmount...', user.firstName);
                userAPI.updateStatus('offline').catch((err) => {
                    console.warn('Failed to set status to offline on unmount:', err.response?.data?.message || err.message);
                });
            }
            isMounted = false;
        };
    }, [user]);

    const handleLogout = () => {
        // Set status to offline on logout, only if user is available
        if (user) {
            console.log('Attempting to set user status to offline on logout...', user.firstName);
            userAPI.updateStatus('offline').catch((err) => {
                console.warn('Failed to set status to offline on logout:', err.response?.data?.message || err.message);
            });
        }
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <Layout>
            <Box sx={{ p: 4, backgroundColor: 'background.default', minHeight: '100vh' }}>
                {/* Welcome Section */}
                <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
                        Welcome, {user.firstName} ({user.role.charAt(0).toUpperCase() + user.role.slice(1)})
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
                        Student ID: {user.studentId || 'Not assigned'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        This is your student dashboard. Here you can view your enrolled courses, submit assignments, and communicate with your teachers.
                    </Typography>
                </Paper>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Course Management Section */}
                <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
                        Course Management
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            component={RouterLink} 
                            to="/course-enrollment"
                            size="large"
                            sx={{ flexGrow: 1, py: 1.5 }}
                        >
                            Manage Course Enrollments
                        </Button>
                        <Button 
                            variant="outlined" 
                            color="secondary" 
                            component={RouterLink} 
                            to="/courses"
                            size="large"
                            sx={{ flexGrow: 1, py: 1.5 }}
                        >
                            Browse All Courses
                        </Button>
                    </Box>
                </Paper>

                {/* Highlights Section */}
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', mb: 3 }}>Highlights</Typography>

                    {/* Recently Viewed Courses */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>Recently Viewed Courses</Typography>
                        <Grid container spacing={3}>
                            {recentCourses.length > 0 ? (
                                recentCourses.map(course => (
                                    <Grid item xs={12} sm={6} md={4} key={course._id}>
                                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'transform 0.2s ease-in-out', '&:hover': { transform: 'translateY(-5px)' } }}>
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Typography variant="h6" component="div" sx={{ color: 'primary.dark', mb: 1 }}>{course.title} ({course.code})</Typography>
                                                <Typography variant="body2" color="text.secondary">{course.description}</Typography>
                                            </CardContent>
                                            <Box sx={{ p: 2, pt: 0 }}>
                                                <Button component={RouterLink} to={`/courses/${course._id}`} variant="outlined" size="small">
                                                    View Course
                                                </Button>
                                            </Box>
                                        </Card>
                                    </Grid>
                                ))
                            ) : (
                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        No recently viewed courses. Start exploring courses to see them here!
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    </Box>

                    {/* Recently Viewed Assignments */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>Upcoming Assignments</Typography>
                        <Grid container spacing={3}>
                            {recentAssignments.length > 0 ? (
                                recentAssignments.map(assignment => (
                                    <Grid item xs={12} sm={6} md={4} key={assignment._id}>
                                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'transform 0.2s ease-in-out', '&:hover': { transform: 'translateY(-5px)' } }}>
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Typography variant="h6" component="div" sx={{ color: 'primary.dark', mb: 1 }}>{assignment.title}</Typography>
                                                <Typography variant="body2" color="text.secondary">Due: {new Date(assignment.dueDate).toLocaleDateString()}</Typography>
                                            </CardContent>
                                            <Box sx={{ p: 2, pt: 0 }}>
                                                <Button component={RouterLink} to={`/assignments/${assignment._id}`} variant="outlined" size="small">
                                                    View Assignment
                                                </Button>
                                            </Box>
                                        </Card>
                                    </Grid>
                                ))
                            ) : (
                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        No recently viewed assignments. Check the Assignments page for upcoming tasks!
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    </Box>

                    {/* Recent Updates */}
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>Recent Updates</Typography>
                        {recentUpdates.length > 0 ? (
                            <List sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                {recentUpdates.map(update => (
                                    <ListItem key={update._id} divider>
                                        <ListItemText 
                                            primary={<Typography variant="body1" sx={{ fontWeight: 500 }}>{update.title}</Typography>}
                                            secondary={
                                                <React.Fragment>
                                                    <Typography sx={{ display: 'inline' }} component="span" variant="body2" color="text.primary">
                                                        {update.content}
                                                    </Typography>
                                                    <br />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(update.createdAt).toLocaleDateString()} by {update.createdBy.firstName} {update.createdBy.lastName}
                                                    </Typography>
                                                </React.Fragment>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                No recent updates available.
                            </Typography>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Layout>
    );
};

export default StudentDashboard;