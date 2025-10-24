"use client"

import { getPieceComponent } from "@/app/components"
import { getSocketInstance } from "@/utils/socketManager"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Alert, Dimensions, Modal, PanResponder, ScrollView, Text, TouchableOpacity, View } from "react-native"
import type { Socket } from "socket.io-client"
import { sixPointerStyles, variantStyles } from "@/app/lib/styles"
import { BOARD_THEME } from "@/app/lib/constants/boardTheme"
import { usePreventEarlyExit } from "@/app/lib/hooks/usePreventEarlyExit"
import type { Move, GameState, SixPointerChessGameProps } from "@/app/lib/types/sixpointer"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

const screenWidth = Dimensions.get("window").width
const screenHeight = Dimensions.get("window").height
const isTablet = Math.min(screenWidth, screenHeight) > 600
const isSmallScreen = screenWidth < 380
const horizontalPadding = isSmallScreen ? 8 : isTablet ? 20 : 12
const boardSize = screenWidth - horizontalPadding * 2
const squareSize = boardSize / 8
const capturedPieceSize = isSmallScreen ? 16 : 18
const coordinateFontSize = isSmallScreen ? 8 : 10
const promotionPieceSize = isSmallScreen ? 32 : isTablet ? 40 : 36

type DragState = {
  active: boolean
  from: string | null
  piece: string | null
  x: number
  y: number
}

const INITIAL_DRAG_STATE: DragState = {
  active: false,
  from: null,
  piece: null,
  x: 0,
  y: 0,
}

export default function SixPointerChessGame({ initialGameState, userId, onNavigateToMenu }: SixPointerChessGameProps) {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState>(initialGameState)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<string[]>([])
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white")
  const [boardFlipped, setBoardFlipped] = useState(false)
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [showMoveHistory, setShowMoveHistory] = useState(false)
  const [promotionModal, setPromotionModal] = useState<{
    visible: boolean
    from: string
    to: string
    options: string[]
  } | null>(null)
  const [dragState, setDragState] = useState<DragState>(INITIAL_DRAG_STATE)
  const [dragTargetSquare, setDragTargetSquare] = useState<string | null>(null)

  // Game ending state
  const [showGameEndModal, setShowGameEndModal] = useState(false)
  const [gameEndMessage, setGameEndMessage] = useState("")
  const [isWinner, setIsWinner] = useState<boolean | null>(null)
  const [gameEndDetails, setGameEndDetails] = useState<{
    reason?: string
    moveSan?: string
    moveMaker?: string
    winner?: string | null
    winnerName?: string | null
    finalPoints?: { white: number; black: number }
  }>({})

  // Foul incidents reported by server (final-move capture recapture edge cases)
  const [foulIncidents, setFoulIncidents] = useState<any[]>([])

  const lastUpdateRef = useRef<number>(Date.now())
  const gameStartTimeRef = useRef<number | null>(null)
  const isFirstMoveRef = useRef<boolean>(true) // Track if this is the first move
  const timerRef = useRef<any>(null)
  const navigationTimeoutRef = useRef<any>(null)

  usePreventEarlyExit({ socket, isGameActive: gameState.status === "active" })

  // Timer sync state
  function safeTimerValue(val: any): number {
    const n = Number(val)
    return isNaN(n) || n === undefined || n === null ? 0 : Math.max(0, n)
  }

  const [localTimers, setLocalTimers] = useState<{ white: number; black: number }>({
    white: safeTimerValue(initialGameState.timeControl.timers.white),
    black: safeTimerValue(initialGameState.timeControl.timers.black),
  })
  const dragStateRef = useRef<DragState>(dragState)

  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  const lastServerSync = useRef<{
    white: number
    black: number
    activeColor: "white" | "black"
    timestamp: number
    turnStartTime: number
    isFirstMove: boolean
  }>({
    white: safeTimerValue(initialGameState.timeControl.timers.white),
    black: safeTimerValue(initialGameState.timeControl.timers.black),
    activeColor: initialGameState.board.activeColor,
    timestamp: Date.now(),
    turnStartTime: Date.now(),
    isFirstMove: true,
  })

  // Chess.com style board sizing - full width

  // Chess.com style responsive values

  // Get 6PT specific values with defaults
  const getMovesPlayed = () => gameState.movesPlayed || gameState.gameState?.movesPlayed || { white: 0, black: 0 }
  const getPoints = () => gameState.points || gameState.gameState?.points || { white: 0, black: 0 }
  const getMaxMoves = () => gameState.maxMoves || gameState.gameState?.maxMoves || 6
  const getBonusMoves = () => gameState.board.bonusMoves || { white: 0, black: 0 }

  // Sixpointer state - FIXED detection
  const isSixPointer = gameState.timeControl?.type === "sixpointer"

  // Use perMove if present, else fallback
  const perMoveTime = (gameState.timeControl as any)?.perMove || 30000
  const [sixPointerPoints, setSixPointerPoints] = useState<{ white: number; black: number }>({ white: 0, black: 0 })
  const [sixPointerMoves, setSixPointerMoves] = useState<{ white: number; black: number }>({ white: 0, black: 0 })
  const [sixPointerBonusMoves, setSixPointerBonusMoves] = useState<{ white: number; black: number }>({
    white: 0,
    black: 0,
  })

  // Function to handle game ending
  const handleGameEnd = (
    result: string,
    winner: string | null,
    endReason: string,
    details?: {
      moveSan?: string
      moveMaker?: string
      winnerName?: string | null
      finalPoints?: { white: number; black: number }
    },
  ) => {
    console.log("[6PT GAME END] Result:", result, "Winner:", winner, "Reason:", endReason)
    // Stop all timers
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    setGameState((prevState) => {
      const previousGameState = prevState.gameState ?? {}
      return {
        ...prevState,
        status: "ended",
        result: result ?? prevState.result,
        resultReason: endReason ?? prevState.resultReason,
        winner,
        gameState: {
          ...previousGameState,
          gameEnded: true,
          result: result ?? previousGameState.result,
          endReason: endReason ?? previousGameState.endReason,
          winner,
        },
      }
    })

    const formatSentence = (text?: string | null) => {
      if (!text) return ""
      const trimmed = text.trim()
      if (!trimmed) return ""
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
    }

    // Determine if current player won
    let playerWon: boolean | null = null
    let message = ""

    if (result === "checkmate") {
      if (winner === playerColor) {
        playerWon = true
        message = "Checkmate! You won the game!"
      } else if (winner && winner !== playerColor) {
        playerWon = false
        message = "Checkmate! You lost the game."
      } else {
        playerWon = null
        message = "Checkmate occurred."
      }
    } else if (result === "timeout") {
      if (winner === playerColor) {
        playerWon = true
        message = "Your opponent ran out of time."
      } else if (winner && winner !== playerColor) {
        playerWon = false
        message = "You ran out of time."
      } else {
        playerWon = null
        message = "Time expired."
      }
    } else if (result === "points") {
      if (winner === playerColor) {
        playerWon = true
        message = "You won by points!"
      } else if (winner && winner !== playerColor) {
        playerWon = false
        message = "You lost by points."
      } else {
        playerWon = null
        message = "Equal points!"
      }
    } else if (result === "draw") {
      playerWon = null
      message = endReason ? formatSentence(endReason) : "Game ended in a draw."
    } else {
      playerWon = null
      message = formatSentence(endReason) || formatSentence(result) || "The game has ended."
    }

    setIsWinner(playerWon)
    setGameEndMessage(message)
    setShowGameEndModal(true)

    // Set details for UI
    setGameEndDetails({
      reason: endReason,
      moveSan: details?.moveSan,
      moveMaker: details?.moveMaker,
      winner,
      winnerName: details?.winnerName,
      finalPoints: details?.finalPoints,
    })

    // Disconnect socket after a short delay
    setTimeout(() => {
      if (socket) {
        console.log("[SOCKET] Disconnecting from game")
        socket.disconnect()
        setSocket(null)
      }
    }, 1000)

    // Auto-navigate to menu after showing the message
    navigationTimeoutRef.current = setTimeout(() => {
      setShowGameEndModal(false)
      if (onNavigateToMenu) {
        onNavigateToMenu()
      }
      router.replace("/(main)/choose")
    }, 7000) // Longer timeout for 6PT to show final scores
  }

  // Function to manually navigate to menu
  const navigateToMenu = () => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
    }
    setShowGameEndModal(false)
    if (socket) {
      socket.disconnect()
      setSocket(null)
    }
    if (onNavigateToMenu) {
      onNavigateToMenu()
    }
    router.replace("/(main)/choose")
  }

  useEffect(() => {
    // Set up game socket connection
    const gameSocket = getSocketInstance()
    if (gameSocket) {
      setSocket(gameSocket)
      console.log("Connected to 6PT Chess game socket")
    }

    if (!gameSocket) {
      console.error("Failed to connect to game socket")
      Alert.alert("Connection Error", "Failed to connect to game socket. Please try again.")
      return
    }

    // Initial player color and board orientation
    const userColor = gameState.userColor[userId]
    const safePlayerColor = userColor === "white" || userColor === "black" ? userColor : "white"
    setPlayerColor(safePlayerColor)
    setBoardFlipped(safePlayerColor === "black")
    setIsMyTurn(gameState.board.activeColor === safePlayerColor)

    // Check if this is the first move based on move history
    const moveCount = gameState.moves?.length || gameState.board?.moveHistory?.length || 0
    isFirstMoveRef.current = moveCount === 0
    console.log("[6PT INIT] Move count:", moveCount, "Is first move:", isFirstMoveRef.current)

    // Initialize game start time
    if (!gameStartTimeRef.current) {
      gameStartTimeRef.current = Date.now()
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [])

  // Always update playerColor and isMyTurn on every gameState change
  useEffect(() => {
    const userColor = gameState.userColor[userId]
    const safePlayerColor = userColor === "white" || userColor === "black" ? userColor : "white"
    setPlayerColor(safePlayerColor)
    setBoardFlipped(safePlayerColor === "black")
    setIsMyTurn(gameState.board.activeColor === safePlayerColor)

    console.log(
      "[6PT DEBUG] userId:",
      userId,
      "userColor:",
      userColor,
      "playerColor:",
      safePlayerColor,
      "activeColor:",
      gameState.board.activeColor,
      "isMyTurn:",
      gameState.board.activeColor === safePlayerColor,
    )
  }, [gameState, userId])

  useEffect(() => {
    if (!socket) return

    // Listen for game events
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
      
      // Clean up timeout ref
      if (possibleMovesRequestRef.current) {
        clearTimeout(possibleMovesRequestRef.current)
      }
    }
  }, [socket, playerColor])

  const handleGameMove = (data: any) => {
    console.log("[MOVE] Move received:", data)
    if (data && data.gameState) {
      const now = Date.now()

      if (isSixPointer) {
        // --- Sixpointer move logic ---
        let movesPlayed = { white: 0, black: 0 }
        let movesLeft = { white: 6, black: 6 }
        let points = { white: 0, black: 0 }

        // Get moves played
        if (data.gameState.board?.movesPlayed) {
          movesPlayed = data.gameState.board.movesPlayed
        } else if (data.gameState.gameState?.movesPlayed) {
          movesPlayed = data.gameState.gameState.movesPlayed
        }

        // Get points
        if (data.gameState.board?.points) {
          points = data.gameState.board.points
        } else if (data.gameState.gameState?.points) {
          points = data.gameState.gameState.points
        }

        // Calculate moves left including bonus moves
        const maxMoves = data.gameState.board?.maxMoves || data.gameState.gameState?.maxMoves || 6
        const bonusMoves = data.gameState.board?.bonusMoves ||
          data.gameState.gameState?.bonusMoves || { white: 0, black: 0 }

        movesLeft = {
          white: maxMoves + bonusMoves.white - movesPlayed.white,
          black: maxMoves + bonusMoves.black - movesPlayed.black,
        }

        setSixPointerMoves(movesPlayed)
        setSixPointerPoints(points)
        setSixPointerBonusMoves(bonusMoves)

        // Show timeout penalty notification if server flagged one
        const lastTimeout = data.gameState.board?.lastTimeoutPenalty || data.gameState.gameState?.lastTimeoutPenalty
        if (lastTimeout) {
          // Show a transient alert to the user
          Alert.alert("Timeout Penalty", lastTimeout.message || "You received a -1 timeout penalty.")
        }

        console.log("[6PT DEBUG] Moves left:", movesLeft, "Points:", points, "Bonus moves:", bonusMoves)

        // Check if game should end (both players exhausted their moves)
        if (movesLeft.white <= 0 && movesLeft.black <= 0) {
          let result = "draw"
          let winner: string | null = null

          if (points.white > points.black) {
            result = "points"
            winner = "white"
          } else if (points.black > points.white) {
            result = "points"
            winner = "black"
          }

          // Use the actual points from the game state, not looking for finalPoints
          const finalPoints = {
            white: points.white,
            black: points.black,
          }

          console.log("[6PT GAME END] Both players out of moves. Winner:", winner, "Final points:", finalPoints)
          handleGameEnd(result, winner, "6 moves completed", { finalPoints })
          return
        }

        // Check for regular game end conditions
        if (
          data.gameState.gameState?.gameEnded ||
          data.gameState.gameState?.checkmate ||
          data.gameState.status === "ended" ||
          data.gameState.shouldNavigateToMenu
        ) {
          const result = data.gameState.gameState?.result || data.gameState.result || "unknown"
          let winner = data.gameState.gameState?.winner || data.gameState.winner

          if (winner === "white" || winner === "black") {
            // Winner is already the color
          } else if (data.gameState.gameState?.winnerColor) {
            winner = data.gameState.gameState.winnerColor
          } else if (result === "checkmate") {
            const checkmatedPlayer = data.gameState.board.activeColor
            winner = checkmatedPlayer === "white" ? "black" : "white"
          }

          const endReason = data.gameState.gameState?.endReason || data.gameState.endReason || result
          const lastMove = data.gameState.move || data.move
          const moveMaker = lastMove?.color || "unknown"
          const moveSan = lastMove?.san || `${lastMove?.from || "?"}->${lastMove?.to || "?"}`

          let winnerName = null
          if (winner && data.gameState.players && data.gameState.players[winner]) {
            winnerName = data.gameState.players[winner].username
          }

          // Use current points as final points
          const finalPoints = {
            white: points.white,
            black: points.black,
          }

          handleGameEnd(result, winner, endReason, { moveSan, moveMaker, winnerName, finalPoints })
          return
        }

        // Update game state for UI
        // Extract timer values from the response
        let newWhiteTime = safeTimerValue(gameState.timeControl.timers.white)
        let newBlackTime = safeTimerValue(gameState.timeControl.timers.black)
        if (data.gameState.timeControl?.timers?.white !== undefined) {
          newWhiteTime = safeTimerValue(data.gameState.timeControl.timers.white)
        } else if (data.gameState.board?.whiteTime !== undefined) {
          newWhiteTime = safeTimerValue(data.gameState.board.whiteTime)
        }

        if (data.gameState.timeControl?.timers?.black !== undefined) {
          newBlackTime = safeTimerValue(data.gameState.timeControl.timers.black)
        } else if (data.gameState.board?.blackTime !== undefined) {
          newBlackTime = safeTimerValue(data.gameState.board.blackTime)
        }

        // Update server sync reference - CRITICAL for six-pointer after timeout
        lastServerSync.current = {
          white: newWhiteTime,
          black: newBlackTime,
          activeColor: data.gameState.board.activeColor,
          timestamp: now,
          turnStartTime: data.gameState.board.turnStartTimestamp || now,
          isFirstMove: (data.gameState.moves?.length || data.gameState.board?.moveHistory?.length || 0) === 0,
        }

        setGameState((prevState) => ({
          ...prevState,
          ...data.gameState,
          board: {
            ...prevState.board,
            ...data.gameState.board,
          },
          timeControl: {
            ...prevState.timeControl,
            ...data.gameState.timeControl,
            timers: {
              white: newWhiteTime,
              black: newBlackTime,
            },
          },
          moves: data.gameState.moves || [],
          lastMove: data.gameState.lastMove,
          moveCount: data.gameState.moveCount,
          movesPlayed: movesPlayed,
          points: points,
        }))

        setLocalTimers({
          white: newWhiteTime,
          black: newBlackTime,
        })

        setMoveHistory(data.gameState.moves || [])
        setSelectedSquare(null)
        setPossibleMoves([])

        const userColor = data.gameState.userColor ? data.gameState.userColor[userId] : playerColor
        const activeColor = data.gameState.board.activeColor
        const newIsMyTurn = activeColor === userColor
        setIsMyTurn(newIsMyTurn)
        return
      }

      // --- Regular game logic for non-sixpointer games ---
      const previousMoveCount = gameState.moves?.length || gameState.board?.moveHistory?.length || 0
      const newMoveCount = data.gameState.moves?.length || data.gameState.board?.moveHistory?.length || 0
      const wasFirstMove = previousMoveCount === 0 && newMoveCount === 1

      // Extract timer values from the response
      let newWhiteTime = safeTimerValue(gameState.timeControl.timers.white)
      let newBlackTime = safeTimerValue(gameState.timeControl.timers.black)
      if (data.gameState.timeControl?.timers?.white !== undefined) {
        newWhiteTime = safeTimerValue(data.gameState.timeControl.timers.white)
      } else if (data.gameState.board?.whiteTime !== undefined) {
        newWhiteTime = safeTimerValue(data.gameState.board.whiteTime)
      }

      if (data.gameState.timeControl?.timers?.black !== undefined) {
        newBlackTime = safeTimerValue(data.gameState.timeControl.timers.black)
      } else if (data.gameState.board?.blackTime !== undefined) {
        newBlackTime = safeTimerValue(data.gameState.board.blackTime)
      }

      // Update server sync reference
      lastServerSync.current = {
        white: newWhiteTime,
        black: newBlackTime,
        activeColor: data.gameState.board.activeColor,
        timestamp: now,
        turnStartTime: data.gameState.board.turnStartTimestamp || now,
        isFirstMove: newMoveCount === 0,
      }

      // Check if the game has ended
      if (
        data.gameState.gameState?.gameEnded ||
        data.gameState.gameState?.checkmate ||
        data.gameState.status === "ended" ||
        data.gameState.shouldNavigateToMenu
      ) {
        const result = data.gameState.gameState?.result || data.gameState.result || "unknown"
        let winner = data.gameState.gameState?.winner || data.gameState.winner

        if (winner === "white" || winner === "black") {
          // Winner is already the color
        } else if (data.gameState.gameState?.winnerColor) {
          winner = data.gameState.gameState.winnerColor
        } else if (result === "checkmate") {
          const checkmatedPlayer = data.gameState.board.activeColor
          winner = checkmatedPlayer === "white" ? "black" : "white"
        }

        const endReason = data.gameState.gameState?.endReason || data.gameState.endReason || result
        const lastMove = data.gameState.move || data.move
        const moveMaker = lastMove?.color || "unknown"
        const moveSan = lastMove?.san || `${lastMove?.from || "?"}->${lastMove?.to || "?"}`

        let winnerName = null
        if (winner && data.gameState.players && data.gameState.players[winner]) {
          winnerName = data.gameState.players[winner].username
        }

        handleGameEnd(result, winner, endReason, { moveSan, moveMaker, winnerName })
        return
      }

      setGameState((prevState) => ({
        ...prevState,
        ...data.gameState,
        board: {
          ...prevState.board,
          ...data.gameState.board,
        },
        timeControl: {
          ...prevState.timeControl,
          ...data.gameState.timeControl,
          timers: {
            white: newWhiteTime,
            black: newBlackTime,
          },
        },
        moves: data.gameState.moves || [],
        lastMove: data.gameState.lastMove,
        moveCount: data.gameState.moveCount,
      }))

      setLocalTimers({
        white: newWhiteTime,
        black: newBlackTime,
      })

      setMoveHistory(data.gameState.moves || [])
      setSelectedSquare(null)
      setPossibleMoves([])

      const userColor = data.gameState.userColor ? data.gameState.userColor[userId] : playerColor
      const activeColor = data.gameState.board.activeColor
      const newIsMyTurn = activeColor === userColor
      setIsMyTurn(newIsMyTurn)
    }
  }

  const handlePossibleMoves = (data: { square: string; moves: any[] }) => {
    console.log("Possible moves (raw):", data.moves)
    let moves: string[] = []
    if (Array.isArray(data.moves) && data.moves.length > 0) {
      if (typeof data.moves[0] === "object" && data.moves[0].to) {
        moves = data.moves.map((m: any) => m.to)
      } else if (typeof data.moves[0] === "string" && data.moves[0].length === 4) {
        moves = data.moves.map((m: string) => m.slice(2, 4))
      } else if (typeof data.moves[0] === "string") {
        moves = data.moves
      }
    }
    console.log("Possible moves (dest squares):", moves)
    setPossibleMoves(moves)
  }

  const handleGameStateUpdate = (data: any) => {
    console.log("[6PT] Game state update:", data)
    if (data && data.gameState) {
      // Check for timeout penalty flag and show notification
      if (data.timeoutPenalty || data.gameState.board?.lastTimeoutPenalty) {
        const timeoutInfo = data.timeoutPenalty || data.gameState.board.lastTimeoutPenalty
        console.log("[6PT] Timeout penalty detected:", timeoutInfo)
        Alert.alert(
          "Timeout Penalty", 
          timeoutInfo.message || `${timeoutInfo.player || 'A player'} received a -1 point penalty for timeout`
        )
        
        // Record timeout penalty timestamp for rate limiting
        lastTimeoutPenaltyRef.current = Date.now()
        
        // CRITICAL: Clear selection and possible moves for timeout penalty
        setSelectedSquare(null)
        setPossibleMoves([])
      }
      
      // Check for game ending
      if (
        data.gameState.gameState?.gameEnded ||
        data.gameState.status === "ended" ||
        data.gameState.shouldNavigateToMenu
      ) {
        const result = data.gameState.gameState?.result || data.gameState.result || "unknown"
        let winner = data.gameState.gameState?.winner || data.gameState.winner

        if (winner === "white" || winner === "black") {
          // Winner is already the color
        } else if (data.gameState.gameState?.winnerColor) {
          winner = data.gameState.gameState.winnerColor
        }

        const endReason = data.gameState.gameState?.endReason || data.gameState.endReason || result
        const finalPoints = data.gameState.gameState?.points || data.gameState.points || getPoints()
        handleGameEnd(result, winner, endReason, { finalPoints })
        return
      }

      // Update server sync reference
      lastServerSync.current = {
        white: safeTimerValue(data.gameState.timeControl?.timers?.white || data.gameState.board?.whiteTime),
        black: safeTimerValue(data.gameState.timeControl?.timers?.black || data.gameState.board?.blackTime),
        activeColor: data.gameState.board.activeColor,
        timestamp: Date.now(),
        turnStartTime: Date.now(),
        isFirstMove: (data.gameState.moves?.length || data.gameState.board?.moveHistory?.length || 0) === 0,
      }

      setGameState((prevState) => ({
        ...prevState,
        ...data.gameState,
        timeControl: {
          ...prevState.timeControl,
          ...data.gameState.timeControl,
          timers: {
            white: safeTimerValue(data.gameState.timeControl?.timers?.white || data.gameState.board?.whiteTime),
            black: safeTimerValue(data.gameState.timeControl?.timers?.black || data.gameState.board?.blackTime),
          },
        },
        // 6PT Chess specific fields
        movesPlayed: data.gameState.movesPlayed || prevState.movesPlayed,
        points: data.gameState.points || prevState.points,
        maxMoves: data.gameState.maxMoves || prevState.maxMoves,
        variant: data.gameState.variant || prevState.variant,
      }))
      // If server provided foul incidents, store for UI
      if (data.gameState.gameState?.foulIncidents) {
        setFoulIncidents(data.gameState.gameState.foulIncidents)
      } else if (data.gameState.foulIncidents) {
        setFoulIncidents(data.gameState.foulIncidents)
      }
      // If server provided timeout penalty metadata, surface to user
      const lastTimeout = data.gameState.board?.lastTimeoutPenalty || data.gameState.gameState?.lastTimeoutPenalty
      if (lastTimeout) {
        Alert.alert("Timeout Penalty", lastTimeout.message || "A player received a -1 timeout penalty.")
        // Also add to foul incidents list for UI if not already present
        setFoulIncidents((prev) => {
          const exists = prev && prev.length && prev.some((f: any) => f.timestamp === lastTimeout.timestamp)
          if (exists) return prev
          return [{ type: "timeout_penalty", reason: lastTimeout.message, ...lastTimeout }, ...(prev || [])]
        })
      }
      
      // Update turn state - critical for timeout penalty scenarios
      const activeColor = data.gameState.board.activeColor
      const userColor = data.gameState.userColor ? data.gameState.userColor[userId] : playerColor
      const newIsMyTurn = activeColor === userColor
      setIsMyTurn(newIsMyTurn)
      setPlayerColor(userColor)
      
      console.log("[6PT] Turn updated - activeColor:", activeColor, "userColor:", userColor, "isMyTurn:", newIsMyTurn)
    }
  }

  const handleTimerUpdate = (data: any) => {
    console.log("[6PT] Timer update:", data)
    // Check for game ending in timer update
    if (data.gameEnded || data.shouldNavigateToMenu) {
      const result = data.endReason || "timeout"
      const winner = data.winner
      const finalPoints = data.points || getPoints()
      handleGameEnd(result, winner, result, { finalPoints })
      return
    }

    // Handle different timer update formats from server
    let whiteTime: number
    let blackTime: number
    if (data.timers && typeof data.timers === "object") {
      whiteTime = safeTimerValue(data.timers.white)
      blackTime = safeTimerValue(data.timers.black)
    } else if (typeof data.white === "number" && typeof data.black === "number") {
      whiteTime = safeTimerValue(data.white)
      blackTime = safeTimerValue(data.black)
    } else {
      whiteTime = safeTimerValue(data.white ?? data.timers?.white)
      blackTime = safeTimerValue(data.black ?? data.timers?.black)
    }
    console.log("[6PT TIMER UPDATE] Parsed values - White:", whiteTime, "Black:", blackTime)

    // Check if this is still the first move
    const moveCount = gameState.moves?.length || gameState.board?.moveHistory?.length || 0
    const isFirstMove = moveCount === 0

    // Update server sync reference
    lastServerSync.current = {
      white: whiteTime,
      black: blackTime,
      activeColor: gameState.board.activeColor,
      timestamp: Date.now(),
      turnStartTime: Date.now(),
      isFirstMove: isFirstMove,
    }

    setGameState((prevState) => ({
      ...prevState,
      timeControl: {
        ...prevState.timeControl,
        timers: {
          white: whiteTime,
          black: blackTime,
        },
      },
    }))
  }

  const handleGameEndEvent = (data: any) => {
    console.log("[6PT] Game end event received:", data)
    const result = data.gameState?.gameState?.result || data.gameState?.result || data.result || "unknown"
    let winner = data.gameState?.gameState?.winner || data.gameState?.winner || data.winner
    if (winner === "white" || winner === "black") {
      // Winner is already the color
    } else if (data.gameState?.gameState?.winnerColor) {
      winner = data.gameState.gameState.winnerColor
    }
    const endReason = data.gameState?.gameState?.endReason || data.gameState?.endReason || data.endReason || result
    const finalPoints = data.gameState?.gameState?.points || data.gameState?.points || data.points || getPoints()
    handleGameEnd(result, winner, endReason, { finalPoints })
  }

  const handleGameError = (data: any) => {
    console.log("[6PT] Game error:", data)
    setGameState((prev) => ({ ...prev, gameState: prev.gameState || {} }))
    Alert.alert("Error", data.message || data.error || "An error occurred")
  }

  const handleGameWarning = (data: any) => {
    const message = data?.message || "Warning: Invalid move or rule violation."
    console.log("[6PT] Game warning:", message, "Data:", data)
    
    // Special handling for timeout penalty warnings
    if (data.timeoutPenalty || (data.gameState && data.gameState.board?.lastTimeoutPenalty)) {
      console.log("[6PT] Timeout penalty warning detected, updating game state")
      
      // Record timeout penalty timestamp for rate limiting
      lastTimeoutPenaltyRef.current = Date.now()
      
      // CRITICAL: Clear selection and possible moves for timeout penalty
      setSelectedSquare(null)
      setPossibleMoves([])
      
      // Update the full game state from timeout penalty
      if (data.gameState) {
        setGameState((prevState) => ({
          ...prevState,
          ...data.gameState,
          board: {
            ...prevState.board,
            ...data.gameState.board,
          },
          timeControl: {
            ...prevState.timeControl,
            ...data.gameState.timeControl,
            timers: {
              white: safeTimerValue(data.gameState.timeControl?.timers?.white || data.gameState.board?.whiteTime),
              black: safeTimerValue(data.gameState.timeControl?.timers?.black || data.gameState.board?.blackTime),
            },
          },
          // Update six-pointer specific fields
          movesPlayed: data.gameState.movesPlayed || data.gameState.board?.movesPlayed || prevState.movesPlayed,
          points: data.gameState.points || data.gameState.board?.points || prevState.points,
          maxMoves: data.gameState.maxMoves || prevState.maxMoves,
          variant: data.gameState.variant || prevState.variant,
        }))
        
        // Update turn state - critical for timeout scenarios
        const activeColor = data.gameState.board.activeColor
        const userColor = data.gameState.userColor ? data.gameState.userColor[userId] : playerColor
        const newIsMyTurn = activeColor === userColor
        setIsMyTurn(newIsMyTurn)
        
        // Update local timers
        setLocalTimers({
          white: safeTimerValue(data.gameState.board.whiteTime),
          black: safeTimerValue(data.gameState.board.blackTime),
        })
        
        // Update server sync
        lastServerSync.current = {
          white: safeTimerValue(data.gameState.board.whiteTime),
          black: safeTimerValue(data.gameState.board.blackTime),
          activeColor: activeColor,
          timestamp: Date.now(),
          turnStartTime: Date.now(),
          isFirstMove: false,
        }
        
        console.log("[6PT] Timeout penalty state updated - activeColor:", activeColor, "userColor:", userColor, "isMyTurn:", newIsMyTurn)
      }
    } else {
      // Regular warning handling
      setGameState((prev) => ({ ...prev, gameState: data.gameState }))
    }
    
    Alert.alert("Warning", message)
  }

  const lastActiveColorRef = useRef<"white" | "black" | null>(null)
  const timeoutEmittedRef = useRef<{ white: boolean; black: boolean }>({ white: false, black: false })

  useEffect(() => {
    // Clear existing timers
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (gameState.status !== "active" || gameState.gameState?.gameEnded) {
      return
    }

    const currentWhiteTime = safeTimerValue(gameState.timeControl.timers.white)
    const currentBlackTime = safeTimerValue(gameState.timeControl.timers.black)

    const currentActiveColor = gameState.board.activeColor
    if (lastServerSync.current.activeColor !== currentActiveColor) {
      timeoutEmittedRef.current = { white: false, black: false }
    }

    // Always update lastServerSync so timer starts immediately at game start and turn change
    lastServerSync.current = {
      white: currentWhiteTime,
      black: currentBlackTime,
      activeColor: currentActiveColor,
      timestamp: Date.now(),
      turnStartTime: gameState.board.turnStartTimestamp || Date.now(),
      isFirstMove: false, // Always false so timer starts immediately
    }

    timerRef.current = setInterval(() => {
      const now = Date.now()
      const serverSync = lastServerSync.current

      let newWhite = serverSync.white
      let newBlack = serverSync.black

      const timeSinceLastSync = now - serverSync.timestamp

      // Always decrement the active player's time immediately
      if (serverSync.activeColor === "white") {
        newWhite = Math.max(0, serverSync.white - timeSinceLastSync)
        newBlack = serverSync.black
      } else {
        newBlack = Math.max(0, serverSync.black - timeSinceLastSync)
        newWhite = serverSync.white
      }

      setLocalTimers({
        white: newWhite,
        black: newBlack,
      })

      // For sixpointer variant, do not auto-end the game on client when timers hit 0.
      // Server will apply a -1 point penalty and emit updated state. For other
      // variants, keep existing behavior of ending on timeout.
      if (!isSixPointer) {
        if (newWhite <= 0 && !gameState.gameState?.gameEnded) {
          handleGameEnd("timeout", "black", "White ran out of time")
          return { white: 0, black: newBlack }
        }
        if (newBlack <= 0 && !gameState.gameState?.gameEnded) {
          handleGameEnd("timeout", "white", "Black ran out of time")
          return { white: newWhite, black: 0 }
        }
      } else {
        const active = serverSync.activeColor
        const isMyTurn = active === playerColor

        if (isMyTurn && active === "white" && newWhite <= 0 && !timeoutEmittedRef.current.white) {
          timeoutEmittedRef.current.white = true
          if (socket) {
            console.log("[6PT] Emitting timeoutPenalty for white (my turn)")
            socket.emit("game:timeoutPenalty", {
              timestamp: Date.now(),
              playerColor: "white",
            })
          }
        }
        if (isMyTurn && active === "black" && newBlack <= 0 && !timeoutEmittedRef.current.black) {
          timeoutEmittedRef.current.black = true
          if (socket) {
            console.log("[6PT] Emitting timeoutPenalty for black (my turn)")
            socket.emit("game:timeoutPenalty", {
              timestamp: Date.now(),
              playerColor: "black",
            })
          }
        }

        // Reset flags when timers are replenished by server
        if (newWhite > 0) timeoutEmittedRef.current.white = false
        if (newBlack > 0) timeoutEmittedRef.current.black = false
      }
    }, 100)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [
    gameState.status,
    gameState.board.activeColor,
    gameState.timeControl.timers.white,
    gameState.timeControl.timers.black,
    gameState.board.turnStartTimestamp,
    gameState.moves?.length,
    gameState.board?.moveHistory?.length,
    gameState.gameState?.gameEnded,
    playerColor, // Added playerColor dependency to reset timers when player changes
  ])

  // Add ref to track last timeout penalty timestamp
  const lastTimeoutPenaltyRef = useRef<number>(0)
  const possibleMovesRequestRef = useRef<any>(null)

  const requestPossibleMoves = (square: string) => {
    if (!socket) return
    
    // Clear any pending request
    if (possibleMovesRequestRef.current) {
      clearTimeout(possibleMovesRequestRef.current)
    }
    
    // If a timeout penalty happened recently, add a small delay to ensure server state is updated
    const timeSinceTimeout = Date.now() - lastTimeoutPenaltyRef.current
    const delay = timeSinceTimeout < 1000 ? 100 : 0 // 100ms delay if timeout was within last 1 second
    
    possibleMovesRequestRef.current = setTimeout(() => {
      console.log("[6PT] Requesting possible moves for square:", square)
      socket.emit("game:getPossibleMoves", {
        square: square,
      })
    }, delay)
  }

  const makeMove = (move: Move) => {
    console.log(
      "[6PT DEBUG] Attempting to make move",
      move,
      "isMyTurn:",
      isMyTurn,
      "playerColor:",
      playerColor,
      "activeColor:",
      gameState.board.activeColor,
    )

    if (!socket || !isMyTurn) {
      console.log("[6PT DEBUG] Not emitting move: socket or isMyTurn false")
      return
    }

    // Check if player has moves remaining
    const movesPlayed = getMovesPlayed()
    const maxMoves = getMaxMoves()
    const playerMovesUsed = movesPlayed[playerColor] || 0
    if (playerMovesUsed >= maxMoves) {
      Alert.alert("Move Limit Reached", `You have already used all ${maxMoves} moves!`)
      return
    }

    // Immediately update local state to show move was made (optimistic update)
    setIsMyTurn(false)
    setSelectedSquare(null)
    setPossibleMoves([])

    socket.emit("game:makeMove", {
      move: { from: move.from, to: move.to, promotion: move.promotion },
      timestamp: Date.now(),
      // include variant so server applies sixpointer rules
      variant: isSixPointer ? "sixpointer" : undefined,
    })
    console.log("[6PT DEBUG] Move emitted:", { from: move.from, to: move.to, promotion: move.promotion })
  }

  const handleSquarePress = (square: string) => {
    if (selectedSquare === square) {
      // Deselect if clicking the same square
      setSelectedSquare(null)
      setPossibleMoves([])
      return
    }

    if (selectedSquare && possibleMoves.includes(square)) {
      // Check if this move is a promotion
      const piece = getPieceAt(selectedSquare)
      const isPromotion =
        piece &&
        ((piece.toLowerCase() === "p" && playerColor === "white" && square[1] === "8") ||
          (piece.toLowerCase() === "p" && playerColor === "black" && square[1] === "1"))

      if (isPromotion) {
        const options = ["q", "r", "b", "n"]
        setPromotionModal({ visible: true, from: selectedSquare, to: square, options })
        return
      }

      makeMove({ from: selectedSquare, to: square })
      setPromotionModal(null)
      setSelectedSquare(null)
      setPossibleMoves([])
      return
    }

    // Only allow selecting a piece if it's the player's turn and the piece belongs to them
    const piece = getPieceAt(square)
    if (isMyTurn && piece && isPieceOwnedByPlayer(piece, playerColor)) {
      setSelectedSquare(square)
      requestPossibleMoves(square)
    } else {
      setSelectedSquare(null)
      setPossibleMoves([])
    }
  }

  const handlePromotionSelect = (promotion: string) => {
    if (promotionModal) {
      makeMove({ from: promotionModal.from, to: promotionModal.to, promotion })
      setPromotionModal(null)
      setSelectedSquare(null)
      setPossibleMoves([])
    }
  }

  const getPieceAt = (square: string): string | null => {
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
        if (col === fileIndex) {
          return c
        }
        col++
      }
    }
    return null
  }

  const isPieceOwnedByPlayer = (piece: string, color: "white" | "black"): boolean => {
    if (color === "white") {
      return piece === piece.toUpperCase()
    } else {
      return piece === piece.toLowerCase()
    }
  }

  const getSquareFromCoords = useCallback(
    (x: number, y: number): string | null => {
      if (x < 0 || y < 0 || x > boardSize || y > boardSize) return null
      const files = boardFlipped ? [...FILES].reverse() : FILES
      const ranks = boardFlipped ? [...RANKS].reverse() : RANKS
      const fileIndex = Math.floor(x / squareSize)
      const rankIndex = Math.floor(y / squareSize)
      if (fileIndex < 0 || fileIndex >= files.length || rankIndex < 0 || rankIndex >= ranks.length) return null
      const file = files[fileIndex]
      const rank = ranks[rankIndex]
      return file && rank ? `${file}${rank}` : null
    },
    [boardFlipped],
  )

  const canDragSquare = useCallback(
    (square: string | null): boolean => {
      if (!square) return false
      if (!isMyTurn || gameState.status !== "active") return false
      const piece = getPieceAt(square)
      if (!piece) return false
      return isPieceOwnedByPlayer(piece, playerColor)
    },
    [isMyTurn, gameState.status, getPieceAt, isPieceOwnedByPlayer, playerColor],
  )

  const restoreSelectionToOrigin = useCallback(() => {
    const originSquare = dragStateRef.current.from
    if (originSquare) {
      setSelectedSquare(originSquare)
      setDragTargetSquare(originSquare)
    } else {
      setSelectedSquare(null)
      setPossibleMoves([])
    }
  }, [])

  const startDrag = useCallback(
    (square: string, piece: string, x: number, y: number) => {
      const boundedX = Math.min(Math.max(x, 0), boardSize)
      const boundedY = Math.min(Math.max(y, 0), boardSize)
      setDragState({
        active: true,
        from: square,
        piece,
        x: boundedX,
        y: boundedY,
      })
      setDragTargetSquare(square)
      setSelectedSquare(square)
      requestPossibleMoves(square)
    },
    [requestPossibleMoves],
  )

  const finishDragMove = useCallback(
    (targetSquare: string | null) => {
      const originSquare = dragStateRef.current.from
      setDragState(INITIAL_DRAG_STATE)
      setDragTargetSquare(null)

      if (!originSquare) {
        setSelectedSquare(null)
        setPossibleMoves([])
        return
      }

      if (!targetSquare || originSquare === targetSquare) {
        restoreSelectionToOrigin()
        return
      }

      if (possibleMoves.includes(targetSquare)) {
        const piece = getPieceAt(originSquare)
        const isPromotion =
          piece &&
          ((piece.toLowerCase() === "p" && playerColor === "white" && targetSquare[1] === "8") ||
            (piece.toLowerCase() === "p" && playerColor === "black" && targetSquare[1] === "1"))

        if (isPromotion) {
          const options = ["q", "r", "b", "n"]
          setPromotionModal({ visible: true, from: originSquare, to: targetSquare, options })
          return
        }

        makeMove({ from: originSquare, to: targetSquare })
        setSelectedSquare(null)
        setPossibleMoves([])
      } else {
        restoreSelectionToOrigin()
      }
    },
    [getPieceAt, playerColor, makeMove, possibleMoves, restoreSelectionToOrigin],
  )

  const abortDrag = useCallback(() => {
    setDragState(INITIAL_DRAG_STATE)
    setDragTargetSquare(null)
    restoreSelectionToOrigin()
  }, [restoreSelectionToOrigin])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          if (Math.abs(gestureState.dx) < 4 && Math.abs(gestureState.dy) < 4) return false
          const square = getSquareFromCoords(evt.nativeEvent.locationX, evt.nativeEvent.locationY)
          return canDragSquare(square)
        },
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent
          const square = getSquareFromCoords(locationX, locationY)
          if (!square) return
          const piece = getPieceAt(square)
          if (piece && canDragSquare(square)) {
            startDrag(square, piece, locationX, locationY)
          }
        },
        onPanResponderMove: (evt) => {
          if (!dragStateRef.current.active) return
          const { locationX, locationY } = evt.nativeEvent
          const boundedX = Math.min(Math.max(locationX, 0), boardSize)
          const boundedY = Math.min(Math.max(locationY, 0), boardSize)
          setDragState((prev) => (prev.active ? { ...prev, x: boundedX, y: boundedY } : prev))
          const hoverSquare = getSquareFromCoords(boundedX, boundedY)
          setDragTargetSquare(hoverSquare)
        },
        onPanResponderRelease: (evt) => {
          const targetSquare = getSquareFromCoords(evt.nativeEvent.locationX, evt.nativeEvent.locationY)
          finishDragMove(targetSquare)
        },
        onPanResponderTerminate: () => {
          abortDrag()
        },
      }),
    [abortDrag, canDragSquare, finishDragMove, getPieceAt, getSquareFromCoords, startDrag, boardSize],
  )

  const formatTime = (milliseconds: number): string => {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) return "0:00"
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const renderCapturedPieces = (color: "white" | "black") => {
    const capturedPieces = gameState.board.capturedPieces || { white: [], black: [] }
    const pieces = capturedPieces[color] || []

    if (pieces.length === 0) return null

    const pieceCounts: { [key: string]: number } = {}
    pieces.forEach((piece) => {
      const pieceType = color === "white" ? piece.toLowerCase() : piece.toUpperCase()
      pieceCounts[pieceType] = (pieceCounts[pieceType] || 0) + 1
    })

    return (
      <View style={variantStyles.capturedPieces}>
        {Object.entries(pieceCounts).map(([piece, count]) => (
          <View key={piece} style={variantStyles.capturedPieceGroup}>
            {getPieceComponent(piece, capturedPieceSize)}
            {count > 1 && <Text style={variantStyles.capturedCount}>{count}</Text>}
          </View>
        ))}
      </View>
    )
  }

  const renderSquare = (file: string, rank: string) => {
    const square = `${file}${rank}`
    const isLight = (FILES.indexOf(file) + Number.parseInt(rank)) % 2 === 0
    const isSelected = selectedSquare === square
    const isPossibleMove = possibleMoves.includes(square)
    const piece = getPieceAt(square)
    const isDragOrigin = dragState.active && dragState.from === square
    const pieceToRender = isDragOrigin ? null : piece

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

    if (dragState.active && dragTargetSquare === square) {
      borderColor = BOARD_THEME.highlight.selected
      borderWidth = 2
    } else if (isPossibleMove && piece) {
      borderColor = BOARD_THEME.highlight.capture
      borderWidth = 2
    } else if (isPossibleMove) {
      borderColor = BOARD_THEME.highlight.move
      borderWidth = 2
    } else if (isSelected) {
      borderColor = BOARD_THEME.highlight.selected
      borderWidth = 2
    } else if (isLastMove) {
      borderColor = BOARD_THEME.highlight.lastMove
      borderWidth = 1
    }

    const squareBackground = isLight ? BOARD_THEME.lightSquare : BOARD_THEME.darkSquare
    const coordinateColor = isLight ? BOARD_THEME.darkSquare : BOARD_THEME.lightSquare
    const moveDotSize = squareSize * BOARD_THEME.moveDotScale
    const captureIndicatorSize = squareSize * BOARD_THEME.captureIndicatorScale

    return (
      <View key={square} style={{ position: "relative" }}>
        <TouchableOpacity
          style={[
            variantStyles.square,
            {
              width: squareSize,
              height: squareSize,
              backgroundColor: squareBackground,
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

          {pieceToRender && getPieceComponent(pieceToRender, squareSize * BOARD_THEME.pieceScale)}

          {isPossibleMove && !piece && (
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
          {isPossibleMove && piece && (
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
        </TouchableOpacity>
      </View>
    )
  }

  const renderBoard = () => {
    const files = boardFlipped ? [...FILES].reverse() : FILES
    const ranks = boardFlipped ? [...RANKS].reverse() : RANKS

    return (
      <View style={variantStyles.boardContainer}>
        <View style={{ width: boardSize, height: boardSize, position: "relative" }} {...panResponder.panHandlers}>
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
              {getPieceComponent(dragState.piece, squareSize * BOARD_THEME.pieceScale)}
            </View>
          )}
        </View>
      </View>
    )
  }

  const renderMovesLeftIndicators = (color: "white" | "black") => {
    const maxMoves = getMaxMoves()
    const movesPlayedCount = getMovesPlayed()[color] || 0 // Number of moves made by this player
    const indicators = []

    for (let i = 0; i < maxMoves; i++) {
      const isMoveMade = i < movesPlayedCount
      const displayMoveNumber = isMoveMade ? (i + 1).toString() : "" // Display 1, 2, 3...

      indicators.push(
        <View
          key={i}
          style={[
            sixPointerStyles.moveSquare,
            isMoveMade ? sixPointerStyles.filledMoveSquare : sixPointerStyles.emptyMoveSquare,
          ]}
        >
          <Text
            style={[
              sixPointerStyles.moveNumberInBox,
              isMoveMade ? sixPointerStyles.filledMoveNumberText : sixPointerStyles.emptyMoveNumberText,
            ]}
          >
            {displayMoveNumber}
          </Text>
        </View>,
      )
    }
    return <View style={sixPointerStyles.movesLeftContainer}>{indicators}</View>
  }

  const renderPlayerInfo = (color: "white" | "black", _isTop: boolean) => {
    const player = gameState.players[color]
    if (!player) {
      return (
        <View style={variantStyles.playerInfoContainer}>
          <Text style={variantStyles.playerName}>Unknown Player</Text>
        </View>
      )
    }

    const timer = safeTimerValue(localTimers[color])
    const isActivePlayer = gameState.board.activeColor === color && gameState.status === "active"
    const isMe = playerColor === color
    const currentPoints = getPoints()[color]

    return (
      <View style={[variantStyles.playerInfoContainer, isActivePlayer && variantStyles.activePlayerContainer]}>
        <View style={variantStyles.playerHeader}>
          <View style={sixPointerStyles.playerInfoLeft}>
            <View style={sixPointerStyles.avatarContainer}>
              <View style={variantStyles.playerAvatar}>
                <Text style={variantStyles.playerAvatarText}>{player.username.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={sixPointerStyles.pointsCircle}>
                <Text style={sixPointerStyles.pointsText}>{currentPoints}</Text>
              </View>
            </View>
            <View style={variantStyles.playerDetails}>
              <View style={variantStyles.playerNameRow}>
                <View style={variantStyles.playerNameContainer}>
                  <Text style={[variantStyles.playerName, isActivePlayer && variantStyles.activePlayerName]} numberOfLines={1}>
                    {player.username}
                  </Text>
                  <Text style={variantStyles.playerRating}>({player.rating > 0 ? player.rating : "Unrated"})</Text>
                </View>
                {isMe && <Text style={variantStyles.youIndicator}>(You)</Text>}
              </View>
              {renderCapturedPieces(color)}
            </View>
          </View>
          <View style={[variantStyles.timerContainer, isActivePlayer && variantStyles.activeTimerContainer]}>
            <Text style={[variantStyles.timerText, isActivePlayer && variantStyles.activeTimerText]}>{formatTime(timer)}</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderMoveHistory = () => {
    if (!showMoveHistory) return null

    const moves = moveHistory
    const movePairs = []
    for (let i = 0; i < moves.length; i += 2) {
      movePairs.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: moves[i],
        black: moves[i + 1] || "",
      })
    }

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
              {movePairs.map((pair, index) => (
                <View key={index} style={variantStyles.moveRow}>
                  <Text style={variantStyles.moveNumber}>{pair.moveNumber}.</Text>
                  <Text style={variantStyles.moveText}>{pair.white}</Text>
                  <Text style={variantStyles.moveText}>{pair.black}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  }

  const opponentColor = playerColor === "white" ? "black" : "white"

  return (
    <View style={variantStyles.container}>
      {/* Top Player Info Block */}
      {renderPlayerInfo(opponentColor, true)}

      {/* Top Moves Left Indicators */}
      {isSixPointer && (
        <View style={sixPointerStyles.movesLeftRowWrapperTop}>{renderMovesLeftIndicators(opponentColor)}</View>
      )}

      {/* Chess Board */}
      {/* Foul incidents banner (if server flagged any) */}
      {foulIncidents && foulIncidents.length > 0 && (
        <View
          style={{
            backgroundColor: "#FFF4E5",
            padding: 8,
            borderRadius: 6,
            marginVertical: 6,
            alignSelf: "stretch",
          }}
        >
          <Text style={{ color: "#7A4A00", textAlign: "center", fontWeight: "600" }}>
            ⚠️ Foul incident reported: {foulIncidents[0].reason || "Final-move recapture edge case"}
          </Text>
        </View>
      )}
      {renderBoard()}

      {/* Bottom Moves Left Indicators */}
      {isSixPointer && (
        <View style={sixPointerStyles.movesLeftRowWrapperBottom}>{renderMovesLeftIndicators(playerColor)}</View>
      )}

      {/* Bottom Player Info Block */}
      {renderPlayerInfo(playerColor, false)}

      {/* Bottom Control Bar */}
      <View style={variantStyles.bottomBar}>
        <TouchableOpacity style={variantStyles.bottomBarButton} onPress={() => setShowMoveHistory(true)}>
          <Text style={variantStyles.bottomBarIcon}>≡</Text>
          <Text style={variantStyles.bottomBarLabel}>Moves</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={variantStyles.bottomBarButton}
          onPress={() => {
            if (socket && gameState.status === "active") {
              socket.emit("game:resign")
            }
          }}
        >
          <Text style={variantStyles.bottomBarIcon}>✕</Text>
          <Text style={variantStyles.bottomBarLabel}>Resign</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={variantStyles.bottomBarButton}
          onPress={() => {
            if (socket && gameState.status === "active") {
              socket.emit("game:offerDraw")
            }
          }}
        >
          <Text style={variantStyles.bottomBarIcon}>½</Text>
          <Text style={variantStyles.bottomBarLabel}>Draw</Text>
        </TouchableOpacity>
      </View>

      {/* Move History Modal */}
      {renderMoveHistory()}

      {/* Game End Modal */}
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
            {gameEndDetails.reason && <Text style={variantStyles.gameEndReason}>Reason: {gameEndDetails.reason}</Text>}
            {gameEndDetails.moveSan && (
              <Text style={variantStyles.gameEndMove}>
                Move: {gameEndDetails.moveSan}
                {gameEndDetails.moveMaker ? ` by ${gameEndDetails.moveMaker}` : ""}
              </Text>
            )}
            {gameEndDetails.finalPoints && (
              <Text style={variantStyles.gameEndMove}>
                Final Score: {gameEndDetails.finalPoints.white} - {gameEndDetails.finalPoints.black}
              </Text>
            )}
            {(gameEndDetails.winner || gameEndDetails.winnerName) && (
              <Text style={variantStyles.gameEndWinner}>
                Winner: {gameEndDetails.winnerName ?? gameEndDetails.winner ?? "Unknown"}
              </Text>
            )}
            <TouchableOpacity style={variantStyles.menuButton} onPress={navigateToMenu}>
              <Text style={variantStyles.menuButtonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Promotion Modal */}
      {promotionModal && (
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
      )}
      
    </View>
  )
}
