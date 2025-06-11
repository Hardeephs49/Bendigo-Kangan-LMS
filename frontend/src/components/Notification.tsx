import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { announcementAPI } from '../services/api';
import { Announcement } from '../types';
import api from '../services/api'; // Import api

const Notifications: React.FC = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const response = await announcementAPI.getRecentUpdates(10); // Fetch up to 10 recent announcements
                setAnnouncements(response);
            } catch (error) {
                console.error('Error fetching announcements:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchAnnouncements();
        }
    }, [user]);

    const handleMarkAsRead = async (announcementId: string) => {
        try {
            await api.post(`/users/notifications/${announcementId}/read`);
            setAnnouncements((prev) =>
                prev.map((ann) =>
                    ann._id === announcementId ? { ...ann, read: true } : ann
                )
            );
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    if (loading) {
        return <Typography>Loading notifications...</Typography>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Notifications
            </Typography>
            {announcements.length > 0 ? (
                <List>
                    {announcements.map((announcement, index) => (
                        <React.Fragment key={announcement._id}>
                            <ListItem>
                                <ListItemText
                                    primary={announcement.title}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2">
                                                {announcement.content}
                                            </Typography>
                                            <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                                                By {announcement.createdBy.firstName} {announcement.createdBy.lastName} on{' '}
                                                {new Date(announcement.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItem>
                            {index < announcements.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            ) : (
                <Typography>No notifications available.</Typography>
            )}
        </Box>
    );
};

export default Notifications;