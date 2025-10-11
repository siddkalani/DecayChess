export interface Player {
  userId: string
  username: string
  rating: number
  avatar: string | null
  title: string | null
}

export interface GameState {
  sessionId: string
  variantName: string
  subvariantName?: string
  description: string
  players: {
    white: Player
    black: Player
  }
  board: {
    fen: string
    position: string
    activeColor: "white" | "black"
    castlingRights: string
    enPassantSquare: string
    halfmoveClock: number
    fullmoveNumber: number
    whiteTime?: number
    blackTime?: number
    turnStartTimestamp?: number
    lastMoveTimestamp?: number
    moveHistory?: { from: string; to: string; [key: string]: any }[]
    repetitionMap?: any
    gameStarted?: boolean
    firstMoveTimestamp?: number
    capturedPieces?: {
      white: string[]
      black: string[]
    }
  }
  timeControl: {
    type: string
    baseTime: number
    increment: number
    timers: {
      white: number
      black: number
    }
    flagged: {
      white: boolean
      black: boolean
    }
    timeSpent?: { white: any; black: any }
  }
  status: string
  result: string
  resultReason?: string | null
  winner?: string | null
  moves: any[]
  moveCount: number
  lastMove: any
  gameState: {
    valid?: boolean
    move?: any
    state?: any
    result?: string
    check?: boolean
    checkmate?: boolean
    stalemate?: boolean
    insufficientMaterial?: boolean
    threefoldRepetition?: boolean
    fiftyMoveRule?: boolean
    canCastleKingside?: { white?: boolean; black?: boolean }
    canCastleQueenside?: { white?: boolean; black?: boolean }
    promotionAvailable?: boolean
    lastMove?: any
    winner?: string | null
    drawReason?: string | null
    gameEnded?: boolean
    endReason?: string | null
    endTimestamp?: number
  }
  userColor: {
    [key: string]: "white" | "black"
  }
  positionHistory?: string[]
  createdAt?: number
  lastActivity?: number
  startedAt?: number
  endedAt?: number | null
  rules?: any
  metadata?: any
  timers?: any
}

export interface Move {
  from: string
  to: string
  promotion?: string
}

export interface ChessGameProps {
  initialGameState: GameState
  userId: string
  onNavigateToMenu?: () => void
}