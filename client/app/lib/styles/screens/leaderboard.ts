import { Dimensions, StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SHADOWS, SPACING } from '../base';

const { width: screenWidth } = Dimensions.get('window');

// Leaderboard screen specific colors
const LEADERBOARD_COLORS = {
  screenBackground: '#1C1C1E',
  cardBackground: '#2C2C2E',
  topThreeCard: '#2C2C2E',
  rankBadgeGold: '#3A3A3C',
  rankBadgeSilver: '#3A3A3C',
  rankBadgeBronze: '#3A3A3C',
  rankBadgeDefault: 'rgba(255, 255, 255, 0.1)',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  topThreeBorder: 'rgba(255, 255, 255, 0.2)',
  goldBorder: 'rgba(255, 255, 255, 0.4)',
  silverBorder: 'rgba(255, 255, 255, 0.3)',
  bronzeBorder: 'rgba(255, 255, 255, 0.2)',
  secondaryText: 'rgba(255, 255, 255, 0.6)',
  tertiaryText: 'rgba(255, 255, 255, 0.5)',
  dividerColor: 'rgba(255, 255, 255, 0.15)',
}

export const leaderboardScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LEADERBOARD_COLORS.screenBackground,
  },
  
  // Header
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  title: {
    color: COLORS.white,
    fontSize: Math.min(screenWidth * 0.08, 32),
    fontWeight: "800",
    textAlign: "center",
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: LEADERBOARD_COLORS.secondaryText,
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: "500",
    textAlign: "center",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    fontWeight: "500",
    marginTop: SPACING.md,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: LEADERBOARD_COLORS.secondaryText,
    fontSize: FONT_SIZES.large,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: LEADERBOARD_COLORS.cardBackground,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: LEADERBOARD_COLORS.borderColor,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    fontWeight: "600",
  },

  // Scroll Content
  scrollContent: {
    paddingBottom: 40,
  },

  // Full Rankings
  fullRankingsContainer: {
    paddingHorizontal: SPACING.xl,
  },
  fullRankingsTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xlarge,
    fontWeight: "700",
    marginBottom: SPACING.lg,
  },

  // Player Cards
  playerCard: {
    backgroundColor: LEADERBOARD_COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: LEADERBOARD_COLORS.borderColor,
    ...SHADOWS.small,
  },
  topThreeCard: {
    borderColor: LEADERBOARD_COLORS.topThreeBorder,
    borderWidth: 1,
    backgroundColor: LEADERBOARD_COLORS.topThreeCard,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  
  // Rank Badge
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  goldRank: {
    backgroundColor: LEADERBOARD_COLORS.rankBadgeGold,
    borderWidth: 2,
    borderColor: LEADERBOARD_COLORS.goldBorder,
  },
  silverRank: {
    backgroundColor: LEADERBOARD_COLORS.rankBadgeSilver,
    borderWidth: 1,
    borderColor: LEADERBOARD_COLORS.silverBorder,
  },
  bronzeRank: {
    backgroundColor: LEADERBOARD_COLORS.rankBadgeBronze,
    borderWidth: 1,
    borderColor: LEADERBOARD_COLORS.bronzeBorder,
  },
  defaultRank: {
    backgroundColor: LEADERBOARD_COLORS.rankBadgeDefault,
  },
  rankText: {
    fontSize: FONT_SIZES.large,
    fontWeight: "700",
    color: COLORS.white,
  },

  // Player Info
  playerInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  playerName: {
    color: COLORS.white,
    fontSize: Math.min(screenWidth * 0.045, 18),
    fontWeight: "600",
    marginBottom: 4,
  },
  playerEmail: {
    color: LEADERBOARD_COLORS.tertiaryText,
    fontSize: Math.min(screenWidth * 0.035, 14),
    fontWeight: "400",
  },

  // Rating
  ratingContainer: {
    alignItems: 'center',
  },
  ratingValue: {
    color: COLORS.white,
    fontSize: Math.min(screenWidth * 0.05, 20),
    fontWeight: "700",
    marginBottom: 2,
  },
  ratingLabel: {
    color: LEADERBOARD_COLORS.secondaryText,
    fontSize: Math.min(screenWidth * 0.03, 12),
    fontWeight: "500",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: LEADERBOARD_COLORS.borderColor,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: COLORS.white,
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: "600",
    marginBottom: 4,
  },
  statLabel: {
    color: LEADERBOARD_COLORS.tertiaryText,
    fontSize: Math.min(screenWidth * 0.03, 12),
    fontWeight: "500",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: LEADERBOARD_COLORS.dividerColor,
    marginHorizontal: SPACING.sm,
  },

  // Footer
  footerSpace: {
    height: 40,
  },
})
