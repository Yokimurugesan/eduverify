const getApiBaseUrl = () => {
    // 1. Monolithic production behaviour (use relative path)
    if (process.env.NODE_ENV === 'production') return '/api';

    // 2. Check environment variable (fallback if explicitly set)
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;

    const hostname = window.location.hostname;
    // 3. If we are accessing via IP (like from mobile), use that IP
    // Otherwise default to localhost
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const BACKEND_URL = API_BASE_URL.replace('/api', '');
