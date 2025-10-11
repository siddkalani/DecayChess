import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, SPACING } from '../base'

// Streak Master screen specific colors
const STREAK_COLORS = {
  screenBackground: '#1C1C1E',
  cardBackground: '#2C2C2E',
  victoryRushBackground: '#69923e',
  accentGreen: '#00A862',
  walletBackground: '#2C2C2E',
  walletBorder: 'rgba(0, 168, 98, 0.3)',
  backButtonBackground: 'rgba(255, 255, 255, 0.1)',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  greenBorder: 'rgba(0, 168, 98, 0.2)',
  secondaryText: 'rgba(255, 255, 255, 0.7)',
  lightBackground: '#FFF5E1',
  progressBackground: 'rgba(255,255,255,0.3)',
  progressFill: '#32D74B',
  dividerColor: 'rgba(255, 255, 255, 0.2)',
  currentPlayerBackground: 'rgba(0, 168, 98, 0.1)',
  errorRed: '#FF6B6B',
  shadowGreen: '#00A862',
}

export const streakMasterScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STREAK_COLORS.screenBackground,
  },
  infoText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    marginTop: SPACING.lg,
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    paddingTop: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: STREAK_COLORS.backButtonBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '600',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xlarge,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  wallet: {
    backgroundColor: STREAK_COLORS.walletBackground,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.xl,
    borderWidth: 1,
    borderColor: STREAK_COLORS.walletBorder,
    minWidth: 80,
    alignItems: 'center',
  },
  walletText: {
    color: STREAK_COLORS.accentGreen,
    fontSize: FONT_SIZES.large,
    fontWeight: '700',
  },

  // Victory Rush Card
  victoryRushCard: {
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.xl,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  cardBackground: {
    backgroundColor: STREAK_COLORS.victoryRushBackground,
    position: 'relative',
  },
  victoryRushContent: {
    padding: SPACING.xl,
    alignItems: 'center',
    minHeight: 240,
  },
  victoryRushLogo: {
    position: 'absolute',
    top: -50,
    width: '120%',
    height: 200,
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
    paddingTop: 100,
    marginBottom: SPACING.xl,
    zIndex: 2,
  },
  subtitle: {
    color: STREAK_COLORS.lightBackground,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  motivationText: {
    color: STREAK_COLORS.lightBackground,
    fontSize: FONT_SIZES.large,
    opacity: 0.9,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '90%',
    height: 8,
    backgroundColor: STREAK_COLORS.progressBackground,
    borderRadius: 4,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  progressFill: {
    width: '43%',
    height: '100%',
    backgroundColor: STREAK_COLORS.progressFill,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
  },
  spotsLeft: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
  },
  totalSpots: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
  },

  // Section Titles
  sectionTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.lg,
    letterSpacing: 0.5,
  },

  // Rules Section
  rulesContainer: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  rulesCard: {
    backgroundColor: STREAK_COLORS.cardBackground,
    borderRadius: SPACING.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: STREAK_COLORS.borderColor,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  ruleBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: STREAK_COLORS.accentGreen,
    marginRight: SPACING.lg,
    marginTop: SPACING.sm,
    flexShrink: 0,
  },
  ruleText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    lineHeight: 24,
    flex: 1,
  },

  // Personal Stats
  personalStatsContainer: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  personalStatsCard: {
    backgroundColor: STREAK_COLORS.cardBackground,
    borderRadius: SPACING.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: STREAK_COLORS.greenBorder,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: STREAK_COLORS.accentGreen,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  statLabel: {
    color: STREAK_COLORS.secondaryText,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: STREAK_COLORS.dividerColor,
    marginHorizontal: SPACING.lg,
  },
  noStatsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  noStatsText: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  noStatsSubtext: {
    color: STREAK_COLORS.secondaryText,
    fontSize: FONT_SIZES.large,
    textAlign: 'center',
  },

  // Leaderboard
  leaderboardContainer: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  playerCard: {
    backgroundColor: STREAK_COLORS.cardBackground,
    borderRadius: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: STREAK_COLORS.borderColor,
  },
  currentPlayerCard: {
    backgroundColor: STREAK_COLORS.currentPlayerBackground,
    borderColor: STREAK_COLORS.accentGreen,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  playerRank: {
    color: STREAK_COLORS.secondaryText,
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    width: 40,
  },
  playerDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  playerName: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
  },
  currentPlayerName: {
    color: STREAK_COLORS.accentGreen,
    fontWeight: '700',
  },
  youIndicator: {
    color: STREAK_COLORS.accentGreen,
    fontSize: FONT_SIZES.medium,
    fontWeight: '500',
  },
  playerStreak: {
    color: STREAK_COLORS.accentGreen,
    fontSize: FONT_SIZES.large,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  tournamentInfo: {
    backgroundColor: STREAK_COLORS.cardBackground,
    borderRadius: SPACING.md,
    padding: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: STREAK_COLORS.borderColor,
  },
  tournamentName: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  participantCount: {
    color: STREAK_COLORS.secondaryText,
    fontSize: FONT_SIZES.small,
    fontWeight: '500',
  },

  // Loading and Error States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    marginTop: SPACING.md,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: STREAK_COLORS.errorRed,
    fontSize: FONT_SIZES.large,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: STREAK_COLORS.accentGreen,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: SPACING.xl,
  },
  retryButtonText: {
    color: '#000000',
    fontSize: FONT_SIZES.medium,
    fontWeight: '700',
  },

  // Bottom Container
  bottomContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    paddingBottom: 40,
    backgroundColor: STREAK_COLORS.screenBackground,
    borderTopWidth: 1,
    borderTopColor: STREAK_COLORS.borderColor,
  },
  playButton: {
    backgroundColor: STREAK_COLORS.accentGreen,
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: SPACING.md,
    elevation: 6,
    shadowColor: STREAK_COLORS.shadowGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  playButtonDisabled: {
    opacity: 0.7,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: SPACING.sm,
  },
  timerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  bottomPadding: {
    height: 140,
  },

  // Queue Status
  queueStatusContainer: {
    backgroundColor: STREAK_COLORS.cardBackground,
    borderRadius: SPACING.xl,
    padding: SPACING.xl,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: STREAK_COLORS.walletBorder,
  },
  queueStatusText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  queueTimerText: {
    color: STREAK_COLORS.secondaryText,
    fontSize: FONT_SIZES.large,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  matchFoundText: {
    color: STREAK_COLORS.accentGreen,
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'bold',
    marginTop: SPACING.md,
    textAlign: 'center',
  },

  // Match Found Styles
  matchFoundContainer: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  matchFoundCard: {
    backgroundColor: STREAK_COLORS.cardBackground,
    borderRadius: SPACING.xl,
    padding: SPACING.xl,
    borderWidth: 2,
    borderColor: STREAK_COLORS.accentGreen,
    alignItems: 'center',
    elevation: 8,
    shadowColor: STREAK_COLORS.accentGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  matchFoundTitle: {
    color: STREAK_COLORS.accentGreen,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  matchDetailsSection: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  opponentSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: STREAK_COLORS.borderColor,
  },
  opponentLabel: {
    color: STREAK_COLORS.secondaryText,
    fontSize: FONT_SIZES.medium,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  opponentName: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xlarge,
    fontWeight: '700',
  },
  variantSection: {
    alignItems: 'center',
  },
  variantLabel: {
    color: STREAK_COLORS.secondaryText,
    fontSize: FONT_SIZES.medium,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  variantName: {
    color: STREAK_COLORS.accentGreen,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subvariantName: {
    color: 'rgba(0, 168, 98, 0.8)',
    fontSize: FONT_SIZES.medium,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  startingGameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: STREAK_COLORS.borderColor,
  },
  startingGameText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
})
