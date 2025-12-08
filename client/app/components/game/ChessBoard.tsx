import React, { useMemo } from "react"
import { View, PanResponder } from "react-native"
import { getPieceComponent } from "./chessPieces"
import { ChessSquare, SquareOverlay } from "./ChessSquare"
import { variantStyles } from "@/app/lib/styles"
import { BOARD_THEME } from "@/app/lib/constants/boardTheme"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

export interface DragState {
  active: boolean
  from: string | null
  piece: string | null
  x: number
  y: number
}

export interface ChessBoardProps {
  boardSize: number
  squareSize: number
  coordinateFontSize: number
  pieceSize: number
  boardFlipped: boolean
  selectedSquare: string | null
  possibleMoves: string[]
  dragState: DragState
  dragTargetSquare: string | null
  lastMove: { from: string; to: string } | null
  getPieceAt: (square: string) => string | null
  onSquarePress: (square: string) => void
  onSquareTouchStart?: (square: string, event: any) => void
  getSquareOverlays?: (file: string, rank: string, square: string, piece: string | null) => SquareOverlay[]
  panResponder?: PanResponder.PanResponderInstance
  customSquareStyles?: (square: string) => { square?: any; piece?: any }
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  boardSize,
  squareSize,
  coordinateFontSize,
  pieceSize,
  boardFlipped,
  selectedSquare,
  possibleMoves,
  dragState,
  dragTargetSquare,
  lastMove,
  getPieceAt,
  onSquarePress,
  onSquareTouchStart,
  getSquareOverlays,
  panResponder,
  customSquareStyles,
}) => {
  const files = useMemo(() => (boardFlipped ? [...FILES].reverse() : FILES), [boardFlipped])
  const ranks = useMemo(() => (boardFlipped ? [...RANKS].reverse() : RANKS), [boardFlipped])

  const renderSquare = (file: string, rank: string) => {
    const square = `${file}${rank}`
    const isLight = (FILES.indexOf(file) + Number.parseInt(rank)) % 2 === 0
    const isSelected = selectedSquare === square
    const isPossibleMove = possibleMoves.includes(square)
    const piece = getPieceAt(square)
    const isDragOrigin = dragState.active && dragState.from === square

    // Check for last move highlighting
    let isLastMove = false
    if (lastMove && lastMove.from && lastMove.to) {
      isLastMove = lastMove.from === square || lastMove.to === square
    }

    const overlays = getSquareOverlays ? getSquareOverlays(file, rank, square, piece) : []
    const customStyles = customSquareStyles ? customSquareStyles(square) : {}

    return (
      <ChessSquare
        key={square}
        file={file}
        rank={rank}
        square={square}
        piece={piece}
        isLight={isLight}
        isSelected={isSelected}
        isPossibleMove={isPossibleMove}
        isLastMove={isLastMove}
        isDragOrigin={isDragOrigin}
        isDragTarget={dragState.active && dragTargetSquare === square}
        squareSize={squareSize}
        coordinateFontSize={coordinateFontSize}
        pieceSize={pieceSize}
        onPress={onSquarePress}
        onTouchStart={onSquareTouchStart}
        overlays={overlays}
        customStyles={customStyles}
      />
    )
  }

  return (
    <View style={variantStyles.boardContainer}>
      <View
        style={{ width: boardSize, height: boardSize, position: "relative" }}
        {...(panResponder?.panHandlers || {})}
      >
        <View style={variantStyles.board}>
          {ranks.map((rank) => (
            <View key={rank} style={variantStyles.row}>
              {files.map((file) => renderSquare(file, rank))}
            </View>
          ))}
        </View>
        {dragState.active && dragState.piece && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: dragState.x - squareSize / 2,
              top: dragState.y - squareSize / 2,
              width: squareSize,
              height: squareSize,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {getPieceComponent(dragState.piece, pieceSize)}
          </View>
        )}
      </View>
    </View>
  )
}

