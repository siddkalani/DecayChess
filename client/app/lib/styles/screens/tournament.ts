import { StyleSheet } from 'react-native'

export const tournamentScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1E", // Main background color from Choose.tsx
  },
  victoryRushCard: {
    backgroundColor: "#69923e", // Deep purple color
    borderRadius: 16,
    marginBottom: 20,
    marginTop: 100, // Space for the overlapping logo
    padding: 0,
    paddingBottom: 24,
  },
  victoryRushContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  victoryRushLogo: {
    width: '150%',
    height: 250,
    position: 'absolute',
    top: -100, // Pull the logo up to overlap
    zIndex: 1,
  },
  victoryRushTitle: {
    color: "#FFF5E1", // Off-white color
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
    lineHeight: 38,
  },
  victoryRushSubtitle: {
    paddingTop: 90,
    color: "#FFF5E1",
    fontSize: 18,
    marginBottom: 20,
    opacity: 0.9,
  },
  closingTimeText: {
    color: "#FFA500",
    fontSize: 16,
    marginBottom: 16,
    fontWeight: "600",
  },
  joinNowButton: {
    backgroundColor: "#FFA500", // Orange color
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
    minWidth: 160,
  },
  joinNowText: {
    color: "#000",
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Header and nav tournamentScreenStyles removed
  topNavButton: {
    alignItems: "center",
    width: "30%",
  },
  iconContainer: {
    position: "relative",
    width: "100%",
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  iconBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.08)", // Icon background from Choose.tsx
    borderRadius: 12,
  },
  icon: {
    zIndex: 1,
    marginBottom: 16,
  },
  topNavButtonText: {
    position: "absolute",
    bottom: 8,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    zIndex: 1,
    opacity: 0.9,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 0, // Remove top padding to allow logo to overlap properly
  },
  connectingContainer: {
    marginBottom: 20,
    alignItems: "center",
    backgroundColor: "#2C2C2E", // Card background from Choose.tsx
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectingText: {
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  connectingTimer: {
    color: "#B0B0B0", // Secondary text color from Choose.tsx
    fontSize: 16,
    marginTop: 5,
  },
  matchFoundText: {
    color: "#00A862", // Green accent color from Choose.tsx
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
    textAlign: "center",
  },
  variantsColumn: {
    flexDirection: "column",
    width: "100%",
  },
  variantCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  variantCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  variantIconContainer: {
    position: "relative",
    width: 52,
    height: 52,
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#769656", // Chess piece background from Choose.tsx
    borderRadius: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  variantTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  variantSubtitle: {
    color: "rgba(255, 255, 255, 0.8)", // Subtitle color from Choose.tsx
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
  },
  statusText: {
    color: "#00A862",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 5,
  },
  arrowText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "300",
  },
  cardDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Modal overlay from Choose.tsx
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  rulesModal: {
    backgroundColor: "#3A3A3C", // Modal background from Choose.tsx
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderColor: "#48484A", // Modal border from Choose.tsx
    borderWidth: 1,
  },
  rulesTitle: {
    color: "#00A862", // Green title from Choose.tsx
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  rulesContent: {
    maxHeight: 300,
    marginBottom: 20,
  },
  rulesText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "left",
  },
  closeRulesButton: {
    backgroundColor: "#00A862", // Green button from Choose.tsx
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: "center",
  },
  closeRulesButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Bottom nav bar removed
  // Navigation button tournamentScreenStyles removed
  errorText: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
  },
  infoText: {
    color: "#b0b3b8",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  mainTournamentCard: {
    borderRadius: 16,
    padding: 0,
    marginBottom: 16,
    width: "100%",
    minHeight: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  mainTournamentCardContent: {
    flex: 1,
    height: "100%",
  },
  mainCardLayout: {
    flex: 1,
    flexDirection: "column",
  },
  tournamentImageContainer: {
    height: 160,
    width: "100%",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  tournamentImage: {
    width: "200%",
    height: "200%",
  },
  mainCardTextContainer: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },
  mainCardTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  mainCardDescription: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 10,
  },
})