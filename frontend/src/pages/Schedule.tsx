import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import { Course } from '../types';
import { courseAPI } from '../services/api';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isBetween from 'dayjs/plugin/isBetween';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(isToday);
dayjs.extend(isBetween);
dayjs.extend(weekday);

type Dayjs = ReturnType<typeof dayjs>;

const Schedule: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getCurrentClassStatus = (course: Course) => {
    const now = dayjs();
    const scheduleParts = course.schedule.match(/^([a-zA-Z]+)\s(\d{2}:\d{2})-(\d{2}:\d{2})$/);

    if (!scheduleParts) {
      return 'Schedule information unavailable.';
    }

    const [_, dayOfWeek, startTimeStr, endTimeStr] = scheduleParts;
    const scheduleDay = dayjs().day(dayjs().day() === 0 ? 7 : dayjs().day()); // Adjust for Monday-Sunday where dayjs starts at Sunday

    // Convert dayOfWeek string to dayjs day index (0 for Sunday, 1 for Monday...)
    const dayMap: { [key: string]: number } = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
    };
    const targetDayIndex = dayMap[dayOfWeek];

    if (targetDayIndex === undefined) {
      return 'Invalid schedule format.';
    }

    const currentDayIndex = now.day();
    
    // Function to find the next occurrence of the scheduled day
    const getNextScheduledDate = (current: Dayjs, targetDay: number) => {
        let nextDate = current.clone();
        // Move to the target day of the week. If it's today or in the past, move to next week
        if (current.day() > targetDay) {
            nextDate = nextDate.add(1, 'week');
        }
        nextDate = nextDate.day(targetDay);
        return nextDate;
    };

    let scheduledStart = getNextScheduledDate(now, targetDayIndex).hour(parseInt(startTimeStr.substring(0, 2))).minute(parseInt(startTimeStr.substring(3, 5))).second(0);
    let scheduledEnd = getNextScheduledDate(now, targetDayIndex).hour(parseInt(endTimeStr.substring(0, 2))).minute(parseInt(endTimeStr.substring(3, 5))).second(0);

    // Adjust for current week if the class is today and hasn't passed yet
    if (currentDayIndex === targetDayIndex) {
        if (now.isAfter(scheduledEnd)) {
            // Class for today has already ended, look for next week
            scheduledStart = scheduledStart.add(1, 'week');
            scheduledEnd = scheduledEnd.add(1, 'week');
        }
    }

    // If the scheduled class is far in the future (e.g., in a past week), move it to the next relevant week
    if (scheduledStart.isBefore(now) && !now.isBetween(scheduledStart, scheduledEnd)) {
        scheduledStart = scheduledStart.add(1, 'week');
        scheduledEnd = scheduledEnd.add(1, 'week');
    }

    if (now.isBetween(scheduledStart, scheduledEnd)) {
      return `Class in progress with ${course.instructor?.firstName || 'N/A'} ${course.instructor?.lastName || ''}. Ends at ${scheduledEnd.format('HH:mm')}.`;
    } else if (scheduledStart.isAfter(now)) {
      return `Next class on ${scheduledStart.format('dddd HH:mm')} with ${course.instructor?.firstName || 'N/A'} ${course.instructor?.lastName || ''}.`;
    } else {
      // If it's passed this week and not current, it's no upcoming class for the immediate future
      return 'No upcoming classes.';
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      if (!user.department) {
        setError('Your account is not properly configured. Please contact your administrator.');
        return;
      }

      try {
        let fetchedCourses: Course[] = [];
        if (user.role === 'student') {
          fetchedCourses = await courseAPI.getStudentCourses();
        } else if (user.role === 'teacher') {
          fetchedCourses = await courseAPI.getTeacherCourses();
        } else if (user.role === 'admin') {
          fetchedCourses = await courseAPI.getAllCourses();
        }
        setCourses(fetchedCourses);
      } catch (err: any) {
        console.error('Error fetching courses:', err);
        setError(err.response?.data?.message || 'Failed to load courses.');
      }
    };
    fetchCourses();
  }, [user]);

  if (!user) {
    return null; // Redirect handled by a higher-level route or auth logic
  }

  return (
    <Layout>
      <Box sx={{ py: 6, px: 4, backgroundColor: 'background.default', width: '100%' }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', mb: 4 }}>
          Course Schedule
        </Typography>
        {error && (
            <Typography variant="body2" sx={{ color: 'red', mb: 2 }}>
                {error}
            </Typography>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 3,
            mt: 2,
          }}
        >
          {courses.length > 0 ? (
            courses.map((course: Course) => (
              <Box
                key={course._id}
                sx={{
                  p: 3,
                  border: '1px solid', borderColor: 'divider',
                  borderRadius: '12px',
                  textAlign: 'left',
                  backgroundColor: 'background.paper',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  },
                }}
              >
                <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>{course.title}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Course ID: {course._id}</Typography>
                {course.instructor && course.schedule && (
                    <Box 
                      sx={{
                        mt: 2,
                        p: 1,
                        borderRadius: '8px',
                        backgroundColor: '#e0f7fa', // Light blue for a 'bubble' effect
                        border: '1px solid #b2ebf2',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#00796b' }}>
                            Instructor: {course.instructor.firstName} {course.instructor.lastName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#004d40' }}>
                            Status: {getCurrentClassStatus(course)}
                        </Typography>
                    </Box>
                )}
              </Box>
            ))
          ) : (
            <Typography sx={{ mt: 2, color: 'text.secondary' }}>No courses available for your role.</Typography>
          )}
        </Box>
      </Box>
    </Layout>
  );
};

export default Schedule; 