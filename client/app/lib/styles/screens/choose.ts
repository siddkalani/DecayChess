import { StyleSheet } from 'react-native'
import { BORDER_RADIUS, COLORS, FONT_SIZES, SHADOWS, SPACING } from '../base'

// Choose screen specific colors
const CHOOSE_COLORS = {
  screenBackground: '#1C1C1E',
  cardBackground: '#2C2C2E',
  featuredCardBackground: '#F2E7D5',
  featuredTextColor: '#8B4513',
  accentGreen: '#00A862',
  accentOrange: '#FFA500',
  secondaryText: '#B0B0B0',
  overlayBackground: 'rgba(0, 0, 0, 0.8)',
  modalBackground: '#3A3A3C',
  modalBorder: '#48484A',
  iconBackground: 'rgba(255, 255, 255, 0.08)',
  statsColor: '#4A90E2',
  chessBackground: '#769656',
}

export const chooseScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CHOOSE_COLORS.screenBackground,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: SPACING.xl,
  },
  featuredCard: {
    backgroundColor: CHOOSE_COLORS.featuredCardBackground,
    borderRadius: 10,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOWS.small,
  },
  featuredCardContent: {
    flex: 1,
  },
  featuredTitle: {
    color: CHOOSE_COLORS.featuredTextColor,
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    marginBottom: 4,
  },
  featuredSubtitle: {
    color: CHOOSE_COLORS.featuredTextColor,
    fontSize: FONT_SIZES.large,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  featuredStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  featuredStatsIcon: {
    fontSize: FONT_SIZES.large,
    marginRight: 4,
  },
  featuredStatsText: {
    color: CHOOSE_COLORS.statsColor,
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
  },
  featuredArrow: {
    padding: 10,
  },
  connectingContainer: {
    marginBottom: SPACING.xl,
    alignItems: "center",
  },
  connectingText: {
    color: CHOOSE_COLORS.secondaryText,
    fontSize: FONT_SIZES.medium,
    marginTop: SPACING.sm,
  },
  variantsColumn: {
    flexDirection: 'column',
    width: '100%',
    padding: 10,
    gap: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: CHOOSE_COLORS.overlayBackground,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  rulesModal: {
    backgroundColor: CHOOSE_COLORS.modalBackground,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xxl,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderColor: CHOOSE_COLORS.modalBorder,
    borderWidth: 1,
  },
  rulesTitle: {
    color: CHOOSE_COLORS.accentGreen,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  rulesContent: {
    maxHeight: 300,
    marginBottom: SPACING.xl,
  },
  rulesText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    lineHeight: 24,
    textAlign: "left",
  },
  closeRulesButton: {
    backgroundColor: CHOOSE_COLORS.accentGreen,
    borderRadius: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    alignSelf: "center",
  },
  closeRulesButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
  },
  tournamentButton: {
    width: '40%',
  },
  tournamentIconContainer: {
    height: 60,
    paddingVertical: 6,
  },
  tournamentIconBackground: {
    backgroundColor: CHOOSE_COLORS.iconBackground,
  },
  tournamentButtonText: {
    fontSize: 13,
    bottom: 2,
  },
  navButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 30,
    gap: 5,
    backgroundColor: CHOOSE_COLORS.screenBackground,
  },
  navButton: {
    flex: 1,
    backgroundColor: CHOOSE_COLORS.cardBackground,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    borderBottomWidth: 1,
    borderBottomColor: CHOOSE_COLORS.modalBorder,
  },
  navButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
  },
  heading: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxlarge,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: SPACING.lg,
    textAlign: 'left',
  },
})
