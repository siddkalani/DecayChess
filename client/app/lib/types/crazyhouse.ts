export interface Move {
  from?: string;
  to: string;
  piece?: string;
  captured?: string;
  promotion?: string;
  drop?: boolean;
  id?: string;
}

export interface CrazyHouseChessGameProps {
  initialGameState: any;
  userId: string;
  onNavigateToMenu?: () => void;
}

export interface PocketPieceStandardType {
  type: string;
}

export interface PocketPieceWithTimerType {
  type: string;
  timer?: number;
  id?: string;
  canDrop?: boolean;
  remainingTime?: number;
}

export interface availableDropPieceType {
  type: string;
  id: string;
  canDrop: boolean;
  remainingTime?: number;
  timerPaused?: boolean;
}

type PocketPieceType = PocketPieceStandardType | PocketPieceWithTimerType;

export interface GameStateType {
  sessionId: string
  variantName: string
  subvariantName?: string // "withTimer" or undefined/other for standard
  description: string
  players: {
    white: any
    black: any
  }
  board: {
    fen: string
    position: string
    activeColor: "white" | "black"
    castlingRights: string
    enPassantSquare: string
    halfmoveClock: number
    fullmoveNumber: number
    whiteTime: number
    blackTime: number
    turnStartTimestamp: number
    lastMoveTimestamp: number
    moveHistory: { from: string; to: string; [key: string]: any }[]
    pocketedPieces: {
      white: PocketPieceType[]
      black: PocketPieceType[]
    }
    availableDropPieces?: {
      white: availableDropPieceType[]
      black: availableDropPieceType[]
    }
    // Backend sends this as a plain object, frontend converts to Map for internal use
    dropTimers: {
      white: Record<string, number> | Map<string, number>
      black: Record<string, number> | Map<string, number>
    }
    frozenPieces: {
      white: PocketPieceWithTimerType[] // These are pieces that have expired and been removed from the pocket
      black: PocketPieceWithTimerType[]
    }
    gameStarted: boolean
    firstMoveTimestamp: number | null
    gameEnded: boolean
    endReason: string | null
    winner: string | null
    endTimestamp: number | null
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
  resultReason: string | null
  winner: string | null
  moves: any[]
  moveCount: number
  lastMove: any
  gameState: {
    // This is the nested gameState object from the backend's result
    check?: boolean
    checkmate?: boolean
    stalemate?: boolean
    insufficientMaterial?: boolean
    threefoldRepetition?: boolean
    fiftyMoveRule?: boolean
    gameEnded?: boolean
    result?: string
    winner?: string | null
    endReason?: string | null
    pocketedPieces?: {
      white: PocketPieceType[]
      black: PocketPieceType[]
    }
    dropTimers?: {
      // This is where the correct dropTimers are
      white: Record<string, number>
      black: Record<string, number>
    }
    frozenPieces?: {
      // This is where the derived frozenPieces (in pocket but not droppable) are
      white: PocketPieceWithTimerType[]
      black: PocketPieceWithTimerType[]
    }
  }
  userColor: {
    [key: string]: "white" | "black"
  }
  positionHistory: string[]
  createdAt: number
  lastActivity: number
  startedAt: number
  endedAt: number | null
  rules?: any
  metadata: any
  timers?: any
}