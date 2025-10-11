import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack>
      <Stack.Screen name="choose" options={{ headerShown: false }} />
      <Stack.Screen name="matchmaking" options={{ headerShown: false }} />
      <Stack.Screen name="tournament" options={{ headerShown: false }} />
      <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="streak-master" options={{ headerShown: false }} />
    </Stack>
  );
}
