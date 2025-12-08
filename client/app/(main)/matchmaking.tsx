import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Socket } from "socket.io-client";
import ClassicChess from "../(game)/variants/classic";
import CrazyHouseChess from "../(game)/variants/crazy-house";
import DecayChess from "../(game)/variants/decay";
import SixPointerChess from "../(game)/variants/six-pointer";
import { getSocket, getSocketInstance } from "../../utils/socketManager";
import { GameState } from "../lib/types/gamestate"; // Import GameState type
import { usePreventRemove } from "@react-navigation/native";
// Re-use the GameState interface or import it if defined in a shared file

const normalizeParam = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? undefined;
};

const getDefaultSubvariant = (variant?: string) => {
  if (!variant) return undefined;
  if (variant === "classic") return "standard";
  if (variant === "crazyhouse") return "standard";
  return undefined;
};

const formatSubvariantLabel = (variant?: string, subvariant?: string) => {
  if (!subvariant) return "";
  if (variant === "classic") {
    if (subvariant === "bullet") return "Blitz";
    if (subvariant === "standard") return "Standard";
  }
  return subvariant;
};

export default function MatchMaking() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const variant = normalizeParam(params.variant);
  const subvariant = normalizeParam(params.subvariant);
  const userId = normalizeParam(params.userId);
  const effectiveSubvariant = subvariant ?? getDefaultSubvariant(variant);

  const [opponent, setOpponent] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isMatchFound, setIsMatchFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gameSocket, setGameSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!variant) {
      Alert.alert("Select a game", "We couldn't determine which variant you selected. Please try again.");
      router.replace("/(main)/choose");
      return;
    }

    if ((variant === "classic" || variant === "crazyhouse") && !effectiveSubvariant) {
      Alert.alert("Choose a time control", "Please pick a time control before entering matchmaking.");
      router.replace("/(main)/choose");
    }
  }, [variant, effectiveSubvariant, router]);

  useEffect(() => {
    // Always get a connected socket instance
    const existingSocket = getSocketInstance();
    if (existingSocket) {
      setSocket(existingSocket);
      console.log("Using existing socket instance for MatchMaking screen");
      // Debug: Log socket details
      existingSocket.onAny((event: string, ...args: any[]) => {
        console.log("[SOCKET EVENT - MATCHMAKING]", event, args);
      });
    } else {
      Alert.alert("Connection failed", "Could not connect to the server.");
      // Use setTimeout to delay navigation until after component is mounted
      setTimeout(() => {
        router.replace("/(main)/choose");
      }, 100);
    }

    return () => {
      // Cleanup listeners on unmount
      if (existingSocket) {
        existingSocket.off("queue:matched");
        existingSocket.off("queue:error");
        existingSocket.off("queue:cooldown");
      }
    };
  }, []);

  useEffect(() => {
    if (!socket || !userId || !variant) {
      console.log("Waiting for socket or params to be ready for queue join.");
      return;
    }

    const payload = effectiveSubvariant ? { variant, subvariant: effectiveSubvariant } : { variant };

    const joinQueue = () => {
      console.log(`Emitting queue:join for variant: ${variant}, subvariant: ${payload.subvariant || 'N/A'}`);
      socket.emit("queue:join", payload);
    };

    if (socket.connected) {
      joinQueue();
    } else {
      socket.once("connect", joinQueue);
      try { socket.connect(); } catch {}
    }

    socket.on("queue:matched", (response: {
      opponent: { userId: string; name: string };
      variant: string; // The variant *actually matched*
      subvariant?: string; // The subvariant *actually matched*
      sessionId: string;
      gameState: GameState;
      tournamentMatch?: boolean; // This flag tells us if it was a tournament match
    }) => {
      console.log("Received match found response:", response);
      const matchedVariant = response.variant || variant;
      const matchedSubvariant = response.subvariant || effectiveSubvariant;
      const matchedSubvariantLabel = formatSubvariantLabel(matchedVariant, matchedSubvariant);
      const subLabel = matchedSubvariantLabel ? ` ${matchedSubvariantLabel}` : "";
      if (response.tournamentMatch) {
        // If a regular user gets matched with a tournament player,
        // the variant comes from the response, not necessarily the route params.
        Alert.alert("Cross-Queue Match!", `You've been matched with a tournament player in ${matchedVariant}${subLabel} with ${response.opponent.name}!`);
      } else {
        Alert.alert("Match Found!", `You've been matched in ${matchedVariant}${subLabel} with ${response.opponent.name}!`);
      }

      setOpponent(response.opponent.name);
      setGameState(response.gameState);
      setTimer(0); // Reset timer when match is found

      // Switch from matchmaking to game mode
      setTimeout(() => {
        setIsMatchFound(true);
        setLoading(true);
        
        // Clean up matchmaking listeners
        socket.off("queue:matched");
        socket.emit("queue:leave");
        socket.disconnect();        

        const sessionId = response.sessionId;

        if (!matchedVariant) {
          console.error("Missing variant info for matched session", response);
          Alert.alert("Match Error", "Missing variant information. Please try again.");
          setLoading(false);
          return;
        }

        console.log("Match found! Session ID:", sessionId, "variant:", matchedVariant, "subvariant:", matchedSubvariant);
        const gameSocket = getSocket(userId, "game", sessionId, matchedVariant, matchedSubvariant, "matchmaking");
        if (!gameSocket) {
          console.error("Failed to get game socket instance");
          alert("Failed to connect to game. Please try again.");
          setLoading(false);
          return;
        }
        setGameSocket(gameSocket);
        console.log("Connected to game socket for session:", sessionId);
        setLoading(false);

      }, 2000); // Show "Match Found!" for 2 seconds before transitioning
    });

    socket.on("queue:error", (response) => {
      console.log("Received queue error:", response);
      setOpponent(null);
      setTimer(0); // Reset timer on error
      Alert.alert("Queue Error", response.message || "An error occurred while matching");
      // Use setTimeout to ensure navigation happens after current execution
      setTimeout(() => {
        router.replace("/(main)/choose");
      }, 100);
    });

    socket.on("queue:cooldown", (response: { until: number }) => {
      const remainingSeconds = Math.ceil((response.until - Date.now()) / 1000);
      Alert.alert("Cooldown", `You are on cooldown. Waiting ${remainingSeconds} seconds before retrying...`);
      setLoading(true);

      // Wait for cooldown to expire, then retry joining the queue
      setTimeout(() => {
        setLoading(false);
        const retryPayload = effectiveSubvariant ? { variant, subvariant: effectiveSubvariant } : { variant };
        socket.emit("queue:join", retryPayload);
        setTimer(0);
      }, remainingSeconds * 1000);
    });


    return () => {
      socket.off("connect", joinQueue);
    };
  }, [socket, userId, variant, effectiveSubvariant, router]);

  useEffect(() => {
    if (opponent || isMatchFound) return; // Stop timer if opponent is found or match is found

    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    // Timeout logic. You might want to provide an option to wait longer
    if (timer > 30) {
      Alert.alert(
        "No Opponent Found",
        "No opponent found within 30 seconds. Do you want to continue waiting?",
        [
          { text: "Cancel", onPress: () => router.replace("/(main)/choose"), style: "cancel" },
          { text: "Keep Waiting", onPress: () => setTimer(0) } // Reset timer to continue waiting
        ]
      );
    }

    return () => clearInterval(interval);
  }, [timer, opponent, isMatchFound, router]);

  const blockBackNavigation = !isMatchFound;

  usePreventRemove(blockBackNavigation, (event) => {
    if (!blockBackNavigation) {
      return;
    }
    const actionType = event?.data?.action?.type;
    if (actionType === "GO_BACK" || actionType === "POP" || actionType === "POP_TO_TOP") {
      event.preventDefault();
    }
  });

  useFocusEffect(
    React.useCallback(() => {
      if (!blockBackNavigation) {
        return undefined;
      }
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => subscription.remove();
    }, [blockBackNavigation])
  );

  // If match is found and game state is available, show the chess game
  if (isMatchFound && gameState && gameSocket) {
    // Use the variant from gameState as it's the actual matched variant (especially for cross-queue)
    switch (gameState.variantName) {
      case "classic":
        return (
          <ClassicChess
            initialGameState={gameState}
            userId={userId}
          />
        );
      case "decay":
        return (
          <DecayChess
            initialGameState={gameState}
            userId={userId}
          />
        );
      case "sixpointer":
        return (
          <SixPointerChess
            initialGameState={gameState}
            userId={userId}
          />
        );
      case "crazyhouse":
        return (
          <CrazyHouseChess
            initialGameState={gameState}
            userId={userId}
          />
        )
      default:
        return (
          <Text style={{ color: "#fff", fontSize: 20, textAlign: "center" }}>
            Unsupported variant: {gameState.variantName}
          </Text>
        );
    }
  } else if (loading) {
    // Show loading spinner while waiting for match to be established
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#23272A", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#00A862" />
        <Text style={{ color: "#b0b3b8", fontSize: 16, marginTop: 12 }}>
          Waiting for match to be established...
        </Text>
      </SafeAreaView>
    );
  }

  // Show matchmaking UI
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#23272A", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 32 }}>
        Matchmaking...
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%" }}>
        {/* User Side */}
        <View style={{ alignItems: "center", flex: 1 }}>
          <Image
            source={{ uri: "https://ui-avatars.com/api/?name=You&background=00A862&color=fff&size=128" }}
            style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 8 }}
          />
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>You</Text>
        </View>

        {/* VS */}
        <View style={{ alignItems: "center", flex: 0.5 }}>
          <Text style={{ color: "#b0b3b8", fontSize: 22, fontWeight: "bold" }}>VS</Text>
        </View>

        {/* Opponent Side */}
        <View style={{ alignItems: "center", flex: 1 }}>
          <Image
            source={{
              uri: opponent
                ? `https://ui-avatars.com/api/?name=${opponent}&background=2C2F33&color=fff&size=128`
                : "https://cdn-icons-png.flaticon.com/512/189/189792.png"
            }}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              marginBottom: 8,
              opacity: opponent ? 1 : 0.5
            }}
          />
          <Text style={{
            color: opponent ? "#fff" : "#b0b3b8",
            fontSize: 18,
            fontWeight: "bold"
          }}>
            {opponent || "Searching..."}
          </Text>
        </View>
      </View>

      {/* Show timer and spinner if not matched */}
      {!opponent && (
        <View style={{ marginTop: 40, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#00A862" />
          <Text style={{ color: "#b0b3b8", fontSize: 16, marginTop: 12 }}>
            Finding an opponent... ({timer}s)
          </Text>
        </View>
      )}

      {/* Show match found message */}
      {opponent && !isMatchFound && (
        <View style={{ marginTop: 40, alignItems: "center" }}>
          <Text style={{ color: "#00A862", fontSize: 20, fontWeight: "bold" }}>
            Match Found!
          </Text>
          <Text style={{ color: "#b0b3b8", fontSize: 14, marginTop: 8 }}>
            Starting game...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
