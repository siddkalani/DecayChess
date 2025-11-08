import React from "react"
import { Text, View } from "react-native"
import { variantStyles } from "@/app/lib/styles"
import { SquareOverlay } from "./ChessSquare"

// Decay timer overlay
export const createDecayTimerOverlay = (
  timeLeft: number,
  formatTime: (ms: number) => string,
  fontSize: number
): SquareOverlay => ({
  type: "decayTimer",
  position: "above",
  content: (
    <View style={variantStyles.decayTimerBox}>
      <Text style={[variantStyles.decayTimerBoxText, { fontSize }]}>
        {formatTime(timeLeft)}
      </Text>
    </View>
  ),
})

// Frozen piece indicator overlay
export const createFrozenOverlay = (moveDotSize: number): SquareOverlay => ({
  type: "frozen",
  position: "top-right",
  content: <Text style={{ fontSize: moveDotSize * 0.6 }}>❄️</Text>,
})

// Generic custom overlay
export const createCustomOverlay = (
  content: React.ReactNode,
  position: "above" | "top-right" | "center" = "center"
): SquareOverlay => ({
  type: "custom",
  position,
  content,
})

