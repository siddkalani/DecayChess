import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { fetchLeaderboardData } from "../lib/APIservice/service";
import { leaderboardScreenStyles } from "../lib/styles/screens";
import { Player } from "../lib/types/miscellaneous";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchLeaderboardData();
      if (result.success) {
        setPlayers(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("Error fetching players:", err);
      setError("Failed to load leaderboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return leaderboardScreenStyles.goldRank;
    if (rank === 2) return leaderboardScreenStyles.silverRank;
    if (rank === 3) return leaderboardScreenStyles.bronzeRank;
    return leaderboardScreenStyles.defaultRank;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "👑";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const calculateWinRate = (wins: number = 0, losses: number = 0) => {
    const total = wins + losses;
    if (total === 0) return "0%";
    return `${Math.round((wins / total) * 100)}%`;
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={leaderboardScreenStyles.container}>
        <View style={leaderboardScreenStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A862" />
          <Text style={leaderboardScreenStyles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={leaderboardScreenStyles.container}>
      <View style={leaderboardScreenStyles.header}>
        <Text style={leaderboardScreenStyles.title}>🏆 Leaderboard</Text>
        <Text style={leaderboardScreenStyles.subtitle}>Top players ranking</Text>
      </View>

      {error ? (
        <View style={leaderboardScreenStyles.errorContainer}>
          <Text style={leaderboardScreenStyles.errorEmoji}>⚠️</Text>
          <Text style={leaderboardScreenStyles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchData} style={leaderboardScreenStyles.retryButton}>
            <Text style={leaderboardScreenStyles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={leaderboardScreenStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00A862']}
              tintColor="#00A862"
            />
          }
        >

          {/* Full Rankings */}
          <View style={leaderboardScreenStyles.fullRankingsContainer}>
            <Text style={leaderboardScreenStyles.fullRankingsTitle}>Full Rankings</Text>
            
            {players.map((player, idx) => {
              const rank = idx + 1;
              const winRate = calculateWinRate(player.win, player.lose);
              
              return (
                <View key={player._id} style={[leaderboardScreenStyles.playerCard, rank <= 3 && leaderboardScreenStyles.topThreeCard]}>
                  <View style={leaderboardScreenStyles.cardHeader}>
                    <View style={[leaderboardScreenStyles.rankBadge, getRankStyle(rank)]}>
                      <Text style={leaderboardScreenStyles.rankText}>
                        {getRankIcon(rank)}
                      </Text>
                    </View>
                    
                    <View style={leaderboardScreenStyles.playerInfo}>
                      <Text style={leaderboardScreenStyles.playerName}>{player.name}</Text>
                      <Text style={leaderboardScreenStyles.playerEmail}>{player.email}</Text>
                    </View>
                    
                    <View style={leaderboardScreenStyles.ratingContainer}>
                      <Text style={leaderboardScreenStyles.ratingValue}>{player.ratings || 0}</Text>
                      <Text style={leaderboardScreenStyles.ratingLabel}>Rating</Text>
                    </View>
                  </View>

                  <View style={leaderboardScreenStyles.statsContainer}>
                    <View style={leaderboardScreenStyles.statBox}>
                      <Text style={leaderboardScreenStyles.statValue}>{player.win || 0}</Text>
                      <Text style={leaderboardScreenStyles.statLabel}>Wins</Text>
                    </View>
                    
                    <View style={leaderboardScreenStyles.statDivider} />
                    
                    <View style={leaderboardScreenStyles.statBox}>
                      <Text style={leaderboardScreenStyles.statValue}>{player.lose || 0}</Text>
                      <Text style={leaderboardScreenStyles.statLabel}>Losses</Text>
                    </View>
                    
                    <View style={leaderboardScreenStyles.statDivider} />
                    
                    <View style={leaderboardScreenStyles.statBox}>
                      <Text style={leaderboardScreenStyles.statValue}>{winRate}</Text>
                      <Text style={leaderboardScreenStyles.statLabel}>Win Rate</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={leaderboardScreenStyles.footerSpace} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

