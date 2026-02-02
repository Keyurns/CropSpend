require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const cors = require('cors');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors()); 
app.use(express.json());

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));

// Serve React static files in production
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
    
    // Check if build exists
    const fs = require('fs');
    if (!fs.existsSync(path.join(clientBuildPath, 'index.html'))) {
        console.error('ERROR: client/build/index.html not found. Run `npm run build` in client/ or rebuild the Docker image.');
        process.exit(1);
    }
    
    // Serve static files
    app.use(express.static(clientBuildPath));
    
    // Handle React routing (send all non-API requests to index.html)
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
    
    console.log('Serving React build from:', clientBuildPath);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));