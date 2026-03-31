// In production (Vercel), the API is served from the same origin, so we should not hardcode localhost.
// Optionally set `REACT_APP_API_BASE_URL` in Vercel if your API is hosted on a different domain.
const BASE_URL = (process.env.REACT_APP_API_BASE_URL || '/api').replace(/\/$/, '');
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