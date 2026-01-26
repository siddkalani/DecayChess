import axios from 'axios';
import { API_BASE_URL } from "../constants";

// ============================================
// 🔧 LOGGING UTILITIES
// ============================================
const LOG_PREFIX = '[API]';

const logRequest = (endpoint, method = 'POST') => {
    console.log(`${LOG_PREFIX} 📤 ${method} ${endpoint}`);
};

const logSuccess = (endpoint, data) => {
    console.log(`${LOG_PREFIX} ✅ ${endpoint} - Success`);
    if (__DEV__) {
        console.log(`${LOG_PREFIX} Response:`, JSON.stringify(data, null, 2));
    }
};

const logError = (endpoint, error) => {
    console.error(`${LOG_PREFIX} ❌ ${endpoint} - Error`);
    console.error(`${LOG_PREFIX} Status: ${error.response?.status || 'Network Error'}`);
    console.error(`${LOG_PREFIX} Message: ${error.message}`);
    if (error.response?.data) {
        console.error(`${LOG_PREFIX} Server Response:`, JSON.stringify(error.response.data, null, 2));
    }
};

// Extract user-friendly error message from API response
const extractErrorMessage = (error, defaultMessage) => {
    // Check various possible error message locations
    const serverMessage = 
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.msg;
    
    if (serverMessage) {
        return serverMessage;
    }
    
    // Handle specific HTTP status codes
    const status = error.response?.status;
    switch (status) {
        case 400:
            return 'Invalid request. Please check your input.';
        case 401:
            return 'Invalid credentials. Please try again.';
        case 403:
            return 'Access denied. Please try again.';
        case 404:
            return 'Service not found. Please try again later.';
        case 409:
            return 'This account already exists.';
        case 429:
            return 'Too many attempts. Please wait a moment.';
        case 500:
            return 'Server error. Please try again later.';
        case 502:
        case 503:
        case 504:
            return 'Server is temporarily unavailable. Please try again.';
        default:
            break;
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
        return 'Request timed out. Please check your connection.';
    }
    if (error.code === 'ERR_NETWORK' || !error.response) {
        return 'Network error. Please check your internet connection.';
    }
    
    return defaultMessage;
};

// ============================================
// 🔐 AUTHENTICATION APIs
// ============================================
export const loginUser = async (email, password) => {
    const endpoint = '/auth/login';
    logRequest(endpoint);
    
    try {
        const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
            email,
            password
        });
        
        if (response.status === 200) {
            logSuccess(endpoint, { user: response.data?.user?.email || 'unknown' });
            return {
                success: true,
                data: response.data,
                error: null
            };
        } else {
            console.warn(`${LOG_PREFIX} ⚠️ ${endpoint} - Unexpected status: ${response.status}`);
            return {
                success: false,
                data: null,
                error: response.data.error || response.data.message || 'Login failed'
            };
        }
    } catch (err) {
        logError(endpoint, err);
        const errorMsg = extractErrorMessage(err, 'Unable to login. Please try again.');
        return {
            success: false,
            data: null,
            error: errorMsg
        };
    }
};

export const registerUser = async (name, email, password) => {
    const endpoint = '/auth/register';
    logRequest(endpoint);
    
    // Client-side validation logging
    if (__DEV__) {
        console.log(`${LOG_PREFIX} 📋 Register payload:`, { name, email, password: '***' });
    }
    
    try {
        const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
            name,
            email,
            password
        });
        
        if (response.status === 201) {
            logSuccess(endpoint, { user: response.data?.user?.email || 'unknown' });
            return {
                success: true,
                data: response.data,
                error: null
            };
        } else {
            console.warn(`${LOG_PREFIX} ⚠️ ${endpoint} - Unexpected status: ${response.status}`);
            return {
                success: false,
                data: null,
                error: response.data.error || response.data.message || 'Registration failed'
            };
        }
    } catch (err) {
        logError(endpoint, err);
        const errorMsg = extractErrorMessage(err, 'Unable to create account. Please try again.');
        return {
            success: false,
            data: null,
            error: errorMsg
        };
    }
};

// Fetch leaderboard data
export const fetchLeaderboardData = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/leaderboard`);
        console.log("Fetched players:", response.data);
        const fetchedPlayers = response.data.users || response.data;
        return {
            success: true,
            data: fetchedPlayers,
            error: null
        };
    } catch (err) {
        console.error("Error fetching players:", err);
        return {
            success: false,
            data: null,
            error: "Failed to load leaderboard."
        };
    }
};

// Fetch tournament leaderboard data
export const fetchTournamentLeaderboard = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/tournaments`);
        const data = response.data;
        
        if (data.success) {
            return {
                success: true,
                data: data.data,
                error: null
            };
        } else {
            return {
                success: false,
                data: null,
                error: "Tournament data not available."
            };
        }
    } catch (error) {
        console.error('Failed to fetch tournament leaderboard:', error);
        return {
            success: false,
            data: null,
            error: "Failed to load tournament leaderboard."
        };
    }
};
