import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthState, RegisterUser } from '../types';
import { authAPI, userAPI } from '../services/api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string, role: 'student' | 'teacher' | 'admin' | 'support') => Promise<User>;
    register: (userData: RegisterUser) => Promise<void>;
    logout: () => void;
    updateProfile: (userData: Partial<User>) => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const [authState, setAuthState] = useState<AuthState>({
        token: localStorage.getItem('token'),
        user: null,
        isAuthenticated: false,
    });
    const [loading, setLoading] = useState(true); // Initialize loading state

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Attempt to fetch user profile to verify token validity
                    const user = await userAPI.getProfile();
                    setAuthState({
                        token,
                        user,
                        isAuthenticated: true,
                    });
                } catch (error: any) {
                    console.error('Error fetching user profile during initialization:', error);
                    // Only log out if the error indicates an invalid token (e.g., 401)
                    if (error.response?.status === 401) {
                         console.log('Token invalid, logging out...');
                         logout();
                    } else {
                        // Otherwise, keep the user logged out but don't trigger a redirect loop
                        setAuthState((prev) => ({
                            ...prev,
                            isAuthenticated: false,
                            user: null,
                        }));
                    }
                }
            }
            setLoading(false); // Set loading to false after initialization
            console.log('AuthContext initialized. IsAuthenticated:', authState.isAuthenticated, 'Token present:', !!localStorage.getItem('token'));
        };

        initializeAuth();
    }, []);

    const login = async (email: string, password: string, role: 'student' | 'teacher' | 'admin' | 'support') => {
        try {
            console.log('Logging in with:', { email, password, role });
            const { user, token } = await authAPI.login(email, password, role);

            if (!token) {
                throw new Error('No token received from server');
            }

            // Update auth state with token and user data
            setAuthState({
                user,
                token,
                isAuthenticated: true,
            });

            // Store token in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (userData: RegisterUser) => {
        try {
            console.log('Registering with userData:', userData); // Debug log
            // Register the user (backend returns { token })
            const { token } = await authAPI.register(userData);
            localStorage.setItem('token', token);
    
            // Ensure email, password, and role are defined before logging in
            if (!userData.email || !userData.password || !userData.role) {
                throw new Error('Email, password, and role are required for login after registration');
            }
    
            console.log('Logging in with:', { email: userData.email, password: userData.password, role: userData.role });
            // Immediately log in to fetch user data (backend returns { token, user })
            const { user } = await authAPI.login(userData.email, userData.password, userData.role);
    
            // Update auth state with token and user data
            setAuthState({
                token,
                user,
                isAuthenticated: true,
            });
            // Redirect based on role
            const redirectPath = userData.role === 'admin' ? '/admin' : '/dashboard';
            navigate(redirectPath);
        } catch (error: any) {
            console.error('Registration error:', error.response?.data?.message || error.message);
            console.error('Full error object:', error);
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    }; 

    const logout = () => {
        localStorage.removeItem('token');
        setAuthState({
            token: null,
            user: null,
            isAuthenticated: false,
        });
        navigate('/login');
    };

    const updateProfile = async (userData: Partial<User>) => {
        try {
            await userAPI.updateProfile(userData);
            const updatedUser = await userAPI.getProfile();
            setAuthState((prev) => ({
                ...prev,
                user: updatedUser,
            }));
        } catch (error: any) {
            console.error('Profile update error:', error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || 'Profile update failed');
        }
    };

    const changePassword = async (currentPassword: string, newPassword: string) => {
        try {
            await userAPI.changePassword(currentPassword, newPassword);
        } catch (error: any) {
            console.error('Password change error:', error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || 'Password change failed');
        }
    };

    const resetPassword = async (email: string) => {
        try {
            await authAPI.forgotPassword(email);
        } catch (error: any) {
            console.error('Password reset error:', error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || 'Password reset failed');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                ...authState,
                loading, // Expose loading state
                login,
                register,
                logout,
                updateProfile,
                changePassword,
                resetPassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};