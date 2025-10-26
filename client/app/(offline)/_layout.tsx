import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";

export default function OfflineLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#23272A" translucent={false} />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="classic" options={{ headerShown: false }} />
        <Stack.Screen name="crazyhouse" options={{ headerShown: false }} />
        <Stack.Screen name="decay" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
