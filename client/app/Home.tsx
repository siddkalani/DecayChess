import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#23272A" }}>
      <Image
        source={{ uri: "https://www.chess.com/bundles/web/images/offline-play/standardboard.84a92436.png" }}
        style={{ width: 120, height: 120, marginBottom: 32, borderRadius: 16 }}
      />
      <Text style={{ color: "#fff", fontSize: 32, fontWeight: "bold", marginBottom: 24 }}>Chess Game</Text>
      <TouchableOpacity
        style={{ backgroundColor: "#00A862", paddingVertical: 16, paddingHorizontal: 48, borderRadius: 30, marginBottom: 16 }}
        onPress={() => router.push("/(auth)/signup")}
      >
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Start</Text>
      </TouchableOpacity>
    </View>
  );
}
