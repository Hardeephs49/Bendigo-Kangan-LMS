import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { courseAPI } from '../services/api';
import { Course } from '../types';
import CourseMaterialComponent from '../components/CourseMaterial';
import Layout from '../components/layout/Layout';

const CourseMaterials: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetchTeacherCourses();
  }, []);

  const fetchTeacherCourses = async () => {
    try {
      setLoading(true);
      const teacherCourses = await courseAPI.getTeacherCourses();
      setCourses(teacherCourses);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box p={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Course Materials Management
        </Typography>

        {courses.length === 0 ? (
          <Alert severity="info">No courses found. Please create or get assigned to a course first.</Alert>
        ) : (
          <Grid container spacing={3}>
            {courses.map((course) => (
              <Grid item xs={12} md={6} lg={4} key={course._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 6,
                    },
                  }}
                  onClick={() => setSelectedCourse(course)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {course.title}
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                      {course.code}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Students: {course.students?.length || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {selectedCourse && (
          <Box mt={4}>
            <Typography variant="h5" gutterBottom>
              Materials for {selectedCourse.title}
            </Typography>
            <CourseMaterialComponent courseId={selectedCourse._id} />
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default CourseMaterials; 