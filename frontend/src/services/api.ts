import axios from 'axios';
import { User, Course, Assignment, Department, RegisterUser, Announcement, CommunicationMessage, CommunicationRoom, UserStatus, Message, CourseMaterial } from '../types';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('API Request:', {
            method: config.method,
            url: config.url,
            data: config.data,
            headers: config.headers
        });
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', {
            status: response.status,
            data: response.data,
            headers: response.headers
        });
        return response;
    },
    (error) => {
        console.error('API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: async (email: string, password: string, role: 'student' | 'teacher' | 'admin' | 'support') => {
        try {
            console.log('Attempting login with:', { email, role });
            const response = await api.post<{ token: string; user: User }>('/auth/login', { email, password, role });
            console.log('Login response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Login error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    },
    register: async (userData: RegisterUser) => {
        const response = await api.post<{ token: string; user: User }>('/auth/register', userData);
        return response.data;
    },
    forgotPassword: async (email: string) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },
};

// User API
export const userAPI = {
    getProfile: async () => {
        const response = await api.get<User>('/users/profile');
        return response.data;
    },
    updateProfile: (updates: Partial<User>) => api.put<User>('/users/profile', updates).then(res => res.data),
    changePassword: async (currentPassword: string, newPassword: string) => {
        const response = await api.put('/users/change-password', {
            currentPassword,
            newPassword,
        });
        return response.data;
    },
    uploadProfilePicture: async (file: File) => {
        const formData = new FormData();
        formData.append('profilePicture', file);
        const response = await api.post('/users/profile/picture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    getAllUsers: async (): Promise<User[]> => {
        try {
            const response = await api.get<User[]>('/users');
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error fetching all users:', error);
            return [];
        }
    },
    getUsersByDepartment: async (role: 'student' | 'teacher'): Promise<User[]> => {
        const response = await api.get<User[]>(`/users/department?role=${role}`);
        return response.data;
    },
    updateUser: (userId: string, updates: Partial<User>) => api.put<User>(`/users/${userId}`, updates).then(res => res.data),
    sendEmailToUser: async (userId: string, subject: string, message: string): Promise<void> => {
        const response = await api.post(`/users/${userId}/email`, { subject, message });
        return response.data;
    },
    updateStatus: async (status: 'online' | 'offline') => {
        const response = await api.put('/users/status', { status });
        return response.data;
    },
    getCourseParticipantsStatus: async (courseId: string): Promise<User[]> => {
        const response = await api.get<User[]>(`/users/status/course/${courseId}`);
        return response.data;
    },
    exileUser: async (userId: string): Promise<void> => {
        const response = await api.delete(`/users/${userId}/exile`);
        return response.data;
    },
    getDepartments: async (): Promise<Department[]> => {
        const response = await api.get<Department[]>('/departments');
        return response.data;
    },
    createUser: async (userData: Partial<User>): Promise<User> => {
        const response = await api.post<User>('/users', userData);
        return response.data;
    },
};

// Course API
export const courseAPI = {
    getAllCourses: async (): Promise<Course[]> => {
        const response = await api.get<Course[]>('/courses');
        return response.data;
    },
    getCoursesByDepartment: async (): Promise<Course[]> => {
        const response = await api.get<Course[]>('/courses/department');
        return response.data;
    },
    getCourse: async (id: string): Promise<Course> => {
        const response = await api.get<Course>(`/courses/${id}`);
        return response.data;
    },
    getAvailableCourses: async (): Promise<Course[]> => {
        console.log('HIT /api/courses/available');
        const response = await api.get<Course[]>('/courses/available');
        return response.data;
    },
    enrollInCourse: async (courseId: string): Promise<void> => {
        const response = await api.post(`/courses/${courseId}/enroll`);
        return response.data;
    },
    unenrollFromCourse: async (courseId: string): Promise<void> => {
        const response = await api.post(`/courses/${courseId}/unenroll`);
        return response.data;
    },
    createCourse: async (courseData: Partial<Course>): Promise<Course> => {
        const response = await api.post<Course>('/courses', courseData);
        return response.data;
    },
    updateCourse: async (id: string, courseData: Partial<Course>): Promise<Course> => {
        const response = await api.put<Course>(`/courses/${id}`, courseData);
        return response.data;
    },
    deleteCourse: async (id: string): Promise<void> => {
        const response = await api.delete(`/courses/${id}`);
        return response.data;
    },
    assignStudentToCourse: async (courseId: string, studentId: string): Promise<void> => {
        const response = await api.post(`/courses/${courseId}/assign-student`, { studentId });
        return response.data;
    },
    unassignStudentFromCourse: async (courseId: string, studentId: string): Promise<void> => {
        const response = await api.post(`/courses/${courseId}/unassign-student`, { studentId });
        return response.data;
    },
    assignTeacherToCourse: async (courseId: string, teacherId: string, day: string, startTime: string): Promise<void> => {
        const response = await api.post(`/courses/${courseId}/assign-teacher`, { teacherId, day, startTime });
        return response.data;
    },
    unassignTeacherFromCourse: async (courseId: string): Promise<void> => {
        const response = await api.post(`/courses/${courseId}/unassign-teacher`);
        return response.data;
    },
    getStudentCourses: async (): Promise<Course[]> => {
        const response = await api.get<Course[]>('/courses/student');
        return response.data;
    },
    getPastCourses: async (): Promise<Course[]> => {
        const response = await api.get<Course[]>('/courses/student/past');
        return response.data;
    },
    completeCourse: async (courseId: string): Promise<void> => {
        const response = await api.post(`/courses/${courseId}/complete`);
        return response.data;
    },
    getRecentlyViewedCourses: async (limit: number = 3): Promise<Course[]> => {
        const response = await api.get<Course[]>(`/courses/recently-viewed?limit=${limit}`);
        return response.data;
    },
    getTeacherCourses: async (): Promise<Course[]> => {
        const response = await api.get<Course[]>('/courses/teacher');
        return response.data;
    },
};

// Assignment API
export const assignmentAPI = {
    getCourseAssignments: async (courseId: string): Promise<Assignment[]> => {
        const response = await api.get<Assignment[]>(`/assignments/course/${courseId}`);
        return response.data;
    },
    getAssignment: async (id: string): Promise<Assignment> => {
        const response = await api.get<Assignment>(`/assignments/${id}`);
        return response.data;
    },
    createAssignment: async (assignmentData: FormData): Promise<Assignment> => {
        const response = await api.post<Assignment>('/assignments', assignmentData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    updateAssignment: async (id: string, assignmentData: FormData): Promise<Assignment> => {
        const response = await api.put<Assignment>(`/assignments/${id}`, assignmentData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    deleteAssignment: async (id: string): Promise<void> => {
        const response = await api.delete(`/assignments/${id}`);
        return response.data;
    },
    submitAssignment: async (id: string, files: { title: string; fileUrl: string }[]): Promise<void> => {
        const response = await api.post(`/assignments/${id}/submit`, { files });
        return response.data;
    },
    updateSubmissionScore: async (assignmentId: string, submissionId: string, score: number, feedback: string): Promise<void> => {
        const response = await api.put(`/assignments/${assignmentId}/submissions/${submissionId}`, { score, feedback });
        return response.data;
    },
    gradeAssignment: async (id: string, submissionId: string, score: number, feedback?: string): Promise<void> => {
        const response = await api.post(`/assignments/${id}/grade/${submissionId}`, {
            score,
            feedback,
        });
        return response.data;
    },
    getStudentAssignments: async (): Promise<Assignment[]> => {
        const response = await api.get<Assignment[]>('/assignments/student');
        return response.data;
    },
    getRecentlyViewedAssignments: async (limit: number = 3): Promise<Assignment[]> => {
        const response = await api.get<Assignment[]>(`/assignments/recently-viewed?limit=${limit}`);
        return response.data;
    },
};

// Announcements API
export const announcementAPI = {
    getRecentUpdates: async (limit: number = 3) => {
        const response = await api.get(`/announcements/recent?limit=${limit}`);
        return response.data;
    },
    createAnnouncement: async (title: string, content: string, targetAudience: 'students' | 'teachers' | 'both'): Promise<Announcement> => {
        const response = await api.post<Announcement>('/announcements', { title, content, targetAudience });
        return response.data;
    },
};

// Department API
export const departmentAPI = {
    getAllDepartments: async (): Promise<Department[]> => {
        const response = await api.get<Department[]>('/departments');
        return response.data;
    },
};

export const communicationAPI = {
    createRoom: async (courseId: string): Promise<CommunicationRoom> => {
        const response = await api.post<CommunicationRoom>('/communication/rooms', { courseId });
        return response.data;
    },
    createPrivateRoom: async (userId: string, targetUserId: string): Promise<CommunicationRoom> => {
        const response = await api.post<CommunicationRoom>('/communication/private-rooms', { targetUserId });
        return response.data;
    },
    sendMessage: async (roomId: string, content: string): Promise<CommunicationMessage> => {
        const response = await api.post<CommunicationMessage>(`/communication/rooms/${roomId}/messages`, { content });
        return response.data;
    },
    getMessages: async (roomId: string): Promise<CommunicationMessage[]> => {
        const response = await api.get<CommunicationMessage[]>(`/communication/rooms/${roomId}/messages`);
        return response.data;
    },
};

// Chat API
export const chatAPI = {
    getChatHistory: async (): Promise<Message[]> => {
        const response = await api.get<Message[]>('/chat/history');
        return response.data;
    },
    sendMessage: async (message: string, userRole: string): Promise<Message> => {
        const response = await api.post<Message>('/chat', { message, userRole });
        return response.data;
    },
};

// Fee API
export const feeAPI = {
    processDirectPayment: async (data: { amount: number; description: string; userId: string }) => {
        const response = await api.post('/fees/direct-payment', data);
        return response.data;
    },
    initiateFlywirePayment: async (data: { 
        amount: number; 
        description: string; 
        userId: string;
        studentName: string;
        studentEmail: string;
    }) => {
        const response = await api.post('/fees/flywire-payment', data);
        return response.data;
    },
    updatePaymentStatus: async (paymentId: string, status: string) => {
        const response = await api.put(`/fees/payment/${paymentId}/status`, { status });
        return response.data;
    }
};

// Course Material API
export const courseMaterialAPI = {
    uploadMaterial: async (formData: FormData): Promise<CourseMaterial> => {
        const response = await api.post<CourseMaterial>(`/course-material/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getCourseMaterials: async (courseId: string): Promise<CourseMaterial[]> => {
        const response = await api.get<CourseMaterial[]>(`/course-material/course/${courseId}`);
        return response.data;
    },

    deleteMaterial: async (materialId: string): Promise<void> => {
        await api.delete(`/course-material/${materialId}`);
    },
};

export default api;