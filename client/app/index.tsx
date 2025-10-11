import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React from "react";

export default function Index() {
  const router = useRouter();
  React.useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      // Add a small delay to ensure Root Layout is mounted
      setTimeout(() => {
        if (token) {
          router.replace('/choose');
        } else {
          router.replace('/Home');
        }
      }, 100);
    };
    checkAuth();
  }, [router]);
  return null;
}
