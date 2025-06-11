import React, { useState } from 'react';
import {
    Typography,
    Box,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { announcementAPI } from '../../services/api';
import Layout from '../../components/layout/Layout';

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [openAnnouncementDialog, setOpenAnnouncementDialog] = useState(false);
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementContent, setAnnouncementContent] = useState('');
    const [targetAudience, setTargetAudience] = useState<'students' | 'teachers' | 'both'>('both');
    const [error, setError] = useState<string | null>(null);

    const handleCreateAnnouncement = async () => {
        try {
            await announcementAPI.createAnnouncement(announcementTitle, announcementContent, targetAudience);
            setOpenAnnouncementDialog(false);
            setAnnouncementTitle('');
            setAnnouncementContent('');
            setTargetAudience('both');
            alert('Announcement created successfully!');
        } catch (error: any) {
            console.error('Error creating announcement:', error);
            setError(error.response?.data?.message || 'Failed to create announcement.');
        }
    };

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
            <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
                <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', mb: 4 }}>
                    Admin Dashboard
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', mb: 3 }}>
                        Announcement Management
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setOpenAnnouncementDialog(true)}
                            size="large"
                            sx={{ py: 1.5 }}
                        >
                            Create New Announcement
                        </Button>
                    </Box>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        Announcements will be sent to the selected audience and appear in their notifications and relevant dashboards.
                    </Typography>
                </Paper>

                {/* Announcement Dialog */}
                <Dialog open={openAnnouncementDialog} onClose={() => setOpenAnnouncementDialog(false)} PaperProps={{ style: { borderRadius: 12 } }}>
                    <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', pb: 2 }}>Create Announcement</DialogTitle>
                    <DialogContent sx={{ p: 4 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            value={announcementTitle}
                            onChange={(e) => setAnnouncementTitle(e.target.value)}
                            sx={{ mb: 3, mt: 1 }}
                            variant="outlined"
                        />
                        <TextField
                            label="Content"
                            fullWidth
                            multiline
                            rows={6}
                            value={announcementContent}
                            onChange={(e) => setAnnouncementContent(e.target.value)}
                            sx={{ mb: 3 }}
                            variant="outlined"
                        />
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Target Audience</InputLabel>
                            <Select
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value as 'students' | 'teachers' | 'both')}
                                label="Target Audience"
                            >
                                <MenuItem value="students">Students</MenuItem>
                                <MenuItem value="teachers">Teachers</MenuItem>
                                <MenuItem value="both">Both</MenuItem>
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
                        <Button onClick={() => setOpenAnnouncementDialog(false)} color="secondary" variant="outlined" sx={{ px: 3, py: 1 }}>Cancel</Button>
                        <Button onClick={handleCreateAnnouncement} variant="contained" color="primary" sx={{ px: 3, py: 1 }}>
                            Create Announcement
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default AdminDashboard;