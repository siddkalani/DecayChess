import { StyleSheet } from 'react-native'
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '../base'

export const crazyHouseStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#222", 
    alignItems: "center" 
  },
  boardContainer: { 
    alignItems: "center", 
    justifyContent: "center" 
  },
  board: {},
  row: { 
    flexDirection: "row" 
  },
  square: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "#444",
  },
  selectedSquare: { 
    backgroundColor: COLORS.lastMoveSquare 
  },
  possibleMoveSquare: { 
    backgroundColor: "rgba(255,255,0,0.3)" 
  },
  pieceText: { 
    fontSize: 28, 
    color: COLORS.white, 
    fontWeight: "bold" 
  },
  possibleMoveDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.3)",
    opacity: 0.8,
  },
  captureIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderTopWidth: 16,
    borderLeftColor: "transparent",
    borderTopColor: "rgba(255,0,0,0.3)",
  },
  playerInfoBlock: {
    width: "100%",
    backgroundColor: "#222",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  topPlayerBlock: { 
    paddingTop: 20 
  },
  bottomPlayerBlock: { 
    borderTopWidth: 1, 
    borderBottomWidth: 0, 
    borderTopColor: "#333", 
    paddingBottom: 20 
  },
  playerDetails: { 
    flex: 1 
  },
  playerName: { 
    color: COLORS.white, 
    fontSize: FONT_SIZES.xlarge, 
    fontWeight: "500" 
  },
  youIndicator: { 
    color: "#90EE90", 
    fontSize: FONT_SIZES.medium, 
    fontWeight: "bold", 
    marginLeft: 5 
  },
  playerRating: { 
    color: COLORS.mutedText, 
    fontSize: FONT_SIZES.medium 
  },
  timerContainer: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.small,
    minWidth: 70,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  activeTimer: { 
    borderColor: "#90EE90" 
  },
  timer: { 
    color: COLORS.white, 
    fontWeight: "bold", 
    fontFamily: "monospace", 
    fontSize: FONT_SIZES.xxlarge 
  },
  // General pocket panel styles
  pocketPanel: {
    flexDirection: "column",
    alignItems: "center",
    marginVertical: SPACING.sm,
    width: "100%",
  },
  pocketLabel: { 
    color: COLORS.white, 
    marginBottom: SPACING.sm, 
    fontSize: FONT_SIZES.large, 
    fontWeight: "bold" 
  },
  // New styles for organizing withTimer pockets
  pocketSectionsContainer: {
    flexDirection: "column",
    width: "100%",
    alignItems: "center",
  },
  droppablePieceSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
    minHeight: 40,
  },
  frozenPiecesSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: SPACING.sm,
  },
  frozenLabel: {
    color: COLORS.lightGray,
    marginRight: SPACING.sm,
    fontSize: FONT_SIZES.medium,
  },
  frozenPiecesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  noPieceText: {
    color: COLORS.mutedText,
    fontSize: FONT_SIZES.medium,
    fontStyle: "italic",
    paddingVertical: SPACING.sm,
  },
  // Existing pocket piece styles
  pocketPieces: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  pocketPiece: {
    backgroundColor: "#333",
    borderRadius: BORDER_RADIUS.small,
    padding: SPACING.sm,
    marginHorizontal: 2,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  selectedPocketPiece: { 
    backgroundColor: COLORS.blue 
  },
  pocketCount: { 
    color: "#a1a1aa", 
    fontSize: FONT_SIZES.small, 
    marginLeft: 2 
  },
  // Timer overlay styles
  dropTimerOverlay: {
    position: 'absolute',
    top: -8,
    left: '50%',
    transform: [{ translateX: -15 }],
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: BORDER_RADIUS.small,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  dropTimerValueText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: "monospace",
  },
  frozenPocketPiece: {
    backgroundColor: COLORS.darkGray,
    borderRadius: BORDER_RADIUS.small,
    padding: SPACING.sm,
    marginHorizontal: 2,
    opacity: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  // Frozen sign overlay styles
  frozenSignOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: BORDER_RADIUS.small,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frozenSignText: {
    fontSize: 10,
  },
  bottomBar: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#333",
    width: "100%",
  },
  bottomBarButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: SPACING.sm,
    minWidth: 60,
  },
  bottomBarIcon: { 
    fontSize: FONT_SIZES.title, 
    marginBottom: 4, 
    color: COLORS.mutedText, 
    fontWeight: "bold" 
  },
  bottomBarLabel: { 
    color: COLORS.white, 
    fontSize: FONT_SIZES.small, 
    fontWeight: "500" 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  moveHistoryModal: {
    backgroundColor: "#222",
    borderRadius: BORDER_RADIUS.large,
    width: "90%",
    maxWidth: 400,
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: "#555",
  },
  moveHistoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#555",
  },
  moveHistoryTitle: { 
    color: COLORS.white, 
    fontSize: FONT_SIZES.xlarge, 
    fontWeight: "bold" 
  },
  closeButton: { 
    padding: SPACING.sm 
  },
  closeButtonText: { 
    color: COLORS.white, 
    fontSize: FONT_SIZES.xlarge, 
    fontWeight: "bold" 
  },
  moveHistoryScroll: { 
    flex: 1, 
    padding: SPACING.lg 
  },
  moveRow: { 
    flexDirection: "row", 
    marginBottom: SPACING.sm, 
    alignItems: "center" 
  },
  moveNumber: { 
    color: COLORS.mutedText, 
    fontSize: FONT_SIZES.medium, 
    width: 30, 
    fontWeight: "bold" 
  },
  moveText: { 
    color: COLORS.white, 
    fontSize: FONT_SIZES.medium, 
    width: 60, 
    marginHorizontal: SPACING.sm 
  },
  gameEndModal: {
    backgroundColor: "#222",
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xxl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#555",
    maxWidth: "90%",
  },
  gameEndTitle: { 
    fontSize: FONT_SIZES.title, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: SPACING.lg, 
    color: COLORS.white 
  },
  gameEndMessage: { 
    fontSize: FONT_SIZES.large, 
    textAlign: "center", 
    marginBottom: SPACING.xl, 
    color: COLORS.white, 
    lineHeight: 22 
  },
  promotionModal: {
    backgroundColor: "#222",
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#555",
  },
  promotionTitle: { 
    color: COLORS.white, 
    fontSize: FONT_SIZES.xlarge, 
    fontWeight: "bold", 
    marginBottom: SPACING.xl, 
    textAlign: "center" 
  },
  promotionOptions: { 
    flexDirection: "row", 
    justifyContent: "center", 
    marginBottom: SPACING.xl, 
    flexWrap: "wrap" 
  },
  promotionOption: {
    margin: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.lightSquare,
    borderRadius: SPACING.sm,
    minWidth: 50,
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  promotionPiece: { 
    fontSize: 28, 
    textAlign: "center", 
    color: COLORS.black 
  },
  cancelButton: { 
    paddingHorizontal: SPACING.xl, 
    paddingVertical: 10, 
    backgroundColor: COLORS.gray, 
    borderRadius: SPACING.sm 
  },
  cancelButtonText: { 
    color: COLORS.white, 
    fontSize: FONT_SIZES.large, 
    fontWeight: "bold" 
  },
  // New styles for non-droppable pieces
  nonDroppablePiece: {
    opacity: 0.6,
    backgroundColor: COLORS.darkGray,
  },
  // New style for empty pocket section
  emptyPocketSection: {
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Add new styles for warning states
  dropTimerWarning: {
    backgroundColor: 'rgba(255,59,48,0.8)',
  },
  dropTimerValueWarning: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  pocketPieceWarning: {
    borderWidth: 2,
    borderColor: '#ff3b30',
  },
})
