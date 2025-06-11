const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Course = require('./models/Course');
const Department = require('./models/Department');

// Load environment variables (ensure MONGODB_URI is available)
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

connectDB().then(() => {
    console.log('Connected to MongoDB Atlas');
    seedDatabase();
}).catch(err => {
    console.error('Error connecting to MongoDB Atlas:', err);
    process.exit(1);
});

// Function to generate a random integer between min and max (inclusive)
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedDatabase = async () => {
    try {
        // Step 1: Clear all existing data
        await User.deleteMany({});
        await Course.deleteMany({});
        await Department.deleteMany({});
        console.log('Cleared all existing data from User, Course, and Department collections');

        //Step 2: Create Departments
        const departmentsData = [
            { name: 'Computer Science' },
            { name: 'Mathematics' },
            { name: 'Physics' },
        ];
        const departments = await Department.insertMany(departmentsData);
        console.log('Created departments:', departments);

        // Map department names to their IDs
        const departmentMap = {};
        departments.forEach(dept => {
            departmentMap[dept.name] = dept._id;
        });

        // Step 3: Create Teachers
        const teachersData = [
            {
                firstName: 'Alice',
                lastName: 'Smith',
                email: 'alice.smith@example.com',
                password: await bcrypt.hash('teacher123', 10),
                role: 'teacher',
                department: departmentMap['Computer Science'],
                createdAt: new Date(),
            },
            {
                firstName: 'Bob',
                lastName: 'Johnson',
                email: 'bob.johnson@example.com',
                password: await bcrypt.hash('teacher123', 10),
                role: 'teacher',
                department: departmentMap['Mathematics'],
                createdAt: new Date(),
            },
            {
                firstName: 'Carol',
                lastName: 'Williams',
                email: 'carol.williams@example.com',
                password: await bcrypt.hash('teacher123', 10),
                role: 'teacher',
                department: departmentMap['Physics'],
                createdAt: new Date(),
            },
        ];
        const teachers = await User.insertMany(teachersData);
        console.log('Created teachers:', teachers);

        // Map department IDs to teacher IDs
        const teacherMap = {};
        teachers.forEach(teacher => {
            teacherMap[teacher.department.toString()] = teacher._id;
        });

        // Step 4: Create Courses and Assign Teachers
        const coursesData = [
            // Computer Science Courses (Instructor: Alice)
            { 
                title: 'Introduction to Programming', 
                code: 'CS101', 
                credits: 3, 
                description: 'Learn the basics of programming with Python.',
                semester: 'Fall 2025',
                schedule: 'Mon/Wed 10:00-11:30',
                room: 'Room 101',
                department: departmentMap['Computer Science'],
                instructor: teacherMap[departmentMap['Computer Science'].toString()],
                materials: ['Lecture 1 Notes', 'Python Basics Slides', 'Assignment 1 Guidelines'],
            },
            { 
                title: 'Data Structures', 
                code: 'CS201', 
                credits: 4, 
                description: 'Study fundamental data structures like arrays, lists, and trees.',
                semester: 'Fall 2025',
                schedule: 'Tue/Thu 13:00-14:30',
                room: 'Room 102',
                department: departmentMap['Computer Science'],
                instructor: teacherMap[departmentMap['Computer Science'].toString()],
                materials: ['Arrays and Lists Notes', 'Tree Structures Slides', 'Lab Exercise 1'],
            },
            { 
                title: 'Algorithms', 
                code: 'CS301', 
                credits: 4, 
                description: 'Explore algorithm design and analysis techniques.',
                semester: 'Spring 2025',
                schedule: 'Mon/Wed 14:00-15:30',
                room: 'Room 103',
                department: departmentMap['Computer Science'],
                instructor: teacherMap[departmentMap['Computer Science'].toString()],
                materials: ['Sorting Algorithms Notes', 'Graph Algorithms Slides'],
            },
            { 
                title: 'Operating Systems', 
                code: 'CS401', 
                credits: 3, 
                description: 'Understand the principles of operating systems.',
                semester: 'Spring 2025',
                schedule: 'Tue/Thu 09:00-10:30',
                room: 'Room 104',
                department: departmentMap['Computer Science'],
                instructor: teacherMap[departmentMap['Computer Science'].toString()],
                materials: ['Process Management Notes', 'Memory Management Slides'],
            },
            // Mathematics Courses (Instructor: Bob)
            { 
                title: 'Calculus I', 
                code: 'MATH101', 
                credits: 3, 
                description: 'Introduction to differential and integral calculus.',
                semester: 'Fall 2025',
                schedule: 'Mon/Wed 11:00-12:30',
                room: 'Room 201',
                department: departmentMap['Mathematics'],
                instructor: teacherMap[departmentMap['Mathematics'].toString()],
                materials: ['Limits and Derivatives Notes', 'Integrals Slides', 'Practice Problems Set 1'],
            },
            { 
                title: 'Linear Algebra', 
                code: 'MATH201', 
                credits: 3, 
                description: 'Study of vectors, matrices, and linear transformations.',
                semester: 'Fall 2025',
                schedule: 'Tue/Thu 14:00-15:30',
                room: 'Room 202',
                department: departmentMap['Mathematics'],
                instructor: teacherMap[departmentMap['Mathematics'].toString()],
                materials: ['Vectors and Matrices Notes', 'Linear Transformations Slides'],
            },
            { 
                title: 'Probability and Statistics', 
                code: 'MATH301', 
                credits: 3, 
                description: 'Learn the basics of probability and statistical methods.',
                semester: 'Spring 2025',
                schedule: 'Mon/Wed 09:00-10:30',
                room: 'Room 203',
                department: departmentMap['Mathematics'],
                instructor: teacherMap[departmentMap['Mathematics'].toString()],
                materials: ['Probability Basics Notes', 'Statistical Methods Slides'],
            },
            // Physics Courses (Instructor: Carol)
            { 
                title: 'Mechanics', 
                code: 'PHYS101', 
                credits: 4, 
                description: 'Fundamentals of classical mechanics.',
                semester: 'Fall 2025',
                schedule: 'Tue/Thu 10:00-11:30',
                room: 'Room 301',
                department: departmentMap['Physics'],
                instructor: teacherMap[departmentMap['Physics'].toString()],
                materials: ["Newton's Laws Notes", 'Kinematics Slides', 'Lab Experiment 1 Guide'],
            },
            { 
                title: 'Electromagnetism', 
                code: 'PHYS201', 
                credits: 4, 
                description: 'Study of electric and magnetic fields.',
                semester: 'Fall 2025',
                schedule: 'Mon/Wed 13:00-14:30',
                room: 'Room 302',
                department: departmentMap['Physics'],
                instructor: teacherMap[departmentMap['Physics'].toString()],
                materials: ['Electric Fields Notes', 'Magnetic Fields Slides'],
            },
            { 
                title: 'Quantum Physics', 
                code: 'PHYS301', 
                credits: 3, 
                description: 'Introduction to quantum mechanics principles.',
                semester: 'Spring 2025',
                schedule: 'Tue/Thu 11:00-12:30',
                room: 'Room 303',
                department: departmentMap['Physics'],
                instructor: teacherMap[departmentMap['Physics'].toString()],
                materials: ['Wave-Particle Duality Notes', 'Quantum States Slides'],
            },
        ];
        const courses = await Course.insertMany(coursesData);
        console.log('Created courses with instructors:', courses);

        // Map course codes to their objects
        const courseMap = {};
        courses.forEach(course => {
            courseMap[course.code] = course;
        });

        // Step 5: Create a test student
        const studentData = {
            firstName: 'Test',
            lastName: 'Student',
            email: 'test.student@example.com',
            password: await bcrypt.hash('student123', 10),
            role: 'student',
            department: departmentMap['Computer Science'], // Assign to Computer Science department
            studentId: 'STU001',
            createdAt: new Date(),
        };
        const student = await User.create(studentData);
        console.log('Created test student:', student);

        console.log('Database seeded successfully!');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};