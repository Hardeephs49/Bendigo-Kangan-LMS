import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import api from '../../services/api';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            await api.post('/auth/reset-password', { token, password });
            setSuccess('Password reset successfully');
        } catch (err) {
            setError('Failed to reset password');
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={{ maxWidth: 400, p: 3, bgcolor: 'white', borderRadius: 2 }}>
                <Typography variant="h5" gutterBottom>Reset Password</Typography>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="New Password"
                        type="password"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Confirm Password"
                        type="password"
                        fullWidth
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <Button type="submit" variant="contained" fullWidth>Reset Password</Button>
                </form>
            </Box>
        </Box>
    );
};

export default ResetPassword;