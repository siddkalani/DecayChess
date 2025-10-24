import { Stack } from "expo-router";
import React from "react";

export default function OfflineLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="classic" options={{ headerShown: false }} />
      <Stack.Screen name="crazyhouse" options={{ headerShown: false }} />
      <Stack.Screen name="decay" options={{ headerShown: false }} />
    </Stack>
  );
}
