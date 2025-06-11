import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, Avatar, Button, Divider } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { announcementAPI } from '../services/api';
import { Announcement } from '../types';

interface AnnouncementPopupProps {
    onClose: () => void;
}

const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({ onClose }) => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const data = await announcementAPI.getRecentUpdates();
                console.log('Raw announcements from API:', data);

                // Ensure data is an array
                if (!Array.isArray(data)) {
                    throw new Error('Expected an array of announcements');
                }

                // Sort announcements by createdAt in descending order
                const sortedAnnouncements = data.sort(
                    (a: Announcement, b: Announcement) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                console.log('Sorted announcements:', sortedAnnouncements);
                console.log('Logged-in user role:', user?.role);

                // Client-side filtering based on user role
                const normalizedRole = user?.role.toLowerCase() || '';
                const filteredAnnouncements = sortedAnnouncements.filter(announcement => {
                    const target = announcement.targetAudience.toLowerCase();
                    return target === 'both' || target === normalizedRole;
                });

                setAnnouncements(filteredAnnouncements);
            } catch (error: any) {
                console.error('Error fetching announcements:', error);
                setError(error.message || 'Failed to load announcements.');
            }
        };
        fetchAnnouncements();
    }, [user]);

    return (
        <Box sx={{ width: 300, maxHeight: 400, p: 2, bgcolor: 'white', borderRadius: 4, boxShadow: 2, overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Announcements
            </Typography>
            {error && (
                <Typography variant="body2" sx={{ color: 'red', mb: 2 }}>
                    {error}
                </Typography>
            )}
            <List>
                {announcements.length > 0 ? (
                    announcements.map((announcement, index) => (
                        <React.Fragment key={announcement._id}>
                            <ListItem sx={{ py: 1 }}>
                                <Avatar
                                    src={announcement.createdBy?.profilePicture || undefined}
                                    sx={{ mr: 2, width: 40, height: 40 }}
                                />
                                <Box>
                                    <Typography variant="subtitle2">
                                        {announcement.createdBy?.firstName} {announcement.createdBy?.lastName}
                                    </Typography>
                                    <Typography variant="body2">{announcement.content}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(announcement.createdAt).toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        Audience: {announcement.targetAudience}
                                    </Typography>
                                </Box>
                            </ListItem>
                            {index < announcements.length - 1 && <Divider />}
                        </React.Fragment>
                    ))
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No announcements available. Some announcements may be targeted to specific audiences.
                    </Typography>
                )}
            </List>
            {/* <Button variant="contained" onClick={onClose} sx={{ mt: 2, width: '100%' }}>
                Close
            </Button> */}
        </Box>
    );
};

export default AnnouncementPopup;