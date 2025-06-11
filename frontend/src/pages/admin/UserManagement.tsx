import React, { useEffect, useState } from 'react';
import {
    Typography,
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Button,
    Divider,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import { User, Department } from '../../types';
import Layout from '../../components/layout/Layout';

const UserManagement: React.FC = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState<User[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // State for exile dialog
    const [openExileDialog, setOpenExileDialog] = useState(false);
    const [userToExile, setUserToExile] = useState<User | null>(null);

    // State for add user dialog
    const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
    const [newUser, setNewUser] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'student' as 'student' | 'teacher',
        department: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const [studentsResponse, teachersResponse, departmentsResponse] = await Promise.all([
                    userAPI.getUsersByDepartment('student'),
                    userAPI.getUsersByDepartment('teacher'),
                    userAPI.getDepartments()
                ]);

                if (!Array.isArray(studentsResponse) || !Array.isArray(teachersResponse)) {
                    throw new Error('Invalid response format from server');
                }

                setStudents(studentsResponse);
                setTeachers(teachersResponse);
                setDepartments(departmentsResponse);
            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError(err.response?.data?.message || err.message || 'Failed to load data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleExile = (user: User) => {
        setUserToExile(user);
        setOpenExileDialog(true);
    };

    const confirmExile = async () => {
        if (!userToExile) return;
        
        try {
            await userAPI.exileUser(userToExile._id);
            // Refresh the user lists
            const [studentsResponse, teachersResponse] = await Promise.all([
                userAPI.getUsersByDepartment('student'),
                userAPI.getUsersByDepartment('teacher')
            ]);
            setStudents(studentsResponse);
            setTeachers(teachersResponse);
            setOpenExileDialog(false);
            setUserToExile(null);
            setSuccess('User exiled successfully');
            setError(null);
        } catch (err: any) {
            console.error('Error exiling user:', err);
            setError(err.response?.data?.message || 'Failed to exile user. Please try again.');
        }
    };

    const handleAddUser = async () => {
        try {
            await userAPI.createUser(newUser);
            // Refresh the user lists
            const [studentsResponse, teachersResponse] = await Promise.all([
                userAPI.getUsersByDepartment('student'),
                userAPI.getUsersByDepartment('teacher')
            ]);
            setStudents(studentsResponse);
            setTeachers(teachersResponse);
            setOpenAddUserDialog(false);
            setNewUser({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                role: 'student',
                department: ''
            });
            setSuccess('User added successfully');
            setError(null);
        } catch (err: any) {
            console.error('Error adding user:', err);
            setError(err.response?.data?.message || 'Failed to add user. Please try again.');
        }
    };

    if (loading) {
        return (
            <Layout>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Typography>Loading...</Typography>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    User Management
                </Typography>

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

                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setOpenAddUserDialog(true)}
                    sx={{ mb: 3 }}
                >
                    Add New User
                </Button>

                <Paper sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ p: 2 }}>
                        Students
                    </Typography>
                    <List>
                        {students.map((student, index) => (
                            <React.Fragment key={student._id}>
                                <ListItem>
                                    <ListItemText
                                        primary={`${student.firstName} ${student.lastName}`}
                                        secondary={
                                            <Box component="span">
                                                <Typography component="span" variant="body2">
                                                    Email: {student.email}
                                                </Typography>
                                                <Typography component="span" variant="body2" sx={{ ml: 2 }}>
                                                    Department: {typeof student.department === 'object' && student.department !== null && 'name' in student.department ? student.department.name : 'N/A'}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            onClick={() => handleExile(student)}
                                            sx={{ mr: 1 }}
                                        >
                                            Exile Student
                                        </Button>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < students.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>

                <Paper>
                    <Typography variant="h6" sx={{ p: 2 }}>
                        Teachers
                    </Typography>
                    <List>
                        {teachers.map((teacher, index) => (
                            <React.Fragment key={teacher._id}>
                                <ListItem>
                                    <ListItemText
                                        primary={`${teacher.firstName} ${teacher.lastName}`}
                                        secondary={
                                            <Box component="span">
                                                <Typography component="span" variant="body2">
                                                    Email: {teacher.email}
                                                </Typography>
                                                <Typography component="span" variant="body2" sx={{ ml: 2 }}>
                                                    Department: {typeof teacher.department === 'object' && teacher.department !== null && 'name' in teacher.department ? teacher.department.name : 'N/A'}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            onClick={() => handleExile(teacher)}
                                            sx={{ mr: 1 }}
                                        >
                                            Exile Staff
                                        </Button>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < teachers.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>

                {/* Exile Confirmation Dialog */}
                <Dialog
                    open={openExileDialog}
                    onClose={() => setOpenExileDialog(false)}
                >
                    <DialogTitle>Confirm Exile</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to exile {userToExile?.firstName} {userToExile?.lastName}? 
                            This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenExileDialog(false)}>Cancel</Button>
                        <Button onClick={confirmExile} color="error" variant="contained">
                            Confirm Exile
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Add User Dialog */}
                <Dialog
                    open={openAddUserDialog}
                    onClose={() => setOpenAddUserDialog(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            <TextField
                                label="First Name"
                                value={newUser.firstName}
                                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Last Name"
                                value={newUser.lastName}
                                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Email"
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Password"
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                fullWidth
                            />
                            <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={newUser.role}
                                    label="Role"
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'student' | 'teacher' })}
                                >
                                    <MenuItem value="student">Student</MenuItem>
                                    <MenuItem value="teacher">Teacher</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Department</InputLabel>
                                <Select
                                    value={newUser.department}
                                    label="Department"
                                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                >
                                    {departments.map((dept) => (
                                        <MenuItem key={dept._id} value={dept._id}>
                                            {dept.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenAddUserDialog(false)}>Cancel</Button>
                        <Button onClick={handleAddUser} color="primary" variant="contained">
                            Add User
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default UserManagement;