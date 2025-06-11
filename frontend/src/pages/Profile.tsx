import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Avatar } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import { User } from '../types';
import Layout from '../components/layout/Layout';

// Extend the User type locally to include the new fields
interface ExtendedUser extends User {
    phoneNumber?: string;
    address?: string;
    profilePicture?: string;
}

const Profile: React.FC = () => {
    const { user, updateProfile, changePassword } = useAuth();
    const typedUser = user as ExtendedUser | null; // Type assertion to use ExtendedUser
    const [phoneNumber, setPhoneNumber] = useState(typedUser?.phoneNumber || '');
    const [address, setAddress] = useState(typedUser?.address || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [profilePicture, setProfilePicture] = useState(typedUser?.profilePicture || '');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        setPhoneNumber(typedUser?.phoneNumber || '');
        setAddress(typedUser?.address || '');
        setProfilePicture(typedUser?.profilePicture || '');
    }, [typedUser]);

    const handleUpdateProfile = async () => {
        try {
            // Type assertion for updateProfile argument
            await updateProfile({ phoneNumber, address } as Partial<User>);
            setSuccess('Profile updated successfully');
            setError('');
        } catch (err) {
            setError((err as Error).message || 'Failed to update profile');
            setSuccess('');
        }
    };

    const handleChangePassword = async () => {
        try {
            await changePassword(currentPassword, newPassword);
            setSuccess('Password changed successfully');
            setError('');
            setCurrentPassword('');
            setNewPassword('');
        } catch (err) {
            setError((err as Error).message || 'Failed to change password');
            setSuccess('');
        }
    };

    const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const file = e.target.files[0];
                const updatedUser = await userAPI.uploadProfilePicture(file);
                setProfilePicture(updatedUser.profilePicture);
                setSuccess('Profile picture updated successfully');
                setError('');
            } catch (err) {
                setError((err as Error).message || 'Failed to upload profile picture');
                setSuccess('');
            }
        }
    };

    if (!typedUser) return null;

    return (
        <Layout>
            <Box sx={{ flex: 1, p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Profile
                </Typography>

                {error && <Typography color="error">{error}</Typography>}
                {success && <Typography color="success.main">{success}</Typography>}

                {/* Profile Picture */}
                <Box sx={{ mb: 3 }}>
                    <Avatar src={profilePicture} sx={{ width: 100, height: 100, mb: 2 }} />
                    <Button variant="contained" component="label">
                        Upload Profile Picture
                        <input type="file" hidden accept="image/*" onChange={handleProfilePictureChange} />
                    </Button>
                </Box>

                {/* Profile Details */}
                <Box sx={{ mb: 3 }}>
                    <TextField
                        label="Phone Number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                    />
                    <Button variant="contained" onClick={handleUpdateProfile}>
                        Update Profile
                    </Button>
                </Box>

                {/* Change Password */}
                <Box>
                    <Typography variant="h5" gutterBottom>
                        Change Password
                    </Typography>
                    <TextField
                        label="Current Password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                    />
                    <Button variant="contained" onClick={handleChangePassword}>
                        Change Password
                    </Button>
                </Box>
            </Box>
        </Layout>
    );
};

export default Profile;