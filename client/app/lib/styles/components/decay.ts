import { Dimensions, StyleSheet } from 'react-native'

const screenWidth = Dimensions.get("window").width
const screenHeight = Dimensions.get("window").height
const isTablet = Math.min(screenWidth, screenHeight) > 600
const isSmallScreen = screenWidth < 380
const isVerySmallScreen = screenWidth < 320

// Improved responsive sizing for better centering
const horizontalPadding = isSmallScreen ? 8 : isTablet ? 20 : 12
const boardSize = screenWidth - horizontalPadding * 2
const squareSize = boardSize / 8

// Dynamic sizing based on screen size with better proportions
const playerInfoHeight = isSmallScreen ? 70 : isTablet ? 100 : 85
const gameStatusHeight = isSmallScreen ? 35 : 45
const bottomBarHeight = isSmallScreen ? 65 : 75
const decayTimerFontSize = isSmallScreen ? 8 : 10
const pieceFontSize = squareSize * (isSmallScreen ? 0.6 : isTablet ? 0.7 : 0.65)

// Improved spacing constants
const verticalSpacing = isSmallScreen ? 8 : isTablet ? 16 : 12
const componentSpacing = isSmallScreen ? 6 : isTablet ? 12 : 8

export const decayStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#312e2b", // Chess.com dark background
    paddingTop: isSmallScreen ? 30 : isTablet ? 60 : 50,
    paddingBottom: bottomBarHeight,
    paddingHorizontal: horizontalPadding,
  },
  boardContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: verticalSpacing,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    // Ensure the board is perfectly centered
    alignSelf: "center",
  },
  board: {
    flexDirection: "column",
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#4a4a4a",
    width: boardSize,
    height: boardSize,
  },
  row: {
    flexDirection: "row",
    flex: 1,
  },
  square: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    flex: 1,
  },
  playerInfoContainer: {
   
    borderRadius: 2,
    paddingHorizontal: isSmallScreen ? 12 : isTablet ? 20 : 16,
    paddingVertical: isSmallScreen ? 10 : isTablet ? 16 : 12,
    marginVertical: componentSpacing,


    minHeight: playerInfoHeight,
    // Improved shadow for better visual separation
 

   
  
  },
  activePlayerContainer: {
    backgroundColor: "#2d5a2d",
    borderColor: "#4ade80",
    borderWidth: 2,
    shadowColor: "#4ade80",
    shadowOpacity: 0.3,
  },
  playerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerDetails: {
    flex: 1,
    marginRight: isSmallScreen ? 8 : 12,
  },
  playerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: isSmallScreen ? 4 : 6,
  },
  playerAvatar: {
    width: isSmallScreen ? 32 : isTablet ? 48 : 40,
    height: isSmallScreen ? 32 : isTablet ? 48 : 40,
    borderRadius: isSmallScreen ? 16 : isTablet ? 24 : 20,
    backgroundColor: "#4a4a4a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: isSmallScreen ? 8 : isTablet ? 16 : 12,
  },
  playerAvatarText: {
    color: "#fff",
    fontSize: isSmallScreen ? 14 : isTablet ? 20 : 16,
    fontWeight: "bold",
  },
  playerNameContainer: {
    flex: 1,
    marginRight: 8,
  },
  playerName: {
    color: "#fff",
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    fontWeight: "600",
  },
  activePlayerName: {
    color: "#4ade80",
  },
  playerRating: {
    color: "#a1a1aa",
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    marginTop: 2,
  },
  youIndicator: {
    color: "#60a5fa",
    fontSize: isSmallScreen ? 10 : isTablet ? 14 : 12,
    fontWeight: "500",
    backgroundColor: "#1e3a8a",
    paddingHorizontal: isSmallScreen ? 6 : 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  decayStatus: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  decayStatusText: {
    color: "#f97316",
    fontSize: isSmallScreen ? 10 : isTablet ? 14 : 12,
    marginRight: 12,
    marginTop: 2,
  },
  frozenStatusText: {
    color: "#ef4444",
    fontSize: isSmallScreen ? 10 : isTablet ? 14 : 12,
    marginTop: 2,
  },
  timerContainer: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: isSmallScreen ? 12 : isTablet ? 20 : 16,
    paddingVertical: isSmallScreen ? 8 : isTablet ? 12 : 10,
    borderRadius: 20,
    minWidth: isSmallScreen ? 70 : isTablet ? 100 : 80,
    alignItems: "center",
  },
  activeTimerContainer: {
    backgroundColor: "#fff",
  },
  timerText: {
    color: "#fff",
    fontSize: isSmallScreen ? 16 : isTablet ? 22 : 18,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  activeTimerText: {
    color: "#000",
  },
  capturedPieces: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: isSmallScreen ? 8 : isTablet ? 16 : 12,
    paddingTop: isSmallScreen ? 6 : isTablet ? 12 : 8,
    borderTopWidth: 1,
    borderTopColor: "#3a3a3a",
  },
  capturedPieceGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  capturedCount: {
    color: "#a1a1aa",
    fontSize: isSmallScreen ? 10 : isTablet ? 14 : 12,
    marginLeft: 2,
    fontWeight: "bold",
  },
  gameStatusContainer: {
    alignItems: "center",
    marginVertical: componentSpacing,
    paddingHorizontal: 16,
    minHeight: gameStatusHeight,
    justifyContent: "center",
  },
  gameOverText: {
    color: "#ef4444",
    fontSize: isSmallScreen ? 16 : isTablet ? 22 : 18,
    fontWeight: "bold",
  },
  turnIndicator: {
    color: "#a1a1aa",
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    marginBottom: 4,
    textAlign: "center",
  },
  myTurnIndicator: {
    color: "#4ade80",
    fontWeight: "600",
  },
  variantName: {
    color: "#60a5fa",
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: isSmallScreen ? 10 : isTablet ? 16 : 12,
    paddingHorizontal: horizontalPadding,
    borderTopWidth: 1,
    borderTopColor: "#3a3a3a",
    height: bottomBarHeight,
  },
  bottomBarButton: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: isSmallScreen ? 8 : isTablet ? 16 : 12,
    borderRadius: 8,
    flex: 1,
  },
  bottomBarIcon: {
    fontSize: isSmallScreen ? 18 : isTablet ? 24 : 20,
    color: "#fff",
    marginBottom: 4,
  },
  bottomBarLabel: {
    fontSize: isSmallScreen ? 10 : isTablet ? 14 : 12,
    color: "#a1a1aa",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  moveHistoryModal: {
    backgroundColor: "#262421",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  moveHistoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  moveHistoryTitle: {
    color: "#fff",
    fontSize: isSmallScreen ? 16 : isTablet ? 20 : 18,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#ef4444",
    padding: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  moveHistoryScroll: {
    maxHeight: 300,
  },
  moveRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  moveNumber: {
    color: "#a1a1aa",
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    width: 30,
    fontFamily: "monospace",
  },
  moveText: {
    color: "#fff",
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    marginRight: 16,
    fontFamily: "monospace",
  },
  promotionModal: {
    backgroundColor: "#262421",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  promotionTitle: {
    color: "#fff",
    fontSize: isSmallScreen ? 16 : isTablet ? 20 : 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  promotionOptions: {
    flexDirection: "row",
    gap: 12,
  },
  promotionOption: {
    backgroundColor: "#4a4a4a",
    padding: isSmallScreen ? 12 : isTablet ? 20 : 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#60a5fa",
  },
  gameEndModal: {
    backgroundColor: "#262421",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    width: "85%",
    borderWidth: 2,
    borderColor: "#3a3a3a",
  },
  victoryModal: {
    borderColor: "#4ade80",
  },
  defeatModal: {
    borderColor: "#ef4444",
  },
  gameEndTitle: {
    fontSize: isSmallScreen ? 20 : isTablet ? 28 : 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#fff",
  },
  victoryTitle: {
    color: "#4ade80",
  },
  defeatTitle: {
    color: "#ef4444",
  },
  gameEndMessage: {
    color: "#fff",
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },
  gameEndReason: {
    color: "#a1a1aa",
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    marginBottom: 8,
  },
  gameEndMove: {
    color: "#a1a1aa",
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    marginBottom: 8,
  },
  gameEndWinner: {
    color: "#4ade80",
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  menuButton: {
    backgroundColor: "#60a5fa",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  menuButtonText: {
    color: "#fff",
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    fontWeight: "600",
  },
  coordinateLabel: {
    position: "absolute",
    fontWeight: "bold",
  },
  rankLabel: {
    left: 2,
    top: 2,
  },
  fileLabel: {
    right: 2,
    bottom: 2,
  },
  decayTimerAbove: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  decayTimerBox: {
    backgroundColor: "#f97316",
    borderRadius: 4,
    paddingHorizontal: isSmallScreen ? 4 : 6,
    paddingVertical: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  decayTimerBoxText: {
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  frozenIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  frozenText: {
    // fontSize is set dynamically in renderSquare
  },
  possibleMoveDot: {
    position: "absolute",
    backgroundColor: "#16a34a",
    opacity: 0.8,
  },
  captureIndicator: {
    position: "absolute",
    backgroundColor: "#dc2626",
    top: 2,
    right: 2,
    opacity: 0.9,
  },
})

export const variantStyles = decayStyles
