require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const taskRoutes = require('./routes/tasks');

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Middleware
// CORS configuration - allow all origins in production (or specify your domain)
app.use(cors({
    origin: '*', // In production, replace with your actual domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '../frontend/html')));

// API Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/v1/users', require('./routes/users'));

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running!', timestamp: new Date().toISOString() });
});

// Serve frontend for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../frontend/html', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 7845;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Serving frontend from: ${path.join(__dirname, '../frontend')}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
