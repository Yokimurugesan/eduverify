const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  // If we are accessing via IP (like from mobile), use that IP for backend calls
  // Otherwise default to localhost
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const BACKEND_URL = API_BASE_URL.replace('/api', '');
