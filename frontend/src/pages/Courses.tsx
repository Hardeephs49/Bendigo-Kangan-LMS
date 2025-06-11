import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseAPI } from '../services/api';
import { Course } from '../types';
import Layout from '../components/layout/Layout';

const Courses: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
    const [pastCourses, setPastCourses] = useState<Course[]>([]);
    const [enrolledError, setEnrolledError] = useState<string | null>(null);
    const [pastError, setPastError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                if (!user) {
                    setEnrolledError('User not authenticated');
                    setPastError('User not authenticated');
                    return;
                }

                if (!user.department) {
                    setEnrolledError('Your account is not properly configured. Please contact your administrator.');
                    setPastError('Your account is not properly configured. Please contact your administrator.');
                    return;
                }

                if (user.role === 'student') {
                    try {
                        const enrolled = await courseAPI.getStudentCourses();
                        console.log('Raw Enrolled Courses:', enrolled);
                        if (!Array.isArray(enrolled)) {
                            throw new Error('Expected an array of enrolled courses');
                        }
                        const validEnrolled = enrolled.filter(course =>
                            course && course._id && /^[0-9a-fA-F]{24}$/.test(course._id)
                        );
                        console.log('Valid Enrolled Courses:', validEnrolled);
                        setEnrolledCourses(validEnrolled);
                    } catch (err: any) {
                        console.error('Error fetching enrolled courses:', err);
                        setEnrolledError(err.response?.data?.message || 'Failed to load enrolled courses.');
                    }

                    try {
                        const past = await courseAPI.getPastCourses();
                        console.log('Raw Past Courses:', past);
                        if (!Array.isArray(past)) {
                            throw new Error('Expected an array of past courses');
                        }
                        const validPast = past.filter(course =>
                            course && course._id && /^[0-9a-fA-F]{24}$/.test(course._id)
                        );
                        console.log('Valid Past Courses:', validPast);
                        setPastCourses(validPast);
                    } catch (err: any) {
                        console.error('Error fetching past courses:', err);
                        setPastError(err.response?.data?.message || 'Failed to load past courses.');
                    }
                } else if (user.role === 'teacher') {
                    try {
                        const teachingCourses = await courseAPI.getTeacherCourses();
                        console.log('Teaching Courses:', teachingCourses);
                        if (!Array.isArray(teachingCourses)) {
                            throw new Error('Expected an array of teaching courses');
                        }
                        const validTeachingCourses = teachingCourses.filter(course =>
                            course && course._id && /^[0-9a-fA-F]{24}$/.test(course._id)
                        );
                        setEnrolledCourses(validTeachingCourses);
                    } catch (err: any) {
                        console.error('Error fetching teaching courses:', err);
                        setEnrolledError(err.response?.data?.message || 'Failed to load teaching courses.');
                    }
                } else if (user.role === 'admin') {
                    try {
                        const allCourses = await courseAPI.getAllCourses();
                        console.log('All Courses (Admin):', allCourses);
                        if (!Array.isArray(allCourses)) {
                            throw new Error('Expected an array of courses');
                        }
                        const validCourses = allCourses.filter(course =>
                            course && course._id && /^[0-9a-fA-F]{24}$/.test(course._id)
                        );
                        setEnrolledCourses(validCourses);
                    } catch (err: any) {
                        console.error('Error fetching all courses:', err);
                        setEnrolledError(err.response?.data?.message || 'Failed to load courses.');
                    }
                }
            } catch (error: any) {
                console.error('Error fetching courses:', error);
                setEnrolledError(error.response?.data?.message || 'Failed to load courses.');
                setPastError(error.response?.data?.message || 'Failed to load courses.');
            }
        };
        fetchCourses();
    }, [user]);

    if (!user) return null;

    return (
        <Layout>
            <Box sx={{ flex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4">
                        My Courses
                    </Typography>
                    {user.role === 'admin' && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate('/courses/new')}
                        >
                            Add New Course
                        </Button>
                    )}
                </Box>

                {/* Currently Enrolled or Teaching Courses */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" gutterBottom>
                        {user.role === 'student' ? 'Currently Enrolled Courses' : user.role === 'teacher' ? 'Teaching Courses' : 'All Courses'}
                    </Typography>
                    {enrolledError && (
                        <Typography variant="body2" sx={{ color: 'red', mb: 2 }}>
                            {enrolledError}
                        </Typography>
                    )}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {enrolledCourses.length > 0 ? (
                            enrolledCourses.map(course => (
                                <Card key={course._id} sx={{ width: 300 }}>
                                    <CardContent>
                                        <Typography variant="h6">{course.title} ({course.code})</Typography>
                                        <Typography variant="body2">Credits: {course.credits ?? 'N/A'}</Typography>
                                        <Typography variant="body2">Semester: {course.semester ?? 'N/A'}</Typography>
                                        <Button component={RouterLink} to={`/courses/${course._id}`} sx={{ mt: 1 }}>
                                            View Course
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Typography>
                                {user.role === 'student' ? 'No enrolled courses found. Please enroll in a course.' :
                                 user.role === 'teacher' ? 'No teaching courses found.' :
                                 'No courses found.'}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Past Courses (Students Only) */}
                {user.role === 'student' && (
                    <Box>
                        <Typography variant="h5" gutterBottom>
                            Past Courses
                        </Typography>
                        {pastError && (
                            <Typography variant="body2" sx={{ color: 'red', mb: 2 }}>
                                {pastError}
                            </Typography>
                        )}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {pastCourses.length > 0 ? (
                                pastCourses.map(course => (
                                    <Card key={course._id} sx={{ width: 300 }}>
                                        <CardContent>
                                            <Typography variant="h6">{course.title} ({course.code})</Typography>
                                            <Typography variant="body2">Credits: {course.credits ?? 'N/A'}</Typography>
                                            <Typography variant="body2">Semester: {course.semester ?? 'N/A'}</Typography>
                                            <Button component={RouterLink} to={`/courses/${course._id}`} sx={{ mt: 1 }}>
                                                View Course
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Typography>No past courses found.</Typography>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>
        </Layout>
    );
};

export default Courses;