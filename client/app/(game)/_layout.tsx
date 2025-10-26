import { Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRequireAuth } from "../lib/hooks/useRequireAuth";
import { StatusBar } from "expo-status-bar";

export default function GameLayout() {
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
        <StatusBar style="light" backgroundColor="#23272A" translucent={false} />
        <ActivityIndicator size="large" color="#00A862" />
        <Text style={{ color: "#fff", marginTop: 16, fontSize: 16 }}>
          Checking login status...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="time-controls" options={{ headerShown: false }} />
      <Stack.Screen name="time-controls/classic" options={{ headerShown: false }} />
      <Stack.Screen name="time-controls/crazy" options={{ headerShown: false }} />
      <Stack.Screen name="variants" options={{ headerShown: false }} />
    </Stack>
  );
}
