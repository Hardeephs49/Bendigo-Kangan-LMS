import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, TextField, Typography, Link, Paper, Grid, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginRole, setLoginRole] = useState<'student' | 'teacher' | 'admin'>('student');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear any existing errors
    try {
      await login(email, password, loginRole);
      // Redirect is handled in AuthContext
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const handleRoleChange = (event: React.MouseEvent<HTMLElement>, newRole: 'student' | 'teacher' | 'admin' | null) => {
    if (newRole !== null) {
      setLoginRole(newRole);
      setError(''); // Clear any existing errors
    }
  };

  const getInputLabel = () => {
    switch (loginRole) {
      case 'teacher':
        return 'Teacher Email';
      case 'admin':
        return 'Admin Email';
      default:
        return 'Student ID or Email';
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

        {/* Login form on the right */}
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
            Sign In
          </Typography>

          {error && (
            <Typography variant="body2" sx={{ color: 'error.main', mb: 2 }}>
              {error}
            </Typography>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <ToggleButtonGroup
                value={loginRole}
                exclusive
                onChange={handleRoleChange}
                fullWidth
                sx={{ mb: 2 }}
              >
                <ToggleButton value="student" sx={{ py: 1 }}>
                  Student
                </ToggleButton>
                <ToggleButton value="teacher" sx={{ py: 1 }}>
                  Teacher
                </ToggleButton>
                <ToggleButton value="admin" sx={{ py: 1 }}>
                  Admin
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={getInputLabel()}
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mb: 2, py: 1.5 }}
            >
              Login
            </Button>
            <Grid container justifyContent="space-between">
              <Grid item>
                <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ color: 'text.secondary' }}>
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link component={RouterLink} to="/register" variant="body2" sx={{ color: 'primary.main' }}>
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;