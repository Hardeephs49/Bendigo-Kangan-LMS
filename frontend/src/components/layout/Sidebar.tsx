import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    School as SchoolIcon,
    Assignment as AssignmentIcon,
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon,
    Map as MapIcon,
    Payment as PaymentIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

const Sidebar: React.FC = () => {
    const location = useLocation();
    const { user } = useAuth();

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Courses', icon: <SchoolIcon />, path: '/courses' },
        { text: 'Assignments', icon: <AssignmentIcon />, path: '/assignments' },
        { text: 'Navigation', icon: <MapIcon />, path: '/navigation' },
        { text: 'Fees Payment', icon: <PaymentIcon />, path: '/fees' },
        { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    ];

    if (user?.role === 'admin') {
        menuItems.push({ text: 'Admin', icon: <AdminIcon />, path: '/admin' });
    }

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                },
            }}
        >
            <List sx={{ mt: 8 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            component={Link}
                            to={item.path}
                            selected={location.pathname === item.path}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export default Sidebar; 