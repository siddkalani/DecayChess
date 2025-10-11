"use client"

import { getPieceComponent } from "@/app/components"
import { getSocketInstance } from "@/utils/socketManager"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { Alert, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native"
import type { Socket } from "socket.io-client"
import { decayStyles } from "@/app/lib/styles"
import { DecayChessGameProps, GameState, DecayState, Move } from "@/app/lib/types/decay"
import { usePreventEarlyExit } from "@/app/lib/hooks/usePreventEarlyExit"
const screenWidth = Dimensions.get("window").width
const screenHeight = Dimensions.get("window").height
const isTablet = Math.min(screenWidth, screenHeight) > 600
const isSmallScreen = screenWidth < 380

// Improved responsive sizing for better centering
const horizontalPadding = isSmallScreen ? 8 : isTablet ? 20 : 12
const boardSize = screenWidth - horizontalPadding * 2
const squareSize = boardSize / 8

const decayTimerFontSize = isSmallScreen ? 8 : 10
const pieceFontSize = squareSize * (isSmallScreen ? 0.6 : isTablet ? 0.7 : 0.65)



const PIECE_VALUES = {
  p: 1,
  P: 1,
  n: 3,
  N: 3,
  b: 3,
  B: 3,
  r: 5,
  R: 5,
  q: 9,
  Q: 9,
  k: 0,
  K: 0,
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

// Major pieces that can have decay timers (excluding pawns and king)
const MAJOR_PIECES = ["q", "r", "b", "n", "Q", "R", "B", "N"]

// Decay timer constants
const QUEEN_INITIAL_DECAY_TIME = 25000 // 25 seconds
const MAJOR_PIECE_INITIAL_DECAY_TIME = 20000 // 20 seconds
const DECAY_TIME_INCREMENT = 2000 // +2 seconds per additional move

// Format decay timer in MM:SS format
const formatDecayTimeMinutes = (milliseconds: number): string => {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return "0:00"
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

// FIXED: Move safeTimerValue outside component to prevent re-renders
function safeTimerValue(val: any): number {
  const n = Number(val)
  return isNaN(n) || n === undefined || n === null ? 0 : Math.max(0, n)
}

export default function DecayChessGame({ initialGameState, userId, onNavigateToMenu }: DecayChessGameProps) {
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

  // Decay-specific state - FIXED STRUCTURE
  const [decayState, setDecayState] = useState<{
    white: DecayState
    black: DecayState
  }>({
    white: {},
    black: {},
  })

  const [frozenPieces, setFrozenPieces] = useState<{
    white: Set<string>
    black: Set<string>
  }>({
    white: new Set(),
    black: new Set(),
  })

  // Track which queens have moved to activate decay system
  const [queenMoved, setQueenMoved] = useState<{
    white: boolean
    black: boolean
  }>({
    white: false,
    black: false,
  })

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
  }>({})

  // Timer management - FIXED
  const timerRef = useRef<any>(null)
  const decayTimerRef = useRef<any>(null)
  const navigationTimeoutRef = useRef<any>(null)

  usePreventEarlyExit({ socket, isGameActive: gameState.status === "active" })

  const [localTimers, setLocalTimers] = useState<{ white: number; black: number }>({
    white: safeTimerValue(initialGameState.timeControl.timers.white),
    black: safeTimerValue(initialGameState.timeControl.timers.black),
  })

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

  // Helper functions
  const isQueen = useCallback((piece: string): boolean => {
    return piece.toLowerCase() === "q"
  }, [])

  const isMajorPiece = useCallback((piece: string): boolean => {
    return MAJOR_PIECES.includes(piece)
  }, [])

  const getPieceColor = useCallback((piece: string): "white" | "black" => {
    return piece === piece.toUpperCase() ? "white" : "black"
  }, [])

  const getPieceAt = useCallback(
    (square: string): string | null => {
      const fileIndex = FILES.indexOf(square[0])
      const rankIndex = RANKS.indexOf(square[1])
      if (fileIndex === -1 || rankIndex === -1) return null

      const fen = gameState.board.fen || gameState.board.position
      if (!fen) return null

      // Only use the piece placement part (before first space)
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
    },
    [gameState.board.fen, gameState.board.position],
  )

  const isPieceOwnedByPlayer = useCallback((piece: string, color: "white" | "black"): boolean => {
    if (color === "white") {
      return piece === piece.toUpperCase()
    } else {
      return piece === piece.toLowerCase()
    }
  }, [])

  // Utility: Remove decay timers and frozen state for captured pieces
  const cleanupCapturedPieces = useCallback(
    (newBoard: GameState["board"]) => {
      // Get all occupied squares from the new board
      const occupiedSquares = new Set<string>()
      const fen = newBoard.fen || newBoard.position
      if (fen) {
        const piecePlacement = fen.split(" ")[0]
        const rows = piecePlacement.split("/")
        for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
          let fileIdx = 0
          for (const c of rows[rankIdx]) {
            if (c >= "1" && c <= "8") {
              fileIdx += Number.parseInt(c, 10)
            } else {
              if (fileIdx < 8) {
                occupiedSquares.add(`${FILES[fileIdx]}${RANKS[rankIdx]}`)
                fileIdx++
              }
            }
          }
        }
      }

      // Remove decay timers for squares that are no longer occupied
      setDecayState((prev) => {
        const newState = { white: { ...prev.white }, black: { ...prev.black } }
        ;(["white", "black"] as const).forEach((color) => {
          Object.keys(newState[color]).forEach((sq) => {
            if (!occupiedSquares.has(sq)) {
              delete newState[color][sq]
            }
          })
        })
        return newState
      })

      // Remove frozen state for squares that are no longer occupied
      setFrozenPieces((prev) => {
        const newFrozen = { white: new Set(prev.white), black: new Set(prev.black) }
        ;(["white", "black"] as const).forEach((color) => {
          for (const sq of newFrozen[color]) {
            if (!occupiedSquares.has(sq)) {
              console.log(`[UNFREEZE] Removing frozen state from ${sq} (${color})`)
              newFrozen[color].delete(sq)
            }
          }
        })
        return newFrozen
      })
    },
    [], // No dependencies needed as it only uses setters and local variables
  )

  // FIXED: Start decay timer for a piece
  const startDecayTimer = useCallback(
    (square: string, piece: string) => {
      const pieceColor = getPieceColor(piece)
      const isQueenPiece = isQueen(piece)
      const isMajorPieceType = isMajorPiece(piece)

      setDecayState((prev) => {
        const newState = { ...prev }
        const colorState = { ...newState[pieceColor] }
        const existingTimer = colorState[square]

        // ENFORCE RULE: Only one major piece can have a timer at a time
        if (isMajorPieceType && !isQueenPiece) {
          // Check if any other major piece already has a timer for this color
          const hasOtherMajorPieceTimer = Object.entries(colorState).some(([sq, timer]) => {
            if (sq === square) return false // Don't count the current square
            if (!timer || !timer.isActive) return false
            
            // Check if this timer belongs to a major piece (not queen)
            const pieceAtSq = getPieceAt(sq)
            return pieceAtSq && isMajorPiece(pieceAtSq) && !isQueen(pieceAtSq)
          })

          if (hasOtherMajorPieceTimer) {
            console.log(`[DECAY] BLOCKED: Cannot start timer for ${piece} at ${square} - another major piece is already decaying for ${pieceColor}`)
            return prev // Don't start a new timer
          }
        }

        let decayTime: number
        let moveCount: number

        if (existingTimer) {
          // Increment by 2 seconds, cap appropriately
          const maxTime = isQueenPiece ? QUEEN_INITIAL_DECAY_TIME : MAJOR_PIECE_INITIAL_DECAY_TIME
          decayTime = Math.min(existingTimer.timeLeft + DECAY_TIME_INCREMENT, maxTime)
          moveCount = existingTimer.moveCount + 1
        } else {
          // Start with initial value
          decayTime = isQueenPiece ? QUEEN_INITIAL_DECAY_TIME : MAJOR_PIECE_INITIAL_DECAY_TIME
          moveCount = 1
        }

        colorState[square] = {
          timeLeft: decayTime,
          isActive: true,
          moveCount,
          pieceSquare: square,
        }

        newState[pieceColor] = colorState
        return newState
      })

      console.log(
        `[DECAY] Started decay timer for ${piece} at ${square}: ${isQueenPiece ? QUEEN_INITIAL_DECAY_TIME : MAJOR_PIECE_INITIAL_DECAY_TIME}ms`,
      )
    },
    [getPieceColor, isQueen, isMajorPiece, getPieceAt],
  )

  // FIXED: Freeze a piece when decay timer expires
  const freezePiece = useCallback((square: string, color: "white" | "black") => {
    console.log(`[DECAY] Freezing piece at ${square} for ${color}`)
    setFrozenPieces((prev) => {
      const newFrozen = { ...prev }
      newFrozen[color] = new Set([...newFrozen[color], square])
      return newFrozen
    })

    // Remove the decay timer when piece is frozen
    setDecayState((prev) => {
      const newState = { ...prev }
      const colorState = { ...newState[color] }
      delete colorState[square]
      newState[color] = colorState
      return newState
    })
  }, [])

  // FIXED: Move piece in decay state when a move is made
  const movePieceInDecayState = useCallback(
    (from: string, to: string, piece: string) => {
      const pieceColor = getPieceColor(piece)
      const opponentColor = pieceColor === "white" ? "black" : "white"

      setDecayState((prev) => {
        const newState = { ...prev }
        const colorState = { ...newState[pieceColor] }

        // If the piece being moved has a decay timer, move it to the new square
        if (colorState[from]) {
          colorState[to] = {
            ...colorState[from],
            pieceSquare: to,
            isActive: true,
          }
          delete colorState[from]
          console.log(`[DECAY] Moved timer from ${from} to ${to} for ${piece}`)
        }

        newState[pieceColor] = colorState
        return newState
      })

      setFrozenPieces((prev) => {
        const newFrozen = { ...prev }

        // --- FIX: Always remove opponent's frozen state from the destination square ---
        if (newFrozen[opponentColor].has(to)) {
          newFrozen[opponentColor] = new Set(newFrozen[opponentColor])
          newFrozen[opponentColor].delete(to)
        }

        // Only transfer frozen state if the moving piece was frozen
        if (newFrozen[pieceColor].has(from)) {
          newFrozen[pieceColor] = new Set(newFrozen[pieceColor])
          newFrozen[pieceColor].delete(from)
          newFrozen[pieceColor].add(to)
        }

        return newFrozen
      })
    },
    [getPieceColor],
  )

  // FIXED: Handle decay logic for a move - CORE REQUIREMENT IMPLEMENTATION
  const handleDecayMove = useCallback(
    (from: string, to: string, piece?: string) => {
      const movedPiece = piece || getPieceAt(from)
      if (!movedPiece) return

      const pieceColor = getPieceColor(movedPiece)

      // Move the piece in decay state first
      movePieceInDecayState(from, to, movedPiece)

      // Handle queen moves - CORE REQUIREMENT
      if (isQueen(movedPiece)) {
        // Mark that this color's queen has moved
        setQueenMoved((prev) => ({ ...prev, [pieceColor]: true }))

        // Start or update decay timer for queen
        startDecayTimer(to, movedPiece)
        console.log(`[DECAY] Queen moved for ${pieceColor}, decay timer started/updated`)
      }
      // Handle major piece moves (only after queen has moved for this color)
      else if (isMajorPiece(movedPiece)) {
        // Check if queen has moved and is either frozen or not present on the board
        const queenSquares = Array.from({ length: 8 * 8 }, (_, i) => {
          const file = FILES[i % 8]
          const rank = RANKS[Math.floor(i / 8)]
          return `${file}${rank}`
        })

        const queenOnBoard = queenSquares.some((sq) => {
          const piece = getPieceAt(sq)
          return piece && isQueen(piece) && getPieceColor(piece) === pieceColor
        })

        const hasQueenFrozen = Array.from(frozenPieces[pieceColor]).some((square) => {
          const piece = getPieceAt(square)
          return piece && isQueen(piece)
        })

        // Only start decay timer if queen has moved and is either frozen or not present
        if (queenMoved[pieceColor] && (hasQueenFrozen || !queenOnBoard)) {
          // ENFORCE RULE: Check if another major piece is already decaying
          let canStartTimer = true
          
          setDecayState((prev) => {
            const colorState = prev[pieceColor]
            const hasOtherMajorPieceTimer = Object.entries(colorState).some(([sq, timer]) => {
              if (sq === to) return false // Don't count the destination square
              if (!timer || !timer.isActive) return false
              
              // Check if this timer belongs to a major piece (not queen)
              const pieceAtSq = getPieceAt(sq)
              return pieceAtSq && isMajorPiece(pieceAtSq) && !isQueen(pieceAtSq)
            })
            
            if (hasOtherMajorPieceTimer) {
              canStartTimer = false
              console.log(`[DECAY] BLOCKED: Cannot start timer for ${movedPiece} at ${to} - another major piece is already decaying for ${pieceColor}`)
            }
            
            return prev
          })

          if (canStartTimer) {
            startDecayTimer(to, movedPiece)
            console.log(`[DECAY] Major piece ${movedPiece} moved for ${pieceColor}, decay timer started`)
          }
        }
      }
    },
    [
      getPieceAt,
      getPieceColor,
      movePieceInDecayState,
      isQueen,
      isMajorPiece,
      startDecayTimer,
      frozenPieces,
      queenMoved,
    ],
  )

  // FIXED: Decay timer countdown effect
  useEffect(() => {
    if (decayTimerRef.current) {
      clearInterval(decayTimerRef.current)
    }

    if (gameState.status !== "active") {
      return
    }

    console.log("[DECAY] Setting up decay timer management")

    decayTimerRef.current = setInterval(() => {
      setDecayState((prev) => {
        const newState = { ...prev }
        let hasChanges = false

        // Handle both players' timers
        ;["white", "black"].forEach((color) => {
          const colorState = { ...newState[color as "white" | "black"] }
          const isPlayerTurn = gameState.board.activeColor === color

          Object.keys(colorState).forEach((square) => {
            const timer = colorState[square]
            if (timer && timer.timeLeft > 0 && timer.isActive) {
              // Only countdown during player's turn
              if (isPlayerTurn) {
                timer.timeLeft = Math.max(0, timer.timeLeft - 100)
                hasChanges = true

                // Log timer updates for debugging
                if (timer.timeLeft % 1000 === 0) {
                  console.log(`[DECAY] ${color} ${square}: ${Math.floor(timer.timeLeft / 1000)}s remaining`)
                }

                // Freeze piece if timer expires
                if (timer.timeLeft <= 0) {
                  console.log(`[DECAY] Timer expired for piece at ${square}`)
                  setTimeout(() => freezePiece(square, color as "white" | "black"), 0)
                }
              }
            }
          })

          newState[color as "white" | "black"] = colorState
        })

        return hasChanges ? newState : prev
      })
    }, 100) // Update every 100ms

    return () => {
      if (decayTimerRef.current) {
        clearInterval(decayTimerRef.current)
        console.log("[DECAY] Cleared decay timer interval")
      }
    }
  }, [gameState.status, gameState.board.activeColor, freezePiece])

  // Function to handle game ending
  const handleGameEnd = useCallback(
    (
      result: string,
      winner: string | null,
      endReason: string,
      details?: { moveSan?: string; moveMaker?: string; winnerName?: string | null },
    ) => {
      console.log("[GAME END] Result:", result, "Winner:", winner, "Reason:", endReason)

      // Stop all timers
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (decayTimerRef.current) {
        clearInterval(decayTimerRef.current)
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

      // Determine if current player won
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
      }, 5000)
    },
    [playerColor, socket, onNavigateToMenu, router],
  )

  // Function to manually navigate to menu
  const navigateToMenu = useCallback(() => {
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
  }, [socket, onNavigateToMenu, router])

  // Initialize game
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

    // Initial player color and board orientation
    const userColor = gameState.userColor[userId]
    const safePlayerColor = userColor === "white" || userColor === "black" ? userColor : "white"
    setPlayerColor(safePlayerColor)
    setBoardFlipped(safePlayerColor === "black")
    setIsMyTurn(gameState.board.activeColor === safePlayerColor)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (decayTimerRef.current) {
        clearInterval(decayTimerRef.current)
      }
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [gameState.userColor, userId, gameState.board.activeColor])

  // Update player state when game state changes
  useEffect(() => {
    const userColor = gameState.userColor[userId]
    const safePlayerColor = userColor === "white" || userColor === "black" ? userColor : "white"
    setPlayerColor(safePlayerColor)
    setBoardFlipped(safePlayerColor === "black")
    setIsMyTurn(gameState.board.activeColor === safePlayerColor)
  }, [gameState, userId])

  // FIXED: Improved timer effect with proper turn-based countdown
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (gameState.status !== "active" || gameState.gameState?.gameEnded) {
      return
    }

    // Get baseTime and increment from backend
    const baseTime = safeTimerValue(gameState.timeControl?.baseTime)
    const maxTime = baseTime

    // Clamp timers to maxTime
    const currentWhiteTime = Math.min(safeTimerValue(gameState.timeControl.timers.white), maxTime)
    const currentBlackTime = Math.min(safeTimerValue(gameState.timeControl.timers.black), maxTime)
    
    // Use the server timer values directly without modification
    lastServerSync.current = {
      white: currentWhiteTime,
      black: currentBlackTime,
      activeColor: gameState.board.activeColor,
      timestamp: Date.now(),
      turnStartTime: gameState.board.turnStartTimestamp || Date.now(),
      isFirstMove: (gameState.moves?.length || 0) === 0,
    }

    // Set initial timer values from server
    setLocalTimers({
      white: currentWhiteTime,
      black: currentBlackTime,
    })

    // Only start countdown if game has moves (not the very first move)
    if ((gameState.moves?.length || 0) > 0) {
      timerRef.current = setInterval(() => {
        setLocalTimers((prev) => {
          let newWhite = lastServerSync.current.white
          let newBlack = lastServerSync.current.black
          const now = Date.now()
          const elapsed = now - lastServerSync.current.timestamp

          if (lastServerSync.current.activeColor === "white") {
            newWhite = Math.max(0, Math.min(lastServerSync.current.white - elapsed, maxTime))
            newBlack = Math.min(lastServerSync.current.black, maxTime)
          } else {
            newBlack = Math.max(0, Math.min(lastServerSync.current.black - elapsed, maxTime))
            newWhite = Math.min(lastServerSync.current.white, maxTime)
          }

          // End game if timer runs out
          if (newWhite <= 0 && !gameState.gameState?.gameEnded) {
            handleGameEnd("timeout", "black", "White ran out of time")
            return { white: 0, black: newBlack }
          }
          if (newBlack <= 0 && !gameState.gameState?.gameEnded) {
            handleGameEnd("timeout", "white", "Black ran out of time")
            return { white: newWhite, black: 0 }
          }

          return { white: newWhite, black: newBlack }
        })
      }, 100)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
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
    handleGameEnd,
    gameState.timeControl?.baseTime,
    gameState.timeControl?.increment,
  ])

  // Socket event handlers (keeping all the existing logic)
  const handleGameMove = useCallback(
    (data: any) => {
      console.log("[MOVE] Move received:", data)
      if (data && data.gameState) {
        // Handle decay logic for the moved piece
        if (data.move && data.move.from && data.move.to) {
          const movedPiece = getPieceAt(data.move.from)
          handleDecayMove(data.move.from, data.move.to, movedPiece === null ? undefined : movedPiece)
        }

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

        // Update server sync reference with the actual server timer values
        const now = Date.now()
        lastServerSync.current = {
          white: newWhiteTime,
          black: newBlackTime,
          activeColor: data.gameState.board.activeColor,
          timestamp: now,
          turnStartTime: data.gameState.board.turnStartTimestamp || now,
          isFirstMove: (data.gameState.moves?.length || 0) === 0,
        }

        // Update local timers immediately to the server values
        setLocalTimers({
          white: newWhiteTime,
          black: newBlackTime,
        })

        // Check if the game has ended
        if (
          data.gameState.gameState?.gameEnded ||
          data.gameState.gameState?.checkmate ||
          data.gameState.status === "ended" ||
          data.gameState.shouldNavigateToMenu
        ) {
          const result = data.gameState.gameState?.result || data.gameState.result || "unknown"
          let winner = data.gameState.gameState?.winner || data.gameState.winner

          if (result === "checkmate") {
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

        // Clean up decay/frozen state for captured pieces
        cleanupCapturedPieces(data.gameState.board)

        // Update local timers
        setLocalTimers({
          white: newWhiteTime,
          black: newBlackTime,
        })

        setMoveHistory(data.gameState.moves || [])
        setSelectedSquare(null)
        setPossibleMoves([])

        // Update turn state
        const userColor = data.gameState.userColor ? data.gameState.userColor[userId] : playerColor
        const activeColor = data.gameState.board.activeColor
        const newIsMyTurn = activeColor === userColor
        setIsMyTurn(newIsMyTurn)
      }
    },
    [
      handleDecayMove,
      getPieceAt,
      gameState.timeControl.timers,
      handleGameEnd,
      userId,
      playerColor,
      cleanupCapturedPieces,
    ],
  )

  const handlePossibleMoves = useCallback((data: { square: string; moves: any[] }) => {
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
  }, [])

  const handleGameStateUpdate = useCallback(
    (data: any) => {
      console.log("Game state update:", data)
      if (data && data.gameState) {
        // Check for game ending
        if (
          data.gameState.gameState?.gameEnded ||
          data.gameState.status === "ended" ||
          data.gameState.shouldNavigateToMenu
        ) {
          const result = data.gameState.gameState?.result || data.gameState.result || "unknown"
          const winner = data.gameState.gameState?.winner || data.gameState.winner
          const endReason = data.gameState.gameState?.endReason || data.gameState.endReason || result
          handleGameEnd(result, winner, endReason)
          return
        }

        // Update server sync reference
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
    },
    [handleGameEnd, playerColor],
  )

  const handleTimerUpdate = useCallback(
    (data: any) => {
      console.log("Timer update:", data)

      // Check for game ending in timer update
      if (data.gameEnded || data.shouldNavigateToMenu) {
        const result = data.endReason || "timeout"
        const winner = data.winner
        handleGameEnd(result, winner, result)
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

      // Update server sync reference
      lastServerSync.current = {
        white: whiteTime,
        black: blackTime,
        activeColor: gameState.board.activeColor,
        timestamp: Date.now(),
        turnStartTime: Date.now(),
        isFirstMove: (gameState.moves?.length || gameState.board?.moveHistory?.length || 0) === 0,
      }

      // Update local timers immediately
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
    },
    [handleGameEnd, gameState.board.activeColor, gameState.moves?.length, gameState.board?.moveHistory?.length],
  )

  const handleGameEndEvent = useCallback(
    (data: any) => {
      console.log("Game end event received:", data)
      const result = data.gameState?.gameState?.result || data.gameState?.result || data.result || "unknown"
      const winner = data.gameState?.gameState?.winner || data.gameState?.winner || data.winner
      const endReason = data.gameState?.gameState?.endReason || data.gameState?.endReason || data.endReason || result
      handleGameEnd(result, winner, endReason)
    },
    [handleGameEnd],
  )

  const handleGameError = useCallback((data: any) => {
    console.log("Game error:", data)
    Alert.alert("Error", data.message || data.error || "An error occurred")
  }, [])

  const handleGameWarning = useCallback((data: any) => {
    console.warn("[GAME WARNING] Received warning:", data)
    setGameState((prev) => ({ ...prev, gameState: data.gameState }))
    Alert.alert("Game Warning", data.message || "An unexpected warning occurred.")
  }, [])

  // Set up socket event listeners
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
  }, [
    socket,
    handleGameMove,
    handlePossibleMoves,
    handleGameStateUpdate,
    handleTimerUpdate,
    handleGameEndEvent,
    handleGameError,
    handleGameWarning,
  ])

  // Game interaction functions
  const requestPossibleMoves = useCallback(
    (square: string) => {
      if (!socket) return
      socket.emit("game:getPossibleMoves", { square })
    },
    [socket],
  )

  const makeMove = useCallback(
    (move: Move) => {
      console.log("[DEBUG] Attempting to make move", move, "isMyTurn:", isMyTurn)
      if (!socket || !isMyTurn) {
        console.log("[DEBUG] Not emitting move: socket or isMyTurn false")
        return
      }

      // Check if the piece is frozen
      if (frozenPieces[playerColor].has(move.from)) {
        Alert.alert("Frozen Piece", "This piece is frozen due to decay and cannot be moved!")
        return
      }

      // Immediately update local state to show move was made (optimistic update)
      setIsMyTurn(false)
      setSelectedSquare(null)
      setPossibleMoves([])

      socket.emit("game:makeMove", {
        move: { from: move.from, to: move.to, promotion: move.promotion },
        timestamp: Date.now(),
      })

      console.log("[DEBUG] Move emitted:", { from: move.from, to: move.to, promotion: move.promotion })
    },
    [socket, isMyTurn, frozenPieces, playerColor],
  )

  const handleSquarePress = useCallback(
    (square: string) => {
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
          const options = ["q", "r", "b", "n"] // queen, rook, bishop, knight
          setPromotionModal({ visible: true, from: selectedSquare, to: square, options })
          return
        }

        makeMove({ from: selectedSquare, to: square })
        setSelectedSquare(null)
        setPossibleMoves([])
        return
      }

      // Only allow selecting a piece if it's the player's turn and the piece belongs to them
      const piece = getPieceAt(square)
      if (isMyTurn && piece && isPieceOwnedByPlayer(piece, playerColor)) {
        // Check if the piece is frozen
        if (frozenPieces[playerColor].has(square)) {
          Alert.alert("Frozen Piece", "This piece is frozen due to decay and cannot be moved!")
          return
        }

        setSelectedSquare(square)
        requestPossibleMoves(square)
      } else {
        setSelectedSquare(null)
        setPossibleMoves([])
      }
    },
    [
      selectedSquare,
      possibleMoves,
      isMyTurn,
      playerColor,
      frozenPieces,
      makeMove,
      requestPossibleMoves,
      getPieceAt,
      isPieceOwnedByPlayer,
    ],
  )

  // Handle promotion selection
  const handlePromotionSelect = useCallback(
    (promotion: string) => {
      if (promotionModal) {
        makeMove({ from: promotionModal.from, to: promotionModal.to, promotion })
        setPromotionModal(null)
        setSelectedSquare(null)
        setPossibleMoves([])
      }
    },
    [promotionModal, makeMove],
  )

  // Correct FEN parsing for piece lookup
  const formatTime = useCallback((milliseconds: number): string => {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) return "0:00"
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  // Calculate material advantage
  const calculateMaterialAdvantage = useCallback(() => {
    const capturedPieces = gameState.board.capturedPieces || { white: [], black: [] }
    let whiteAdvantage = 0
    let blackAdvantage = 0

    capturedPieces.white.forEach((piece) => {
      whiteAdvantage += PIECE_VALUES[piece.toLowerCase() as keyof typeof PIECE_VALUES] || 0
    })

    capturedPieces.black.forEach((piece) => {
      blackAdvantage += PIECE_VALUES[piece.toUpperCase() as keyof typeof PIECE_VALUES] || 0
    })

    return { white: whiteAdvantage, black: blackAdvantage }
  }, [gameState.board.capturedPieces])

  const renderCapturedPieces = useCallback(
    (color: "white" | "black") => {
      const capturedPieces = gameState.board.capturedPieces || { white: [], black: [] }
      const pieces = capturedPieces[color] || []
      if (pieces.length === 0) return null

      // Group pieces by type and count them
      const pieceCounts: { [key: string]: number } = {}
      pieces.forEach((piece) => {
        const pieceType = color === "white" ? piece.toLowerCase() : piece.toUpperCase()
        pieceCounts[pieceType] = (pieceCounts[pieceType] || 0) + 1
      })

      return (
        <View style={decayStyles.capturedPieces}>
          {Object.entries(pieceCounts).map(([piece, count]) => (
            <View key={piece} style={decayStyles.capturedPieceGroup}>
              {getPieceComponent(piece, isSmallScreen ? 14 : 16)}
              {count > 1 && <Text style={decayStyles.capturedCount}>{count}</Text>}
            </View>
          ))}
        </View>
      )
    },
    [gameState.board.capturedPieces],
  )

  const renderSquare = useCallback(
    (file: string, rank: string) => {
      const square = `${file}${rank}`
      const isLight = (FILES.indexOf(file) + Number.parseInt(rank)) % 2 === 0
      const isSelected = selectedSquare === square
      const isPossibleMove = possibleMoves.includes(square)

      // Check for last move highlighting
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

      const piece = getPieceAt(square)

      // Check if this piece has an active decay timer
      const pieceColor = piece ? getPieceColor(piece) : null
      const hasActiveDecayTimer = pieceColor && decayState[pieceColor][square]?.isActive
      const decayTimeLeft = hasActiveDecayTimer ? decayState[pieceColor][square].timeLeft : 0

      // Check if this piece is frozen
      const isFrozen = pieceColor && frozenPieces[pieceColor].has(square)

      // Determine border color and width
      let borderColor = "transparent"
      let borderWidth = 0

      if (isFrozen) {
        borderColor = "#dc2626" // Red for frozen pieces
        borderWidth = 2
      } else if (isPossibleMove) {
        borderColor = "#16a34a" // Green for possible moves
        borderWidth = 2
      } else if (isSelected) {
        borderColor = "#2563eb" // Blue for selected
        borderWidth = 2
      } else if (isLastMove) {
        borderColor = "#f59e0b" // Yellow for last move
        borderWidth = 1
      } else if (hasActiveDecayTimer) {
        borderColor = "#ea580c" // Orange for decay timer
        borderWidth = 1
      }

      return (
        <View key={square} style={{ position: "relative" }}>
          {/* Decay timer display above the square */}
          {hasActiveDecayTimer && decayTimeLeft > 0 && (
            <View
              style={[
                decayStyles.decayTimerAbove,
                {
                  width: squareSize,
                  left: 0,
                  top: isSmallScreen ? -20 : -24, // Position above the square
                },
              ]}
            >
              <View style={decayStyles.decayTimerBox}>
                <Text style={[decayStyles.decayTimerBoxText, { fontSize: decayTimerFontSize }]}>
                  {formatDecayTimeMinutes(decayTimeLeft)}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              decayStyles.square,
              {
                width: squareSize,
                height: squareSize,
                backgroundColor: isLight ? "#F0D9B5" : "#769656", // Chess.com colors
                borderWidth: borderWidth,
                borderColor: borderColor,
              },
            ]}
            onPress={() => handleSquarePress(square)}
          >
            {/* Coordinate labels */}
            {file === "a" && (
              <Text
                style={[
                  decayStyles.coordinateLabel,
                  decayStyles.rankLabel,
                  {
                    color: isLight ? "#769656" : "#F0D9B5",
                    fontSize: isSmallScreen ? 8 : 10,
                  },
                ]}
              >
                {rank}
              </Text>
            )}
            {rank === "1" && (
              <Text
                style={[
                  decayStyles.coordinateLabel,
                  decayStyles.fileLabel,
                  {
                    color: isLight ? "#769656" : "#F0D9B5",
                    fontSize: isSmallScreen ? 8 : 10,
                  },
                ]}
              >
                {file}
              </Text>
            )}

            {/* Piece */}
            {piece && (
              <View
                style={{
                  opacity: isFrozen ? 0.6 : 1,
                }}
              >
                {getPieceComponent(piece, pieceFontSize)}
              </View>
            )}

            {/* Frozen indicator */}
            {isFrozen && (
              <View style={[decayStyles.frozenIndicator, { width: squareSize * 0.25, height: squareSize * 0.25 }]}>
                <Text style={[decayStyles.frozenText, { fontSize: squareSize * 0.15 }]}>❄️</Text>
              </View>
            )}

            {/* Move indicators */}
            {isPossibleMove && !piece && (
              <View
                style={[
                  decayStyles.possibleMoveDot,
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
                  decayStyles.captureIndicator,
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
    },
    [
      selectedSquare,
      possibleMoves,
      gameState.board,
      gameState.lastMove,
      getPieceAt,
      getPieceColor,
      decayState,
      frozenPieces,
      handleSquarePress,
    ],
  )

  // Render game info (check, checkmate, stalemate, etc.)
  const renderGameInfo = useCallback(() => {
    const gs = gameState.gameState || {}

    // Check if game has ended
    if (gameState.status === "ended" || gs.gameEnded) {
      return (
        <View style={decayStyles.gameStatusContainer}>
          <Text style={decayStyles.gameOverText}>🏁 Game Ended 🏁</Text>
        </View>
      )
    }

    // Show whose turn it is
    const activePlayerName = gameState.players[gameState.board.activeColor]?.username || gameState.board.activeColor
    const isMyTurnActive = gameState.board.activeColor === playerColor

    return
  }, [gameState.status, gameState.gameState, gameState.players, gameState.board.activeColor, playerColor])

  // FIXED: Render board with proper structure
  const renderBoard = useCallback(() => {
    const files = boardFlipped ? [...FILES].reverse() : FILES
    const ranks = boardFlipped ? [...RANKS].reverse() : RANKS

    return (
      <View style={decayStyles.boardContainer}>
        <View style={decayStyles.board}>
          {ranks.map((rank) => (
            <View key={rank} style={decayStyles.row}>
              {files.map((file) => renderSquare(file, rank))}
            </View>
          ))}
        </View>
      </View>
    )
  }, [boardFlipped, renderSquare])

  const renderPlayerInfo = useCallback(
    (color: "white" | "black") => {
      const player = gameState.players[color]
      if (!player) {
        return (
          <View style={decayStyles.playerInfoContainer}>
            <Text style={decayStyles.playerName}>Unknown Player</Text>
          </View>
        )
      }

      // Use localTimers for smooth UI countdown
      const timer = safeTimerValue(localTimers[color])
      const isActive = gameState.board.activeColor === color && gameState.status === "active"
      const isMe = playerColor === color
      const materialAdvantage = calculateMaterialAdvantage()
      const advantage = materialAdvantage[color] - materialAdvantage[color === "white" ? "black" : "white"]

      // Count active decay timers and frozen pieces for this player
      const activeDecayTimers = Object.values(decayState[color]).filter((timer) => timer.isActive).length
      const frozenPiecesCount = frozenPieces[color].size

      return (
        <View style={[decayStyles.playerInfoContainer, isActive && decayStyles.activePlayerContainer]}>
          <View style={decayStyles.playerHeader}>
            <View style={decayStyles.playerDetails}>
              <View style={decayStyles.playerNameRow}>
                <View style={decayStyles.playerAvatar}>
                  <Text style={decayStyles.playerAvatarText}>{player.username.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={decayStyles.playerNameContainer}>
                  <Text style={[decayStyles.playerName, isActive && decayStyles.activePlayerName]} numberOfLines={1}>
                    {player.username}
                  </Text>
                  <Text style={decayStyles.playerRating}>({player.rating > 0 ? player.rating : "Unrated"})</Text>
                </View>
                {isMe && <Text style={decayStyles.youIndicator}>(You)</Text>}
              </View>
              {/* Decay status */}
              {(activeDecayTimers > 0 || frozenPiecesCount > 0) && (
                <View style={decayStyles.decayStatus}>
                  {activeDecayTimers > 0 && <Text style={decayStyles.decayStatusText}>⏱️ {activeDecayTimers} decaying</Text>}
                  {frozenPiecesCount > 0 && <Text style={decayStyles.frozenStatusText}>❄️ {frozenPiecesCount} frozen</Text>}
                </View>
              )}
            </View>
            <View style={[decayStyles.timerContainer, isActive && decayStyles.activeTimerContainer]}>
              <Text style={[decayStyles.timerText, isActive && decayStyles.activeTimerText]}>{formatTime(timer)}</Text>
            </View>
          </View>
          {renderCapturedPieces(color)}
        </View>
      )
    },
    [
      gameState.players,
      gameState.board.activeColor,
      gameState.status,
      playerColor,
      localTimers,
      calculateMaterialAdvantage,
      decayState,
      frozenPieces,
      formatTime,
      renderCapturedPieces,
    ],
  )

  const renderMoveHistory = useCallback(() => {
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
        <View style={decayStyles.modalOverlay}>
          <View style={decayStyles.moveHistoryModal}>
            <View style={decayStyles.moveHistoryHeader}>
              <Text style={decayStyles.moveHistoryTitle}>📜 Move History</Text>
              <TouchableOpacity onPress={() => setShowMoveHistory(false)} style={decayStyles.closeButton}>
                <Text style={decayStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={decayStyles.moveHistoryScroll}>
              {movePairs.map((pair, index) => (
                <View key={index} style={decayStyles.moveRow}>
                  <Text style={decayStyles.moveNumber}>{pair.moveNumber}.</Text>
                  <Text style={decayStyles.moveText}>{pair.white}</Text>
                  <Text style={decayStyles.moveText}>{pair.black}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  }, [showMoveHistory, moveHistory])

  // FIXED: Consistent player positioning - each player always sees themselves at bottom
  const opponentColor = playerColor === "white" ? "black" : "white"

  return (
    <View style={decayStyles.container}>
      {/* Opponent Player (always at top) */}
      {renderPlayerInfo(opponentColor)}

      {/* Game Status */}
      {renderGameInfo()}

      {/* Chess Board - Centered */}
      {renderBoard()}

      {/* Current Player (always at bottom) */}
      {renderPlayerInfo(playerColor)}

      {/* Bottom Control Bar */}
      <View style={decayStyles.bottomBar}>
        <TouchableOpacity style={decayStyles.bottomBarButton} onPress={() => setShowMoveHistory(true)}>
          <Text style={decayStyles.bottomBarIcon}>≡</Text>
          <Text style={decayStyles.bottomBarLabel}>Moves</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={decayStyles.bottomBarButton}
          onPress={() => {
            if (socket && gameState.status === "active") {
              socket.emit("game:resign")
            }
          }}
        >
          <Text style={decayStyles.bottomBarIcon}>✕</Text>
          <Text style={decayStyles.bottomBarLabel}>Resign</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={decayStyles.bottomBarButton}
          onPress={() => {
            if (socket && gameState.status === "active") {
              socket.emit("game:offerDraw")
            }
          }}
        >
          <Text style={decayStyles.bottomBarIcon}>½</Text>
          <Text style={decayStyles.bottomBarLabel}>Draw</Text>
        </TouchableOpacity>
      </View>

      {/* Move History Modal */}
      {renderMoveHistory()}

      {/* Promotion Modal */}
      {promotionModal && (
        <Modal visible={promotionModal.visible} transparent animationType="slide">
          <View style={decayStyles.modalOverlay}>
            <View style={decayStyles.promotionModal}>
              <Text style={decayStyles.promotionTitle}>Choose Promotion</Text>
              <View style={decayStyles.promotionOptions}>
                {promotionModal.options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={decayStyles.promotionOption}
                    onPress={() => handlePromotionSelect(option)}
                  >
                    {getPieceComponent(
                      playerColor === "white" ? option.toUpperCase() : option,
                      isSmallScreen ? 28 : 32,
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Game End Modal */}
      <Modal visible={showGameEndModal} transparent animationType="slide">
        <View style={decayStyles.modalOverlay}>
          <View
            style={[
              decayStyles.gameEndModal,
              isWinner === true && decayStyles.victoryModal,
              isWinner === false && decayStyles.defeatModal,
            ]}
          >
            <Text
              style={[
                decayStyles.gameEndTitle,
                isWinner === true && decayStyles.victoryTitle,
                isWinner === false && decayStyles.defeatTitle,
              ]}
            >
              {isWinner === true ? "🎉 VICTORY! 🎉" : isWinner === false ? "😔 DEFEAT 😔" : "🏁 GAME OVER 🏁"}
            </Text>
            <Text style={decayStyles.gameEndMessage}>{gameEndMessage}</Text>
            {gameEndDetails.reason && <Text style={decayStyles.gameEndReason}>Reason: {gameEndDetails.reason}</Text>}
            {gameEndDetails.moveSan && (
              <Text style={decayStyles.gameEndMove}>
                Move: {gameEndDetails.moveSan} by {gameEndDetails.moveMaker}
              </Text>
            )}
            {gameEndDetails.winnerName && <Text style={decayStyles.gameEndWinner}>Winner: {gameEndDetails.winnerName}</Text>}
            <TouchableOpacity style={decayStyles.menuButton} onPress={navigateToMenu}>
              <Text style={decayStyles.menuButtonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}
