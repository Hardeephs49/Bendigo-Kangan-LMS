// backend/src/server.js
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables BEFORE any other imports
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading environment variables from:', envPath);

// Read and log the raw contents of the .env file
try {
  const envContents = fs.readFileSync(envPath, 'utf8');
  console.log('Raw .env file contents from file system:\n---\n', envContents, '\n---');
} catch (error) {
  console.error('Error reading .env file at specified path:', error);
}

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  throw result.error;
}

// Log all environment variables (without sensitive values)
console.log('Environment variables loaded:', Object.keys(result.parsed || {}).join(', '));

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { initializeSocket } = require('./socket');

// Debug environment variables
console.log('DEBUG: OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '******' + process.env.OPENROUTER_API_KEY.substring(process.env.OPENROUTER_API_KEY.length - 4) : 'Not Set');
console.log('DEBUG: JWT_SECRET:', process.env.JWT_SECRET ? '******' + process.env.JWT_SECRET.substring(process.env.JWT_SECRET.length - 4) : 'Not Set');

const connectDB = require('./config/db');
connectDB();

// Create Express app
const app = express();

// VERY EARLY DEBUG LOG to see incoming requests
app.use((req, res, next) => {
    console.log(`[EARLY DEBUG] Request: ${req.method} ${req.originalUrl}`);
    next();
});

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Debug middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Routes
console.log('Attempting to load auth routes...');
const authRoutes = require('./routes/auth');
console.log('Auth routes loaded.');

console.log('Attempting to load user routes...');
const userRoutes = require('./routes/users');
console.log('User routes loaded.');

console.log('Attempting to load payment routes...');
const paymentRoutes = require('./routes/payment');
console.log('Payment routes loaded.');

console.log('Attempting to load fees routes...');
const feesRoutes = require('./routes/fees');
console.log('Fees routes loaded.');

console.log('Using routes...');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/courses', require('./routes/courses'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/course-material', require('./routes/courseMaterial'));
app.use('/api/communication', require('./routes/communication'));
console.log('Attempting to load uploads routes...');
app.use('/api/uploads', require('./routes/uploads'));
console.log('Uploads routes loaded and used.');
console.log('All routes used.');

// use backend.js
console.log('Attempting to load backend router...');
const { router: backendRouter, setupSocket } = require('./routes/backend');
console.log('Backend router loaded.');
console.log('Backend router used.');

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running!' });
});

// Debug log to confirm routes
function printRoutes(app) {
    console.log('Registered routes:');
    app._router.stack.forEach((middleware) => {
        if (middleware.route) { // routes registered directly on the app
            const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
            console.log(`${methods} ${middleware.route.path}`);
        } else if (middleware.name === 'router') { // router middleware 
            middleware.handle.stack.forEach((handler) => {
                const route = handler.route;
                if (route) {
                    const methods = Object.keys(route.methods).join(', ').toUpperCase();
                    console.log(`${methods} ${route.path}`);
                }
            });
        }
    });
}

// Start server with Socket.IO
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log('==============================');
    console.log(`Server is running on port ${PORT}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log('==============================');
    printRoutes(app);
});

// Set up socket.io
setupSocket(server);
const io = initializeSocket(server);
global.io = io;

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Debug log to confirm routes
console.log('Registered routes:', app._router.stack
    .filter(r => r.route)
    .map(r => r.route.path));

app.use('/api', backendRouter);
