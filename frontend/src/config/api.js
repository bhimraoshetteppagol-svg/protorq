// API Configuration - automatically detects localhost, network IP, ngrok, and public domains
const getApiUrl = () => {
  // Check for environment variable first (highest priority)
  // This is where you'll set your ngrok backend URL
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Auto-detect based on current hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol; // http: or https:
  
  // If accessing via ngrok domain
  if (hostname.includes('ngrok.io') || hostname.includes('ngrok-free.app') || hostname.includes('ngrok.app')) {
    // For ngrok, if REACT_APP_API_URL is not set, we need to use a separate ngrok URL for backend
    // The backend ngrok URL should be set via environment variable
    // For now, try to construct it (this assumes backend is on different ngrok tunnel)
    console.warn('Accessing via ngrok but REACT_APP_API_URL not set. Please set REACT_APP_API_URL to your backend ngrok URL.');
    // Return the same domain but this won't work if backend is on different tunnel
    // User must set REACT_APP_API_URL environment variable
    return `${protocol}//${hostname}`;
  }
  
  // If accessing via IP address or domain (not localhost), use that for API
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${protocol}//${hostname}:5000`;
  }
  
  // Default to localhost for local development
  return 'http://localhost:5000';
};

export const API_URL = getApiUrl();
export default API_URL;

