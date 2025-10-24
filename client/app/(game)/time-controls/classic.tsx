import { getSocket } from "@/utils/socketManager";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const timeControls = [
  { label: "Blitz", description: "3+2 (3 min, 2s increment)" },
  { label: "Bullet", description: "1+0 (1 min, no increment)" },
  { label: "Standard", description: "10 mins" },
];

export default function ClassicTimeControl() {
  const router = useRouter()
  const { userId } = useLocalSearchParams()
  const [selected, setSelected] = useState(0)
  const [socketConnecting, setSocketConnecting] = useState(false)
  console.log("ClassicTimeControl userId:", userId)

  const handleSubVariantSelect = async () => {
    if (!userId) return;

    const tc = timeControls[selected];
    const subvariant = tc.label.toLowerCase();
    if (!tc) return;

    // Briefly show connecting state
    setSocketConnecting(true);

    // Ensure a matchmaking socket exists and start connection if needed
    const socketInstance = getSocket(userId, "matchmaking");
    try {
      if (!socketInstance.connected) socketInstance.connect();
    } catch {}

    // Navigate immediately; matchmaking screen handles queue:join
    router.push({
      pathname: "/matchmaking",
      params: { variant: "classic", subvariant, userId },
    });
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace("/(main)/choose")
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#23272A" }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 16,
          }}
        >
          <TouchableOpacity
            onPress={handleGoBack}
            style={{ paddingVertical: 6, paddingHorizontal: 4 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: "#00A862", fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Classic Time Control</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 16 }}>
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 32, textAlign: "center" }}>
            Choose Time Control
          </Text>
      {timeControls.map((tc, idx) => (
        <TouchableOpacity
          key={tc.label}
          onPress={() => setSelected(idx)}
          style={{
            backgroundColor: selected === idx ? "#00A862" : "#2C2F33",
            borderRadius: 14,
            padding: 22,
            marginBottom: 18,
            width: 320,
            alignItems: "center",
            borderWidth: selected === idx ? 2 : 0,
            borderColor: selected === idx ? "#fff" : undefined,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 7,
            elevation: 2,
          }}
        >
          <Text style={{ color: selected === idx ? "#fff" : "#00A862", fontSize: 22, fontWeight: "bold", marginBottom: 6 }}>{tc.label}</Text>
          <Text style={{ color: "#b0b3b8", fontSize: 16 }}>{tc.description}</Text>
        </TouchableOpacity>
      ))}
          <TouchableOpacity
            style={{
              backgroundColor: "#00A862",
              borderRadius: 10,
              paddingVertical: 14,
              paddingHorizontal: 40,
              marginTop: 30,
              opacity: socketConnecting ? 0.6 : 1,
              width: "100%",
            }}
            onPress={handleSubVariantSelect}
            disabled={socketConnecting}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", textAlign: "center" }}>
              {socketConnecting ? "Connecting..." : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}
