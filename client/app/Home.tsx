import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React from "react";

export default function Home() {
  const router = useRouter();

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [token, user] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('user'),
        ]);
        if (!isMounted) {
          return;
        }
        if (token && user) {
          router.replace('/(main)/choose');
          return;
        }
      } catch {
        // Ignore storage errors and fall back to signup screen.
      }
      if (isMounted) {
        router.replace('/(auth)/signup');
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [router]);

  return null;
}
