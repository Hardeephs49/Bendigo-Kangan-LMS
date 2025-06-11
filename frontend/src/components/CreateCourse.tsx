import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseAPI } from '../services/api';
import Layout from '../components/layout/Layout';

const CreateCourse: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        credits: '3', // Default value as in AdminDashboard
        description: '',
        semester: '',
        schedule: '',
        room: '',
        department: '',
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Set the department based on the admin's department, similar to AdminDashboard
        if (user && user.department) {
            let departmentId: string;
            if (typeof user.department === 'object' && user.department !== null && '_id' in user.department) {
                departmentId = user.department._id as string;
            } else if (typeof user.department === 'string') {
                departmentId = user.department;
            } else {
                departmentId = '';
                setError('Invalid department format. Please contact support.');
            }
            setFormData(prev => ({
                ...prev,
                department: departmentId,
            }));
        } else {
            setError('Admin department not found. Please update your profile with a department.');
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Validate required fields
            if (
                !formData.title ||
                !formData.code ||
                !formData.description ||
                !formData.semester ||
                !formData.room ||
                !formData.schedule ||
                !formData.department
            ) {
                setError('All fields are required.');
                return;
            }

            const credits = parseInt(formData.credits);
            if (isNaN(credits) || credits <= 0) {
                setError('Credits must be a valid positive number.');
                return;
            }

            const courseData = {
                ...formData,
                credits: credits,
            };

            await courseAPI.createCourse(courseData);
            navigate('/courses');
        } catch (err: any) {
            console.error('Error creating course:', {
                message: err.response?.data?.message || err.message,
                status: err.response?.status,
                data: err.response?.data,
            });
            setError(err.response?.data?.message || 'Failed to create course.');
        }
    };

    if (!user || user.role !== 'admin') {
        navigate('/courses');
        return null;
    }

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Create New Course
                </Typography>
                {error && (
                    <Typography variant="body2" sx={{ color: 'red', mb: 2 }}>
                        {error}
                    </Typography>
                )}
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        fullWidth
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Course Code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        fullWidth
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Credits"
                        name="credits"
                        type="number"
                        value={formData.credits}
                        onChange={handleChange}
                        fullWidth
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        rows={4}
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Semester"
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        fullWidth
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Schedule (e.g., Monday 09:00-10:30)"
                        name="schedule"
                        value={formData.schedule}
                        onChange={handleChange}
                        fullWidth
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Room"
                        name="room"
                        value={formData.room}
                        onChange={handleChange}
                        fullWidth
                        required
                        sx={{ mb: 2 }}
                    />
                    <Button type="submit" variant="contained" color="primary">
                        Create Course
                    </Button>
                </form>
            </Box>
        </Layout>
    );
};

export default CreateCourse;