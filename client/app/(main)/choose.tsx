import { getSocket } from "@/utils/socketManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { shouldHideNavigation } from "../../utils/navigationState";
import Layout from '../components/layout/Layout';
import VariantCard from '../components/ui/VariantCard';
import Skeleton from "../components/ui/Skeleton";
import TournamentScreen from "./tournament";
import { chooseScreenStyles } from "../lib/styles/screens";

export default function Choose() {
  const router = useRouter();
  
  const variants = [
    {
      name: "decay",
      title: "Decay",
      subtitle: "Time Control: 3+2",
      description: "Move your queen to start a decay timer; later a major piece gets one too.",
      rulesItems: [
        "On your first queen move, a 25s Decay Timer starts (runs only on your turns).",
        "Each subsequent move of that same queen adds +2s to its remaining decay time.",
        "If the timer expires, the queen freezes and cannot be moved again.",
        "After your queen freezes, the next major piece you move starts a 20s Decay Timer with the same behavior.",
      ],
      color: "#2C2C2E"
    },
    {
      name: "sixpointer",
      title: "6PT Chess",
      subtitle: "Time Control: 30 sec per move",
      description: "Score points by captures over 6 moves each from a balanced random start.",
      rulesItems: [
        "Start from a verified random, legal, balanced mid‑game position.",
        "Each side gets 6 full moves (12 plies); after both complete 6 moves, the game ends.",
        "Scoring: Pawn=1, Knight/Bishop=3, Rook=5, Queen=9 (sum your captures).",
        "Checkmate ends immediately; the checkmated side loses.",
        "Draws (stalemate/threefold): scores stand and are split accordingly.",
        "Missed move (flag or failing to play when legal): −1 point penalty.",
        "Foul play: if you capture on your 6th move and opponent has an immediate legal recapture but no moves left, it counts as foul play.",
        "Tie on points: Draw.",
      ],
      color: "#2C2C2E"
    },
    {
      name: "crazyhouse",
      title: "Crazyhouse",
      subtitle: "Time Control: 3+2 (choose Standard or with Timer)",
      description: "Captured pieces go to your Pocket; drop them on your turn instead of moving.",
      rulesItems: [
        "Captured enemy pieces go to your Pocket.",
        "On your turn, you may drop a pocket piece on a legal square instead of moving.",
        "Pawns cannot be dropped on the 1st or 8th ranks.",
        "With Timer subvariant: each captured piece must be dropped within 10s on your turn or it disappears.",
      ],
      color: "#2C2C2E"
    },
    {
      name: "classic",
      title: "Classic Chess",
      subtitle: "Time Controls: Standard 10+0, Bullet 1+0",
      description: "Normal FIDE rules for movement, castling, en passant, promotion, check, and checkmate.",
      rulesItems: [
        "Flagging: main clock expires → loss on time.",
        "Illegal moves follow standard chess penalties.",
      ],
      color: "#2C2C2E"
    },
  ];

  const [userId, setUserId] = useState<string | null>(null);
  const [socketConnecting, setSocketConnecting] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedVariantRules, setSelectedVariantRules] = useState("");
  const [selectedVariantTitle, setSelectedVariantTitle] = useState("");
  const [livePlayers, setLivePlayers] = useState<Record<"decay" | "sixpointer" | "crazyhouse" | "classic", number>>({
    decay: 0,
    sixpointer: 0,
    crazyhouse: 0,
    classic: 0,
  });
  const [isFetchingLivePlayers, setIsFetchingLivePlayers] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const fetchUserId = useCallback(async (): Promise<string | null> => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserId(user._id);
        return user._id;
      }

      setUserId(null);
      router.replace("/(auth)/login");
      return null;
    } catch (e) {
      console.error("Error fetching user ID:", e);
      setUserId(null);
      router.replace("/(auth)/login");
      return null;
    }
  }, [router]);

  useEffect(() => {
    fetchUserId();
  }, [fetchUserId]);

  useEffect(() => {
    if (!userId) return;

    if (!refreshing) {
      setIsFetchingLivePlayers(true);
    }
    const socketInstance = getSocket(userId, "matchmaking");

    const handleLiveCounts = (data: { decay?: number; sixpointer?: number; crazyhouse?: number; classic?: number }) => {
      setLivePlayers({
        decay: Number(data?.decay) || 0,
        sixpointer: Number(data?.sixpointer) || 0,
        crazyhouse: Number(data?.crazyhouse) || 0,
        classic: Number(data?.classic) || 0,
      });
      setIsFetchingLivePlayers(false);
      setRefreshing(false);
      clearRefreshTimeout();
    };

    const handleConnectError = (error: Error) => {
      console.error("Matchmaking socket connection error:", error);
      setIsFetchingLivePlayers(false);
      setRefreshing(false);
      clearRefreshTimeout();
    };

    const requestCounts = () => {
      try {
        socketInstance.emit("queue:get_live_counts");
      } catch (err) {
        console.error("Failed to request live counts:", err);
        setIsFetchingLivePlayers(false);
        setRefreshing(false);
        clearRefreshTimeout();
      }
    };

    socketInstance.on("queue:live_counts", handleLiveCounts);
    socketInstance.on("connect_error", handleConnectError);

    if (!socketInstance.connected) {
      socketInstance.once("connect", requestCounts);
      socketInstance.connect();
    } else {
      requestCounts();
    }

    return () => {
      socketInstance.off("queue:live_counts", handleLiveCounts);
      socketInstance.off("connect_error", handleConnectError);
      socketInstance.off("connect", requestCounts);
    };
  }, [userId, refreshKey, clearRefreshTimeout]);

  useEffect(() => {
    return () => {
      clearRefreshTimeout();
    };
  }, [clearRefreshTimeout]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    clearRefreshTimeout();
    refreshTimeoutRef.current = setTimeout(() => {
      refreshTimeoutRef.current = null;
      setRefreshing(false);
      setIsFetchingLivePlayers(false);
    }, 10000);
    fetchUserId()
      .then((id) => {
        if (!id) {
          setIsFetchingLivePlayers(false);
          setRefreshing(false);
          clearRefreshTimeout();
          return;
        }
        setRefreshKey((prev) => prev + 1);
      })
      .catch((error) => {
        console.error("Failed to refresh home screen:", error);
        setIsFetchingLivePlayers(false);
        setRefreshing(false);
        clearRefreshTimeout();
      });
  }, [fetchUserId, clearRefreshTimeout]);

 

  const handleVariantSelect = async (variant: string) => {
    if (!userId) {
      Alert.alert("Login Required", "Please log in to play games.");
      return;
    }

    if (variant === "classic") {
      router.replace({ pathname: "/(game)/time-controls/classic", params: { userId } } as any);
      return;
    } else if (variant === "crazyhouse") {
      router.replace({ pathname: "/(game)/time-controls/crazy", params: { userId } } as any);
      return;
    }

    setSocketConnecting(true);
    const socketInstance = getSocket(userId, "matchmaking");

    const joinQueue = () => {
      socketInstance.emit("queue:join", { variant });
      router.replace({ pathname: "/matchmaking", params: { variant, userId } });
      setSocketConnecting(false);
    };

    function onConnectSuccess() {
      console.log("Matchmaking socket connected for variant select.");
      socketInstance.off("connect_error", onConnectError);
      joinQueue();
    }

    function onConnectError(error: Error) {
      console.error("Matchmaking socket connection error:", error);
      Alert.alert("Connection Failed", "Failed to connect to the game server. Please try again.");
      socketInstance.off("connect", onConnectSuccess);
      socketInstance.off("connect_error", onConnectError);
      setSocketConnecting(false);
    }

    if (socketInstance.connected) {
      joinQueue();
      return;
    }

    socketInstance.once("connect", onConnectSuccess);
    socketInstance.once("connect_error", onConnectError);
    socketInstance.connect();
  };

  const handleProfile = () => {
    router.push({ pathname: '/profile' } as any);
  };

  const handleLeaderboard = () => {
    router.push({ pathname: "/leaderboard" } as any);
  };

  const handleOffline = () => {
    router.push('/(offline)');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      router.push("/(auth)/login");
    } catch (e) {
      console.error("Error logging out:", e);
      Alert.alert("Error", "Failed to log out.");
    }
  };

  const closeRulesModal = () => {
    setShowRulesModal(false);
    setSelectedVariantRules("");
    setSelectedVariantTitle("");
  };

  const [isChooseScreen, setIsChooseScreen] = useState(true);
  const showChooseScreen = () => setIsChooseScreen(true);
  const showTournamentScreen = () => setIsChooseScreen(false);

  // Check if navigation should be hidden (tournament match active)
  const [hideNavigation, setHideNavigation] = useState(shouldHideNavigation());
  
  // Poll navigation state to detect changes
  useEffect(() => {
    const checkNavVisibility = () => {
      const currentState = shouldHideNavigation();
      if (currentState !== hideNavigation) {
        setHideNavigation(currentState);
      }
    };
    
    const interval = setInterval(checkNavVisibility, 500);
    return () => clearInterval(interval);
  }, [hideNavigation]);

  return (
    <Layout
      onProfile={handleProfile}
      onLogout={handleLogout}
      onSelectHome={showChooseScreen}
      onSelectOffline={handleOffline}
      onSelectTournament={showTournamentScreen}
      isChooseScreen={isChooseScreen}
      hideNavigation={hideNavigation}
      activeBottomTab="home"
    >
      {isChooseScreen ? (
        isFetchingLivePlayers ? (
          <ChooseScreenSkeleton refreshing={refreshing} onRefresh={handleRefresh} />
        ) : (
          <ScrollView
            contentContainerStyle={chooseScreenStyles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#00A862"
                colors={["#00A862"]}
              />
            }
          >
            {/* Navigation Buttons */}
            <View style={chooseScreenStyles.navButtonsContainer}>
              <TouchableOpacity style={chooseScreenStyles.navButton} onPress={handleLeaderboard}>
                <Text style={chooseScreenStyles.navButtonText}>Leaderboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={chooseScreenStyles.navButton} onPress={() => setShowRulesModal(true)}>
                <Text style={chooseScreenStyles.navButtonText}>Rules</Text>
              </TouchableOpacity>
            </View>

            {/* Heading */}
            <Text style={chooseScreenStyles.heading}>Choose Variant</Text>
            <Text style={{ color: "#b0b3b8", fontSize: 14, marginBottom: 16 }}>
              Live player counts update in real time
            </Text>

            {socketConnecting && (
              <View style={chooseScreenStyles.connectingContainer}>
                <ActivityIndicator size="large" color="#00A862" />
                <Text style={chooseScreenStyles.connectingText}>Connecting to server...</Text>
              </View>
            )}

            {/* Variants Section */}
            <View style={chooseScreenStyles.variantsColumn}>
              {variants.map((variant) => (
                <VariantCard
                  key={variant.name}
                  variantName={variant.title}
                  subtitle={variant.subtitle}
                  description={variant.description}
                  rulesItems={(variant as any).rulesItems}
                  activePlayers={livePlayers[variant.name as keyof typeof livePlayers] ?? 0}
                  onPlay={() => handleVariantSelect(variant.name)}
                  disabled={userId ? false : true}
                />
              ))}
            </View>
          </ScrollView>
        )
      ) : (
        <TournamentScreen />
      )}

      {/* Rules Modal */}
      <Modal
        visible={showRulesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeRulesModal}
      >
        <View style={chooseScreenStyles.modalOverlay}>
          <View style={chooseScreenStyles.rulesModal}>
            <Text style={chooseScreenStyles.rulesTitle}>Game Rules</Text>
            <ScrollView style={chooseScreenStyles.rulesContent}>
              <RulesModalContent />
            </ScrollView>
            <TouchableOpacity style={chooseScreenStyles.closeRulesButton} onPress={closeRulesModal}>
              <Text style={chooseScreenStyles.closeRulesButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Layout>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>{title}</Text>
      {items.map((it, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#00A862', marginTop: 7, marginRight: 8 }} />
          <Text style={{ color: '#ddd', fontSize: 14, lineHeight: 20, flex: 1 }}>{it}</Text>
        </View>
      ))}
    </View>
  )
}

function RulesModalContent() {
  // Global rules
  const globalRules = [
    "Flagging: If a player's main clock expires, they lose on time.",
    "Variant-specific timers (Decay / Pocket) run only during that player's own turns.",
    "Illegal moves follow standard chess penalties.",
    "Random-start positions (where used) must be verified to avoid unfair advantage.",
  ];

  // Per-variant rules
  const classicRules = [
    "Time Controls: Standard 10+0, Bullet 1+0.",
    "Normal FIDE rules: movement, castling, en passant, promotion, check, and checkmate.",
  ];

  const decayRules = [
    "Time Control: 3+2.",
    "First queen move starts a 25s Decay Timer (runs on your turns only).",
    "Each subsequent move of that queen adds +2s to the decay timer.",
    "If the timer expires, the queen freezes and cannot be moved again.",
    "After queen freezes, the next major piece you move starts a 20s Decay Timer with the same behavior.",
  ];

  const crazyTimerRules = [
    "Time Control: 3+2.",
    "Captured enemy pieces go to your Pocket (Crazyhouse rules).",
    "Each captured piece must be dropped within 10s on your turn, or it disappears.",
    "Drops must be legal (pawns may not be dropped on the 1st or 8th ranks).",
  ];

  const crazyRules = [
    "Time Control: 3+2.",
    "Captured enemy pieces go to your Pocket.",
    "On your turn, you may drop a pocket piece on a legal square instead of moving.",
    "No pocket timer in this variant; standard Crazyhouse drop legality applies.",
  ];

  const sixPtRules = [
    "Time Control: 30 seconds per move.",
    "Start from a verified, random, legal, balanced mid‑game position.",
    "Each side gets 6 full moves (12 plies); then the game ends.",
    "Scoring by captures: Pawn=1, Knight/Bishop=3, Rook=5, Queen=9.",
    "Checkmate ends immediately; the checkmated side loses.",
    "Draws (stalemate/threefold): scores stand and are split accordingly.",
    "Missed move within the 6‑move span: −1 point penalty.",
    "Foul play clause: capturing on your 6th move when opponent has an immediate legal recapture but no moves left counts as foul play.",
    "Tie on points: Draw.",
  ];

  return (
    <View>
      <Section title="Global Rules" items={globalRules} />
      <Section title="Classic (Standard Chess)" items={classicRules} />
      <Section title="Queen Decay Chess" items={decayRules} />
      <Section title="Crazyhouse (with Timer)" items={crazyTimerRules} />
      <Section title="Crazyhouse" items={crazyRules} />
      <Section title="6PT Chess" items={sixPtRules} />
    </View>
  )
}

function ChooseScreenSkeleton({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  return (
    <ScrollView
      contentContainerStyle={chooseScreenStyles.scrollViewContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#00A862"
          colors={["#00A862"]}
        />
      }
    >
      <View style={chooseScreenStyles.navButtonsContainer}>
        {[0, 1].map((item) => (
          <View
            key={item}
            style={[
              skeletonStyles.navButtonWrapper,
              item === 0 && skeletonStyles.navButtonSpacing,
            ]}
          >
            <Skeleton height={30} />
          </View>
        ))}
      </View>
      <Skeleton width="60%" height={34} style={skeletonStyles.headingLine} />
      <Skeleton width="40%" height={14} style={skeletonStyles.subheadingLine} />

      <View style={chooseScreenStyles.variantsColumn}>
        {Array.from({ length: 4 }).map((_, index) => (
          <VariantCardSkeleton key={index} />
        ))}
      </View>
    </ScrollView>
  );
}

function VariantCardSkeleton() {
  return (
    <View style={skeletonStyles.variantCard}>
      <View style={skeletonStyles.variantHeader}>
        <Skeleton width="55%" height={28} />
        <Skeleton width={80} height={32} />
      </View>
      <Skeleton width="80%" height={14} style={skeletonStyles.variantLine} />
      <Skeleton width="60%" height={14} style={skeletonStyles.variantLine} />
      <View style={skeletonStyles.variantFooter}>
        <Skeleton width="35%" height={12} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  navButtonWrapper: {
    flex: 1,
  },
  navButtonSpacing: {
    marginRight: 8,
  },
  headingLine: {
    marginTop: 24,
    marginBottom: 12,
    borderRadius: 10,
  },
  subheadingLine: {
    marginBottom: 24,
    borderRadius: 10,
  },
  variantCard: {
    backgroundColor: "#2C2B29",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  variantHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  variantLine: {
    marginBottom: 10,
  },
  variantFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
});
