"use client"

import { useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { Alert, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native"
import type { Socket } from "socket.io-client"
import { getSocketInstance } from "../../../utils/socketManager"
import { getPieceComponent } from "../../components/game/chessPieces"
import { variantStyles } from "@/app/lib/styles"
import { usePreventEarlyExit } from "@/app/lib/hooks/usePreventEarlyExit"
import { Move, GameState, ChessGameProps} from "../../lib/types/classic"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

export default function ChessGame({ initialGameState, userId, onNavigateToMenu }: ChessGameProps) {
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

  // Game ending state
  const [showGameEndModal, setShowGameEndModal] = useState(false)
  const [gameEndMessage, setGameEndMessage] = useState("")
  const [isWinner, setIsWinner] = useState<boolean | null>(null)

  // Details for UI: reason, move, winner, winnerName
  const [gameEndDetails, setGameEndDetails] = useState<{
    reason?: string
    moveSan?: string
    moveMaker?: string
    winner?: string | null
    winnerName?: string | null
  }>({})

  // Timer management
  const gameStartTimeRef = useRef<number | null>(null)
  const isFirstMoveRef = useRef<boolean>(true)
  const timerRef = useRef<any>(null)
  const navigationTimeoutRef = useRef<any>(null)

  usePreventEarlyExit({ socket, isGameActive: gameState.status === "active" })

  // Timer sync state - improved timer management
  // Clamp timer to baseTime (timers can go above baseTime with increment)
  function safeTimerValue(val: any, baseTime?: number, increment?: number): number {
    const n = Number(val)
    if (isNaN(n) || n === undefined || n === null) return 0;
    // Don't clamp to baseTime - increment can make timers exceed baseTime
    return Math.max(0, n);
  }

  const baseTime = initialGameState.timeControl.baseTime;
  const increment = initialGameState.timeControl.increment;
  const [localTimers, setLocalTimers] = useState<{ white: number; black: number }>({
    white: safeTimerValue(initialGameState.timeControl.timers.white, baseTime, increment),
    black: safeTimerValue(initialGameState.timeControl.timers.black, baseTime, increment),
  })

  // Track the last known server state for accurate local countdown
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

  // Get screen dimensions and calculate responsive values
const screenWidth = Dimensions.get("window").width
const screenHeight = Dimensions.get("window").height
const isTablet = Math.min(screenWidth, screenHeight) > 600
const isSmallScreen = screenWidth < 380
const horizontalPadding = isSmallScreen ? 8 : isTablet ? 20 : 12
const boardSize = screenWidth - horizontalPadding * 2
const squareSize = boardSize / 8
const promotionPieceSize = isSmallScreen ? 32 : isTablet ? 40 : 36
const coordinateFontSize = isSmallScreen ? 8 : 10

  // Function to handle game ending
  const handleGameEnd = (
    result: string,
    winner: string | null,
    endReason: string,
    details?: { moveSan?: string; moveMaker?: string; winnerName?: string | null },
  ) => {
    console.log("[GAME END] Result:", result, "Winner:", winner, "Reason:", endReason)
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

    let playerWon: boolean | null = null
    let message = ""

    if (result === "checkmate") {
      if (winner === playerColor) {
        playerWon = true
        message = "🎉 VICTORY! 🎉\nCheckmate! You won the game!"
      } else if (winner && winner !== playerColor) {
        playerWon = false
        message = "😔 DEFEAT 😔\nCheckmate! You lost the game."
      } else {
        playerWon = null
        message = "🏁 GAME OVER 🏁\nCheckmate occurred"
      }
    } else if (result === "timeout") {
      if (winner === playerColor) {
        playerWon = true
        message = "🎉 VICTORY! 🎉\nYour opponent ran out of time!"
      } else if (winner && winner !== playerColor) {
        playerWon = false
        message = "😔 DEFEAT 😔\nYou ran out of time!"
      } else {
        playerWon = null
        message = "🏁 GAME OVER 🏁\nTime expired"
      }
    } else if (result === "draw") {
      playerWon = null
      message = `⚖️ DRAW ⚖️\n${endReason || "Game ended in a draw"}`
    } else {
      playerWon = null
      message = `🏁 GAME OVER 🏁\n${result}`
    }

    setIsWinner(playerWon)
    setGameEndMessage(message)
    setShowGameEndModal(true)
    setGameEndDetails({
      reason: endReason,
      moveSan: details?.moveSan,
      moveMaker: details?.moveMaker,
      winner,
      winnerName: details?.winnerName,
    })

    setTimeout(() => {
      if (socket) {
        console.log("[SOCKET] Disconnecting from game")
        socket.disconnect()
        setSocket(null)
      }
    }, 1000)

    navigationTimeoutRef.current = setTimeout(() => {
      setShowGameEndModal(false)
      if (onNavigateToMenu) {
        onNavigateToMenu()
      }
      router.replace("/(main)/choose")
    }, 5000)
  }

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
    const gameSocket = getSocketInstance()
    if (gameSocket) {
      setSocket(gameSocket)
      console.log("Connected to game socket")
    }

    if (!gameSocket) {
      console.error("Failed to connect to game socket")
      Alert.alert("Connection Error", "Failed to connect to game socket. Please try again.")
      return
    }

    const userColor = gameState.userColor[userId]
    const safePlayerColor = userColor === "white" || userColor === "black" ? userColor : "white"
    setPlayerColor(safePlayerColor)
    setBoardFlipped(safePlayerColor === "black")
    setIsMyTurn(gameState.board.activeColor === safePlayerColor)

    const moveCount = gameState.moves?.length || gameState.board?.moveHistory?.length || 0
    isFirstMoveRef.current = moveCount === 0
    console.log("[INIT] Move count:", moveCount, "Is first move:", isFirstMoveRef.current)

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

  useEffect(() => {
    const userColor = gameState.userColor[userId]
    const safePlayerColor = userColor === "white" || userColor === "black" ? userColor : "white"
    setPlayerColor(safePlayerColor)
    setBoardFlipped(safePlayerColor === "black")
    setIsMyTurn(gameState.board.activeColor === safePlayerColor)

    console.log(
      "[DEBUG] userId:",
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Only start timer if game is active, not ended, and board is initialized
    if (gameState.status === "active" && !gameState.gameState?.gameEnded && gameState.board && gameState.board.activeColor) {
      const now = Date.now();
      const currentWhiteTime = safeTimerValue(gameState.timeControl.timers.white, baseTime, increment);
      const currentBlackTime = safeTimerValue(gameState.timeControl.timers.black, baseTime, increment);
      // Always treat as first move if moveHistory is empty (game just started)
      const moveCount = gameState.moves?.length || gameState.board?.moveHistory?.length || 0;
      const isFirstMove = moveCount === 0;

      lastServerSync.current = {
        white: currentWhiteTime,
        black: currentBlackTime,
        activeColor: gameState.board.activeColor,
        timestamp: now,
        turnStartTime: gameState.board.turnStartTimestamp || now,
        isFirstMove: isFirstMove,
      };

      console.log("[TIMER] Setting up timer for active color:", gameState.board.activeColor);
      console.log("[TIMER] Move count:", moveCount, "Is first move:", isFirstMove);
      console.log("[TIMER] Server sync values - White:", currentWhiteTime, "Black:", currentBlackTime);
      console.log("[TIMER] Local timer values - White:", localTimers.white, "Black:", localTimers.black);

      // Start ticking immediately
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const serverSync = lastServerSync.current;
        const elapsedSinceSync = now - serverSync.timestamp;

        setLocalTimers((prev) => {
          let newWhite = serverSync.white;
          let newBlack = serverSync.black;
          // Only tick for active player if game has started (not first move)
          if (serverSync.activeColor === "white" && !serverSync.isFirstMove) {
            newWhite = Math.max(0, serverSync.white - elapsedSinceSync);
            newBlack = serverSync.black;
          } else if (serverSync.activeColor === "black" && !serverSync.isFirstMove) {
            newBlack = Math.max(0, serverSync.black - elapsedSinceSync);
            newWhite = serverSync.white;
          }
          // Don't clamp timers - increment can make them exceed baseTime
          newWhite = safeTimerValue(newWhite);
          newBlack = safeTimerValue(newBlack);
          if (newWhite <= 0 && !gameState.gameState?.gameEnded) {
            console.log("WHITE TIMEOUT DETECTED - Ending game");
            handleGameEnd("timeout", "black", "White ran out of time");
            return { white: 0, black: newBlack };
          }
          if (newBlack <= 0 && !gameState.gameState?.gameEnded) {
            console.log("BLACK TIMEOUT DETECTED - Ending game");
            handleGameEnd("timeout", "white", "Black ran out of time");
            return { white: newWhite, black: 0 };
          }
          return { white: newWhite, black: newBlack };
        });
      }, 100);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    gameState.status,
    gameState.board.activeColor,
    gameState.timeControl.timers.white,
    gameState.timeControl.timers.black,
    gameState.board.turnStartTimestamp,
    gameState.moves?.length,
    gameState.board?.moveHistory?.length,
    gameState.gameState?.gameEnded,
    baseTime,
    increment,
  ]);

  const handleGameMove = (data: any) => {
    console.log("[MOVE] Move received:", data)
    if (data && data.gameState) {
      const now = Date.now()
      const previousMoveCount = gameState.moves?.length || gameState.board?.moveHistory?.length || 0
      const newMoveCount = data.gameState.moves?.length || data.gameState.board?.moveHistory?.length || 0
      const wasFirstMove = previousMoveCount === 0 && newMoveCount === 1

      console.log(
        "[MOVE] Previous move count:",
        previousMoveCount,
        "New move count:",
        newMoveCount,
        "Was first move:",
        wasFirstMove,
      )

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

      console.log("[MOVE] Timer values from server - White:", newWhiteTime, "Black:", newBlackTime)
      console.log("[MOVE] Previous local timers - White:", localTimers.white, "Black:", localTimers.black)

      if (wasFirstMove) {
        console.log("[MOVE] First move detected - preserving initial timer values")
        newWhiteTime = localTimers.white
        newBlackTime = localTimers.black
      }

      lastServerSync.current = {
        white: newWhiteTime,
        black: newBlackTime,
        activeColor: data.gameState.board.activeColor,
        timestamp: now,
        turnStartTime: data.gameState.board.turnStartTimestamp || now,
        isFirstMove: newMoveCount === 0,
      }

      console.log("[MOVE] Updated server sync - Active color:", data.gameState.board.activeColor)

      if (
        data.gameState.gameState?.gameEnded ||
        data.gameState.gameState?.checkmate ||
        data.gameState.status === "ended" ||
        data.gameState.shouldNavigateToMenu
      ) {
        console.log("[MOVE] Game ended detected:", data.gameState.gameState)
        const result = data.gameState.gameState?.result || data.gameState.result || "unknown"
        let winner = data.gameState.gameState?.winner || data.gameState.winner

        if (winner === "white" || winner === "black") {
          // Winner is already the color, use it as is
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

        console.log(
          `[GAME ENDED] Reason: ${endReason}\n` +
            `Move: ${moveSan} by ${moveMaker}\n` +
            `Winner: ${winner}${winnerName ? ` (${winnerName})` : ""}`,
        )

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

      console.log("[MOVE] Updated local timers to - White:", newWhiteTime, "Black:", newBlackTime)

      setMoveHistory(data.gameState.moves || [])
      setSelectedSquare(null)
      setPossibleMoves([])

      const userColor = data.gameState.userColor ? data.gameState.userColor[userId] : playerColor
      const activeColor = data.gameState.board.activeColor
      const newIsMyTurn = activeColor === userColor
      setIsMyTurn(newIsMyTurn)

      console.log(
        "[MOVE] Turn update - Active color:",
        activeColor,
        "User color:",
        userColor,
        "Is my turn:",
        newIsMyTurn,
      )
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
    console.log("Game state update:", data)
    if (data && data.gameState) {
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
        handleGameEnd(result, winner, endReason)
        return
      }

      lastServerSync.current = {
        white: safeTimerValue(data.gameState.timeControl?.timers?.white || data.gameState.board?.whiteTime),
        black: safeTimerValue(data.gameState.timeControl?.timers?.black || data.gameState.board?.blackTime),
        activeColor: data.gameState.board.activeColor,
        timestamp: Date.now(),
        turnStartTime: data.gameState.board.turnStartTimestamp || Date.now(),
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
      }))

      setIsMyTurn(data.gameState.board.activeColor === playerColor)
    }
  }

  const handleGameTimerUpdate = (data: any) => {
    console.log("Timer update:", data)
    if (data.gameEnded || data.shouldNavigateToMenu) {
      const result = data.endReason || "timeout"
      const winner = data.winner
      handleGameEnd(result, winner, result)
      return
    }

    let whiteTime: number
    let blackTime: number

    if (data.timers && typeof data.timers === "object") {
      whiteTime = safeTimerValue(data.timers.white)
      blackTime = safeTimerValue(data.timers.black)
    } else if (typeof data.timers === "number" && typeof data.black === "number") {
      whiteTime = safeTimerValue(data.timers)
      blackTime = safeTimerValue(data.black)
    } else {
      whiteTime = safeTimerValue(data.white ?? data.timers?.white)
      blackTime = safeTimerValue(data.black ?? data.timers?.black)
    }

    console.log("[TIMER UPDATE] Parsed values - White:", whiteTime, "Black:", blackTime)

    const moveCount = gameState.moves?.length || gameState.board?.moveHistory?.length || 0
    const isFirstMove = moveCount === 0

    lastServerSync.current = {
      white: whiteTime,
      black: blackTime,
      activeColor: gameState.board.activeColor,
      timestamp: Date.now(),
      turnStartTime: Date.now(),
      isFirstMove: isFirstMove,
    }

    setLocalTimers({
      white: whiteTime,
      black: blackTime,
    })

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

    console.log(
      "[TIMER UPDATE] Updated local timers to - White:",
      whiteTime,
      "Black:",
      blackTime,
      "Is first move:",
      isFirstMove,
    )
  }

  const handleTimerUpdate = (data: any) => {
    handleGameTimerUpdate(data)
  }

  const handleGameEndEvent = (data: any) => {
    console.log("Game end event received:", data)
    const result = data.gameState?.gameState?.result || data.gameState?.result || data.result || "unknown"
    let winner = data.gameState?.gameState?.winner || data.gameState?.winner || data.winner

    if (winner === "white" || winner === "black") {
      // Winner is already the color
    } else if (data.gameState?.gameState?.winnerColor) {
      winner = data.gameState.gameState.winnerColor
    }

    const endReason = data.gameState?.gameState?.endReason || data.gameState?.endReason || data.endReason || result
    handleGameEnd(result, winner, endReason)
  }

  const handleGameError = (data: any) => {
    console.log("Game error:", data)
    Alert.alert("Error", data.message || data.error || "An error occurred")
  }

  const handleGameWarning = (data: any) => {
    const message = data?.message || "Warning: Invalid move or rule violation."
    Alert.alert("Warning", message)
  }

  const requestPossibleMoves = (square: string) => {
    if (!socket) return
    socket.emit("game:getPossibleMoves", {
      square: square,
    })
  }

  const makeMove = (move: Move) => {
    console.log(
      "[DEBUG] Attempting to make move",
      move,
      "isMyTurn:",
      isMyTurn,
      "playerColor:",
      playerColor,
      "activeColor:",
      gameState.board.activeColor,
    )

    if (!socket || !isMyTurn) {
      console.log("[DEBUG] Not emitting move: socket or isMyTurn false")
      return
    }

    setIsMyTurn(false)
    setSelectedSquare(null)
    setPossibleMoves([])

    socket.emit("game:makeMove", {
      move: { from: move.from, to: move.to, promotion: move.promotion },
      timestamp: Date.now(),
    })

    console.log("[DEBUG] Move emitted:", { from: move.from, to: move.to, promotion: move.promotion })
  }

  const handleSquarePress = (square: string) => {
    if (selectedSquare === square) {
      setSelectedSquare(null)
      setPossibleMoves([])
      return
    }

    if (selectedSquare && possibleMoves.includes(square)) {
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
            {getPieceComponent(piece, isSmallScreen ? 14 : 16)}
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

  const renderBoard = () => {
    const files = boardFlipped ? [...FILES].reverse() : FILES
    const ranks = boardFlipped ? [...RANKS].reverse() : RANKS

    return (
      <View style={variantStyles.boardContainer}>
        <View style={variantStyles.board}>
          {ranks.map((rank) => (
            <View key={rank} style={variantStyles.row}>
              {files.map((file) => renderSquare(file, rank))}
            </View>
          ))}
        </View>
      </View>
    )
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

    return (
      <View style={[variantStyles.playerInfoContainer, isActivePlayer && variantStyles.activePlayerContainer]}>
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
            {renderCapturedPieces(color)}
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

  // Fix player positioning based on board flip
  // When board is flipped (player is black), black player should be on top
  // When board is not flipped (player is white), white player should be on top
  const topPlayerColor = boardFlipped ? "black" : "white"
  const bottomPlayerColor = boardFlipped ? "white" : "black"

  return (
    <View style={variantStyles.container}>
      {renderPlayerInfo(topPlayerColor, true)}
      {renderBoard()}
      {renderPlayerInfo(bottomPlayerColor, false)}

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

      {renderMoveHistory()}

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
