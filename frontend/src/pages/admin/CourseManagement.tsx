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
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { courseAPI, userAPI } from '../../services/api'; // Add userAPI import
import { Course, User, Department } from '../../types';
import Layout from '../../components/layout/Layout';

const CourseManagement: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [openCourseDialog, setOpenCourseDialog] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [newCourse, setNewCourse] = useState({
        title: '',
        code: '',
        credits: 3,
        description: '',
        semester: '',
        room: '',
        schedule: '',
        department: '',
    });
    const [openAssignStudentDialog, setOpenAssignStudentDialog] = useState(false);
    const [openAssignTeacherDialog, setOpenAssignTeacherDialog] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [students, setStudents] = useState<User[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [selectedDay, setSelectedDay] = useState<string>('Monday');
    const [startTime, setStartTime] = useState<string>('09:00');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch students and teachers using userAPI
                const studentsResponse = await userAPI.getUsersByDepartment('student');
                setStudents(studentsResponse);

                const teachersResponse = await userAPI.getUsersByDepartment('teacher');
                setTeachers(teachersResponse);

                const coursesResponse = await courseAPI.getCoursesByDepartment();
                setCourses(coursesResponse);

                // Fetch departments
                const departmentsResponse = await userAPI.getDepartments();
                setDepartments(departmentsResponse);

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
                    setNewCourse(prev => ({
                        ...prev,
                        department: departmentId,
                    }));
                } else {
                    setNewCourse(prev => ({
                        ...prev,
                        department: '',
                    }));
                    setError('Admin department not found. Please update your profile with a department.');
                }
            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError(err.response?.data?.message || 'Failed to load data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleCreateCourse = async () => {
        try {
            if (!newCourse.title || !newCourse.code || !newCourse.description || !newCourse.semester || !newCourse.room || !newCourse.schedule) {
                setError('All fields are required.');
                return;
            }

            if (editingCourse) {
                await courseAPI.updateCourse(editingCourse._id, newCourse);
            } else {
                await courseAPI.createCourse(newCourse);
            }
            const coursesResponse = await courseAPI.getCoursesByDepartment();
            setCourses(coursesResponse);
            setOpenCourseDialog(false);
            setEditingCourse(null);
            setNewCourse({
                title: '',
                code: '',
                credits: 3,
                description: '',
                semester: '',
                room: '',
                schedule: '',
                department: user && user.department && typeof user.department === 'object' && '_id' in user.department ? user.department._id : '',
            });
            setError(null);
        } catch (error: any) {
            console.error('Error saving course:', error);
            setError(error.response?.data?.message || 'Failed to save course.');
        }
    };

    const handleEditCourse = (course: Course) => {
        setEditingCourse(course);
        setNewCourse({
            title: course.title,
            code: course.code,
            credits: course.credits,
            description: course.description,
            semester: course.semester,
            room: course.room,
            schedule: course.schedule || '',
            department: typeof course.department === 'string' ? course.department : course.department._id,
        });
        setOpenCourseDialog(true);
    };

    const handleDeleteCourse = async (courseId: string) => {
        try {
            await courseAPI.deleteCourse(courseId);
            const coursesResponse = await courseAPI.getCoursesByDepartment();
            setCourses(coursesResponse);
        } catch (error: any) {
            console.error('Error deleting course:', error);
            setError(error.response?.data?.message || 'Failed to delete course.');
        }
    };

    const handleAssignStudent = async () => {
        if (!selectedCourse || !selectedStudent) return;
        try {
            await courseAPI.assignStudentToCourse(selectedCourse._id, selectedStudent);
            const coursesResponse = await courseAPI.getCoursesByDepartment();
            setCourses(coursesResponse);
            setOpenAssignStudentDialog(false);
            setSelectedStudent('');
        } catch (error: any) {
            console.error('Error assigning student:', error);
            setError(error.response?.data?.message || 'Failed to assign student.');
        }
    };

    const handleUnassignStudent = async (courseId: string, studentId: string) => {
        try {
            await courseAPI.unassignStudentFromCourse(courseId, studentId);
            const coursesResponse = await courseAPI.getCoursesByDepartment();
            setCourses(coursesResponse);
        } catch (error: any) {
            console.error('Error unassigning student:', error);
            setError(error.response?.data?.message || 'Failed to unassign student.');
        }
    };

    const handleAssignTeacher = async () => {
        if (!selectedCourse || !selectedTeacher) return;
        try {
            await courseAPI.assignTeacherToCourse(selectedCourse._id, selectedTeacher, selectedDay, startTime);
            const coursesResponse = await courseAPI.getCoursesByDepartment();
            setCourses(coursesResponse);
            setOpenAssignTeacherDialog(false);
            setSelectedTeacher('');
            setSelectedDay('Monday');
            setStartTime('09:00');
        } catch (error: any) {
            console.error('Error assigning teacher:', error);
            setError(error.response?.data?.message || 'Failed to assign teacher.');
        }
    };

    const handleUnassignTeacher = async (courseId: string) => {
        try {
            await courseAPI.unassignTeacherFromCourse(courseId);
            const coursesResponse = await courseAPI.getCoursesByDepartment();
            setCourses(coursesResponse);
        } catch (error: any) {
            console.error('Error unassigning teacher:', error);
            setError(error.response?.data?.message || 'Failed to unassign teacher.');
        }
    };

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    if (user?.role !== 'admin') {
        return (
            <Box>
                <Typography variant="h4" color="error">
                    Access Denied
                </Typography>
                <Typography>
                    You do not have permission to access this page.
                </Typography>
            </Box>
        );
    }

    return (
        <Layout>
            <Box sx={{ flex: 1, p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Course Management
                </Typography>

                {error && (
                    <Typography variant="body2" sx={{ color: 'red', mb: 2 }}>
                        {error}
                    </Typography>
                )}

                <Box sx={{ mb: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setOpenCourseDialog(true)}
                    >
                        Add New Course
                    </Button>
                </Box>
                <Paper>
                    <List>
                        {courses.map((course, index) => (
                            <React.Fragment key={course._id}>
                                <ListItem>
                                    <ListItemText
                                        primary={`${course.title} (${course.code})`}
                                        secondary={
                                            <Box component="span">
                                                <Typography component="span" variant="body2">
                                                    Credits: {course.credits} | Semester: {course.semester} | Room: {course.room}
                                                </Typography>
                                                <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                                                    Instructor: {course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : 'Not assigned'}
                                                </Typography>
                                                <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                                                    Schedule: {course.schedule || 'Not set'}
                                                </Typography>
                                                <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                                                    Students: {course.students.length}
                                                    {course.students.length > 0 && (
                                                        <Box sx={{ mt: 1 }}>
                                                            {course.students.map(student => (
                                                                <Typography key={student._id} variant="body2">
                                                                    - {student.firstName} {student.lastName} 
                                                                    <Button
                                                                        size="small"
                                                                        color="secondary"
                                                                        onClick={() => handleUnassignStudent(course._id, student._id)}
                                                                        sx={{ ml: 1 }}
                                                                    >
                                                                        Unassign
                                                                    </Button>
                                                                </Typography>
                                                            ))}
                                                        </Box>
                                                    )}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleEditCourse(course)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                onClick={() => handleDeleteCourse(course._id)}
                                            >
                                                Delete
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                size="small"
                                                onClick={() => {
                                                    setSelectedCourse(course);
                                                    setOpenAssignStudentDialog(true);
                                                }}
                                            >
                                                Assign Student
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                size="small"
                                                onClick={() => {
                                                    setSelectedCourse(course);
                                                    setOpenAssignTeacherDialog(true);
                                                }}
                                            >
                                                {course.instructor ? 'Reassign Teacher' : 'Assign Teacher'}
                                            </Button>
                                            {course.instructor && (
                                                <Button
                                                    variant="outlined"
                                                    color="secondary"
                                                    size="small"
                                                    onClick={() => handleUnassignTeacher(course._id)}
                                                >
                                                    Unassign Teacher
                                                </Button>
                                            )}
                                        </Box>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < courses.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                    {courses.length === 0 && (
                        <Typography sx={{ p: 2 }}>No courses found in your department.</Typography>
                    )}
                </Paper>

                {/* Course Dialog */}
                <Dialog open={openCourseDialog} onClose={() => setOpenCourseDialog(false)}>
                    <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Title"
                            fullWidth
                            value={newCourse.title}
                            onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                            sx={{ mb: 2, mt: 1 }}
                            required
                        />
                        <TextField
                            label="Code"
                            fullWidth
                            value={newCourse.code}
                            onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                            sx={{ mb: 2 }}
                            required
                        />
                        <TextField
                            label="Credits"
                            type="number"
                            fullWidth
                            value={newCourse.credits}
                            onChange={(e) => setNewCourse({ ...newCourse, credits: Number(e.target.value) })}
                            sx={{ mb: 2 }}
                            required
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={newCourse.description}
                            onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                            sx={{ mb: 2 }}
                            required
                        />
                        <TextField
                            label="Semester"
                            fullWidth
                            value={newCourse.semester}
                            onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })}
                            sx={{ mb: 2 }}
                            required
                        />
                        <TextField
                            label="Room"
                            fullWidth
                            value={newCourse.room}
                            onChange={(e) => setNewCourse({ ...newCourse, room: e.target.value })}
                            sx={{ mb: 2 }}
                            required
                        />
                        <TextField
                            label="Schedule (e.g., Monday 09:00-10:30)"
                            fullWidth
                            value={newCourse.schedule}
                            onChange={(e) => setNewCourse({ ...newCourse, schedule: e.target.value })}
                            sx={{ mb: 2 }}
                            required
                        />
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={newCourse.department}
                                label="Department"
                                onChange={(e) => setNewCourse({ ...newCourse, department: e.target.value })}
                                required
                            >
                                {departments.map((dept) => (
                                    <MenuItem key={dept._id} value={dept._id}>
                                        {dept.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenCourseDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateCourse} variant="contained">
                            {editingCourse ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Assign Student Dialog */}
                <Dialog open={openAssignStudentDialog} onClose={() => setOpenAssignStudentDialog(false)}>
                    <DialogTitle>Assign Student to {selectedCourse?.title}</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth sx={{ mt: 1 }}>
                            <InputLabel>Select Student</InputLabel>
                            <Select
                                value={selectedStudent}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                            >
                                {students
                                    .filter(student => !selectedCourse?.students.some(s => s._id === student._id))
                                    .map((student) => (
                                        <MenuItem key={student._id} value={student._id}>
                                            {student.firstName} {student.lastName}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenAssignStudentDialog(false)}>Cancel</Button>
                        <Button onClick={handleAssignStudent} variant="contained" disabled={!selectedStudent}>
                            Assign
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Assign Teacher Dialog */}
                <Dialog open={openAssignTeacherDialog} onClose={() => setOpenAssignTeacherDialog(false)}>
                    <DialogTitle>Assign Teacher to {selectedCourse?.title}</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
                            <InputLabel>Select Teacher</InputLabel>
                            <Select
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                            >
                                {teachers.map((teacher) => (
                                    <MenuItem key={teacher._id} value={teacher._id}>
                                        {teacher.firstName} {teacher.lastName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Day of the Week</InputLabel>
                            <Select
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value)}
                            >
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                                    <MenuItem key={day} value={day}>
                                        {day}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Start Time (HH:MM)"
                            fullWidth
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            placeholder="09:00"
                            helperText="Class duration is 1.5 hours"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenAssignTeacherDialog(false)}>Cancel</Button>
                        <Button onClick={handleAssignTeacher} variant="contained" disabled={!selectedTeacher}>
                            Assign
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default CourseManagement;