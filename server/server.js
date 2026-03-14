require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const cors = require('cors');
const fs = require('fs'); // Moved to the top for cleaner architecture

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors()); 

// UPGRADE 1: Increased payload limit for receipt images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint for cloud deployment (Render/Railway)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));

// Serve React static files when a built client exists (Web Dashboard)
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');

if (fs.existsSync(path.join(clientBuildPath, 'index.html'))) {
    app.use(express.static(clientBuildPath));

    // Handle React routing (send all non-API requests to index.html)
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });

    console.log('Serving React build from:', clientBuildPath);
} else {
    console.log('client/build not found - API-only mode (development).');
}

// UPGRADE 2: Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Server Error:", err.stack);
    res.status(500).json({ msg: 'An unexpected server error occurred.' });
});

// UPGRADE 3: Mobile Network Binding
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Listening on all network interfaces (Ready for Mobile App)`);
});