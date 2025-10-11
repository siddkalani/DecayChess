import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";

type AuthStatus = "checking" | "ready";

export function useRequireAuth() {
  const router = useRouter();
  const [status, setStatus] = React.useState<AuthStatus>("checking");

  React.useEffect(() => {
    let isMounted = true;

    const verifyAuthentication = async () => {
      try {
        const [token, user] = await Promise.all([
          AsyncStorage.getItem("token"),
          AsyncStorage.getItem("user"),
        ]);

        if (!token || !user) {
          router.replace("/(auth)/login");
          return;
        }

        if (isMounted) {
          setStatus("ready");
        }
      } catch (error) {
        console.error("Failed to enforce authentication:", error);
        router.replace("/(auth)/login");
      }
    };

    verifyAuthentication();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return status;
}
