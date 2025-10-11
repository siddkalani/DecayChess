// Utility functions
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from './types';

export const storage = {
  async setToken(token: string) {
    await AsyncStorage.setItem('token', token);
  },
  
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  },
  
  async setUser(user: User) {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  },
  
  async getUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  async clear() {
    await AsyncStorage.multiRemove(['token', 'user']);
  },
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};
