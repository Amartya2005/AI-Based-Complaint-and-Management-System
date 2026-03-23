import React, { createContext, useState, useEffect, useRef } from 'react';
import { getCurrentUser } from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => getCurrentUser());
    const [loading] = useState(false);
    const loggingOut = useRef(false);

    // Listen for the 'auth:logout' event dispatched by api.js on 401.
    // Using React state instead of window.location.href avoids aborting
    // in-flight XHR requests (which browsers misreport as CORS errors).
    // The ref guard prevents multiple concurrent 401 responses from
    // calling setUser(null) multiple times.
    useEffect(() => {
        const handleLogout = () => {
            if (loggingOut.current) return;
            loggingOut.current = true;
            setUser(null);
            localStorage.removeItem('user');
            // Navigate to login; replace so back-button doesn't re-enter protected routes
            window.history.replaceState(null, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
            setTimeout(() => { loggingOut.current = false; }, 1000);
        };
        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
