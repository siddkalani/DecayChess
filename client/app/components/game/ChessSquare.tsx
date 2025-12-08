import React, { useRef } from "react"
import { Text, View, Pressable } from "react-native"
import { getPieceComponent } from "./chessPieces"
import { BOARD_THEME } from "@/app/lib/constants/boardTheme"
import { variantStyles } from "@/app/lib/styles"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

export interface SquareOverlay {
  type: "decayTimer" | "frozen" | "custom"
  content?: React.ReactNode
  position?: "above" | "top-right" | "center"
}

export interface ChessSquareProps {
  file: string
  rank: string
  square: string
  piece: string | null
  isLight: boolean
  isSelected: boolean
  isPossibleMove: boolean
  isLastMove: boolean
  isDragOrigin: boolean
  isDragTarget: boolean
  squareSize: number
  coordinateFontSize: number
  pieceSize: number
  onPress: (square: string) => void
  onTouchStart?: (square: string, event: any) => void
  overlays?: SquareOverlay[]
  customStyles?: {
    square?: any
    piece?: any
  }
}

export const ChessSquare: React.FC<ChessSquareProps> = ({
  file,
  rank,
  square,
  piece,
  isLight,
  isSelected,
  isPossibleMove,
  isLastMove,
  isDragOrigin,
  isDragTarget,
  squareSize,
  coordinateFontSize,
  pieceSize,
  onPress,
  onTouchStart,
  overlays = [],
  customStyles = {},
}) => {
  // Track if we've handled this touch to prevent duplicate events
  const touchHandledRef = useRef(false)
  const touchStartTimeRef = useRef(0)

  // Determine border color and width
  let borderColor = "transparent"
  let borderWidth = 0

  if (isLastMove) {
    borderColor = BOARD_THEME.highlight.lastMove
    borderWidth = 1
  }

  // Check for variant-specific border colors from overlays
  const frozenOverlay = overlays.find((o) => o.type === "frozen")
  if (frozenOverlay) {
    borderColor = BOARD_THEME.highlight.frozen
    borderWidth = 2
  }

  const decayOverlay = overlays.find((o) => o.type === "decayTimer")
  if (decayOverlay && !isSelected && !isPossibleMove && !isLastMove) {
    borderColor = BOARD_THEME.highlight.decay
    borderWidth = 1
  }

  const squareBackground = isLight ? BOARD_THEME.lightSquare : BOARD_THEME.darkSquare
  const coordinateColor = isLight ? BOARD_THEME.darkSquare : BOARD_THEME.lightSquare
  const moveDotSize = squareSize * BOARD_THEME.moveDotScale
  const captureIndicatorSize = squareSize * BOARD_THEME.captureIndicatorScale

  const pieceToRender = isDragOrigin ? null : piece

  return (
    <View key={square} style={{ position: "relative" }}>
      {/* Render overlays above the square (e.g., decay timers) */}
      {overlays
        .filter((o) => o.position === "above")
        .map((overlay, idx) => (
          <View key={idx} style={{ position: "absolute", width: squareSize, left: 0, top: -24, zIndex: 10 }}>
            {overlay.content}
          </View>
        ))}

      <Pressable
        style={[
          variantStyles.square,
          customStyles.square,
          {
            width: squareSize,
            height: squareSize,
            backgroundColor: squareBackground,
            borderWidth,
            borderColor,
          },
        ]}
        delayPressIn={0}
        delayPressOut={0}
        onPressIn={() => {
          // Immediate response on press in (touchstart equivalent)
          if (onTouchStart) {
            const now = Date.now()
            // Prevent duplicate events within 50ms
            if (now - touchStartTimeRef.current > 50) {
              touchHandledRef.current = false
            }
            touchStartTimeRef.current = now
            
            if (!touchHandledRef.current) {
              touchHandledRef.current = true
              onTouchStart(square, null)
            }
          }
        }}
        onPress={() => {
          // Fallback if onTouchStart didn't handle it
          if (!touchHandledRef.current) {
            onPress(square)
          }
          // Reset after a short delay
          setTimeout(() => {
            touchHandledRef.current = false
          }, 100)
        }}
      >
        {/* Coordinate labels */}
        {file === "a" && (
          <Text
            style={[
              variantStyles.coordinateLabel,
              variantStyles.rankLabel,
              { color: coordinateColor, fontSize: coordinateFontSize },
            ]}
          >
            {rank}
          </Text>
        )}
        {rank === "1" && (
          <Text
            style={[
              variantStyles.coordinateLabel,
              variantStyles.fileLabel,
              { color: coordinateColor, fontSize: coordinateFontSize },
            ]}
          >
            {file}
          </Text>
        )}

        {/* Piece */}
        {pieceToRender && (
          <View style={customStyles.piece}>
            {getPieceComponent(pieceToRender, pieceSize)}
          </View>
        )}

        {/* Frozen indicator overlay - positioned top-right */}
        {frozenOverlay && frozenOverlay.content && (
          <View
            style={[
              variantStyles.frozenIndicator,
              {
                width: moveDotSize,
                height: moveDotSize,
                top: 2,
                right: 2,
              },
            ]}
          >
            {frozenOverlay.content}
          </View>
        )}

        {/* Move indicators */}
        {isPossibleMove && !piece && !frozenOverlay && (
          <View
            style={[
              variantStyles.possibleMoveDot,
              {
                width: moveDotSize,
                height: moveDotSize,
                borderRadius: moveDotSize / 2,
              },
            ]}
          />
        )}
        {isPossibleMove && piece && !frozenOverlay && (
          <View
            style={[
              variantStyles.captureIndicator,
              {
                width: captureIndicatorSize,
                height: captureIndicatorSize,
                borderRadius: captureIndicatorSize / 2,
              },
            ]}
          />
        )}
      </Pressable>
    </View>
  )
}
