export interface GameState {
  sessionId: string;
  variantName: string; // Renamed from variantName to 'variant' as per backend
  subvariantName?: string; // Made optional
  description: string;
  players: {
    white: {
      userId: string;
      username: string;
      rating: number;
      avatar: string | null;
      title: string | null;
    };
    black: {
      userId: string;
      username: string;
      rating: number;
      avatar: string | null;
      title: string | null;
    };
  };
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
    pocketedPieces: {
      white: string[]
      black: string[]
    }
    dropTimers?: {
      white: { [piece: string]: number }
      black: { [piece: string]: number }
    }
    gameStarted?: boolean
    firstMoveTimestamp?: number
    gameEnded?: boolean
    endReason?: string | null
    winner?: string | null
    endTimestamp?: number | null
  };
  timeControl: {
    type: string;
    baseTime: number;
    increment: number;
    timers: {
      white: number;
      black: number;
    };
    flagged: {
      white: boolean;
      black: boolean;
    };
  };
  status: string;
  result: string;
  moves: string[];
  moveCount: number;
  lastMove: string | null;
  gameState: {
    check: boolean;
    checkmate: boolean;
    stalemate: boolean;
  };
  userColor: {
    [key: string]: "white" | "black";
  };
}