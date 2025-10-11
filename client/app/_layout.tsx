import { Stack } from "expo-router";
import "./styles/globals.css";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="Home" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(main)" options={{ headerShown: false }} />
      <Stack.Screen name="(game)" options={{ headerShown: false }} />
    </Stack>
  );
}
