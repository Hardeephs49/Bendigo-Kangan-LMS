import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Button, Stack, Popover, Menu, MenuItem, Box } from '@mui/material';
import { Menu as MenuIcon, AccountCircle } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

interface NavbarProps {
  isSidebarOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [managementAnchorEl, setManagementAnchorEl] = useState<null | HTMLElement>(null);
  const [learningAnchorEl, setLearningAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);

  // Log user state when it changes
  React.useEffect(() => {
    console.log('Navbar user state:', user);
    if (user) {
      console.log('Navbar user role:', user.role);
    }
  }, [user]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setManagementAnchorEl(null);
    setLearningAnchorEl(null);
    setProfileAnchorEl(null);
  };

  const handleManagementClick = (event: React.MouseEvent<HTMLElement>) => {
    setManagementAnchorEl(event.currentTarget);
  };

  const handleTeachingClick = () => {
    navigate('/course-materials');
  };

  const handleLearningClick = (event: React.MouseEvent<HTMLElement>) => {
    setLearningAnchorEl(event.currentTarget);
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const managementOpen = Boolean(managementAnchorEl);
  const learningOpen = Boolean(learningAnchorEl);
  const profileOpen = Boolean(profileAnchorEl);

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderRadius: 0,
        top: 0,
        left: 'auto',
        right: 'auto',
        zIndex: 1100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        py: 0,
      }}
    >
      <Toolbar 
        sx={{
          minHeight: '36px',
          paddingY: '5px',
          paddingLeft: '0px',
          paddingRight: '10px',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="h5"
          noWrap
          component="a"
          href="/dashboard"
          sx={{
            paddingLeft: '10px',
            display: { xs: 'none', md: 'flex' },
            fontFamily: 'inherit',
            fontWeight: 700,
            letterSpacing: '.1rem',
            color: 'primary.main',
            textDecoration: 'none',
          }}
        >
          Bendigo-Kangan LMS
        </Typography>
        {/* Render navigation only if user object is available */}
        {user ? (
          <Stack 
            direction="row" 
            spacing={1} 
            alignItems="center" 
            sx={{
              flexGrow: 1,
              justifyContent: 'flex-end',
              gap: '15px',
              paddingRight: '10px',
            }}
          >
            {/* Conditional Navbar based on user role */}
            {user.role === 'admin' && (
              <>
                <Button
                  color="primary"
                  component={Link}
                  to="/dashboard"
                  sx={{ fontWeight: 600 }}
                >
                  Home
                </Button>
                <Button
                  color="primary"
                  onClick={handleManagementClick}
                  sx={{ fontWeight: 600 }}
                >
                  Management
                </Button>
                <Menu
                  anchorEl={managementAnchorEl}
                  open={managementOpen}
                  onClose={handleMenuClose}
                  sx={{ '& .MuiPaper-root': { borderRadius: 2, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' } }}
                >
                  <MenuItem component={Link} to="/admin/user-management" onClick={handleMenuClose}>
                    User Management
                  </MenuItem>
                  <MenuItem component={Link} to="/admin/course-management" onClick={handleMenuClose}>
                    Course Management
                  </MenuItem>
                </Menu>
                <Button
                  color="primary"
                  component={Link}
                  to="/communication"
                  sx={{ fontWeight: 600 }}
                >
                  Announcement
                </Button>
                <Button
                  color="primary"
                  component={Link}
                  to="/navigation"
                  sx={{ fontWeight: 600 }}
                >
                  Navigation
                </Button>
              </>
            )}
            {user.role === 'student' && (
              <>
                <Button
                  color="primary"
                  component={Link}
                  to="/dashboard"
                  sx={{ fontWeight: 600 }}
                >
                  Home
                </Button>
                <Button
                  color="primary"
                  component={Link}
                  to="/course-enrollment"
                  sx={{ fontWeight: 600 }}
                >
                  Course Enrollment
                </Button>
                <Button
                  color="primary"
                  component={Link}
                  to="/courses"
                  sx={{ fontWeight: 600 }}
                >
                  Courses
                </Button>
                <Button
                  color="primary"
                  component={Link}
                  to="/assignments"
                  sx={{ fontWeight: 600 }}
                >
                  Assignments
                </Button>
                <Button
                  color="primary"
                  component={Link}
                  to="/fees-payment"
                  sx={{ fontWeight: 600 }}
                >
                  Fees Payment
                </Button>
                <Button
                  color="primary"
                  component={Link}
                  to="/best-next-step"
                  sx={{ fontWeight: 600 }}
                >
                  Best Next Step
                </Button>
                <Button
                  color="primary"
                  component={Link}
                  to="/communication"
                  sx={{ fontWeight: 600 }}
                >
                  Communication
                </Button>
                <Button
                  color="primary"
                  component={Link}
                  to="/navigation"
                  sx={{ fontWeight: 600 }}
                >
                  Navigation
                </Button>
              </>
            )}
            {user.role === 'teacher' && (
              <>
                <Button
                  color="primary"
                  component={Link}
                  to="/dashboard"
                  sx={{ fontWeight: 600 }}
                >
                  Home
                </Button>
                <Button
                  color="primary"
                  onClick={handleTeachingClick}
                  sx={{ fontWeight: 600 }}
                >
                  Teaching
                </Button>
                <Button
                  color="primary"
                  component={Link}
                  to="/communication"
                  sx={{ fontWeight: 600 }}
                >
                  Communication
                </Button>
                <Button
                  color="primary"
                  component={Link}
                  to="/navigation"
                  sx={{ fontWeight: 600 }}
                >
                  Navigation
                </Button>
              </>
            )}
            {user.role === 'support' && (
              <>
                <Button
                  color="primary"
                  component={Link}
                  to="/dashboard"
                  sx={{ fontWeight: 600 }}
                >
                  Home
                </Button>
                <Button
                  color="primary"
                  component={Link}
                  to="/communication"
                  sx={{ fontWeight: 600 }}
                >
                  Announcement
                </Button>
                <Button
                  color="primary"
                  component={Link}
                  to="/navigation"
                  sx={{ fontWeight: 600 }}
                >
                  Navigation
                </Button>
              </>
            )}
            <Button
              color="inherit"
              onClick={handleProfileClick}
              startIcon={<AccountCircle />}
              sx={{ color: 'text.secondary' }}
            >
              {user.firstName}
            </Button>
            <Menu
              anchorEl={profileAnchorEl}
              open={profileOpen}
              onClose={handleMenuClose}
              sx={{ '& .MuiPaper-root': { borderRadius: 2, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' } }}
            >
              <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                Logout
              </MenuItem>
            </Menu>
            <Button
              color="inherit"
              onClick={() => navigate('/schedule')}
              sx={{ color: 'text.secondary' }}
            >
              Schedule
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={2} sx={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <Button
              color="primary"
              component={Link}
              to="/login"
              sx={{ fontWeight: 600 }}
            >
              Login
            </Button>
            <Button
              color="primary"
              component={Link}
              to="/register"
              sx={{ fontWeight: 600 }}
            >
              Register
            </Button>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;