import {
  getLegalMoves as legalMovesBlitz,
  validateAndApplyMove as validateBlitz,
} from "../validations/classic/blitz.js"
import {
  getLegalMoves as legalMovesBullet,
  validateAndApplyMove as validateBullet,
} from "../validations/classic/bullet.js"
import {
  validateAndApplyMove as validateStandard,
  getLegalMoves as legalMovesStandard,
} from "../validations/classic/standard.js"
import {
  getCrazyhouseStandardLegalMoves as legalMovesCzyStnd,
  validateAndApplyCrazyhouseStandardMove as validateCzyStd,
} from "../validations/crazyhouse/crazyhouseStandard.js"
import {
  validateAndApplyCrazyhouseMove as validateCzyTimer,
  getCrazyhouseLegalMoves as legalMovesCzyTimer,
  getCurrentCrazyhouseTimers,
  serializeCrazyhouseState,
  deserializeCrazyhouseState,
  getPocketStatus,
  getAvailableDropPieces,
  expireDropPieces,
} from "../validations/crazyhouse/crazyhouseTimer.js"
import { getDecayLegalMoves, validateAndApplyDecayMove } from "../validations/decay.js"
import {
  getLegalMoves as legalMovesSixPointer,
  validateAndApplyMove as validateSixPointer,
} from "../validations/sixPointer.js"
import { getSessionById, updateGameState } from "./session.controller.js"

// Make a move
export async function makeMove({ sessionId, userId, move, timestamp, variant, subvariant }) {
  console.log("Making move:", move, "for user:", userId, "at timestamp:", timestamp)
  const session = await getSessionById(sessionId)
  if (!session) return { type: "game:error", message: "Session not found" }

  // Ensure gameState exists and is active
  if (!session.gameState || session.gameState.status !== "active") {
    return { type: "game:error", message: "Game is not active or invalid state" }
  }

  const gameState = session.gameState

  // Clamp timers to baseTime + increment for classic/standard
  if (variant === "classic") {
    const baseTime = gameState.timeControl?.baseTime
    const increment = gameState.timeControl?.increment
    for (const color of ["white", "black"]) {
      if (typeof gameState.board[`${color}Time`] === "number") {
        const maxTime = baseTime
        gameState.board[`${color}Time`] = Math.min(gameState.board[`${color}Time`], maxTime)
      }
    }
    // Start timer for active player immediately
    const activeColor = gameState.board.activeColor
    if (gameState.board.timers && gameState.board.timers[activeColor]) {
      gameState.board.timers[activeColor].isRunning = true
      gameState.board.timers[activeColor].lastUpdateTime = timestamp || Date.now()
    }
    const opponentColor = activeColor === "white" ? "black" : "white"
    if (gameState.board.timers && gameState.board.timers[opponentColor]) {
      gameState.board.timers[opponentColor].isRunning = false
    }
  }

  const color =
    gameState.players.white.userId === userId ? "white" : gameState.players.black.userId === userId ? "black" : null
  if (!color) return { type: "game:error", message: "User not a player in this game" }

  // Initialize arrays/objects if missing
  gameState.moves = gameState.moves || []
  gameState.positionHistory = gameState.positionHistory || []
  gameState.metadata = gameState.metadata || {}
  gameState.metadata.drawOffers = gameState.metadata.drawOffers || { white: false, black: false }

  // Initialize crazyhouse-specific properties if this is a crazyhouse game
  if (variant === "crazyhouse") {
    if (!gameState.board.pocketedPieces) {
      gameState.board.pocketedPieces = { white: [], black: [] }
    }
    if (subvariant === "withTimer") {
      // Deserialize Maps if they come from a plain object (e.g., database)
      gameState.board = deserializeCrazyhouseState(gameState.board)
      if (!gameState.board.dropTimers) {
        gameState.board.dropTimers = { white: new Map(), black: new Map() }
      }
      if (!gameState.board.repetitionMap) {
        gameState.board.repetitionMap = new Map()
      }
      gameState.board.whiteTime = gameState.board.whiteTime ?? 180000
      gameState.board.blackTime = gameState.board.blackTime ?? 180000
      gameState.board.increment = gameState.board.increment ?? 2000
      gameState.board.turnStartTimestamp = gameState.board.turnStartTimestamp ?? timestamp
      gameState.board.lastMoveTimestamp = gameState.board.lastMoveTimestamp ?? timestamp
      gameState.board.gameStarted = gameState.board.gameStarted ?? false
      gameState.board.firstMoveTimestamp = gameState.board.firstMoveTimestamp ?? null
      if (!gameState.board.frozenPieces) {
        gameState.board.frozenPieces = { white: [], black: [] }
      }
    }
  }

  const now = timestamp || Date.now()

  // SixPointer timer logic
  if (variant === "sixpointer") {
    if (!gameState.board.timers) {
      gameState.board.timers = {
        white: { remaining: 30000, lastUpdateTime: now, isRunning: true },
        black: { remaining: 30000, lastUpdateTime: now, isRunning: false },
      }
    }
    gameState.board.whiteTime = gameState.board.whiteTime ?? 30000
    gameState.board.blackTime = gameState.board.blackTime ?? 30000

    const currentSixPointerPlayerTime = gameState.board.timers[color].remaining
    const elapsed = now - (gameState.board.timers[color].lastUpdateTime || now)
    gameState.board.timers[color].remaining = Math.max(0, currentSixPointerPlayerTime - elapsed)
    gameState.board[`${color}Time`] = gameState.board.timers[color].remaining

    let timeoutPenaltyApplied = false
    if (gameState.board.timers[color].remaining <= 0) {
      // Apply a -1 point penalty but do NOT abort the incoming move.
      // The move will still be validated/applied and counted (+1 move),
      // while the player's points are reduced by 1.
      gameState.board.points = gameState.board.points || { white: 0, black: 0 }
      gameState.board.points[color] = Math.max(0, (gameState.board.points[color] || 0) - 1)

      // Track timeout penalties for auditing/UI
      gameState.board.timeoutPenalties = gameState.board.timeoutPenalties || { white: 0, black: 0 }
      gameState.board.timeoutPenalties[color] = (gameState.board.timeoutPenalties[color] || 0) + 1

      // Record a small metadata object so clients/admin UI can surface the penalty
      gameState.board.lastTimeoutPenalty = {
        color,
        penalty: -1,
        message: `${color} timed out, 1 point deducted.`,
        timestamp: now,
      }

      // Reflect zero remaining for the timed-out player until the move is applied
      gameState.board.timers[color].remaining = 0
      gameState.board.timers[color].lastUpdateTime = now
      // Keep whiteTime/blackTime in sync for clients
      gameState.board.whiteTime = gameState.board.timers.white.remaining
      gameState.board.blackTime = gameState.board.timers.black.remaining

      timeoutPenaltyApplied = true
      // Do NOT return here; allow the validator to process the move so move count increases
    }
    gameState.board.timers[color].lastUpdateTime = now
  }

  // Determine which validator and legal moves function to use
  let validateFunc
  let legalMovesFunc

  if (variant === "classic") {
    if (subvariant === "standard") {
      validateFunc = validateStandard
      legalMovesFunc = legalMovesStandard
    } else if (subvariant === "blitz") {
      validateFunc = validateBlitz
      legalMovesFunc = legalMovesBlitz
    } else if (subvariant === "bullet") {
      validateFunc = validateBullet
      legalMovesFunc = legalMovesBullet
    }
  } else if (variant === "crazyhouse") {
    if (subvariant === "standard") {
      validateFunc = validateCzyStd
      legalMovesFunc = legalMovesCzyStnd
    } else if (subvariant === "withTimer") {
      validateFunc = validateCzyTimer
      legalMovesFunc = legalMovesCzyTimer
    }
  } else if (variant === "sixpointer") {
    validateFunc = validateSixPointer
    legalMovesFunc = legalMovesSixPointer
  } else if (variant === "decay") {
    validateFunc = validateAndApplyDecayMove
    legalMovesFunc = getDecayLegalMoves
  }

  if (!validateFunc || !legalMovesFunc) {
    return { type: "game:error", message: "Invalid variant or subvariant" }
  }

  // For Crazyhouse variants, pass pocketedPieces for legal moves
  let possibleMoves
  if (variant === "crazyhouse" && subvariant === "standard") {
    possibleMoves = legalMovesFunc(gameState.board.fen, gameState.board.pocketedPieces, color)
  } else if (variant === "crazyhouse" && subvariant === "withTimer") {
    // Before getting possible moves, ensure any expired pieces are handled
    expireDropPieces(gameState.board, now)
    possibleMoves = legalMovesFunc(
      gameState.board.fen,
      gameState.board.pocketedPieces,
      gameState.board.dropTimers,
      color,
    )
    console.log("Possible moves:", possibleMoves)
    console.log("Move received:", move)
  } else {
    possibleMoves = legalMovesFunc(gameState.board.fen)
  }

  console.log("Moves received:", move)
  const isMoveLegal =
    possibleMoves &&
    possibleMoves.some(
      (m) =>
        (m.from === move.from && m.to === move.to && (!m.promotion || m.promotion === move.promotion)) ||
        (move.drop === true &&
          m.from === "pocket" &&
          m.to === move.to &&
          m.piece === move.piece &&
          (typeof move.id === "undefined" || m.pieceId === move.id)),
    )

  if (!isMoveLegal) {
    return { type: "game:warning", message: "Move is not legal" }
  }

  // Apply move using the variant-specific validator
  const result = validateFunc(gameState.board, move, color, now)
  console.log("Move validation result from variant validator:", result)

  if (!result.valid) {
    // Special handling for TIMEOUT_PENALTY in six-pointer variant
    if (result.code === "TIMEOUT_PENALTY" && variant === "sixpointer") {
      console.log("TIMEOUT_PENALTY detected - updating game state and continuing")
      
      // Update the board state with the timeout penalty applied
      gameState.board = result.state
      
      // Update timers after timeout penalty
      const newActiveColor = result.state.activeColor
      if (gameState.board.timers) {
        gameState.board.timers[newActiveColor].remaining = 30000
        gameState.board.timers[newActiveColor].lastUpdateTime = now
        gameState.board[`${newActiveColor}Time`] = 30000
      }
      
      // Store the timeout penalty information for client notification
      gameState.board.lastTimeoutPenalty = {
        player: color,
        timestamp: now,
        message: result.reason || "Timeout penalty applied",
        pointsDeducted: result.timeoutPenalty?.pointsDeducted || 1,
        newActiveColor: newActiveColor,
      }
      
      // Save the updated game state
      await updateGameState(sessionId, gameState)
      
      return {
        type: "game:timeoutPenalty",
        message: result.reason || "Timeout penalty applied",
        timeoutPenalty: result.timeoutPenalty,
        gameState,
        penaltyApplied: true,
      }
    }
    
    return {
      type: "game:warning",
      message: result.reason || "Invalid move",
      move: null,
      gameState,
    }
  }

  // Update game state using the *entire* state object returned by the validator
  gameState.board = result.state
  gameState.moves.push(result.move)
  gameState.moveCount = (gameState.moveCount || 0) + 1
  gameState.lastMove = result.move
  gameState.positionHistory.push(result.state.fen)
  gameState.gameState = result

  // For decay variant, ensure timeControl structure is properly populated
  if (variant === "decay") {
    gameState.timeControl = gameState.timeControl || {}
    gameState.timeControl.timers = {
      white: result.state.whiteTime || 180000,
      black: result.state.blackTime || 180000,
    }
    gameState.timeControl.baseTime = 180000
    gameState.timeControl.increment = 2000
  }

  // For SixPointer, reset timers after a valid move
  if (variant === "sixpointer") {
    const activeColor = gameState.board.activeColor
    const opponentColor = activeColor === "white" ? "black" : "white"

    // Reset timer for next player (opponent) to 30 seconds
    gameState.board.timers[opponentColor].remaining = 30000
    gameState.board.timers[opponentColor].lastUpdateTime = now
    gameState.board[`${opponentColor}Time`] = 30000

    // Ensure current player's timer is properly tracked
    gameState.board.timers[activeColor].lastUpdateTime = now

    console.log(`Resetting timer for ${opponentColor} to 30 seconds`)
  } else if (variant === "classic" && subvariant === "blitz") {
    const activeColor = gameState.board.activeColor
    gameState.board[`${activeColor}Time`] += 2000
  }
  // Note: For decay variant, timer increment is handled inside the decay validator

  // For Crazyhouse withTimer, update pocket status and serialize state
  if (variant === "crazyhouse" && subvariant === "withTimer") {
    const nowForPocket = Date.now()
    // 1. Update pocket status first
    gameState.board.pocketStatus = {
      white: getPocketStatus(gameState.board, "white", nowForPocket),
      black: getPocketStatus(gameState.board, "black", nowForPocket),
    }

    // 2. Update available drops (only for active player)
    const activeColor = gameState.board.activeColor
    gameState.board.availableDropPieces = {
      white: activeColor === "white" ? getAvailableDropPieces(gameState.board, "white", nowForPocket) : [],
      black: activeColor === "black" ? getAvailableDropPieces(gameState.board, "black", nowForPocket) : [],
    }

    // 3. Update frozen pieces (preserving state)
    const currentFrozen = gameState.board.frozenPieces || { white: [], black: [] }
    gameState.board.frozenPieces = {
      white: [...new Set([...currentFrozen.white, ...(gameState.board.pocketStatus.white.frozen || [])])],
      black: [...new Set([...currentFrozen.black, ...(gameState.board.pocketStatus.black.frozen || [])])],
    }

    // 4. Serialize for storage
    gameState.board.dropTimers = {
      white: Object.fromEntries(gameState.board.dropTimers.white),
      black: Object.fromEntries(gameState.board.dropTimers.black),
    }
    gameState.board.pocketedPieces = {
      white: [...gameState.board.pocketedPieces.white],
      black: [...gameState.board.pocketedPieces.black],
    }

    gameState.board = serializeCrazyhouseState(gameState.board)
  }

  if (variant === "crazyhouse" && subvariant === "withTimer") {
    // Clean up any expired timers
    const nowForCleanup = Date.now()
    expireDropPieces(gameState.board, nowForCleanup)

    // Clean up paused flags that are no longer needed
    for (const color of ["white", "black"]) {
      for (const piece of gameState.board.pocketedPieces[color]) {
        if (piece.timerPaused && !piece.remainingTime) {
          delete piece.timerPaused
          delete piece.remainingTime
        }
      }
    }
  }

  // Game end logic
  if (result.gameEnded) {
    gameState.status = "finished"
    gameState.result = result.result
    gameState.resultReason = result.endReason || null
    gameState.winner = result.winnerColor || null
    gameState.endedAt = result.endTimestamp || now
  } else {
    console.log("Game is still active, no end condition met")
  }

  await updateGameState(sessionId, gameState)
  console.log("Game state after move:", gameState)
  return { move: result.move, gameState }
}

// Apply a timeout penalty for sixpointer variant. This can be triggered by the client
// when the local interpolated timer reaches zero to ensure the server applies the
// authoritative -1 point penalty and passes the turn.
export async function applyTimeoutPenalty({ sessionId, userId, timestamp, variant, subvariant }) {
  const now = timestamp || Date.now()
  const session = await getSessionById(sessionId)
  if (!session) return { type: "game:error", message: "Session not found" }

  const gameState = session.gameState
  if (!gameState || gameState.status !== "active") {
    return { type: "game:error", message: "Game not active" }
  }

  const color =
    gameState.players.white.userId === userId ? "white" : gameState.players.black.userId === userId ? "black" : null
  if (!color) return { type: "game:error", message: "User not a player in this game" }

  const currentActiveColor = gameState.board.activeColor
  if (currentActiveColor !== color) {
    console.log(`[TIMEOUT PENALTY] Ignoring penalty request from ${color}, active player is ${currentActiveColor}`)
    return { type: "game:error", message: "Not your turn to be penalized" }
  }

  // Ensure board and points structures exist
  gameState.board = gameState.board || {}
  gameState.board.points = gameState.board.points || { white: 0, black: 0 }
  gameState.board.timeoutPenalties = gameState.board.timeoutPenalties || { white: 0, black: 0 }

  const lastPenalty = gameState.board.lastTimeoutPenalty
  if (lastPenalty && lastPenalty.color === color && now - lastPenalty.timestamp < 5000) {
    console.log(`[TIMEOUT PENALTY] Ignoring duplicate penalty for ${color} within 5 seconds`)
    return { type: "game:error", message: "Penalty already applied recently" }
  }

  // Apply -1 penalty (but do not end the game). Record metadata for clients.
  const pointsBefore = gameState.board.points[color] || 0
  gameState.board.points[color] = Math.max(0, pointsBefore - 1)
  gameState.board.timeoutPenalties[color] = (gameState.board.timeoutPenalties[color] || 0) + 1

  gameState.board.lastTimeoutPenalty = {
    color,
    penalty: -1,
    message: `${color} timed out, 1 point deducted.`,
    timestamp: now,
  }

  // Pass turn to opponent and reset both timers to per-move or 30s
  const opponentColor = color === "white" ? "black" : "white"
  gameState.board.activeColor = opponentColor

  const perMove = (gameState.timeControl && gameState.timeControl.perMove) || 30000
  gameState.board.timers = gameState.board.timers || {
    white: { remaining: perMove, lastUpdateTime: now, isRunning: false },
    black: { remaining: perMove, lastUpdateTime: now, isRunning: false },
  }

  gameState.board.timers.white.remaining = perMove
  gameState.board.timers.black.remaining = perMove
  gameState.board.timers.white.lastUpdateTime = now
  gameState.board.timers.black.lastUpdateTime = now
  gameState.board.whiteTime = perMove
  gameState.board.blackTime = perMove

  // Make the opponent timer active so the next player can move immediately
  gameState.board.timers[opponentColor].isRunning = true
  gameState.board.timers[color].isRunning = false

  // Update timestamps for turn start and last move
  gameState.board.turnStartTimestamp = now
  gameState.board.lastMoveTimestamp = now

  // Persist state
  // Ensure moves arrays exist and record a synthetic timeout move so move is counted
  gameState.moves = gameState.moves || []
  gameState.positionHistory = gameState.positionHistory || []
  gameState.board.moveHistory = gameState.board.moveHistory || []
  gameState.board.movesPlayed = gameState.board.movesPlayed || { white: 0, black: 0 }
  gameState.gameState = gameState.gameState || {}
  gameState.gameState.movesPlayed = gameState.gameState.movesPlayed || { white: 0, black: 0 }

  // Create synthetic move representing the timeout (counts as the player's move)
  const timeoutMove = {
    color,
    type: "timeout",
    san: "timeout",
    from: null,
    to: null,
    timestamp: now,
    reason: `${color} timed out`,
  }

  gameState.moves.push(timeoutMove)
  gameState.moveCount = (gameState.moveCount || 0) + 1
  gameState.lastMove = timeoutMove
  // push current fen to positionHistory for completeness
  if (gameState.board && gameState.board.fen) {
    gameState.positionHistory.push(gameState.board.fen)
  }

  // Increment movesPlayed for the timed-out player
  gameState.board.movesPlayed[color] = (gameState.board.movesPlayed[color] || 0) + 1
  gameState.gameState.movesPlayed[color] = (gameState.gameState.movesPlayed[color] || 0) + 1

  await updateGameState(sessionId, gameState)

  // Keep top-level conveniences in sync for clients
  gameState.movesPlayed = gameState.board.movesPlayed
  gameState.points = gameState.board.points
  gameState.gameState.lastMove = timeoutMove

  // Build a validator-style response so callers can consume details (keeps compatibility with earlier logs)
  const validationResult = {
    valid: false,
    reason: `${color} timed out, 1 point deducted and turn passed`,
    timeoutPenalty: {
      penaltyApplied: true,
      pointsDeducted: 1,
      timeReset: true,
      newPoints: gameState.board.points[color],
      turnPassed: true,
      newActiveColor: opponentColor,
    },
    state: gameState.board,
    code: "TIMEOUT_PENALTY",
  }

  return { move: timeoutMove, gameState, validationResult }
}

// Get possible moves for a piece
export async function getPossibleMoves({ sessionId, square, variant, subvariant }) {
  console.log("Getting possible moves for square:", square)
  const session = await getSessionById(sessionId)
  if (!session) throw new Error("Session not found")

  const { gameState } = session

  // Deserialize Maps if this is crazyhouse withTimer
  if (variant === "crazyhouse" && subvariant === "withTimer") {
    gameState.board = deserializeCrazyhouseState(gameState.board)
    expireDropPieces(gameState.board, Date.now())
  }

  const fen = gameState.board.fen
  let legalMovesFunc

  if (variant === "classic") {
    if (subvariant === "standard") {
      legalMovesFunc = legalMovesStandard
    } else if (subvariant === "blitz") {
      legalMovesFunc = legalMovesBlitz
    } else if (subvariant === "bullet") {
      legalMovesFunc = legalMovesBullet
    }
  } else if (variant === "crazyhouse") {
    if (subvariant === "standard") {
      legalMovesFunc = legalMovesCzyStnd
    } else if (subvariant === "withTimer") {
      legalMovesFunc = legalMovesCzyTimer
    }
  } else if (variant === "sixpointer") {
    legalMovesFunc = legalMovesSixPointer
  } else if (variant === "decay") {
    legalMovesFunc = getDecayLegalMoves
  }

  if (!legalMovesFunc) {
    throw new Error("Invalid variant or subvariant")
  }

  let moves
  if (variant === "crazyhouse") {
    const playerColor = gameState.board.activeColor === "w" ? "white" : "black"
    if (subvariant === "standard") {
      moves = legalMovesFunc(fen, gameState.board.pocketedPieces, playerColor)
    } else if (subvariant === "withTimer") {
      moves = legalMovesFunc(fen, gameState.board.pocketedPieces, gameState.board.dropTimers, playerColor)
    }
    if (square === "pocket") {
      return moves.filter((m) => m.from === "pocket")
    }
    return moves.filter((m) => m.from === square)
  } else {
    moves = legalMovesFunc(fen).filter((m) => m.from === square)
  }
  return moves
}

// Get current game timers (especially useful for crazyhouse withTimer)
export async function getCurrentTimers({ sessionId, variant, subvariant }) {
  const session = await getSessionById(sessionId)
  if (!session) return { type: "game:error", message: "Session not found" }
  if (!session.gameState) {
    return { type: "game:error", message: "No game state found" }
  }

  const gameState = session.gameState
  const now = Date.now()

  if (variant === "crazyhouse" && subvariant === "withTimer") {
    if (!(gameState.board.dropTimers.white instanceof Map)) {
      gameState.board = deserializeCrazyhouseState(gameState.board)
    }
    const timers = getCurrentCrazyhouseTimers(gameState.board, now)
    return { timers }
  }

  return {
    timers: {
      white: gameState.board.whiteTime || 0,
      black: gameState.board.blackTime || 0,
      activeColor: gameState.board.activeColor || "white",
      gameEnded: gameState.status === "finished",
    },
  }
}

// Resign (No changes needed, as it's a global game action)
export async function resign({ sessionId, userId }) {
  const session = await getSessionById(sessionId)
  if (!session) throw new Error("Session not found")

  const { gameState } = session
  if (gameState.status !== "active") throw new Error("Game is not active")

  const color =
    gameState.players.white.userId === userId ? "white" : gameState.players.black.userId === userId ? "black" : null
  if (!color) throw new Error("User not a player in this game")

  const winner = color === "white" ? "black" : "white"
  gameState.status = "finished"
  gameState.result = winner
  gameState.resultReason = "resignation"
  gameState.winner = winner
  gameState.endedAt = Date.now()
  gameState.shouldNavigateToMenu = true
  if (gameState.gameState && typeof gameState.gameState === "object") {
    gameState.gameState.shouldNavigateToMenu = true
    gameState.gameState.gameEnded = true
    gameState.gameState.result = gameState.result
    gameState.gameState.winner = winner
    gameState.gameState.endReason = "resignation"
  }

  await updateGameState(sessionId, gameState)
  return { gameState }
}

// Offer draw (No changes needed)
export async function offerDraw({ sessionId, userId }) {
  const session = await getSessionById(sessionId)
  if (!session) throw new Error("Session not found")

  const { gameState } = session
  if (gameState.status !== "active") throw new Error("Game is not active")

  const color =
    gameState.players.white.userId === userId ? "white" : gameState.players.black.userId === userId ? "black" : null
  if (!color) throw new Error("User not a player in this game")

  gameState.metadata.drawOffers[color] = true

  await updateGameState(sessionId, gameState)
  return { gameState }
}

// Accept draw (No changes needed)
export async function acceptDraw({ sessionId, userId }) {
  const session = await getSessionById(sessionId)
  if (!session) throw new Error("Session not found")

  const { gameState } = session
  if (gameState.status !== "active") throw new Error("Game is not active")

  const color =
    gameState.players.white.userId === userId ? "white" : gameState.players.black.userId === userId ? "black" : null
  if (!color) throw new Error("User not a player in this game")

  const oppColor = color === "white" ? "black" : "white"
  if (!gameState.metadata.drawOffers[oppColor]) throw new Error("No draw offer from opponent")

  gameState.status = "finished"
  gameState.result = "draw"
  gameState.resultReason = "mutual_agreement"
  gameState.winner = null
  gameState.endedAt = Date.now()

  await updateGameState(sessionId, gameState)
  return { gameState }
}

// Decline draw (No changes needed)
export async function declineDraw({ sessionId, userId }) {
  const session = await getSessionById(sessionId)
  if (!session) throw new Error("Session not found")

  const { gameState } = session
  if (gameState.status !== "active") throw new Error("Game is not active")

  const color =
    gameState.players.white.userId === userId ? "white" : gameState.players.black.userId === userId ? "black" : null
  if (!color) throw new Error("User not a player in this game")

  const oppColor = color === "white" ? "black" : "white"
  gameState.metadata.drawOffers[oppColor] = false

  await updateGameState(sessionId, gameState)
  return { gameState }
}
