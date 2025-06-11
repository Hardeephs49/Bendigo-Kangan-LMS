import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { 
  Box, Typography, Button, List, ListItem, ListItemText, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, InputLabel, FormControl, Grid, Alert, CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { courseAPI, assignmentAPI, communicationAPI, userAPI } from '../services/api';
import { Course, Assignment, User } from '../types';
import Layout from '../components/layout/Layout';
import dayjs from 'dayjs';

const TeacherDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [teachingCourses, setTeachingCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [error, setError] = useState<string | null>(null);

    // State for new assignment form
    const [newAssignment, setNewAssignment] = useState({
        title: '',
        description: '',
        maxScore: 0,
        dueDate: dayjs(),
        brief: null as File | null,
    });

    useEffect(() => {
        let isMounted = true;

        const fetchTeachingCourses = async () => {
            try {
                if (!user) {
                    if (isMounted) setError('User not authenticated');
                    return;
                }
        
                console.log('Fetching teacher courses for user:', user._id); // Debug log
                const teacherCourses = await courseAPI.getTeacherCourses();
                console.log('Received teacher courses data:', teacherCourses); // Debug log
                if (isMounted) setTeachingCourses(teacherCourses);
                if (teacherCourses.length === 0) {
                    if (isMounted) setError('No teaching courses found. Please contact an admin to assign you to a course.');
                }
            } catch (err: any) {
                console.error('Error fetching teaching courses:', {
                    message: err.response?.data?.message || err.message,
                    status: err.response?.status,
                    data: err.response?.data,
                }); // Detailed error log
                if (isMounted) setError(err.response?.data?.message || 'Failed to load teaching courses.');
            }
        };

        fetchTeachingCourses();
        userAPI.updateStatus('online');

        return () => {
            isMounted = false;
            userAPI.updateStatus('offline');
        };
    }, [user]);

    const handleCourseSelect = async (course: Course) => {
        try {
            // First get the course details with populated student data
            const courseDetails = await courseAPI.getCourse(course._id);
            console.log('Course details with students:', courseDetails); // Debug log
            
            // Then fetch assignments
            const courseAssignments = await assignmentAPI.getCourseAssignments(course._id);
            
            // Update both states at once to prevent flickering
            setSelectedCourse(courseDetails);
            setAssignments(courseAssignments);
        } catch (err: any) {
            console.error('Error fetching course details:', err);
            setError(err.response?.data?.message || 'Failed to load course details.');
        }
    };

    const handleAssignmentUpload = async () => {
        if (!selectedCourse) {
            console.error('No course selected');
            setError('Please select a course first');
            return;
        }

        try {
            // Validate that either description or brief is provided
            if (!newAssignment.description && !newAssignment.brief) {
                setError('Either assignment description or brief file is required.');
                return;
            }

            console.log('Creating assignment with data:', {
                title: newAssignment.title,
                description: newAssignment.description,
                maxScore: newAssignment.maxScore,
                dueDate: newAssignment.dueDate.toISOString(),
                course: selectedCourse._id,
                brief: newAssignment.brief ? newAssignment.brief.name : null
            });

            const formData = new FormData();
            formData.append('title', newAssignment.title);
            formData.append('description', newAssignment.description);
            formData.append('maxScore', newAssignment.maxScore.toString());
            formData.append('dueDate', newAssignment.dueDate.toISOString());
            formData.append('course', selectedCourse._id);
            if (newAssignment.brief) {
                formData.append('brief', newAssignment.brief);
            }

            console.log('Sending form data to server...');
            const newAssignmentResponse = await assignmentAPI.createAssignment(formData);
            console.log('Server response:', newAssignmentResponse);
            
            setAssignments([...assignments, newAssignmentResponse]);

            // Reset form
            setNewAssignment({
                title: '',
                description: '',
                maxScore: 0,
                dueDate: dayjs(),
                brief: null,
            });
            setError(null);
        } catch (err: any) {
            console.error('Error uploading assignment:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            setError(err.response?.data?.message || 'Failed to upload assignment. Please check the console for details.');
        }
    };

    const handleLogout = () => {
        userAPI.updateStatus('offline');
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <Layout>
            <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
                {/* Welcome Section */}
                <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
                        Welcome, {user.firstName} (Teacher)
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
                        Department: {typeof user.department === 'object' && user.department !== null && 'name' in user.department ? user.department.name : 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        This is your teacher dashboard. View your teaching courses, manage students, and handle assignments.
                    </Typography>
                </Paper>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Teaching Courses */}
                <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', mb: 3 }}>
                        Teaching Courses
                    </Typography>
                    <Grid container spacing={3}>
                        {teachingCourses.length > 0 ? (
                            teachingCourses.map((course) => (
                                <Grid item xs={12} sm={6} md={4} key={course._id}>
                                    <Card
                                        sx={{
                                            height: '100%', 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            borderRadius: 2, 
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
                                            transition: 'transform 0.2s ease-in-out',
                                            '&:hover': {
                                                transform: 'translateY(-5px)',
                                            },
                                            cursor: 'pointer',
                                            border: selectedCourse?._id === course._id ? '2px solid' : '1px solid',
                                            borderColor: selectedCourse?._id === course._id ? 'primary.main' : 'divider',
                                        }}
                                        onClick={() => handleCourseSelect(course)}
                                    >
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" component="div" sx={{ color: 'primary.dark', mb: 1 }}>{course.title} ({course.code})</Typography>
                                            <Typography variant="body2" color="text.secondary">Credits: {course.credits ?? 'N/A'}</Typography>
                                            <Typography variant="body2" color="text.secondary">Semester: {course.semester ?? 'N/A'}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))
                        ) : ( 
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>No teaching courses found.</Typography>
                            </Grid>
                        )}
                    </Grid>
                </Paper>

                {/* Selected Course Details */}
                {selectedCourse && (
                    <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', mb: 3 }}>
                            {selectedCourse.title} ({selectedCourse.code})
                        </Typography>

                        {/* Enrolled Students */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
                                Enrolled Students
                            </Typography>
                            {selectedCourse.students && selectedCourse.students.length > 0 ? (
                                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                    <Table>
                                        <TableHead sx={{ backgroundColor: 'action.hover' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Student ID</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedCourse.students.map((student) => {
                                                console.log('Rendering student in table:', JSON.stringify(student, null, 2));
                                                return (
                                                    <TableRow key={student._id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'action.hover' } }}>
                                                        <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                                                        <TableCell>{student.email}</TableCell>
                                                        <TableCell>{(student as User).studentId ?? 'N/A'}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>No students enrolled in this course.</Typography>
                            )}
                        </Box>

                        {/* Assignments */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
                                Assignments
                            </Typography>
                            {assignments.length > 0 ? (
                                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Title</TableCell>
                                                <TableCell>Description</TableCell>
                                                <TableCell>Max Score</TableCell>
                                                <TableCell>Due Date</TableCell>
                                                <TableCell>Submissions</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {assignments.map((assignment) => (
                                                <TableRow key={assignment._id}>
                                                    <TableCell>{assignment.title}</TableCell>
                                                    <TableCell>{assignment.description}</TableCell>
                                                    <TableCell>{assignment.maxScore}</TableCell>
                                                    <TableCell>{new Date(assignment.dueDate).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        {assignment.submissions ? assignment.submissions.length : 0} submissions
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            onClick={() => navigate(`/assignments/${assignment._id}`)}
                                                        >
                                                            View Details
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>No assignments found for this course.</Typography>
                            )}
                        </Box>

                        {/* Add New Assignment */}
                        <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', mb: 3 }}>
                                Add New Assignment
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 500 }}>
                                <FormControl fullWidth margin="normal">
                                    <TextField
                                        label="Title"
                                        value={newAssignment.title}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                        required
                                        fullWidth
                                    />
                                </FormControl>
                                <FormControl fullWidth margin="normal">
                                    <TextField
                                        label="Description"
                                        multiline
                                        rows={4}
                                        value={newAssignment.description}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                        fullWidth
                                    />
                                </FormControl>
                                <FormControl fullWidth margin="normal">
                                    <TextField
                                        label="Maximum Score"
                                        type="number"
                                        value={newAssignment.maxScore}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: Number(e.target.value) })}
                                        required
                                        fullWidth
                                    />
                                </FormControl>
                                <FormControl fullWidth margin="normal">
                                    <TextField
                                        label="Due Date"
                                        type="datetime-local"
                                        value={newAssignment.dueDate.format('YYYY-MM-DDTHH:mm')}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: dayjs(e.target.value) })}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        required
                                        fullWidth
                                    />
                                </FormControl>
                                <FormControl fullWidth margin="normal">
                                    <input
                                        type="file"
                                        onChange={(e) => setNewAssignment({ ...newAssignment, brief: e.target.files?.[0] || null })}
                                        accept=".pdf,.doc,.docx,.txt"
                                        style={{ display: 'none' }}
                                        id="brief-upload-button"
                                    />
                                    <label htmlFor="brief-upload-button">
                                        <Button variant="outlined" component="span" fullWidth>
                                            {newAssignment.brief ? newAssignment.brief.name : 'Upload Assignment Brief'}
                                        </Button>
                                    </label>
                                    {newAssignment.brief && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                            Selected file: {newAssignment.brief.name}
                                        </Typography>
                                    )}
                                </FormControl>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleAssignmentUpload}
                                    disabled={!newAssignment.title || !newAssignment.maxScore || !selectedCourse}
                                    sx={{ mt: 2 }}
                                >
                                    Create Assignment
                                </Button>
                            </Box>
                        </Paper>
                    </Paper>
                )}

                {/* Communication Section (Removed based on user request) */}
                {/* 
                <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', mb: 3 }}>
                        Course Communication
                    </Typography>
                    <CommunicationComponent />
                </Paper>
                */}

            </Box>
        </Layout>
    );
};

export default TeacherDashboard;