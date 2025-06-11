import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { courseAPI } from '../services/api';
import { Course } from '../types';
import CourseMaterialComponent from './CourseMaterial';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface CourseDetailsProps {
  courseId: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`course-tabpanel-${index}`}
      aria-labelledby={`course-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ courseId }) => {
  console.log('[Frontend] CourseDetails component function executed.');
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const data = await courseAPI.getCourse(courseId);
      setCourse(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch course details');
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log('[Frontend] Tab changed to:', newValue);
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !course) {
    return (
      <Box p={3}>
        <Alert severity="error">{error || 'Course not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ mb: 3, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {course.title}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Course Code: {course.code}
        </Typography>
        <Typography variant="body1" paragraph>
          {course.description}
        </Typography>
      </Paper>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="course tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Materials" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Course Overview
          </Typography>
          <Typography variant="body1" paragraph>
            {course.description}
          </Typography>
          {/* Add more overview content here */}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Course Materials
          </Typography>
          <CourseMaterialComponent courseId={courseId!} />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default CourseDetails; 