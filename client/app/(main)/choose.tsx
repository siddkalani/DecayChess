import { getSocket } from "@/utils/socketManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
      subtitle: "Pieces decay after some time • 100 coins per win",
      description: "Pieces decay after a set number of moves. Adapt your strategy!",
      rules: "In Decay Chess, each piece has a limited lifespan measured in moves. After a certain number of moves, pieces will 'decay' and be removed from the board. Plan your strategy carefully as your pieces won't last forever!",
      color: "#2C2C2E"
    },
    {
      name: "sixpointer",
      title: "6 Point Chess",
      subtitle: "Win by points after 6 moves each • 100 coins per win",
      description: "Each piece has a point value. Score 6 points to win!",
      rules: "Each piece has a specific point value: Pawn=1, Knight/Bishop=3, Rook=5, Queen=9. Capture opponent pieces to accumulate points. First player to reach 6 points wins the game!",
      color: "#2C2C2E"
    },
    {
      name: "crazyhouse",
      title: "Crazyhouse ",
      subtitle: "Crazyhouse without time pressure • 100 coins per win",
      description: "Captured pieces return to your hand. Play fast!",
      rules: "When you capture an opponent's piece, it joins your reserves and can be dropped back onto the board as your own piece on any empty square. This creates dynamic and tactical gameplay with time pressure!",
      color: "#2C2C2E"
    },
    {
      name: "classic",
      title: "Classic Chess",
      subtitle: "Play offline with a friend",
      description: "The traditional chess game with no special rules.",
      rules: "Standard chess rules apply. The objective is to checkmate your opponent's king. Pieces move according to traditional chess rules with no modifications.",
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

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserId(user._id);
        }
        console.log("found user")
      } catch (e) {
        console.error("Error fetching user ID:", e);
      }
    };

    fetchUserId();
  }, [])

  useEffect(() => {
    if (!userId) {
      return;
    }

    setIsFetchingLivePlayers(true);
    const socketInstance = getSocket(userId, "matchmaking");
    const handleLiveCounts = (data: { decay?: number; sixpointer?: number; crazyhouse?: number; classic?: number }) => {
      setLivePlayers({
        decay: Number(data?.decay) || 0,
        sixpointer: Number(data?.sixpointer) || 0,
        crazyhouse: Number(data?.crazyhouse) || 0,
        classic: Number(data?.classic) || 0,
      });
      setIsFetchingLivePlayers(false);
    };

    socketInstance.on("queue:live_counts", handleLiveCounts);

    const requestCounts = () => {
      socketInstance.emit("queue:get_live_counts");
    };

    if (!socketInstance.connected) {
      socketInstance.once("connect", requestCounts);
      socketInstance.connect();
    } else {
      requestCounts();
    }

    return () => {
      socketInstance.off("queue:live_counts", handleLiveCounts);
      socketInstance.off("connect", requestCounts);
    };
  }, [userId])

 

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
      onSelectTournament={showTournamentScreen}
      isChooseScreen={isChooseScreen}
      hideNavigation={hideNavigation}
      activeBottomTab="home"
    >
      {isChooseScreen ? (
        isFetchingLivePlayers ? (
          <ChooseScreenSkeleton />
        ) : (
          <ScrollView 
            contentContainerStyle={chooseScreenStyles.scrollViewContent}
            showsVerticalScrollIndicator={false}
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
                  description={variant.description}
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
            <Text style={chooseScreenStyles.rulesTitle}>{selectedVariantTitle} Rules</Text>
            <ScrollView style={chooseScreenStyles.rulesContent}>
              <Text style={chooseScreenStyles.rulesText}>{selectedVariantRules}</Text>
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

function ChooseScreenSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={chooseScreenStyles.scrollViewContent}
      showsVerticalScrollIndicator={false}
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
