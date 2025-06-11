import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    List,
    ListItem,
    ListItemText,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    InputLabel,
    FormControl,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { courseAPI, assignmentAPI } from '../services/api';
import { Course, Assignment, User } from '../types';
import Layout from '../components/layout/Layout';
import dayjs from 'dayjs';
import CourseMaterialComponent from '../components/CourseMaterial';
import CourseDetails from '../components/CourseDetails';

const CourseDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [course, setCourse] = useState<Course | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [error, setError] = useState<string | null>(null);

    // State for new assignment form (for teachers)
    const [newAssignment, setNewAssignment] = useState({
        title: '',
        description: '',
        maxScore: 0,
        dueDate: dayjs(),
        brief: null as File | null,
    });

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                if (!id) {
                    setError('Course ID is missing');
                    return;
                }
                const response = await courseAPI.getCourse(id);
                console.log('Course Details:', response); // Debug log
                setCourse(response);

                // Fetch assignments for the course (for teachers)
                if (user?.role === 'teacher') {
                    const courseAssignments = await assignmentAPI.getCourseAssignments(id);
                    setAssignments(courseAssignments);
                }
            } catch (error: any) {
                console.error('Error fetching course:', error);
                setError(error.response?.data?.message || 'Failed to load course details. Please try again.');
            }
        };
        fetchCourse();
    }, [id, user]);

    const handleEnroll = async () => {
        try {
            if (!id || !user) return;
            await courseAPI.enrollInCourse(id);
            const updatedCourse = await courseAPI.getCourse(id);
            setCourse(updatedCourse);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to enroll in course');
        }
    };

    const handleAssignmentUpload = async () => {
        if (!course) return;

        try {
            // Validate that either description or brief is provided
            if (!newAssignment.description && !newAssignment.brief) {
                setError('Either assignment description or brief file is required.');
                return;
            }

            const formData = new FormData();
            formData.append('title', newAssignment.title);
            formData.append('description', newAssignment.description);
            formData.append('maxScore', newAssignment.maxScore.toString());
            formData.append('dueDate', newAssignment.dueDate.toISOString());
            formData.append('course', course._id);
            if (newAssignment.brief) {
                formData.append('brief', newAssignment.brief);
            }

            const newAssignmentResponse = await assignmentAPI.createAssignment(formData);
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
            setError(err.response?.data?.message || 'Failed to upload assignment.');
        }
    };

    if (!user) return <Typography>User not authenticated</Typography>;
    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="body2" sx={{ color: 'red' }}>
                    {error}
                </Typography>
            </Box>
        );
    }
    if (!course) return <Typography>Loading...</Typography>;

    const isEnrolled = course.students.some(student => student._id === user._id);

    const renderAssignmentForm = () => (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
                Add New Assignment
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 500 }}>
                <FormControl fullWidth>
                    <InputLabel htmlFor="assignment-title">Title</InputLabel>
                    <TextField
                        id="assignment-title"
                        label="Title"
                        value={newAssignment.title}
                        onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                        required
                    />
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel htmlFor="assignment-description">Description</InputLabel>
                    <TextField
                        id="assignment-description"
                        label="Description"
                        multiline
                        rows={4}
                        value={newAssignment.description}
                        onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    />
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel htmlFor="assignment-max-score">Maximum Score</InputLabel>
                    <TextField
                        id="assignment-max-score"
                        label="Maximum Score"
                        type="number"
                        value={newAssignment.maxScore}
                        onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: Number(e.target.value) })}
                        required
                    />
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel htmlFor="assignment-due-date">Due Date</InputLabel>
                    <TextField
                        id="assignment-due-date"
                        type="datetime-local"
                        label="Due Date"
                        value={newAssignment.dueDate.format('YYYY-MM-DDTHH:mm')}
                        onChange={(e) => {
                            const date = dayjs(e.target.value);
                            setNewAssignment({ ...newAssignment, dueDate: date });
                        }}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        required
                    />
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel htmlFor="assignment-brief">Assignment Brief</InputLabel>
                    <input
                        id="assignment-brief"
                        type="file"
                        onChange={(e) => setNewAssignment({ ...newAssignment, brief: e.target.files?.[0] || null })}
                        accept=".pdf,.doc,.docx"
                        aria-label="Assignment Brief"
                        title="Upload Assignment Brief"
                    />
                </FormControl>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAssignmentUpload}
                    disabled={!newAssignment.title || !newAssignment.maxScore}
                >
                    Upload Assignment
                </Button>
            </Box>
        </Box>
    );

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <CourseDetails courseId={course._id} />
            </Box>
        </Layout>
    );
};

export default CourseDetail;