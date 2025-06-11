import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Tabs,
    Tab,
    CircularProgress,
    Alert,
} from '@mui/material';
import { courseAPI } from '../../services/api';
import { Course } from '../../types';

const Enrollment: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            console.log('Fetching available courses...');
            // Fetch available courses
            const available = await courseAPI.getAvailableCourses();
            console.log('Available courses:', available);
            setAvailableCourses(available);

            console.log('Fetching enrolled courses...');
            // Fetch enrolled courses
            const enrolled = await courseAPI.getStudentCourses();
            console.log('Enrolled courses:', enrolled);
            setEnrolledCourses(enrolled);
        } catch (err: any) {
            console.error('Error fetching courses:', err);
            setError(err.response?.data?.message || 'Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleEnroll = async (courseId: string) => {
        try {
            await courseAPI.enrollInCourse(courseId);
            // Refresh both lists
            await fetchCourses();
            setError(null);
        } catch (err: any) {
            console.error('Error enrolling in course:', err);
            setError(err.response?.data?.message || 'Failed to enroll in course');
        }
    };

    const handleUnenroll = async (courseId: string) => {
        try {
            await courseAPI.unenrollFromCourse(courseId);
            // Refresh both lists
            await fetchCourses();
            setError(null);
        } catch (err: any) {
            console.error('Error unenrolling from course:', err);
            setError(err.response?.data?.message || 'Failed to unenroll from course');
        }
    };

    const filteredAvailableCourses = availableCourses.filter(course => 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Course Enrollment
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
                <Tab label="Available Courses" />
                <Tab label="Enrolled Courses" />
            </Tabs>

            {tabValue === 0 && (
                <>
                    <TextField
                        fullWidth
                        label="Search Courses"
                        variant="outlined"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ mb: 3 }}
                    />
                    <Paper>
                        <List>
                            {filteredAvailableCourses.map((course, index) => (
                                <React.Fragment key={course._id}>
                                    <ListItem>
                                        <ListItemText
                                            primary={`${course.title} (${course.code})`}
                                            secondary={
                                                <Box component="span">
                                                    <Typography component="span" variant="body2">
                                                        Credits: {course.credits} | Semester: {course.semester}
                                                    </Typography>
                                                    <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                                                        {course.description}
                                                    </Typography>
                                                    <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                                                        Schedule: {course.schedule || 'Not set'}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleEnroll(course._id)}
                                            >
                                                Enroll
                                            </Button>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    {index < filteredAvailableCourses.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                            {filteredAvailableCourses.length === 0 && (
                                <ListItem>
                                    <ListItemText primary="No courses available" />
                                </ListItem>
                            )}
                        </List>
                    </Paper>
                </>
            )}

            {tabValue === 1 && (
                <Paper>
                    <List>
                        {enrolledCourses.map((course, index) => (
                            <React.Fragment key={course._id}>
                                <ListItem>
                                    <ListItemText
                                        primary={`${course.title} (${course.code})`}
                                        secondary={
                                            <Box component="span">
                                                <Typography component="span" variant="body2">
                                                    Credits: {course.credits} | Semester: {course.semester}
                                                </Typography>
                                                <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                                                    {course.description}
                                                </Typography>
                                                <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                                                    Schedule: {course.schedule || 'Not set'}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={() => handleUnenroll(course._id)}
                                        >
                                            Unenroll
                                        </Button>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < enrolledCourses.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                        {enrolledCourses.length === 0 && (
                            <ListItem>
                                <ListItemText primary="You are not enrolled in any courses" />
                            </ListItem>
                        )}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default Enrollment; 