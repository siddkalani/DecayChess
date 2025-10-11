import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React from "react";

export default function Index() {
  const router = useRouter();
  React.useEffect(() => {
    const checkAuth = async () => {
      const [token, user] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
      ]);
      // Add a small delay to ensure Root Layout is mounted
      setTimeout(() => {
        if (token && user) {
          router.replace('/(main)/choose');
        } else {
          router.replace('/(auth)/login');
        }
      }, 100);
    };
    checkAuth();
  }, [router]);
  return null;
}
