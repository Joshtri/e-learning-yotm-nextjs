import axios from 'axios';

// Create an Axios instance with default configs
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds timeout
});

// Request interceptor for adding auth token
// api.interceptors.request.use(
//   (config) => {
//     // Get token from localStorage if in browser environment
//     if (typeof window !== 'undefined') {
//       const token = localStorage.getItem('auth_token');
      
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//     }
    
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response interceptor for handling errors
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     const { response } = error;
    
//     // Handle token errors
//     if (response?.status === 401) {
//       if (typeof window !== 'undefined') {
//         // Clear stored tokens on auth errors
//         localStorage.removeItem('auth_token');
        
//         // Redirect to login page
//         window.location.href = '/';
//       }
//     }
    
//     return Promise.reject(error);
//   }
// );

export default api;