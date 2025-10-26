import { Stack } from "expo-router";
import React from "react";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import "./styles/globals.css";
import AnimatedSplash from "./components/ui/AnimatedSplash";

// Keep the native splash visible while we set up and until our
// in-app animated splash overlay takes over.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showAnimatedSplash, setShowAnimatedSplash] = React.useState(true);

  React.useEffect(() => {
    // Hide the native splash shortly after mount so our animated
    // overlay can be shown seamlessly.
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#23272A" translucent={false} />
      <Stack>
        <Stack.Screen name="Home" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen name="(game)" options={{ headerShown: false }} />
        <Stack.Screen name="(offline)" options={{ headerShown: false }} />
      </Stack>
      {showAnimatedSplash && (
        <AnimatedSplash
          onFinish={() => setShowAnimatedSplash(false)}
          logoSource={require("../assets/logo.png")}
        />
      )}
    </SafeAreaProvider>
  );
}
