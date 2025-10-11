import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./styles/globals.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="Home" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen name="(game)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
