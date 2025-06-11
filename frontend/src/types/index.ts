export interface User {
    _id: string;
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'student' | 'teacher' | 'admin' | 'support';
    department?: { _id: string; name: string } | string;
    studentId?: string;
    enrolledCourses?: { _id: string; title: string; code: string }[];
    teachingCourses?: { _id: string; title: string; code: string }[];
    pastCourses?: { _id: string; title: string; code: string }[];
    recentlyViewedCourses?: { _id: string; title: string; code: string }[];
    createdAt?: string;
    phoneNumber?: string;
    address?: string;
    profilePicture?: string;
    notifications?: { announcementId: string; read: boolean }[];
    onlineStatus?: 'online' | 'offline';
    lastSeen?: Date;
    token?: string;
}

export interface RegisterUser extends Omit<Partial<User>, 'department'> {
    password: string;
    department: string;
}

export interface Course {
    id: string;
    _id: string;
    title: string;
    code: string;
    credits: number;
    description: string;
    semester: string;
    schedule: string;
    room: string;
    department: string | { _id: string; name: string };
    instructor?: { _id: string; firstName: string; lastName: string; email: string };
    students: { _id: string; firstName: string; lastName: string; email: string }[];
    materials: string[];
    createdAt: string;
}

export interface CourseMaterial {
    _id: string;
    courseId: string;
    title: string;
    description: string;
    fileUrl: string;
    fileType: string;
    uploadedBy: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    uploadDate: Date;
    isPublic: boolean;
}

export interface Assignment {
    id: string;
    _id: string;
    title: string;
    description?: string;
    brief?: string;
    course: string;
    dueDate: Date | string;
    maxScore: number;
    attachments: CourseMaterial[];
    submissions: Submission[];
    createdAt?: string;
}

export interface Submission {
    _id?: string;
    student: User;
    submittedAt: Date;
    files: CourseMaterial[];
    score?: number;
    feedback?: string;
    status: 'submitted' | 'graded' | 'late';
}

export interface Announcement {
    _id: string;
    title: string;
    content: string;
    targetAudience: 'students' | 'teachers' | 'both';
    createdBy: User; // Updated to use the full User type
    createdAt: Date;
}

export interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
}

export interface Department {
    _id: string;
    name: string;
}

export interface Message {
    sender: 'user' | 'bot';
    text: string;
    timestamp: Date;
}

export interface CommunicationMessage {
    _id?: string;
    sender: User;
    content: string;
    timestamp: string | Date;
}

export interface CommunicationRoom {
    _id: string;
    course: Course;
    participants: User[];
    messages: CommunicationMessage[];
    createdAt: Date;
}

export interface UserStatus {
    userId: string;
    status: 'online' | 'offline';
    lastSeen?: Date;
}

export interface Chat {
    userId: string;
    messages: Message[];
}