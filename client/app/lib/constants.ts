// App constants
// Resolve host for API and WebSocket based on platform
// - Android emulator: 10.0.2.2 maps to host machine
// - iOS simulator: localhost maps to host machine
// If you are on a physical device, replace HOST with your LAN IP (e.g., 192.168.x.x)
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Prefer Expo public envs when provided (injected at build time)
const ENV_API = process.env.EXPO_PUBLIC_API_URL;
const ENV_WS = process.env.EXPO_PUBLIC_WS_URL;

// Emulator/simulator-friendly defaults
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const DEFAULT_PORT = 3000;

// Fallbacks when envs are not provided
const FALLBACK_HTTP = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;
const API_DEFAULT = `${FALLBACK_HTTP}/api`;

export const API_BASE_URL = ENV_API || API_DEFAULT;
export const WS_BASE_URL = ENV_WS || FALLBACK_HTTP;

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
