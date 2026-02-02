// API configuration
// In development: proxy in package.json forwards /api to localhost:5000
// In production (Docker): API is served from same origin

const API_BASE = process.env.NODE_ENV === 'production' 
    ? '' 
    : 'http://localhost:5000';

export const API = {
    AUTH: `${API_BASE}/api/auth`,
    EXPENSES: `${API_BASE}/api/expenses`
};

export default API_BASE;
