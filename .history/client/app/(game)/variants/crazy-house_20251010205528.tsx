"use client"

import { useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { Alert, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native"
import type { Socket } from "socket.io-client"
import { getSocketInstance } from "../../../utils/socketManager"
import { getPieceComponent } from "../../components/game/chessPieces"
import { crazyHouseStyles } from "../../lib/styles/components/crazyHouse"
import { variantStyles } from "@/app/lib/styles"
import { usePreventEarlyExit } from "@/app/lib/hooks/usePreventEarlyExit"

// Define types for this component
import { GameStateType, Move, CrazyHouseChessGameProps, PocketPieceWithTimerType, availableDropPieceType } from "@/app/lib/types/crazyhouse"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

const screenWidth = Dimensions.get("window").width
const screenHeight = Dimensions.get("window").height
const isTablet = Math.min(screenWidth, screenHeight) > 600
const isSmallScreen = screenWidth < 380
const horizontalPadding = isSmallScreen ? 8 : isTablet ? 20 : 12
const baseBoardSize = screenWidth - horizontalPadding * 2
const coordinateFontSize = isSmallScreen ? 8 : 10
const pocketPieceSize = isSmallScreen ? 20 : isTablet ? 26 : 22
const promotionPieceSize = isSmallScreen ? 32 : isTablet ? 40 : 36

export default function CrazyHouseChessGame({ initialGameState, userId, onNavigateToMenu }: CrazyHouseChessGameProps) {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameStateType>(initialGameState)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<string[]>([])

  const [selectedPocketPiece, setSelectedPocketPiece] = useState<string | PocketPieceWithTimerType | null>(null)

  const [selectedPocket, setSelectedPocket] = useState<"white" | "black" | null>(null)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white")
  const [boardFlipped, setBoardFlipped] = useState(false)
  const [moveHistory, setMoveHistory] = useState<any[]>([])
  const [showMoveHistory, setShowMoveHistory] = useState(false)
  const [promotionModal, setPromotionModal] = useState<{
    visible: boolean
    from?: string
    to: string
    options: string[]
    drop?: boolean
    piece?: string
  } | null>(null)
  const [showGameEndModal, setShowGameEndModal] = useState(false)
  const [gameEndMessage, setGameEndMessage] = useState("")
  const [isWinner, setIsWinner] = useState<boolean | null>(null)
  const [localTimers, setLocalTimers] = useState<{ white: number; black: number }>({
    white: initialGameState.board.whiteTime, // Use board.whiteTime
    black: initialGameState.board.blackTime, // Use board.blackTime
  })
  const [localDropTimers, setLocalDropTimers] = useState<{ white: number | null; black: number | null }>({
    white: null,
    black: null,
  })
  const timerRef = useRef<any>(null)
  const navigationTimeoutRef = useRef<any>(null)
  const [boardDimension, setBoardDimension] = useState(baseBoardSize)

  const handleBoardLayout = (event: any) => {
    const availableHeight = event.nativeEvent.layout.height
    const newSize = Math.min(baseBoardSize, availableHeight)
    if (newSize > 0) {
      setBoardDimension((prev) => (Math.abs(prev - newSize) > 1 ? newSize : prev))
    }
  }

  const squareSize = boardDimension / 8

  usePreventEarlyExit({ socket, isGameActive: gameState.status === "active" })

  // Helper to convert plain object dropTimers to Map
  const getDropTimersMap = (
    dropTimers: GameStateType["board"]["dropTimers"] | GameStateType["gameState"]["dropTimers"],
    color: "white" | "black",
  ) => {
    const timers = dropTimers?.[color]
    return timers instanceof Map ? timers : new Map(Object.entries(timers || {}))
  }

  useEffect(() => {
    const gameSocket = getSocketInstance()
    if (gameSocket) {
      setSocket(gameSocket)
    } else {
      Alert.alert("Connection Error", "Failed to connect to game socket. Please try again.")
      return
    }

    const userColor = initialGameState.userColor[userId]
    setPlayerColor(userColor === "white" || userColor === "black" ? userColor : "white")
    setBoardFlipped(userColor === "black")
    setIsMyTurn(initialGameState.board.activeColor === userColor)
    setMoveHistory(initialGameState.moves || []) // Initialize move history

    // Initialize local drop timers if it's a withTimer variant
    if (initialGameState.subvariantName === "withTimer") {
      const activeColor = initialGameState.board.activeColor
      const pocket = initialGameState.board.pocketedPieces[activeColor] as PocketPieceWithTimerType[]
      // Prioritize dropTimers from initialGameState.gameState if available, otherwise from board
      const sourceDropTimers = initialGameState.gameState?.dropTimers || initialGameState.board.dropTimers
      const dropTimersMap = getDropTimersMap(sourceDropTimers, activeColor)

      if (pocket.length > 0) {
        const firstPiece = pocket[0]
        let expirationTimestamp = firstPiece.id ? dropTimersMap.get(firstPiece.id) : undefined
        // If timer is not in the active map, check if it's paused on the piece itself
        if (
          !expirationTimestamp &&
          (firstPiece as availableDropPieceType).timerPaused &&
          (firstPiece as availableDropPieceType).remainingTime !== undefined
        ) {
          expirationTimestamp = Date.now() + ((firstPiece as availableDropPieceType).remainingTime ?? 0) // Calculate effective expiration
        }

        if (expirationTimestamp) {
          const remaining = expirationTimestamp - Date.now()
          setLocalDropTimers((prev) => ({
            ...prev,
            [activeColor]: Math.max(0, remaining),
          }))
        }
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on("game:move", handleGameMove)
    socket.on("game:possibleMoves", handlePossibleMoves)
    socket.on("game:gameState", handleGameStateUpdate)
    socket.on("game:timer", handleTimerUpdate)
    socket.on("game:end", handleGameEndEvent)
    socket.on("game:error", handleGameError)
    socket.on("game:warning", handleGameWarning)

    return () => {
      socket.off("game:move", handleGameMove)
      socket.off("game:possibleMoves", handlePossibleMoves)
      socket.off("game:gameState", handleGameStateUpdate)
      socket.off("game:timer", handleTimerUpdate)
      socket.off("game:end", handleGameEndEvent)
      socket.off("game:error", handleGameError)
      socket.off("game:warning", handleGameWarning)
    }
  }, [socket, playerColor])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    // Only start timer if game is active, not ended, and board is initialized
    if (gameState.status === "active" && !gameState.board.gameEnded && gameState.board && gameState.board.activeColor) {
      timerRef.current = setInterval(() => {
        setLocalTimers((prevMainTimers) => {
          const activeColor = gameState.board.activeColor
          const now = Date.now()
          const BASE_TIME = 3 * 60 * 1000 // 3 minutes in milliseconds
          let newWhite = prevMainTimers.white
          let newBlack = prevMainTimers.black
          // Always tick for active player
          if (activeColor === "white") {
            newWhite = Math.max(0, newWhite - 100)
            newBlack = prevMainTimers.black
          } else {
            newBlack = Math.max(0, newBlack - 100)
            newWhite = prevMainTimers.white
          }
          // Clamp timers so they never exceed base time
          newWhite = Math.min(newWhite, BASE_TIME)
          newBlack = Math.min(newBlack, BASE_TIME)
          // Drop timer updates
          if (gameState.subvariantName === "withTimer") {
            setLocalDropTimers((prevDropTimers) => {
              const newDropTimers = { 
                white: prevDropTimers.white, 
                black: prevDropTimers.black 
              }
              // Only update timer for active player
              if (activeColor === "white" || activeColor === "black") {
                const currentActivePlayerPocket =
                  (gameState.board.pocketedPieces[activeColor] as PocketPieceWithTimerType[]) || []
                const currentActivePlayerDropTimersMap = getDropTimersMap(gameState.board.dropTimers, activeColor)
                if (currentActivePlayerPocket.length > 0) {
                  const firstPiece = currentActivePlayerPocket[0]
                  let expirationTimestamp = firstPiece.id ? currentActivePlayerDropTimersMap.get(firstPiece.id) : undefined
                  // If timer is not in the active map, check if it's paused on the piece itself
                  if (
                    !expirationTimestamp &&
                    (firstPiece as availableDropPieceType).timerPaused &&
                    (firstPiece as availableDropPieceType).remainingTime !== undefined
                  ) {
                    expirationTimestamp = firstPiece && (now + ((firstPiece as availableDropPieceType).remainingTime ?? 0))
                  }
                  if (expirationTimestamp) {
                    const remaining = expirationTimestamp - now
                    newDropTimers[activeColor] = Math.max(0, remaining)
                  }
                }
              }
              return { ...prevDropTimers, ...newDropTimers }
            })
          } else {
            setLocalDropTimers({ white: null, black: null })
          }
          return { white: newWhite, black: newBlack }
        })
      }, 100)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [
    gameState.status,
    gameState.board.activeColor,
    gameState.board.whiteTime,
    gameState.board.blackTime,
    gameState.board.gameEnded,
    gameState.subvariantName,
    gameState.board.pocketedPieces,
    gameState.board.dropTimers,
  ])

  // Socket handlers
  function handleGameMove(data: any) {
    if (data && data.gameState) {
      console.log("Game move received:", data.gameState)
      setGameState((prevState) => {
        const newState = {
          ...prevState,
          ...data.gameState, // Merges top-level properties
          board: {
            ...prevState.board,
            ...data.gameState.board, // Merges board properties, including board.frozenPieces (expired ones)
            dropTimers: data.gameState.gameState?.dropTimers || data.gameState.board.dropTimers,
          },
          gameState: {
            // Ensure the nested gameState is updated with its specific properties
            ...prevState.gameState,
            ...data.gameState.gameState, // This will correctly update gameState.frozenPieces with the *derived* ones
          },
          // Ensure timeControl.timers are updated if they are the source of truth
          // Otherwise, board.whiteTime/blackTime should be used directly
          timeControl: {
            ...prevState.timeControl,
            ...data.gameState.timeControl,
            timers: {
              white: data.gameState.board?.whiteTime ?? prevState.timeControl.timers.white,
              black: data.gameState.board?.blackTime ?? prevState.timeControl.timers.black,
            },
          },
          moves: data.gameState.moves || [],
          lastMove: data.gameState.lastMove,
          moveCount: data.gameState.moveCount,
        }
        // Re-hydrate dropTimers Maps if they come as plain objects (only for withTimer)
        if (newState.subvariantName === "withTimer" && newState.board.dropTimers) {
          newState.board.dropTimers.white = getDropTimersMap(newState.board.dropTimers, "white")
          newState.board.dropTimers.black = getDropTimersMap(newState.board.dropTimers, "black")
        }

        // Update local drop timers immediately based on new state
        if (newState.subvariantName === "withTimer") {
          const activeColor = newState.board.activeColor
          const pocket = newState.board.pocketedPieces[activeColor] as PocketPieceWithTimerType[]
          const dropTimersMap = getDropTimersMap(newState.board.dropTimers, activeColor)
          const now = Date.now()
          setLocalDropTimers((prev) => {
            const newDropTimers: { white: number | null; black: number | null } = { white: null, black: null } // Reset both
            if (pocket.length > 0) {
              const firstPiece = pocket[0]
              let expirationTimestamp = firstPiece.id ? dropTimersMap.get(firstPiece.id) : undefined
              // If timer is not in the active map, check if it's paused on the piece itself
              if (
                !expirationTimestamp &&
                (firstPiece as availableDropPieceType).timerPaused &&
                (firstPiece as availableDropPieceType).remainingTime !== undefined
              ) {
                expirationTimestamp = now + ((firstPiece as availableDropPieceType).remainingTime ?? 0) // Calculate effective expiration
              }
              if (expirationTimestamp !== undefined && expirationTimestamp !== null) {
                newDropTimers[activeColor as "white" | "black"] = Math.max(0, expirationTimestamp - now)
              } else {
                newDropTimers[activeColor as "white" | "black"] = null
              }
            }
            return newDropTimers
          })
        } else {
          setLocalDropTimers({ white: null, black: null })
        }

        // Update local main timers based on the new board state
        setLocalTimers({
          white: newState.board.whiteTime,
          black: newState.board.blackTime,
        })
        return newState
      })
      setMoveHistory(data.gameState.moves || [])
      setSelectedSquare(null)
      setPossibleMoves([])
      setSelectedPocketPiece(null)
      const userColor = data.gameState.userColor ? data.gameState.userColor[userId] : playerColor
      setIsMyTurn(data.gameState.board.activeColor === userColor)
    }
  }

  function handlePossibleMoves(data: { square: string; moves: any[] }) {
    let moves: string[] = []
    if (Array.isArray(data.moves) && data.moves.length > 0) {
      if (typeof data.moves[0] === "object" && data.moves[0].to) {
        moves = data.moves.map((m: any) => m.to)
      } else if (typeof data.moves[0] === "string") {
        moves = data.moves
      }
    }
    setPossibleMoves(moves)
  }

  function handleGameStateUpdate(data: any) {
    if (data && data.gameState) {
      setGameState((prevState) => {
        const newState = {
          ...prevState,
          ...data.gameState,
          board: {
            ...prevState.board,
            ...data.gameState.board, // Merges board properties, including board.frozenPieces (expired ones)
            dropTimers: data.gameState.gameState?.dropTimers || data.gameState.board.dropTimers,
          },
          gameState: {
            // Ensure the nested gameState is updated with its specific properties
            ...prevState.gameState,
            ...data.gameState.gameState, // This will correctly update gameState.frozenPieces with the *derived* ones
          },
          timeControl: {
            ...prevState.timeControl,
            ...data.gameState.timeControl,
            timers: {
              white: data.gameState.board?.whiteTime ?? prevState.timeControl.timers.white,
              black: data.gameState.board?.blackTime ?? prevState.timeControl.timers.black,
            },
          },
        }
        // Re-hydrate dropTimers Maps if they come as plain objects (only for withTimer)
        if (newState.subvariantName === "withTimer" && newState.board.dropTimers) {
          newState.board.dropTimers.white = getDropTimersMap(newState.board.dropTimers, "white")
          newState.board.dropTimers.black = getDropTimersMap(newState.board.dropTimers, "black")
        }

        // Update local drop timers immediately based on new state
        if (newState.subvariantName === "withTimer") {
          const activeColor = newState.board.activeColor
          const pocket = newState.board.pocketedPieces[activeColor] as PocketPieceWithTimerType[]
          const dropTimersMap = getDropTimersMap(newState.board.dropTimers, activeColor)
          const now = Date.now()
          setLocalDropTimers((prev) => {
            const newDropTimers: { white: number | null; black: number | null } = { white: null, black: null } // Reset both
            if (pocket.length > 0) {
              const firstPiece = pocket[0]
              let expirationTimestamp = firstPiece.id ? dropTimersMap.get(firstPiece.id) : undefined
              // If timer is not in the active map, check if it's paused on the piece itself
              if (
                !expirationTimestamp &&
                (firstPiece as availableDropPieceType).timerPaused &&
                (firstPiece as availableDropPieceType).remainingTime !== undefined
              ) {
                expirationTimestamp = now + ((firstPiece as availableDropPieceType).remainingTime ?? 0) // Calculate effective expiration
              }
              if (expirationTimestamp !== undefined && expirationTimestamp !== null) {
                newDropTimers[activeColor as "white" | "black"] = Math.max(0, expirationTimestamp - now)
              } else {
                newDropTimers[activeColor as "white" | "black"] = null
              }
            }
            return newDropTimers
          })
        } else {
          setLocalDropTimers({ white: null, black: null })
        }
        // Update local main timers based on the new board state
        setLocalTimers({
          white: newState.board.whiteTime,
          black: newState.board.blackTime,
        })
        return newState
      })
      setIsMyTurn(data.gameState.board.activeColor === playerColor)
    }
  }

  function handleTimerUpdate(data: any) {
    // This handler is for the main game timers only, drop timers are handled by game:move/gameState
    const whiteTime = data.white ?? localTimers.white
    const blackTime = data.black ?? localTimers.black
    setLocalTimers({ white: whiteTime, black: blackTime })
  }

  function handleGameEndEvent(data: any) {
    const result = data.gameState?.gameState?.result || data.gameState?.result || data.winner || "unknown"
    const winner = data.gameState?.gameState?.winner || data.gameState?.winner || data.winner
    setIsWinner(winner === playerColor ? true : winner ? false : null)
    setGameEndMessage(result)
    setShowGameEndModal(true)

    setTimeout(() => {
      if (socket) socket.disconnect()
      setSocket(null)
    }, 1000)

    navigationTimeoutRef.current = setTimeout(() => {
      setShowGameEndModal(false)
      if (onNavigateToMenu) onNavigateToMenu()
      router.replace("/choose")
    }, 5000)
  }

  const navigateToMenu = () => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
    }
    setShowGameEndModal(false)
    if (onNavigateToMenu) onNavigateToMenu()
    router.replace("/choose")
  }

  function handleGameError(data: any) {
    Alert.alert("Error", data.message || data.error || "An error occurred")
    // Keep turn active on error
    setIsMyTurn(true)
    setSelectedSquare(null)
    setPossibleMoves([])
    setSelectedPocketPiece(null)
    setSelectedPocket(null)
  }

  function handleGameWarning(data: any) {
    Alert.alert("Warning", data?.message || "Warning: Invalid move or rule violation.")
    // Continue game and allow player to make another move
    const userColor = gameState.userColor[userId]
    setIsMyTurn(gameState.board.activeColor === userColor) // Re-evaluate based on current activeColor
    setSelectedSquare(null)
    setPossibleMoves([])
    setSelectedPocketPiece(null)
    setSelectedPocket(null)
  }

  // Move logic
  function requestPossibleMoves(square: string) {
    if (!socket) return
    socket.emit("game:getPossibleMoves", { square })
  }

  function makeMove(move: Move) {
    if (!socket || !isMyTurn) return

    setIsMyTurn(false)
    setSelectedSquare(null)
    setPossibleMoves([])
    setSelectedPocketPiece(null)
    socket.emit("game:makeMove", { move, timestamp: Date.now() })
  }

  function handleSquarePress(square: string) {
    if (selectedPocketPiece && isMyTurn && selectedPocket === playerColor) {
      const pieceAtTarget = getPieceAt(square)
      if (!pieceAtTarget) {
        let pieceToDrop: string
        let pieceId: string | undefined

        if (gameState.subvariantName === "withTimer") {
          // Only allow drop for availableDropPieces
          const availableDropPieces = gameState.board.availableDropPieces?.[playerColor] || []
          const selectedPieceObj = availableDropPieces.find((p) => p.id === (selectedPocketPiece as any).id)

          if (!selectedPieceObj || !selectedPieceObj.canDrop) {
            Alert.alert("Invalid Drop", "This piece is not currently available for drop or its timer has expired.")
            setSelectedPocketPiece(null)
            setSelectedPocket(null)
            setSelectedSquare(null)
            setPossibleMoves([])
            return
          }
          pieceToDrop = selectedPieceObj.type
          pieceId = selectedPieceObj.id
        } else {
          // For standard, selectedPocketPiece is just the piece type string
          pieceToDrop = selectedPocketPiece as string
        }
        // Pass pieceId for withTimer variant
        makeMove({ to: square, piece: pieceToDrop, drop: true, ...(pieceId ? { id: pieceId } : {}) })
      } else {
        Alert.alert("Invalid Drop", "You can only drop a piece on an empty square.")
      }
      setSelectedPocketPiece(null)
      setSelectedPocket(null)
      setSelectedSquare(null)
      setPossibleMoves([])
      return
    }

    if (selectedSquare === square) {
      setSelectedSquare(null)
      setPossibleMoves([])
      return
    }

    if (selectedSquare && possibleMoves.includes(square)) {
      // Promotion check
      const piece = getPieceAt(selectedSquare)
      const isPromotion =
        piece &&
        ((piece.toLowerCase() === "p" && playerColor === "white" && square[1] === "8") ||
          (piece.toLowerCase() === "p" && playerColor === "black" && square[1] === "1"))

      if (isPromotion) {
        setPromotionModal({ visible: true, from: selectedSquare, to: square, options: ["q", "r", "b", "n"] })
        return
      }

      makeMove({ from: selectedSquare, to: square })
      setPromotionModal(null)
      setSelectedSquare(null)
      setPossibleMoves([])
      return
    }

    const piece = getPieceAt(square)
    if (isMyTurn && piece && isPieceOwnedByPlayer(piece, playerColor)) {
      setSelectedSquare(square)
      requestPossibleMoves(square)
    } else {
      setSelectedSquare(null)
      setPossibleMoves([])
    }
  }

  function handlePromotionSelect(promotion: string) {
    if (promotionModal) {
      if (promotionModal.drop && promotionModal.piece) {
        makeMove({ to: promotionModal.to, piece: promotionModal.piece, drop: true, promotion })
      } else {
        makeMove({ from: promotionModal.from, to: promotionModal.to, promotion })
      }
      setPromotionModal(null)
      setSelectedSquare(null)
      setPossibleMoves([])
    }
  }

  function getPieceAt(square: string): string | null {
    const fileIndex = FILES.indexOf(square[0])
    const rankIndex = RANKS.indexOf(square[1])
    if (fileIndex === -1 || rankIndex === -1) return null

    const fen = gameState.board.fen || gameState.board.position
    if (!fen) return null

    const piecePlacement = fen.split(" ")[0]
    const rows = piecePlacement.split("/")
    if (rows.length !== 8) return null

    const row = rows[rankIndex]
    let col = 0
    for (let i = 0; i < row.length; i++) {
      const c = row[i]
      if (c >= "1" && c <= "8") {
        col += Number.parseInt(c)
      } else {
        if (col === fileIndex) return c
        col++
      }
    }
    return null
  }

  function isPieceOwnedByPlayer(piece: string, color: "white" | "black"): boolean {
    return color === "white" ? piece === piece.toUpperCase() : piece === piece.toLowerCase()
  }

  function formatTime(milliseconds: number): string {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) return "0:00"
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Update the formatDropTime function to only show seconds
  function formatDropTime(milliseconds: number): string {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) return "0"
    const seconds = Math.floor(milliseconds / 1000)
    return `${seconds}`
  }

  // Pocket panel
  function renderPocketPanel(color: "white" | "black", isBottomPanel: boolean) {
    const isMyTurnForPocket = gameState.board.activeColor === color && isMyTurn

    if (gameState.subvariantName === "withTimer") {
      // Get all pieces in the pocket
      const pocket = (gameState.board.pocketedPieces[color] || []) as PocketPieceWithTimerType[]
      // Get available/droppable pieces for reference
      const availableDropPieces = gameState.board.availableDropPieces?.[color] || []
      // Get drop timers map
      const dropTimersMap = getDropTimersMap(gameState.board.dropTimers, color)

      return (
        <View
          style={[
            crazyHouseStyles.pocketPanel,
            { alignSelf: "stretch" },
            isBottomPanel ? { marginBottom: isSmallScreen ? 24 : 32 } : null,
          ]}
        >
          <Text style={crazyHouseStyles.pocketLabel}>{color === "white" ? "White Pocket" : "Black Pocket"}</Text>
          <View style={crazyHouseStyles.pocketSectionsContainer}>
            {/* All pocket pieces section */}
            <View style={crazyHouseStyles.droppablePieceSection}>
              {pocket.length > 0 ? (
                pocket.map((piece) => {
                  const isDroppable = availableDropPieces.some(p => p.id === piece.id && p.canDrop)
                  const expirationTimestamp = piece.id ? dropTimersMap.get(piece.id) : undefined
                  const remaining = expirationTimestamp ? expirationTimestamp - Date.now() : null
                  
                  return (
                    <TouchableOpacity
                      key={piece.id}
                      style={[
                        crazyHouseStyles.pocketPiece,
                        (selectedPocketPiece as any)?.id === piece.id && selectedPocket === color
                          ? crazyHouseStyles.selectedPocketPiece
                          : null,
                        !isDroppable && crazyHouseStyles.nonDroppablePiece,
                        // Add warning styles for urgency
                        remaining !== null && remaining <= 5000 ? crazyHouseStyles.pocketPieceWarning : null,
                      ]}
                      onPress={() => {
                        if (isDroppable && isMyTurnForPocket) {
                          setSelectedPocketPiece(piece)
                          setSelectedPocket(color)
                        }
                      }}
                      disabled={!isMyTurnForPocket || !isDroppable}
                    >
                      {typeof piece.type === "string" && getPieceComponent(piece.type, pocketPieceSize)}
                      {remaining !== null && (
                        <View style={crazyHouseStyles.dropTimerOverlay}>
                          <Text style={crazyHouseStyles.dropTimerValueText}>
                            {formatDropTime(Math.max(0, remaining))}
                          </Text>
                        </View>
                      )}
                      {!isDroppable && (
                        <View style={crazyHouseStyles.frozenSignOverlay}>
                          <Text style={crazyHouseStyles.frozenSignText}>❄️</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                })
              ) : (
                <View style={crazyHouseStyles.emptyPocketSection}>
                  <Text style={crazyHouseStyles.noPieceText}>No pieces in pocket</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )
    } else {
      // Standard Crazyhouse variant (pocketedPieces are strings)
      const pocket = gameState.board.pocketedPieces[color] || []
      const pieceCounts: { [key: string]: number } = {}
      pocket.forEach((piece) => {
        let pieceType: string
        if (typeof piece === "string") {
          pieceType = piece
        } else if ("type" in piece && typeof piece.type === "string") {
          pieceType = piece.type
        } else {
          pieceType = ""
        }
        if (pieceType) {
          pieceCounts[pieceType] = (pieceCounts[pieceType] || 0) + 1
        }
      })

      return (
        <View
          style={[
            crazyHouseStyles.pocketPanel,
            { alignSelf: "stretch" },
            isBottomPanel ? { marginBottom: isSmallScreen ? 24 : 32 } : null,
          ]}
        >
          <Text style={crazyHouseStyles.pocketLabel}>{color === "white" ? "White Pocket" : "Black Pocket"}</Text>
          <View style={crazyHouseStyles.pocketPieces}>
            {Object.entries(pieceCounts).map(([pieceType, count]) => (
              <TouchableOpacity
                key={pieceType}
                style={[
                  crazyHouseStyles.pocketPiece,
                  selectedPocketPiece === pieceType && selectedPocket === color ? crazyHouseStyles.selectedPocketPiece : null,
                ]}
                onPress={() => {
                  setSelectedPocketPiece(pieceType)
                  setSelectedPocket(color)
                }}
                disabled={!isMyTurnForPocket}
              >

                {getPieceComponent(pieceType, pocketPieceSize)}

                {count > 1 && <Text style={crazyHouseStyles.pocketCount}>x{count}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )
    }
  }

  // Board rendering
  function renderSquare(file: string, rank: string) {
    const square = `${file}${rank}`
    const isLight = (FILES.indexOf(file) + Number.parseInt(rank)) % 2 === 0
    const isSelected = selectedSquare === square
    const isPossibleMove = possibleMoves.includes(square)
    const piece = getPieceAt(square)

    let lastMoveObj = null
    if (gameState.board && Array.isArray(gameState.board.moveHistory) && gameState.board.moveHistory.length > 0) {
      lastMoveObj = gameState.board.moveHistory[gameState.board.moveHistory.length - 1]
    } else if (
      gameState.lastMove &&
      typeof gameState.lastMove === "object" &&
      gameState.lastMove.from &&
      gameState.lastMove.to
    ) {
      lastMoveObj = gameState.lastMove
    }

    let isLastMove = false
    if (lastMoveObj && lastMoveObj.from && lastMoveObj.to) {
      isLastMove = lastMoveObj.from === square || lastMoveObj.to === square
    }

    let borderColor = "transparent"
    let borderWidth = 0

    if (isPossibleMove && piece) {
      borderColor = "#dc2626"
      borderWidth = 2
    } else if (isPossibleMove) {
      borderColor = "#16a34a"
      borderWidth = 2
    } else if (isSelected) {
      borderColor = "#2563eb"
      borderWidth = 2
    } else if (isLastMove) {
      borderColor = "#f59e0b"
      borderWidth = 1
    }

    return (
      <View key={square} style={{ position: "relative" }}>
        <TouchableOpacity
          style={[
            variantStyles.square,
            {
              width: squareSize,
              height: squareSize,
              backgroundColor: isLight ? "#F0D9B5" : "#769656",
              borderWidth,
              borderColor,
            },
          ]}
          onPress={() => handleSquarePress(square)}
        >
          {file === "a" && (
            <Text
              style={[
                variantStyles.coordinateLabel,
                variantStyles.rankLabel,
                { color: isLight ? "#769656" : "#F0D9B5", fontSize: coordinateFontSize },
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
                { color: isLight ? "#769656" : "#F0D9B5", fontSize: coordinateFontSize },
              ]}
            >
              {file}
            </Text>
          )}

          {piece && getPieceComponent(piece, squareSize * 0.8)}

          {isPossibleMove && !piece && (
            <View
              style={[
                variantStyles.possibleMoveDot,
                {
                  width: squareSize * 0.25,
                  height: squareSize * 0.25,
                  borderRadius: squareSize * 0.125,
                },
              ]}
            />
          )}
          {isPossibleMove && piece && (
            <View
              style={[
                variantStyles.captureIndicator,
                {
                  width: squareSize * 0.3,
                  height: squareSize * 0.3,
                  borderRadius: squareSize * 0.15,
                },
              ]}
            />
          )}
        </TouchableOpacity>
      </View>
    )
  }

  function renderBoard() {
    const files = boardFlipped ? [...FILES].reverse() : FILES
    const ranks = boardFlipped ? [...RANKS].reverse() : RANKS

    return (
      <View style={[variantStyles.boardContainer, { width: boardDimension, height: boardDimension }]}>
        <View
          style={[
            variantStyles.board,
            {
              width: boardDimension,
              height: boardDimension,
            },
          ]}
        >
          {ranks.map((rank) => (
            <View key={rank} style={variantStyles.row}>
              {files.map((file) => renderSquare(file, rank))}
            </View>
          ))}
        </View>
      </View>
    )
  }

  // Player info
  function renderPlayerInfo(color: "white" | "black", isTop: boolean) {
    const player = gameState.players[color]
    if (!player) {
      return (
        <View style={variantStyles.playerInfoContainer}>
          <Text style={variantStyles.playerName}>Unknown Player</Text>
        </View>
      )
    }

    const timer = localTimers[color]
    const isActivePlayer = gameState.board.activeColor === color && gameState.status === "active"
    const isMe = playerColor === color

    return (
      <View
        style={[
          variantStyles.playerInfoContainer,
          isActivePlayer && variantStyles.activePlayerContainer,
          isTop ? { marginBottom: isSmallScreen ? 12 : 16 } : { marginBottom: isSmallScreen ? 28 : 36 },
        ]}
      >
        <View style={variantStyles.playerHeader}>
          <View style={variantStyles.playerDetails}>
            <View style={variantStyles.playerNameRow}>
              <View style={variantStyles.playerAvatar}>
                <Text style={variantStyles.playerAvatarText}>{player.username.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={variantStyles.playerNameContainer}>
                <Text style={[variantStyles.playerName, isActivePlayer && variantStyles.activePlayerName]} numberOfLines={1}>
                  {player.username}
                </Text>
                <Text style={variantStyles.playerRating}>({player.rating > 0 ? player.rating : "Unrated"})</Text>
              </View>
              {isMe && <Text style={variantStyles.youIndicator}>(You)</Text>}
            </View>
          </View>
          <View style={[variantStyles.timerContainer, isActivePlayer && variantStyles.activeTimerContainer]}>
            <Text style={[variantStyles.timerText, isActivePlayer && variantStyles.activeTimerText]}>{formatTime(timer)}</Text>
          </View>
        </View>
      </View>
    )
  }

  // Move history modal
  function renderMoveHistory() {
    if (!showMoveHistory) return null

    const moves = moveHistory

    return (
      <Modal visible={showMoveHistory} transparent animationType="slide">
        <View style={variantStyles.modalOverlay}>
          <View style={variantStyles.moveHistoryModal}>
            <View style={variantStyles.moveHistoryHeader}>
              <Text style={variantStyles.moveHistoryTitle}>📜 Move History</Text>
              <TouchableOpacity onPress={() => setShowMoveHistory(false)} style={variantStyles.closeButton}>
                <Text style={variantStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={variantStyles.moveHistoryScroll}>
              {moves.map((move, idx) => (
                <View key={idx} style={variantStyles.moveRow}>
                  <Text style={variantStyles.moveNumber}>{idx + 1}.</Text>
                  <Text style={variantStyles.moveText}>{move.san || `${move.from || ""}-${move.to || ""}`}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  }

  // Promotion modal
  function renderPromotionModal() {
    if (!promotionModal || !promotionModal.visible) return null

    return (
      <Modal visible={promotionModal.visible} transparent animationType="slide">
        <View style={variantStyles.modalOverlay}>
          <View style={variantStyles.promotionModal}>
            <Text style={variantStyles.promotionTitle}>Choose Promotion</Text>
            <View style={variantStyles.promotionOptions}>
              {promotionModal.options.map((p) => (
                <TouchableOpacity key={p} style={variantStyles.promotionOption} onPress={() => handlePromotionSelect(p)}>
                  {getPieceComponent(
                    playerColor === "white" ? p.toUpperCase() : p.toLowerCase(),
                    promotionPieceSize,
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[variantStyles.menuButton, { backgroundColor: "#4a4a4a", marginTop: 16 }]}
              onPress={() => setPromotionModal(null)}
            >
              <Text style={variantStyles.menuButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  // Game end modal
  function renderGameEndModal() {
    if (!showGameEndModal) return null

    return (
      <Modal visible={showGameEndModal} transparent animationType="slide">
        <View style={variantStyles.modalOverlay}>
          <View
            style={[
              variantStyles.gameEndModal,
              isWinner === true && variantStyles.victoryModal,
              isWinner === false && variantStyles.defeatModal,
            ]}
          >
            <Text
              style={[
                variantStyles.gameEndTitle,
                isWinner === true && variantStyles.victoryTitle,
                isWinner === false && variantStyles.defeatTitle,
              ]}
            >
              {isWinner === true ? "🎉 VICTORY! 🎉" : isWinner === false ? "😔 DEFEAT 😔" : "🏁 GAME OVER 🏁"}
            </Text>
            <Text style={variantStyles.gameEndMessage}>{gameEndMessage}</Text>
            <TouchableOpacity style={variantStyles.menuButton} onPress={navigateToMenu}>
              <Text style={variantStyles.menuButtonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  // Flip board
  function handleFlipBoard() {
    setBoardFlipped(!boardFlipped)
  }

  const opponentColor = playerColor === "white" ? "black" : "white"

  return (
    <View style={variantStyles.container}>
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        <View>
          {renderPlayerInfo(opponentColor, true)}
          {renderPocketPanel(opponentColor, false)}
        </View>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }} onLayout={handleBoardLayout}>
          {renderBoard()}
        </View>

        <View style={{ marginBottom: isSmallScreen ? 8 : 12 }}>
          {renderPocketPanel(playerColor, true)}
          {renderPlayerInfo(playerColor, false)}
        </View>
      </View>

      <View style={variantStyles.bottomBar}>
        <TouchableOpacity style={variantStyles.bottomBarButton} onPress={() => setShowMoveHistory(true)}>
          <Text style={variantStyles.bottomBarIcon}>≡</Text>
          <Text style={variantStyles.bottomBarLabel}>Moves</Text>
        </TouchableOpacity>
        <TouchableOpacity style={variantStyles.bottomBarButton} onPress={handleFlipBoard}>
          <Text style={variantStyles.bottomBarIcon}>⟲</Text>
          <Text style={variantStyles.bottomBarLabel}>Flip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={variantStyles.bottomBarButton}
          onPress={() => {
            if (socket && gameState.status === "active") socket.emit("game:resign")
          }}
        >
          <Text style={variantStyles.bottomBarIcon}>✕</Text>
          <Text style={variantStyles.bottomBarLabel}>Resign</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={variantStyles.bottomBarButton}
          onPress={() => {
            if (socket && gameState.status === "active") socket.emit("game:offerDraw")
          }}
        >
          <Text style={variantStyles.bottomBarIcon}>½</Text>
          <Text style={variantStyles.bottomBarLabel}>Draw</Text>
        </TouchableOpacity>
      </View>

      {renderMoveHistory()}
      {renderGameEndModal()}
      {renderPromotionModal()}
    </View>
  )
}
