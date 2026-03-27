import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';

// Import all your pages
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Team from './components/Team';
import AuditLogs from './components/AuditLogs';
import Profile from './components/Profile';

const PrivateRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('token');
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes - Wrapped in the Security Guard */}
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/reports" element={
                        <PrivateRoute>
                            <Reports />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/team" element={
                        <PrivateRoute>
                            <Team />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/audit" element={
                        <PrivateRoute>
                            <AuditLogs />
                        </PrivateRoute>
                    } />
                    <Route path="/profile" element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    } />
                    
                    {/* Catch-all: If they type a random URL, send them to login */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;