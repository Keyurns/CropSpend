const BASE_URL = 'http://localhost:5000/api'; 
export const API = {
    BASE_URL: BASE_URL,
    LOGIN: `${BASE_URL}/auth/login`,
    REGISTER: `${BASE_URL}/auth/register`,
    EXPENSES: `${BASE_URL}/expenses`,
    USERS: `${BASE_URL}/users`,
    AUDIT_LOGS: `${BASE_URL}/auditlogs`,
    ADMIN_USERS: `${BASE_URL}/admin/users`,
    PROFILE: `${BASE_URL}/users/profile`,
};