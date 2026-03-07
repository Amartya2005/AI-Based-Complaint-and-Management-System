import axios from 'axios';

// Empty base URL — Vite's proxy forwards /auth, /users, /complaints etc.
// to http://localhost:8000 transparently. No CORS needed.
const api = axios.create({
    baseURL: '',
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
    const raw = localStorage.getItem('user');
    if (raw) {
        try {
            const user = JSON.parse(raw);
            if (user?.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        } catch {
            localStorage.removeItem('user');
        }
    }
    return config;
});

// Auto-logout on 401 — use a custom event instead of window.location.href
// so we don't abort in-flight XHR requests (which browsers misreport as CORS errors)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Real HTTP error — log the actual status so it's visible in console
            console.error(
                `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
                `→ HTTP ${error.response.status}`,
                error.response.data
            );

            if (error.response.status === 401) {
                localStorage.removeItem('user');
                // Dispatch a custom event so React Router can redirect cleanly
                // without a hard page reload that kills all pending requests
                window.dispatchEvent(new CustomEvent('auth:logout'));
            }
        } else if (error.request) {
            // Request was made but no response received (network error / server down)
            console.error('[API Error] No response received — is the server running?', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
