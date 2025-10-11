import axios from 'axios';
import { API_BASE_URL } from "../constants";

// Authentication APIs
export const loginUser = async (email, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            password
        });
        
        if (response.status === 200) {
            return {
                success: true,
                data: response.data,
                error: null
            };
        } else {
            return {
                success: false,
                data: null,
                error: response.data.error || 'Login failed'
            };
        }
    } catch (err) {
        console.error("Error during login:", err);
        const errorMsg = err.response?.data?.error || 'An error occurred. Please try again.';
        return {
            success: false,
            data: null,
            error: errorMsg
        };
    }
};

export const registerUser = async (name, email, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
            name,
            email,
            password
        });
        
        if (response.status === 201) {
            return {
                success: true,
                data: response.data,
                error: null
            };
        } else {
            return {
                success: false,
                data: null,
                error: response.data.error || 'Registration failed'
            };
        }
    } catch (err) {
        console.error("Error during registration:", err);
        const errorMsg = err.response?.data?.error || 'An error occurred. Please try again.';
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
