import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Chatbot from './components/Chatbot';
import CommunicationComponent from './components/CommunicationComponent';
import PrivateRoute from './components/routing/PrivateRoute';
import Layout from './components/layout/Layout';
import CreateCourse from './components/CreateCourse';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Main pages
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Assignments from './pages/Assignments';
import Profile from './pages/Profile';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AssignmentDetail from './pages/AssignmentDetail';
import StudentDashboard from './pages/StudentDashboard';
import CourseEnrollment from './pages/CourseEnrollment';
import FeesPayment from './pages/FeesPayment';
import BestNextStep from './pages/BestNextStep';
import UserManagement from './pages/admin/UserManagement';
import Schedule from './pages/Schedule';

// New pages (to be created)
import CourseManagement from './pages/admin/CourseManagement';
import Navigation from './pages/Navigation';
import CommunicationPage from './pages/CommunicationPage';
import CourseMaterials from './pages/CourseMaterials';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5', // A deep, professional blue
      light: '#757de8',
      dark: '#002984',
      contrastText: '#fff',
    },
    secondary: {
      main: '#ff4081', // A vibrant, attractive pink for accents
      light: '#ff79b0',
      dark: '#c60055',
      contrastText: '#fff',
    },
    background: {
      default: '#f4f6f8', // Light grey for a clean background
      paper: '#ffffff',
    },
    text: {
      primary: '#212121', // Dark grey for primary text
      secondary: '#757575', // Medium grey for secondary text
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: {
      fontWeight: 600, // Make headings slightly bolder
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none', // Prevent uppercase buttons for a softer look
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Rounded corners for buttons
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Rounded corners for paper elements
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)', // Subtle shadow for depth
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Prevent uppercase tabs
          fontWeight: 600,
        },
      },
    },
  },
});

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const getDashboardComponent = () => {
    if (!user) return null;
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected routes wrapped in Layout */}
      <Route path="/dashboard" element={<PrivateRoute><Layout>{getDashboardComponent()}</Layout></PrivateRoute>} />
      <Route path="/courses" element={<PrivateRoute><Layout><Courses /></Layout></PrivateRoute>} />
      <Route path="/courses/new" element={<PrivateRoute><Layout><CreateCourse /></Layout></PrivateRoute>} />
      <Route path="/courses/:id" element={<PrivateRoute><Layout><CourseDetail /></Layout></PrivateRoute>} />
      <Route path="/course-materials" element={<PrivateRoute><Layout><CourseMaterials /></Layout></PrivateRoute>} />
      <Route path="/assignments" element={<PrivateRoute><Layout><Assignments /></Layout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
      <Route path="/admin/*" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/user-management" element={<PrivateRoute><Layout><UserManagement /></Layout></PrivateRoute>} />
      <Route path="/admin/course-management" element={<PrivateRoute><Layout><CourseManagement /></Layout></PrivateRoute>} />
      <Route path="/navigation" element={<PrivateRoute><Layout><Navigation /></Layout></PrivateRoute>} />
      <Route path="/fees-payment" element={<PrivateRoute><Layout><FeesPayment /></Layout></PrivateRoute>} />
      <Route path="/best-next-step" element={<PrivateRoute><Layout><BestNextStep /></Layout></PrivateRoute>} />
      <Route path="/schedule" element={<PrivateRoute><Layout><Schedule /></Layout></PrivateRoute>} />
      <Route path="/assignments/:id" element={<PrivateRoute><Layout><AssignmentDetail /></Layout></PrivateRoute>} />
      <Route path="/course-enrollment" element={<PrivateRoute><Layout><CourseEnrollment /></Layout></PrivateRoute>} />
      <Route path="/communication" element={<PrivateRoute><Layout><CommunicationPage /></Layout></PrivateRoute>} />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppRoutes />
          <Chatbot />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;