import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Button, CircularProgress, Alert } from '@mui/material';
import { courseAPI } from '../services/api';
import { Course } from '../types';

interface AvailableCoursesListProps {
  showEnrollButton?: boolean;
  onEnroll?: (courseId: string) => void;
}

const AvailableCoursesList: React.FC<AvailableCoursesListProps> = ({ showEnrollButton = true, onEnroll }) => {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const courses = await courseAPI.getAvailableCourses();
        setAvailableCourses(Array.isArray(courses) ? courses : []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load available courses.');
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableCourses();
  }, []);

  const handleEnroll = async (courseId: string) => {
    try {
      await courseAPI.enrollInCourse(courseId);
      setSuccess('Successfully enrolled in course');
      setError(null);
      // Remove the enrolled course from the list
      setAvailableCourses(prev => prev.filter(c => c._id !== courseId));
      if (onEnroll) onEnroll(courseId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enroll in course');
      setSuccess(null);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Typography variant="h6" gutterBottom>Available Courses</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {availableCourses.length > 0 ? (
          availableCourses.map(course => (
            <Card key={course._id} sx={{ width: 300 }}>
              <CardContent>
                <Typography variant="h6">{course.title} ({course.code})</Typography>
                <Typography variant="body2">Credits: {course.credits ?? 'N/A'}</Typography>
                <Typography variant="body2">Semester: {course.semester ?? 'N/A'}</Typography>
                <Typography variant="body2">{course.description}</Typography>
                <Typography variant="body2">Schedule: {course.schedule || 'Not set'}</Typography>
                {showEnrollButton && (
                  <Button variant="contained" color="primary" sx={{ mt: 1 }} onClick={() => handleEnroll(course._id)}>
                    Enroll
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography>No available courses found.</Typography>
        )}
      </Box>
    </Box>
  );
};

export default AvailableCoursesList; 