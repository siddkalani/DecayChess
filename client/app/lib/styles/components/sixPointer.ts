import { Dimensions, StyleSheet } from 'react-native'
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '../base'

const { width } = Dimensions.get('window')
const isSmallScreen = width < 400
const boardSize = Math.min(width * 0.9, 320)
const squareSize = boardSize / 8

// Dynamic font sizes based on screen size
const fontSizes = {
  username: isSmallScreen ? 14 : 16,
  rating: isSmallScreen ? 12 : 14,
  timer: isSmallScreen ? 16 : 20,
  points: isSmallScreen ? 10 : 12,
  piece: Math.min(squareSize * 0.7, 32),
  coordinates: 12,
  movesLeft: 12, // For the "moves left" text (general label)
  moveNumberInBox: 10, // New: For the number inside the move boxes
}

export const sixPointerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2c2c2c", // Chess.com dark background
    justifyContent: "space-between", // Distribute content vertically
    alignItems: "center",
  },
  playerInfoBlock: {
    width: "100%",
    backgroundColor: "#2c2c2c", // Match overall background
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a3a", // Subtle separator
  },
  topPlayerBlock: {
    paddingTop: 20, // Account for status bar
  },
  bottomPlayerBlock: {
    borderTopWidth: 1,
    borderBottomWidth: 0,
    borderTopColor: "#3a3a3a",
    paddingBottom: 20, // Account for bottom safe area
  },
  playerInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    backgroundColor: "#666",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  pointsCircle: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#4a4a4a", // Darker gray for points circle
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2c2c2c", // Match background
  },
  pointsText: {
    color: "#fff",
    fontSize: fontSizes.points, // Ensure this uses the correct font size for points
    fontWeight: "bold",
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    color: "#fff",
    fontSize: fontSizes.username,
    fontWeight: "500",
  },
  youIndicator: {
    color: "#90EE90", // Green for "YOU"
    fontSize: fontSizes.rating,
    fontWeight: "bold",
    marginLeft: 5,
  },
  playerRating: {
    color: "#999",
    fontSize: fontSizes.rating,
  },
  playerInfoRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerContainer: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  activeTimer: {
    borderColor: "#90EE90", // Green border for active timer
  },
  timer: {
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  // New styles for positioning the moves left indicators
  movesLeftRowWrapperTop: {
    width: "100%",
    alignItems: "flex-end", // Aligns the row of boxes to the right
    paddingHorizontal: 16, // Matches player info padding
    paddingBottom: 8, // Space between indicators and board
  },
  movesLeftRowWrapperBottom: {
    width: "100%",
    alignItems: "flex-end", // Aligns the row of boxes to the right
    paddingHorizontal: 16, // Matches player info padding
    paddingTop: 8, // Space between indicators and board
  },
  movesLeftContainer: {
    flexDirection: "row",
    // Removed justifyContent: "center" as alignment is handled by parent wrapper
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  moveSquare: {
    width: 20, // Increased size for number
    height: 20, // Increased size for number
    borderRadius: 4, // Slightly larger border radius
    marginHorizontal: 3, // Adjusted margin
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1, // Add border for definition
    borderColor: "#666", // Default border color
  },
  filledMoveSquare: {
    backgroundColor: "#90EE90", // Green for filled moves
    borderColor: "#90EE90", // Green border for filled moves
  },
  emptyMoveSquare: {
    backgroundColor: "#4a4a4a", // Darker gray for empty moves
    borderColor: "#666", // Gray border for empty moves
  },
  moveNumberInBox: {
    fontSize: fontSizes.moveNumberInBox, // Use the new font size
    fontWeight: "bold",
  },
  filledMoveNumberText: {
    color: "#000", // Black text for green boxes
  },
  emptyMoveNumberText: {
    color: "#999", // Gray text for empty boxes
  },
  boardContainer: {
    alignItems: "center",
    justifyContent: "center",
    // Removed flex: 1 and width: "100%" here as it's now managed by the main container's flex
  },
  boardWrapper: {
    position: "relative",
  },
  board: {
    borderRadius: 0, // No border radius for full-width board
  },
  fileCoordinates: {
    flexDirection: "row",
    position: "absolute",
    bottom: -20,
    left: 0,
  },
  rankCoordinates: {
    position: "absolute",
    right: -20,
    top: 0,
  },
  coordinateText: {
    color: "#999",
    fontSize: fontSizes.coordinates,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
  },
  square: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  lastMoveSquare: {
    backgroundColor: "#f7ec74", // Chess.com last move highlight
  },
  selectedSquare: {
    backgroundColor: "#f7ec74", // Same as last move for consistency
  },
  possibleMoveSquare: {
    backgroundColor: "rgba(255, 255, 0, 0.3)", // Subtle highlight for possible moves
  },
  captureMoveSquare: {
    backgroundColor: "rgba(255, 0, 0, 0.3)", // Red tint for captures
  },
  piece: {
    fontWeight: "bold",
    color: "#000",
    textShadowColor: "rgba(255,255,255,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  possibleMoveDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
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
    borderTopColor: "rgba(255, 0, 0, 0.3)", // Red tint for captures
  },
  bottomBar: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#333",
    width: "100%",
  },
  bottomBarButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 60,
  },
  bottomBarIcon: {
    fontSize: 24,
    marginBottom: 4,
    color: "#999", // Professional gray color that matches the theme
    fontWeight: "bold",
  },
  bottomBarLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  moveHistoryModal: {
    backgroundColor: "#2c2c2c",
    borderRadius: 12,
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#555",
  },
  moveHistoryTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  moveHistoryScroll: {
    flex: 1,
    padding: 16,
  },
  moveRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  moveNumber: {
    color: "#999",
    fontSize: 14,
    width: 30,
    fontWeight: "bold",
  },
  moveText: {
    color: "#fff",
    fontSize: 14,
    width: 60,
    marginHorizontal: 8,
  },
  gameEndModal: {
    backgroundColor: "#2c2c2c",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#555",
    maxWidth: "90%",
  },
  victoryModal: {
    borderColor: "#90EE90", // Green for victory
  },
  defeatModal: {
    borderColor: "#FF6B6B", // Red for defeat
  },
  gameEndTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#fff",
  },
  victoryTitle: {
    color: "#90EE90",
  },
  defeatTitle: {
    color: "#FF6B6B",
  },
  gameEndMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#fff",
    lineHeight: 22,
  },
  gameEndDetailsContainer: {
    marginBottom: 16,
  },
  gameEndDetailText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  promotionModal: {
    backgroundColor: "#2c2c2c",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#555",
  },
  promotionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  promotionOptions: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  promotionOption: {
    margin: 8,
    padding: 12,
    backgroundColor: "#F0D9B5",
    borderRadius: 8,
    minWidth: 50,
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  promotionPiece: {
    fontSize: 28,
    textAlign: "center",
    color: "#000",
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#666",
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  capturedPieces: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 30, // Ensure some height even if no pieces
  },
  capturedPieceGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  capturedPiece: {
    fontSize: 30, // Adjust size as needed
    color: "#fff", // White color for captured pieces
    marginRight: 2,
  },
  capturedCount: {
    fontSize: 12,
    color: "#999", // Lighter color for count
    fontWeight: "bold",
  },
})
