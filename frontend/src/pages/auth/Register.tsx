import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Typography,
    MenuItem,
    Link,
    Select,
    InputLabel,
    FormControl,
    SelectChangeEvent,
    CircularProgress,
    Paper,
    Grid,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { departmentAPI } from '../../services/api';
import { Department, RegisterUser } from '../../types';

interface RegisterFormData extends Omit<RegisterUser, 'department'> {
    confirmPassword: string;
    department: string; // Store department ID as a string during registration
}

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState<RegisterFormData>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        department: '',
    });
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setLoading(true);
                const deptList = await departmentAPI.getAllDepartments();
                console.log('Fetched departments:', deptList); // Debug log
                setDepartments(deptList);
                if (deptList.length === 0) {
                    setError('No departments available. Please contact support.');
                }
            } catch (err) {
                console.error('Error fetching departments:', err);
                setError('Failed to load departments. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchDepartments();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }> | SelectChangeEvent<string>
    ) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name as string]: value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            const { confirmPassword, ...registerData } = formData;
            await register(registerData);
            navigate('/');
        } catch (err) {
            setError('Registration failed. Please try again.');
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
                backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(/images/students-campus.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* Header with logos and links */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    backgroundColor: 'transparent',
                    zIndex: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        component="img"
                        src="/images/bki-logo.png"
                        alt="Bendigo Kangan Institute Logo"
                        sx={{ height: 40 }}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Link component={RouterLink} to="/support" sx={{ textDecoration: 'none', color: 'rgba(255,255,255,0.7)' }}>
                        <Typography variant="body2">Support</Typography>
                    </Link>
                    <Link component={RouterLink} to="/privacy" sx={{ textDecoration: 'none', color: 'rgba(255,255,255,0.7)' }}>
                        <Typography variant="body2">Privacy Policy</Typography>
                    </Link>
                    <Link component={RouterLink} to="/terms" sx={{ textDecoration: 'none', color: 'rgba(255,255,255,0.7)' }}>
                        <Typography variant="body2">Terms of Use</Typography>
                    </Link>
                </Box>
            </Box>

            {/* Main content box - combined left and right sections */}
            <Paper
                elevation={6}
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    borderRadius: 3,
                    overflow: 'hidden',
                    maxWidth: '900px',
                    width: '100%',
                    zIndex: 1,
                }}
            >
                {/* Left section with welcome message */}
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        p: 4,
                        color: 'white',
                        background: 'linear-gradient(to right bottom, #3f51b5, #673ab7)',
                        minHeight: { xs: '200px', md: 'auto' },
                    }}
                >
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                        Welcome to Bendigo-Kangan LMS
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Your gateway to learning and development
                    </Typography>
                </Box>

                {/* Registration form on the right */}
                <Box
                    sx={{
                        flex: 1,
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        backgroundColor: 'background.paper',
                    }}
                >
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'text.primary' }}>
                        Sign Up
                    </Typography>

                    {error && (
                        <Typography variant="body2" sx={{ color: 'error.main', mb: 2 }}>
                            {error}
                        </Typography>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="firstName"
                            label="First Name"
                            name="firstName"
                            autoComplete="given-name"
                            autoFocus
                            value={formData.firstName}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="lastName"
                            label="Last Name"
                            name="lastName"
                            autoComplete="family-name"
                            value={formData.lastName}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            sx={{ mb: 3 }}
                        />

                        <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                            <InputLabel id="role-select-label">Register As</InputLabel>
                            <Select
                                labelId="role-select-label"
                                id="role-select"
                                value={formData.role}
                                label="Register As"
                                onChange={handleChange}
                                name="role"
                            >
                                <MenuItem value={"student"}>Student</MenuItem>
                                <MenuItem value={"teacher"}>Teacher</MenuItem>
                                <MenuItem value={"admin"}>Admin</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
                            <InputLabel id="department-select-label">Department</InputLabel>
                            <Select
                                labelId="department-select-label"
                                id="department-select"
                                value={formData.department}
                                label="Department"
                                onChange={handleChange}
                                name="department"
                                disabled={loading}
                            >
                                {loading ? (
                                    <MenuItem disabled>
                                        <CircularProgress size={20} /> Loading Departments...
                                    </MenuItem>
                                ) : departments.length === 0 ? (
                                    <MenuItem disabled>No departments available</MenuItem>
                                ) : (
                                    departments.map((dept) => (
                                        <MenuItem key={dept._id} value={dept._id}>
                                            {dept.name}
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            sx={{ mb: 2, py: 1.5 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                        </Button>

                        <Grid container justifyContent="center">
                            <Grid item>
                                <Link component={RouterLink} to="/login" variant="body2" sx={{ color: 'primary.main' }}>
                                    {"Already have an account? Sign In"}
                                </Link>
                            </Grid>
                        </Grid>
                    </form>
                </Box>
            </Paper>
        </Box>
    );
};

export default Register;