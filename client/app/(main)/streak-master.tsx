import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { Socket } from "socket.io-client";

import { ClassicChess, CrazyHouseChess, DecayChess } from '../(game)/variants';
import SixPointerChessGame from '../(game)/variants/six-pointer';
import { getSocket } from '../../utils/socketManager';
import { fetchTournamentLeaderboard } from '../lib/APIservice/service';
import { streakMasterScreenStyles } from '../lib/styles/screens';
import { GameState } from '../lib/types/gamestate';

export default function StreakMasterScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  // Keep exactly the same state variables as tournament.tsx
  const [isConnecting, setIsConnecting] = useState(false);
  const [tournamentSocket, setTournamentSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isMatchFound, setIsMatchFound] = useState(false);
  const [gameSocket, setGameSocket] = useState<Socket | null>(null);
  const [matchedVariant, setMatchedVariant] = useState<string | null>(null);
  const [matchedSubvariant, setMatchedSubvariant] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [tournamentStatus, setTournamentStatus] = useState<'idle' | 'joining' | 'queuing' | 'matched'>('idle');
  const [isJoiningTournament, setIsJoiningTournament] = useState(false);
  const [isTournamentQueueing, setIsTournamentQueueing] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [matchDetails, setMatchDetails] = useState<{
    variant: string;
    subvariant?: string;
    opponent: string;
  } | null>(null);

  // Timer effect exactly same as tournament.tsx
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1)
    }, 1000)

    if (!isTournamentQueueing || opponent || isMatchFound) {
      clearInterval(interval)
      return
    }

    if (timer > 60 && timer % 30 === 0) {
      Alert.alert(
        "Still Searching...",
        `No opponent found in ${timer} seconds. Do you want to continue waiting?`,
        [
          { text: "Continue Waiting", style: "cancel" },
          { text: "Leave Queue", onPress: () => handleLeaveTournament() },
        ],
      )
    }

    return () => clearInterval(interval)
  }, [timer, opponent, isMatchFound, isTournamentQueueing])

  // Modified handlePlayNow function
  const handlePlayNow = useCallback(async () => {
    try {
      if (!userId) {
        Alert.alert("Error", "User not identified.")
        return
      }

      setActiveButton("tournament")
      setIsConnecting(true)
      setTournamentStatus('joining')

      // Create tournament socket connection
      const tournamentSocketInstance = getSocket(userId, "matchmaking")
      if (!tournamentSocketInstance) {
        throw new Error("Failed to connect to matchmaking server")
      }

      // Set up tournament event listeners
      tournamentSocketInstance.onAny((event: string, ...args: any[]) => {
        console.log("[STREAK] Socket event:", event, args)
      })

      // Handle tournament join success
      tournamentSocketInstance.on("tournament:joined", (response: { 
        tournament: any,
        status: 'already_joined' | 'newly_joined' 
      }) => {
        console.log("Queue joined:", response)
        setIsJoiningTournament(false)
        setIsTournamentQueueing(true)
        setTournamentStatus('queuing')
        setTimer(0)
        setIsConnecting(false)
        setActiveButton(null)
      })

      // Handle match found
      tournamentSocketInstance.on("queue:matched", async (response: {
        opponent: { userId: string; name: string }
        variant: string
        subvariant?: string
        sessionId: string
        gameState: GameState
      }) => {
        console.log("Match found:", response)
        setTournamentStatus('matched')
        
        // Set match details for display
        setMatchDetails({
          variant: response.variant,
          subvariant: response.subvariant,
          opponent: response.opponent.name
        })
        
        // Show match details for 3 seconds before starting game
        setTimeout(async () => {
          // Disconnect tournament socket
          tournamentSocketInstance.disconnect()
          setTournamentSocket(null)
          
          // Create game socket
          const gameSocketInstance = getSocket(
            userId,
            "game",
            response.sessionId,
            response.variant,
            response.subvariant,
            "tournament" // Keep tournament mode for consistency
          )

          if (!gameSocketInstance) {
            Alert.alert("Error", "Failed to connect to game server")
            return
          }

          // Set up game state
          setGameSocket(gameSocketInstance)
          setGameState(response.gameState)
          setMatchedVariant(response.variant)
          setMatchedSubvariant(response.subvariant || null)
          setIsMatchFound(true)
          setOpponent(response.opponent.name)
          setMatchDetails(null) // Clear match details
        }, 3000) // 3 second delay to show match details
      })

      // Handle errors
      tournamentSocketInstance.on("error", (error: { message: string; error?: any }) => {
        console.error("Matchmaking error:", error)
        Alert.alert("Error", error.message)
        handleLeaveTournament()
      })

      // Store socket reference
      setTournamentSocket(tournamentSocketInstance)

      // Join tournament
      tournamentSocketInstance.emit("tournament:join")

      // Set connection timeout
      setTimeout(() => {
        if (isConnecting) {
          setIsConnecting(false)
          setActiveButton(null)
          if (tournamentSocketInstance.connected) {
            tournamentSocketInstance.disconnect()
          }
          setTournamentSocket(null)
          setTournamentStatus('idle')
          Alert.alert("Connection Timeout", "Failed to join queue. Please try again.")
        }
      }, 10000)

    } catch (error) {
      console.error("Queue join error:", error)
      setIsConnecting(false)
      setActiveButton(null)
      setTournamentStatus('idle')
      Alert.alert("Error", "Failed to start matchmaking. Please try again.")
    }
  }, [userId])

  // Modified handleLeaveTournament function
  const handleLeaveTournament = useCallback(() => {
    if (tournamentSocket) {
      tournamentSocket.emit("tournament:leave")
      tournamentSocket.disconnect()
      setTournamentSocket(null)
    }

    setIsJoiningTournament(false)
    setIsTournamentQueueing(false)
    setOpponent(null)
    setTimer(0)
    setGameState(null)
    setIsMatchFound(false)
    setLoading(false)
    setMatchedVariant(null)
    setMatchedSubvariant(null)
    setTournamentStatus('idle')
    setActiveButton(null)
    setMatchDetails(null)
  }, [tournamentSocket])

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchTournamentLeaderboard();
      
      if (result.success) {
        setLeaderboardData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [])

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard])

  // Helper function to format variant name
  const formatVariantName = (variant: string, subvariant?: string) => {
    const variantNames = {
      'classic': 'Classic Chess',
      'decay': 'Decay Chess', 
      'sixpointer': '6-Point Chess',
      'crazyhouse': 'Crazyhouse'
    }
    
    let name = variantNames[variant as keyof typeof variantNames] || variant
    if (subvariant) {
      name += ` (${subvariant})`
    }
    return name
  }

  // Exact same game rendering logic as tournament.tsx
  if (isMatchFound && gameState && gameSocket && matchedVariant && userId) {
    switch (matchedVariant) {
      case "classic":
        return <ClassicChess initialGameState={gameState} userId={userId} />
      case "decay":
        return <DecayChess initialGameState={gameState} userId={userId} />
      case "sixpointer":
        return <SixPointerChessGame initialGameState={gameState} userId={userId} />
      case "crazyhouse":
        return <CrazyHouseChess initialGameState={gameState} userId={userId} />
      default:
        return <Text style={streakMasterScreenStyles.errorText}>Unsupported variant: {matchedVariant}</Text>
    }
  } else if (loading) {
    return (
      <View style={streakMasterScreenStyles.container}>
        <ActivityIndicator size="large" color="#00A862" />
        <Text style={streakMasterScreenStyles.infoText}>Waiting for match to be established...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={streakMasterScreenStyles.container}>
      <ScrollView 
        style={streakMasterScreenStyles.scrollView} 
        contentContainerStyle={streakMasterScreenStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={streakMasterScreenStyles.header}>
          <TouchableOpacity onPress={() => router.back()} style={streakMasterScreenStyles.backButton}>
            <Text style={streakMasterScreenStyles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={streakMasterScreenStyles.headerTitle}>Streak Master</Text>
          <View style={streakMasterScreenStyles.wallet}>
            <Text style={streakMasterScreenStyles.walletText}>₹1.00</Text>
          </View>
        </View>

        {/* Victory Rush Card */}
        <View style={streakMasterScreenStyles.victoryRushCard}>
          <View style={streakMasterScreenStyles.cardBackground}>
             <View style={streakMasterScreenStyles.victoryRushContent}>
              <Image 
                source={require("../../assets/tl.png")} 
                style={streakMasterScreenStyles.victoryRushLogo}
                resizeMode="contain"
              />
              <View style={streakMasterScreenStyles.textContainer}>
                <Text style={streakMasterScreenStyles.subtitle}>Rack up wins.</Text>
                <Text style={streakMasterScreenStyles.motivationText}>Keep your streak alive!</Text>
              </View>

            </View>
          </View>
        </View>

        {/* Queue Status */}
        {isTournamentQueueing && (
          <View style={streakMasterScreenStyles.queueStatusContainer}>
            <ActivityIndicator size="large" color="#00A862" />
            <Text style={streakMasterScreenStyles.queueStatusText}>Searching for match...</Text>
            <Text style={streakMasterScreenStyles.queueTimerText}>Time in queue: {timer}s</Text>
          </View>
        )}

        {/* Match Found Details */}
        {matchDetails && (
          <View style={streakMasterScreenStyles.matchFoundContainer}>
            <View style={streakMasterScreenStyles.matchFoundCard}>
              <Text style={streakMasterScreenStyles.matchFoundTitle}>🎯 Match Found!</Text>
              
              <View style={streakMasterScreenStyles.matchDetailsSection}>
                <View style={streakMasterScreenStyles.opponentSection}>
                  <Text style={streakMasterScreenStyles.opponentLabel}>Opponent</Text>
                  <Text style={streakMasterScreenStyles.opponentName}>{matchDetails.opponent}</Text>
                </View>
                
                <View style={streakMasterScreenStyles.variantSection}>
                  <Text style={streakMasterScreenStyles.variantLabel}>Game Mode</Text>
                  <Text style={streakMasterScreenStyles.variantName}>
                    {formatVariantName(matchDetails.variant, matchDetails.subvariant)}
                  </Text>
                  {matchDetails.subvariant && (
                    <Text style={streakMasterScreenStyles.subvariantName}>
                      {matchDetails.subvariant}
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={streakMasterScreenStyles.startingGameSection}>
                <ActivityIndicator size="small" color="#00A862" />
                <Text style={streakMasterScreenStyles.startingGameText}>Starting game...</Text>
              </View>
            </View>
          </View>
        )}

        {/* How to Win Section */}
        <View style={streakMasterScreenStyles.rulesContainer}>
          <Text style={streakMasterScreenStyles.sectionTitle}>How to Win</Text>
          <View style={streakMasterScreenStyles.rulesCard}>
            {[
              "Win or draw games without losing to form a streak",
              "The more games you go unbeaten, the longer your streak",
              "The number of games in your unbeaten streak will be your score in the leaderboard",
              "Your score will be frozen when you lose a game. But don't worry, we will give you another chance if you lose your first game",
              "You should win at least one game to be eligible for prize money"
            ].map((rule, index) => (
              <View key={index} style={streakMasterScreenStyles.ruleItem}>
                <View style={streakMasterScreenStyles.ruleBullet} />
                <Text style={streakMasterScreenStyles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Personal Stats */}
        {leaderboardData && (
          <View style={streakMasterScreenStyles.personalStatsContainer}>
            <Text style={streakMasterScreenStyles.sectionTitle}>Your Stats</Text>
            <View style={streakMasterScreenStyles.personalStatsCard}>
              {(() => {
                const currentUser = leaderboardData.leaderboard.find((player: any) => player.player.id === userId);
                return currentUser ? (
                  <View style={streakMasterScreenStyles.statsGrid}>
                    <View style={streakMasterScreenStyles.statBox}>
                      <Text style={streakMasterScreenStyles.statValue}>{currentUser.player.currentTournamentStreak}</Text>
                      <Text style={streakMasterScreenStyles.statLabel}>Current Streak</Text>
                    </View>
                    <View style={streakMasterScreenStyles.statDivider} />
                    <View style={streakMasterScreenStyles.statBox}>
                      <Text style={streakMasterScreenStyles.statValue}>{currentUser.player.personalBestStreak}</Text>
                      <Text style={streakMasterScreenStyles.statLabel}>Personal Best</Text>
                    </View>
                    <View style={streakMasterScreenStyles.statDivider} />
                    <View style={streakMasterScreenStyles.statBox}>
                      <Text style={streakMasterScreenStyles.statValue}>#{currentUser.rank}</Text>
                      <Text style={streakMasterScreenStyles.statLabel}>Current Rank</Text>
                    </View>
                  </View>
                ) : (
                  <View style={streakMasterScreenStyles.noStatsContainer}>
                    <Text style={streakMasterScreenStyles.noStatsText}>🎯</Text>
                    <Text style={streakMasterScreenStyles.noStatsSubtext}>Join tournament to see your stats</Text>
                  </View>
                );
              })()}
            </View>
          </View>
        )}

        {/* Leaderboard */}
        <View style={streakMasterScreenStyles.leaderboardContainer}>
          <Text style={streakMasterScreenStyles.sectionTitle}>Leaderboard</Text>
          
          {loading ? (
            <View style={streakMasterScreenStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#00A862" />
              <Text style={streakMasterScreenStyles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : leaderboardData ? (
            <View>
              {leaderboardData.leaderboard.slice(0, 10).map((player: any, index: number) => (
                <View 
                  key={player.player.id} 
                  style={[
                    streakMasterScreenStyles.playerCard,
                    player.player.id === userId && streakMasterScreenStyles.currentPlayerCard
                  ]}
                >
                  <View style={streakMasterScreenStyles.playerRow}>
                    <Text style={streakMasterScreenStyles.playerRank}>#{player.rank}</Text>
                    <View style={streakMasterScreenStyles.playerDetails}>
                      <Text style={[
                        streakMasterScreenStyles.playerName,
                        player.player.id === userId && streakMasterScreenStyles.currentPlayerName
                      ]}>
                        {player.player.name}
                        {player.player.id === userId && (
                          <Text style={streakMasterScreenStyles.youIndicator}> (You)</Text>
                        )}
                      </Text>
                    </View>
                    <Text style={streakMasterScreenStyles.playerStreak}>{player.player.currentTournamentStreak}</Text>
                  </View>
                </View>
              ))}
              
              <View style={streakMasterScreenStyles.tournamentInfo}>
                <Text style={streakMasterScreenStyles.tournamentName}>{leaderboardData.tournament.name}</Text>
                <Text style={streakMasterScreenStyles.participantCount}>
                  {leaderboardData.tournament.totalParticipants} participants
                </Text>
              </View>
            </View>
          ) : (
            <View style={streakMasterScreenStyles.errorContainer}>
              <Text style={streakMasterScreenStyles.errorEmoji}>⚠️</Text>
              <Text style={streakMasterScreenStyles.errorText}>Failed to load leaderboard</Text>
              <TouchableOpacity onPress={fetchLeaderboard} style={streakMasterScreenStyles.retryButton}>
                <Text style={streakMasterScreenStyles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={streakMasterScreenStyles.bottomPadding} />
      </ScrollView>

      {/* Fixed Bottom Section */}
      <View style={streakMasterScreenStyles.bottomContainer}>
        <TouchableOpacity 
          style={[
            streakMasterScreenStyles.playButton, 
            (isConnecting || tournamentStatus !== 'idle') && streakMasterScreenStyles.playButtonDisabled
          ]}
          onPress={tournamentStatus === 'idle' ? handlePlayNow : handleLeaveTournament}
          disabled={tournamentStatus === 'matched'}
          activeOpacity={0.8}
        >
          {isConnecting || tournamentStatus !== 'idle' ? (
            <View style={streakMasterScreenStyles.loadingButtonContent}>
              <ActivityIndicator size="small" color="#000000" />
              <Text style={streakMasterScreenStyles.playButtonText}>
                {tournamentStatus === 'joining' ? 'Connecting...' : 
                 tournamentStatus === 'queuing' ? `Finding Match (${timer}s)` :
                 matchDetails ? 'Starting Game...' : 'Match Found!'}
              </Text>
            </View>
          ) : (
            <Text style={streakMasterScreenStyles.playButtonText}>Play Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

