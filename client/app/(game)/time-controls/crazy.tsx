import { getSocket } from "@/utils/socketManager";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const timeControls = [
  { label: "Crazy House Standard", description: "3+2 (3 min, 2s increment)", disabled: false },
  { label: "Crazy House with Timer", description: "3 min, 2s increment but each captured piece has a 10-second limit to be dropped", disabled: true, comingSoon: true },
];

export default function CrazyTimeControl() {
  const router = useRouter()
  const { userId } = useLocalSearchParams()
  const [selected, setSelected] = useState(0)
  const [socketConnecting, setSocketConnecting] = useState(false)
  console.log("CrazyTimeControl userId:", userId)

  const handleSubVariantSelect = async () => {
    if (!userId) return;

    const tc = timeControls[selected];
    if (!tc || tc.disabled) {
      // Don't proceed if the selected variant is disabled
      return;
    }
    const subvariant = tc.label === 'Crazy House Standard' ? 'standard' : 'withTimer';

    // Briefly show connecting state and ensure socket exists
    setSocketConnecting(true);
    const socketInstance = getSocket(userId, "matchmaking");
    try {
      if (!socketInstance.connected) socketInstance.connect();
    } catch {}

    // Navigate immediately; matchmaking screen will emit queue:join
    router.push({
      pathname: "/matchmaking",
      params: { variant: "crazyhouse", subvariant, userId },
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
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Crazyhouse Time Control</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 16 }}>
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 32, textAlign: "center" }}>
            Choose Time Control
          </Text>
          {timeControls.map((tc, idx) => {
            const isDisabled = tc.disabled || false;
            const isSelected = selected === idx;
            const isComingSoon = tc.comingSoon || false;
            
            return (
              <TouchableOpacity
                key={tc.label}
                onPress={() => {
                  if (!isDisabled) {
                    setSelected(idx);
                  }
                }}
                disabled={isDisabled}
                style={{
                  backgroundColor: isSelected && !isDisabled ? "#00A862" : isDisabled ? "#1A1A1A" : "#2C2F33",
                  borderRadius: 14,
                  padding: 22,
                  marginBottom: 18,
                  width: 320,
                  alignItems: "center",
                  borderWidth: isSelected && !isDisabled ? 2 : 0,
                  borderColor: isSelected && !isDisabled ? "#fff" : undefined,
                  shadowColor: "#000",
                  shadowOpacity: 0.18,
                  shadowRadius: 7,
                  elevation: 2,
                  opacity: isDisabled ? 0.6 : 1,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <Text style={{ color: isSelected && !isDisabled ? "#fff" : isDisabled ? "#888" : "#00A862", fontSize: 22, fontWeight: "bold" }}>
                    {tc.label}
                  </Text>
                  {isComingSoon && (
                    <View style={{ 
                      backgroundColor: "#FFA500", 
                      paddingHorizontal: 8, 
                      paddingVertical: 4, 
                      borderRadius: 8, 
                      marginLeft: 10 
                    }}>
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>
                        Coming Soon
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: isDisabled ? "#666" : "#b0b3b8", fontSize: 16, textAlign: "center" }}>
                  {tc.description}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={{
              backgroundColor: timeControls[selected]?.disabled ? "#666" : "#00A862",
              borderRadius: 10,
              paddingVertical: 14,
              paddingHorizontal: 40,
              marginTop: 30,
              opacity: socketConnecting || timeControls[selected]?.disabled ? 0.6 : 1,
              width: "100%",
            }}
            onPress={handleSubVariantSelect}
            disabled={socketConnecting || timeControls[selected]?.disabled}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", textAlign: "center" }}>
              {socketConnecting ? "Connecting..." : timeControls[selected]?.disabled ? "Coming Soon" : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}
