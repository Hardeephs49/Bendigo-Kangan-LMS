import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, Alert } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseAPI } from '../services/api';
import { Course } from '../types';
import Layout from '../components/layout/Layout';

const CourseEnrollment: React.FC = () => {
    const { user } = useAuth();
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                if (!user) {
                    setError('User not authenticated');
                    return;
                }

                if (!user.department) {
                    setError('Your account is not properly configured. Please contact your administrator.');
                    return;
                }

                // Fetch available courses
                const available = await courseAPI.getAvailableCourses();
                setAvailableCourses(available);

                // Fetch enrolled courses
                const enrolled = await courseAPI.getStudentCourses();
                setEnrolledCourses(enrolled);
            } catch (err: any) {
                console.error('Error fetching courses:', err);
                setError(err.response?.data?.message || 'Failed to load courses');
            }
        };

        fetchCourses();
    }, [user]);

    const handleEnroll = async (courseId: string) => {
        try {
            await courseAPI.enrollInCourse(courseId);
            // Refresh both lists
            const [available, enrolled] = await Promise.all([
                courseAPI.getAvailableCourses(),
                courseAPI.getStudentCourses()
            ]);
            setAvailableCourses(available);
            setEnrolledCourses(enrolled);
            setSuccess('Successfully enrolled in course');
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to enroll in course');
            setSuccess(null);
        }
    };

    const handleUnenroll = async (courseId: string) => {
        try {
            await courseAPI.unenrollFromCourse(courseId);
            // Refresh both lists
            const [available, enrolled] = await Promise.all([
                courseAPI.getAvailableCourses(),
                courseAPI.getStudentCourses()
            ]);
            setAvailableCourses(available);
            setEnrolledCourses(enrolled);
            setSuccess('Successfully unenrolled from course');
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to unenroll from course');
            setSuccess(null);
        }
    };

    if (!user) return null;

    return (
        <Layout>
            <Box sx={{ flex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4">
                        Course Enrollment
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {/* Available Courses */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" gutterBottom>
                        Available Courses
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {availableCourses.length > 0 ? (
                            availableCourses.map(course => (
                                <Card key={course._id} sx={{ width: 300 }}>
                                    <CardContent>
                                        <Typography variant="h6">{course.title} ({course.code})</Typography>
                                        <Typography variant="body2">Credits: {course.credits ?? 'N/A'}</Typography>
                                        <Typography variant="body2">Semester: {course.semester ?? 'N/A'}</Typography>
                                        <Typography variant="body2">Department: {typeof course.department === 'string' ? course.department : course.department?.name ?? 'N/A'}</Typography>
                                        <Typography variant="body2">Instructor: {course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : 'Not Assigned'}</Typography>
                                        <Button 
                                            variant="contained" 
                                            onClick={() => handleEnroll(course._id)}
                                            sx={{ mt: 1 }}
                                        >
                                            Enroll
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Typography>No available courses found.</Typography>
                        )}
                    </Box>
                </Box>

                {/* Enrolled Courses */}
                <Box>
                    <Typography variant="h5" gutterBottom>
                        Currently Enrolled Courses
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {enrolledCourses.length > 0 ? (
                            enrolledCourses.map(course => (
                                <Card key={course._id} sx={{ width: 300 }}>
                                    <CardContent>
                                        <Typography variant="h6">{course.title} ({course.code})</Typography>
                                        <Typography variant="body2">Credits: {course.credits ?? 'N/A'}</Typography>
                                        <Typography variant="body2">Semester: {course.semester ?? 'N/A'}</Typography>
                                        <Typography variant="body2">Department: {typeof course.department === 'string' ? course.department : course.department?.name ?? 'N/A'}</Typography>
                                        <Typography variant="body2">Instructor: {course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : 'Not Assigned'}</Typography>
                                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                            <Button 
                                                variant="outlined" 
                                                color="error"
                                                onClick={() => handleUnenroll(course._id)}
                                            >
                                                Unenroll
                                            </Button>
                                            <Button 
                                                variant="outlined" 
                                                component={RouterLink} 
                                                to={`/courses/${course._id}`}
                                            >
                                                View Course
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Typography>You are not enrolled in any courses.</Typography>
                        )}
                    </Box>
                </Box>
            </Box>
        </Layout>
    );
};

export default CourseEnrollment; 