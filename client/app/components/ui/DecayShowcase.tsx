import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  BORDER_RADIUS,
  COLORS as THEME_COLORS,
  FONT_SIZES,
  SHADOWS,
  SPACING,
} from "@/app/lib/styles/base";

type PieceColor = "white" | "black";

type Piece = {
  id: string;
  color: PieceColor;
  symbol: string;
  isQueen?: boolean;
};

type BoardState = Record<string, Piece | undefined>;

type ShowcaseMove = {
  note: string;
  from?: string;
  to?: string;
  triggersDecay?: boolean;
  isQueenMove?: boolean;
  decayBonus?: number;
  freezeQueen?: boolean;
  reset?: boolean;
};

type LastMove = {
  from?: string;
  to?: string;
};

const MOVE_INTERVAL_MS = 1800;
const DECAY_TIMER_START = 25;
const DECAY_DRAIN_PER_MOVE = 8;

const BOARD_COLUMNS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const BOARD_ROWS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

const INITIAL_POSITIONS: { square: string; piece: Piece }[] = [
  { square: "e1", piece: { id: "wK", color: "white", symbol: "♔" } },
  { square: "d1", piece: { id: "wQ", color: "white", symbol: "♕", isQueen: true } },
  { square: "a1", piece: { id: "wR1", color: "white", symbol: "♖" } },
  { square: "h1", piece: { id: "wR2", color: "white", symbol: "♖" } },
  { square: "d2", piece: { id: "wP1", color: "white", symbol: "♙" } },
  { square: "f2", piece: { id: "wP2", color: "white", symbol: "♙" } },
  { square: "g2", piece: { id: "wP3", color: "white", symbol: "♙" } },
  { square: "h2", piece: { id: "wP4", color: "white", symbol: "♙" } },
  { square: "e8", piece: { id: "bK", color: "black", symbol: "♚" } },
  { square: "d8", piece: { id: "bQ", color: "black", symbol: "♛" } },
  { square: "c8", piece: { id: "bB", color: "black", symbol: "♝" } },
  { square: "g8", piece: { id: "bN", color: "black", symbol: "♞" } },
  { square: "h8", piece: { id: "bR2", color: "black", symbol: "♜" } },
  { square: "d7", piece: { id: "bP1", color: "black", symbol: "♟" } },
  { square: "e7", piece: { id: "bP2", color: "black", symbol: "♟" } },
  { square: "f7", piece: { id: "bP3", color: "black", symbol: "♟" } },
  { square: "g7", piece: { id: "bP4", color: "black", symbol: "♟" } },
  { square: "h7", piece: { id: "bP5", color: "black", symbol: "♟" } },
];

const SHOWCASE_MOVES: ShowcaseMove[] = [
  {
    note: "Watch a Decay duel—this board auto-plays a short sequence.",
    reset: true,
  },
  {
    from: "d2",
    to: "d4",
    note: "White opens the center so the queen can break out.",
  },
  {
    from: "d7",
    to: "d6",
    note: "Black keeps the structure solid and eyes the same file.",
  },
  {
    from: "d1",
    to: "h5",
    note: "First queen move starts a 25s Decay timer.",
    triggersDecay: true,
    isQueenMove: true,
  },
  {
    from: "g8",
    to: "f6",
    note: "Black develops and nudges the queen.",
  },
  {
    from: "h5",
    to: "f7",
    note: "Queen strikes f7—+2s bonus but the timer keeps draining.",
    isQueenMove: true,
    decayBonus: 2,
  },
  {
    from: "e8",
    to: "d7",
    note: "Black king sidesteps the pressure.",
  },
  {
    from: "f7",
    to: "e7",
    note: "Another queen move, another chunk off the Decay clock.",
    isQueenMove: true,
  },
  {
    from: "c8",
    to: "b7",
    note: "Black posts the light-squared bishop on a long diagonal.",
  },
  {
    from: "e7",
    to: "e2",
    note: "The queen races home with only seconds remaining.",
    isQueenMove: true,
  },
  {
    from: "d8",
    to: "e8",
    note: "Black's queen grabs the open file.",
  },
  {
    from: "e2",
    to: "c2",
    note: "One more queen move empties the timer completely.",
    isQueenMove: true,
  },
  {
    note: "Timer expires—White's queen is now frozen in place.",
    freezeQueen: true,
  },
  {
    from: "a1",
    to: "d1",
    note: "Other pieces take over while the queen stays locked.",
  },
  {
    from: "b7",
    to: "g2",
    note: "Play continues: the bishop slices down to g2.",
  },
];

const createInitialBoard = (): BoardState => {
  const board: BoardState = {};
  INITIAL_POSITIONS.forEach(({ square, piece }) => {
    board[square] = { ...piece };
  });
  return board;
};

const DecayShowcase = () => {
  const [boardState, setBoardState] = useState<BoardState>(() => createInitialBoard());
  const [moveIndex, setMoveIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState(SHOWCASE_MOVES[0].note);
  const [lastMove, setLastMove] = useState<LastMove>({});
  const [decayActive, setDecayActive] = useState(false);
  const [decayTimer, setDecayTimer] = useState(DECAY_TIMER_START);
  const [queenFrozen, setQueenFrozen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMoveIndex((prev) => (prev + 1) % SHOWCASE_MOVES.length);
    }, MOVE_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [moveIndex]);

  useEffect(() => {
    const move = SHOWCASE_MOVES[moveIndex];
    setStatusMessage(move.note);

    if (move.reset) {
      setBoardState(createInitialBoard());
      setDecayActive(false);
      setDecayTimer(DECAY_TIMER_START);
      setQueenFrozen(false);
      setLastMove({});
      return;
    }

    if (move.freezeQueen) {
      setQueenFrozen(true);
      setDecayActive(false);
      setDecayTimer(0);
      setLastMove({});
      return;
    }

    if (move.from && move.to) {
      setBoardState((prev) => {
        const movingPiece = prev[move.from];
        if (!movingPiece) {
          return prev;
        }
        if (queenFrozen && movingPiece.isQueen) {
          return prev;
        }
        const updated: BoardState = { ...prev };
        delete updated[move.from];
        updated[move.to] = { ...movingPiece };
        return updated;
      });
      setLastMove({ from: move.from, to: move.to });
    } else {
      setLastMove({});
    }

    if (move.triggersDecay) {
      setDecayActive(true);
      setDecayTimer(DECAY_TIMER_START);
      return;
    }

    if (move.isQueenMove && decayActive && !queenFrozen) {
      setDecayTimer((prev) => {
        let next = Math.max(prev - DECAY_DRAIN_PER_MOVE + (move.decayBonus ?? 0), 0);
        if (next === 0) {
          setQueenFrozen(true);
          setDecayActive(false);
        }
        return next;
      });
    }
  }, [moveIndex, decayActive, queenFrozen]);

  const timerPercent = decayActive || queenFrozen ? (decayTimer / DECAY_TIMER_START) * 100 : 100;
  const badgeLabel = queenFrozen ? "Frozen" : decayActive ? "Live" : "Preview";

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Showcase</Text>
            <Text style={styles.subtitle}>Mini board auto-plays in real time</Text>
          </View>
          <View
            style={[
              styles.badge,
              queenFrozen ? styles.badgeFrozen : decayActive ? styles.badgeLive : styles.badgeIdle,
            ]}
          >
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        </View>

        <View style={styles.boardContainer}>
          {BOARD_ROWS.map((row) => (
            <View key={row} style={styles.boardRow}>
              {BOARD_COLUMNS.map((column, index) => {
                const square = `${column}${row}`;
                const piece = boardState[square];
                const isLightSquare = (row + index) % 2 === 0;
                const isLastMoveSquare = lastMove.from === square || lastMove.to === square;
                const isQueenSquare = piece?.isQueen;
                const isFrozenQueen = isQueenSquare && queenFrozen;

                return (
                  <View
                    key={square}
                    style={[
                      styles.square,
                      { backgroundColor: isLightSquare ? THEME_COLORS.lightSquare : THEME_COLORS.darkSquare },
                      isLastMoveSquare && styles.lastMoveSquare,
                      isQueenSquare && decayActive && styles.decayPulse,
                      isFrozenQueen && styles.frozenSquare,
                    ]}
                  >
                    {piece ? (
                      <Text
                        style={[
                          styles.pieceText,
                          piece.color === "white" ? styles.whitePiece : styles.blackPiece,
                          isFrozenQueen && styles.frozenPiece,
                        ]}
                      >
                        {piece.symbol}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View>
          <View style={styles.timerRow}>
            <Text style={styles.timerLabel}>Decay Timer</Text>
            <Text style={[styles.timerValue, queenFrozen && styles.timerValueExpired]}>
              {queenFrozen ? "Queen Locked" : decayActive ? `${decayTimer}s` : "Idle"}
            </Text>
          </View>
          <View style={styles.timerTrack}>
            <View
              style={[
                styles.timerFill,
                { width: `${timerPercent}%` },
                queenFrozen && styles.timerFillExpired,
              ]}
            />
          </View>
        </View>

        <Text style={styles.caption} numberOfLines={2} ellipsizeMode="tail">
          {statusMessage}
        </Text>
      </View>
    </View>
  );
};

export default DecayShowcase;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#2C2C2E",
    borderRadius: BORDER_RADIUS.large,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    width: "100%",
    height: 380,
    overflow: "hidden",
    ...SHADOWS.small,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  title: {
    color: THEME_COLORS.white,
    fontSize: FONT_SIZES.xxlarge,
    fontWeight: "600",
  },
  subtitle: {
    color: THEME_COLORS.secondaryText,
    fontSize: FONT_SIZES.small,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: "transparent",
  },
  badgeText: {
    color: THEME_COLORS.white,
    fontSize: FONT_SIZES.small,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  badgeLive: {
    backgroundColor: "rgba(0, 168, 98, 0.15)",
    borderColor: "#00A862",
  },
  badgeIdle: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  badgeFrozen: {
    backgroundColor: "rgba(255, 107, 107, 0.12)",
    borderColor: "#FF6B6B",
  },
  boardContainer: {
    width: "100%",
    maxWidth: 220,
    maxHeight: 220,
    aspectRatio: 1,
    alignSelf: "center",
    borderRadius: BORDER_RADIUS.medium,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#1F1F21",
    marginBottom: SPACING.md,
  },
  boardRow: {
    flex: 1,
    flexDirection: "row",
  },
  square: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pieceText: {
    fontSize: 22,
  },
  whitePiece: {
    color: "#fff",
  },
  blackPiece: {
    color: "#1b1b1b",
  },
  lastMoveSquare: {
    borderWidth: 2,
    borderColor: "#FFE135",
  },
  decayPulse: {
    borderWidth: 2,
    borderColor: "rgba(0, 168, 98, 0.6)",
  },
  frozenSquare: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  frozenPiece: {
    color: "#EAB308",
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  timerLabel: {
    color: THEME_COLORS.secondaryText,
    fontSize: FONT_SIZES.medium,
  },
  timerValue: {
    color: "#00A862",
    fontSize: FONT_SIZES.large,
    fontWeight: "700",
  },
  timerValueExpired: {
    color: "#FF6B6B",
  },
  timerTrack: {
    height: 6,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: "#3A3A3C",
    marginBottom: SPACING.md,
    overflow: "hidden",
  },
  timerFill: {
    height: "100%",
    backgroundColor: "#00A862",
  },
  timerFillExpired: {
    backgroundColor: "#FF6B6B",
  },
  caption: {
    color: THEME_COLORS.white,
    fontSize: FONT_SIZES.small,
    lineHeight: 18,
  },
});
