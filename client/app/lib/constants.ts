import { Platform } from 'react-native';

// Emulator/simulator-friendly host
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const DEFAULT_PORT = 3000;

/** 
 * =========================================================
 *  🔧 TOGGLE BETWEEN SERVERS
 *  Comment/uncomment to pick which one to use.
 * =========================================================
 */
const USE_MAIN_SERVER = false; // 👉 dev

/** 
 * =========================================================
 *  SERVER ENDPOINTS
 * =========================================================
 */
const MAIN_HTTP = 'https://decaychess-0.onrender.com';
const MAIN_API = `${MAIN_HTTP}/api`;

const DEV_HTTP = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;
const DEV_API = `${DEV_HTTP}/api`;

export const API_BASE_URL = USE_MAIN_SERVER ? MAIN_API : DEV_API;
export const WS_BASE_URL = USE_MAIN_SERVER ? MAIN_HTTP : DEV_HTTP;

/** 
 * =========================================================
 *  ROUTES
 * =========================================================
 */
export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
  },
  MAIN: {
    HOME: '/',
    CHOOSE: '/choose',
    MATCHMAKING: '/matchmaking',
    TOURNAMENT: '/tournament',
    LEADERBOARD: '/leaderboard',
    PROFILE: '/profile',
    STREAK_MASTER: '/streak-master',
  },
  GAME: {
    TIME_CONTROLS: {
      CLASSIC: '/time-controls/classic',
      CRAZY: '/time-controls/crazy',
    },
    VARIANTS: {
      CLASSIC: '/variants/classic',
      CRAZY_HOUSE: '/variants/crazy-house',
      DECAY: '/variants/decay',
      SIX_POINTER: '/variants/six-pointer',
    },
  },
} as const;

/** 
 * =========================================================
 *  UI CONSTANTS
 * =========================================================
 */
export const COLORS = {
  PRIMARY: '#00A862',
  BACKGROUND: '#23272A',
  SECONDARY: '#2C2C2E',
  TEXT: '#FFFFFF',
  TEXT_SECONDARY: '#b0b3b8',
} as const;

export const CHESS_VARIANTS = [
  { id: 'classic', name: 'Classic', description: 'Traditional chess game' },
  { id: 'crazy-house', name: 'Crazy House', description: 'Chess with piece drops' },
  { id: 'decay', name: 'Decay', description: 'Time-based variant' },
  { id: 'six-pointer', name: 'Six Pointer', description: 'Six-sided chess' },
] as const;

console.log(`✅ Using ${USE_MAIN_SERVER ? 'MAIN' : 'DEV'} server: ${API_BASE_URL}`);
