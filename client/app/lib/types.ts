// Type definitions for the chess app
export interface ChessPieceProps {
  size: number;
}

export interface BottomBarProps {
  onProfile: () => void;
  onLogout: () => void;
  onHome: () => void;
}

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Game related types
export type ChessVariant = 'classic' | 'crazy-house' | 'decay' | 'six-pointer';
export type TimeControl = 'classic' | 'crazy';

export interface GameState {
  variant: ChessVariant;
  timeControl: TimeControl;
  isActive: boolean;
}
