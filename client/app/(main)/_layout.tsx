import { Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRequireAuth } from "../lib/hooks/useRequireAuth";

export default function MainLayout() {
  const authStatus = useRequireAuth();

  if (authStatus === "checking") {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#23272A",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#00A862" />
        <Text style={{ color: "#fff", marginTop: 16, fontSize: 16 }}>
          Checking login status...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="choose" options={{ headerShown: false }} />
      <Stack.Screen name="matchmaking" options={{ headerShown: false }} />
      <Stack.Screen name="tournament" options={{ headerShown: false }} />
      <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="streak-master" options={{ headerShown: false }} />
      <Stack.Screen name="newsletter" options={{ headerShown: false }} />
    </Stack>
  );
}
