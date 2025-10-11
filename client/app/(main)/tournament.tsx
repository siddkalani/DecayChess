"use client"

import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native"
import Svg, { Path } from "react-native-svg"
import type { Socket } from "socket.io-client"
import ClassicChess from "../(game)/variants/classic"
import CrazyHouseChess from "../(game)/variants/crazy-house"
import DecayChess from "../(game)/variants/decay"
import SixPointerChess from "../(game)/variants/six-pointer"
import { setNavigationVisibility } from "../../utils/navigationState"
import { getSocket } from "../../utils/socketManager"
import VariantCard from "../components/ui/VariantCard"
import { tournamentScreenStyles } from "../lib/styles/screens"
import { GameState } from "../lib/types/gamestate"
import { TournamentDetails} from "../lib/types/miscellaneous"


export default function TournamentScreen() {
  const router = useRouter()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [activeTournament, setActiveTournament] = useState<TournamentDetails | null>(null)
  const [isJoiningTournament, setIsJoiningTournament] = useState(false)
  const [isTournamentQueueing, setIsTournamentQueueing] = useState(false)
  const [opponent, setOpponent] = useState<string | null>(null)
  const [timer, setTimer] = useState(0)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isMatchFound, setIsMatchFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [gameSocket, setGameSocket] = useState<Socket | null>(null)
  const [matchedVariant, setMatchedVariant] = useState<string | null>(null)
  const [matchedSubvariant, setMatchedSubvariant] = useState<string | null>(null)
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [selectedRulesTitle, setSelectedRulesTitle] = useState("")
  const [selectedRulesContent, setSelectedRulesContent] = useState("")
  const [userId, setUserId] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [activeButton, setActiveButton] = useState<string | null>(null)
  const [tournamentSocket, setTournamentSocket] = useState<Socket | null>(null);
  const [tournamentStatus, setTournamentStatus] = useState<'idle' | 'joining' | 'queuing' | 'matched'>('idle');

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

  // Tournament option data
  const tournamentOptions = [{
    title: "Victory Rush",
    description: activeTournament
      ? `${activeTournament.name} - ${activeTournament.participantsCount}/${activeTournament.capacity} players`
      : "Join the current active tournament",
    action: "tournament",
    rules: activeTournament
      ? `Tournament: ${activeTournament.name}\nEntry Fee: ₹${activeTournament.entryFee}\nPrize Pool: ₹${activeTournament.prizePool}\nCapacity: ${activeTournament.capacity} players\nStatus: ${activeTournament.status.toUpperCase()}`
      : "No active tournament available. Join to create or participate in tournaments.",
    isMainCard: true,
    image: require("../../assets/ttt.png"),
  }]

  // Custom Info Icon Component
  const InfoIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 100 100">
      <Path
        d="M 30.306641 17.960938 C 23.138641 17.960938 17.306641 23.792938 17.306641 30.960938 L 17.306641 69.960938 C 17.306641 77.128938 23.138641 82.960938 30.306641 82.960938 L 69.306641 82.960938 C 76.474641 82.960938 82.306641 77.128938 82.306641 69.960938 L 82.306641 30.960938 C 82.306641 23.791938 76.475641 17.960938 69.306641 17.960938 L 30.306641 17.960938 z M 30.306641 19.960938 L 69.306641 19.960938 C 75.371641 19.960938 80.306641 24.895937 80.306641 30.960938 L 80.306641 69.960938 C 80.306641 76.025937 75.371641 80.960938 69.306641 80.960938 L 30.306641 80.960938 C 24.241641 80.960938 19.306641 76.025937 19.306641 69.960938 L 19.306641 30.960938 C 19.306641 24.895937 24.241641 19.960938 30.306641 19.960938 z M 33.144531 22.960938 C 27.168531 22.960938 22.306641 27.822828 22.306641 33.798828 L 22.306641 67.123047 C 22.306641 73.099047 27.168531 77.960938 33.144531 77.960938 L 66.470703 77.960938 C 72.446703 77.960938 77.306641 73.099047 77.306641 67.123047 L 77.306641 48.460938 C 77.306641 48.183937 77.082641 47.960938 76.806641 47.960938 C 76.530641 47.960938 76.306641 48.184937 76.306641 48.460938 L 76.306641 67.123047 C 76.306641 72.547047 71.894703 76.960938 66.470703 76.960938 L 33.144531 76.960938 C 27.720531 76.960938 23.306641 72.547047 23.306641 67.123047 L 23.306641 33.798828 C 23.306641 28.374828 27.720531 23.960937 33.144531 23.960938 L 66.806641 23.960938 C 67.082641 23.960938 67.306641 23.736937 67.306641 23.460938 C 67.306641 23.184938 67.082641 22.960937 66.806641 22.960938 L 33.144531 22.960938 z M 50.128906 32.591797 C 48.861906 32.591797 47.751219 33.005266 46.824219 33.822266 C 45.881219 34.655266 45.402344 35.700734 45.402344 36.927734 C 45.402344 37.544734 45.534875 38.128156 45.796875 38.660156 C 46.050875 39.179156 46.393406 39.638344 46.816406 40.027344 C 47.236406 40.413344 47.733016 40.726031 48.291016 40.957031 C 48.856016 41.192031 49.474906 41.310547 50.128906 41.310547 C 51.434906 41.310547 52.551266 40.877484 53.447266 40.021484 C 54.348266 39.158484 54.804687 38.117734 54.804688 36.927734 C 54.804688 35.733734 54.336062 34.699562 53.414062 33.851562 C 52.503062 33.015563 51.398906 32.591797 50.128906 32.591797 z M 50.130859 33.591797 C 51.156859 33.591797 52.008281 33.918844 52.738281 34.589844 C 53.456281 35.249844 53.806641 36.014688 53.806641 36.929688 C 53.806641 37.848687 53.463812 38.624781 52.757812 39.300781 C 52.044812 39.982781 51.184859 40.3125 50.130859 40.3125 C 49.608859 40.3125 49.117828 40.220156 48.673828 40.035156 C 48.223828 39.848156 47.827141 39.599922 47.494141 39.294922 C 47.163141 38.990922 46.894312 38.630656 46.695312 38.222656 C 46.502313 37.826656 46.402344 37.391687 46.402344 36.929688 C 46.402344 35.988687 46.756328 35.216266 47.486328 34.572266 C 48.234328 33.911266 49.099859 33.591797 50.130859 33.591797 z M 76.806641 36.960938 C 76.530641 36.960938 76.306641 37.183937 76.306641 37.460938 L 76.306641 39.460938 C 76.306641 39.736938 76.530641 39.960938 76.806641 39.960938 C 77.082641 39.960938 77.306641 39.736937 77.306641 39.460938 L 76.306641 37.460938 C 77.306641 37.184937 77.082641 36.960938 76.806641 36.960938 z M 76.806641 40.960938 C 76.530641 40.960938 76.306641 41.184938 76.306641 41.460938 L 76.306641 45.460938 C 76.306641 45.736938 76.530641 45.960937 76.806641 45.960938 C 77.082641 45.960938 77.306641 45.736938 77.306641 45.460938 L 77.306641 41.460938 C 77.306641 41.183937 77.082641 40.960938 76.806641 40.960938 z M 42.757812 44.013672 C 42.481812 44.013672 42.257813 44.237672 42.257812 44.513672 L 42.257812 47.087891 C 42.257812 47.363891 42.481812 47.587891 42.757812 47.587891 C 46.390813 47.587891 46.390625 48.797313 46.390625 49.195312 L 46.390625 62.919922 C 46.390625 63.328922 46.390812 64.419922 42.757812 64.419922 C 42.481812 64.419922 42.257813 64.643922 42.257812 64.919922 L 42.257812 67.492188 C 42.257812 67.768187 42.481812 67.992188 42.757812 67.992188 L 57.765625 67.992188 C 58.041625 67.992188 58.265625 67.768187 58.265625 67.492188 L 58.265625 64.919922 C 58.265625 64.643922 58.041625 64.419922 57.765625 64.419922 C 56.038625 64.419922 54.931656 64.173406 54.472656 63.691406 C 54.282656 63.491406 54.20175 63.243156 54.21875 62.910156 L 54.21875 62.886719 L 54.21875 44.513672 C 54.21875 44.237672 53.99475 44.013672 53.71875 44.013672 L 42.757812 44.013672 z M 43.257812 45.013672 L 53.216797 45.013672 L 53.216797 62.876953 C 53.189797 63.479953 53.367094 63.985813 53.746094 64.382812 C 54.364094 65.031813 55.488625 65.361109 57.265625 65.412109 L 57.265625 66.992188 L 43.257812 66.992188 L 43.257812 65.414062 C 44.685812 65.383062 47.390625 65.121922 47.390625 62.919922 L 47.390625 49.195312 C 47.390625 47.560313 46.000812 46.687703 43.257812 46.595703 L 43.257812 45.013672 z"
        fill="#fff"
      />
    </Svg>
  )

  // --- Matchmaking Timer Effect ---
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
        `No opponent found in ${timer} seconds. Do you want to continue waiting or leave the tournament?`,
        [
          { text: "Continue Waiting", style: "cancel" },
          { text: "Leave Tournament", onPress: () => handleLeaveTournament() },
        ],
      )
    }

    return () => clearInterval(interval)
  }, [timer, opponent, isMatchFound, isTournamentQueueing])

  // --- Handlers ---
  const handlePlay = useCallback(async () => {
    try {
      if (!userId) {
        Alert.alert("Error", "User not identified.")
        return
      }

      if (activeTournament && activeTournament.status !== "open") {
        Alert.alert("Tournament Closed", "Tournament registration is closed.")
        return
      }

      if (activeTournament && activeTournament.participantsCount >= activeTournament.capacity) {
        Alert.alert("Tournament Full", "This tournament has reached its maximum capacity.")
        return
      }

      setActiveButton("tournament")
      setIsConnecting(true)
      setTournamentStatus('joining')

      // Create tournament socket connection
      const tournamentSocketInstance = getSocket(userId, "matchmaking")
      if (!tournamentSocketInstance) {
        throw new Error("Failed to connect to tournament server")
      }

      // Set up tournament event listeners
      tournamentSocketInstance.onAny((event: string, ...args: any[]) => {
        console.log("[TOURNAMENT SOCKET EVENT]", event, args)
      })

      // Handle tournament join success
      tournamentSocketInstance.on("tournament:joined", (response: { 
        tournament: TournamentDetails,
        status: 'already_joined' | 'newly_joined' 
      }) => {
        console.log("Tournament joined:", response)
        setActiveTournament(response.tournament)
        setIsJoiningTournament(false)
        setIsTournamentQueueing(true)
        setTournamentStatus('queuing')
        setTimer(0)
        setIsConnecting(false)
        setActiveButton(null)
      })

      // Handle tournament errors
      tournamentSocketInstance.on("tournament:error", (error: { message: string; error?: any }) => {
        console.error("Tournament error:", error)
        Alert.alert("Tournament Error", error.message + (error.error ? `: ${error.error}` : ""))
        handleLeaveTournament()
      })

      // Handle active tournament details
      tournamentSocketInstance.on("tournament:active_details", (response: { tournament: TournamentDetails | null }) => {
        console.log("Active tournament details:", response.tournament)
        setActiveTournament(response.tournament)
        setIsJoiningTournament(false)
      })

      // Handle match found
      tournamentSocketInstance.on("queue:matched", async (response: {
        opponent: { userId: string; name: string }
        variant: string
        subvariant?: string
        sessionId: string
        gameState: GameState
        tournamentMatch?: boolean
      }) => {
        console.log("Tournament match found:", response)
        setTournamentStatus('matched')
        
        // Disconnect tournament socket
        tournamentSocketInstance.disconnect()
        setTournamentSocket(null)
        
        // Create game socket with tournament source
        const gameSocketInstance = getSocket(
          userId,
          "game",
          response.sessionId,
          response.variant,
          response.subvariant,
          "tournament" // Specify tournament source
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
          Alert.alert("Connection Timeout", "Failed to join tournament. Please try again.")
        }
      }, 10000)

    } catch (error) {
      console.error("Tournament join error:", error)
      setIsConnecting(false)
      setActiveButton(null)
      setTournamentStatus('idle')
      Alert.alert("Error", "Failed to join tournament. Please try again.")
    }
  }, [userId, activeTournament])

  const handleLeaveTournament = useCallback(() => {
    if (tournamentSocket) {
      tournamentSocket.emit("tournament:leave")
      tournamentSocket.disconnect()
      setTournamentSocket(null)
    }

    // Show navigation when leaving tournament
    setNavigationVisibility(true);
    
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
  }, [tournamentSocket])


  const handleInfoPress = (option: any) => {
    setSelectedRulesTitle(option.title)
    setSelectedRulesContent(option.rules)
    setShowRulesModal(true)
  }

  const closeRulesModal = () => {
    setShowRulesModal(false)
    setSelectedRulesTitle("")
    setSelectedRulesContent("")
  }

  // Render the appropriate game component
  if (isMatchFound && gameState && gameSocket && matchedVariant && userId) {
    // Hide navigation when match is found
    setNavigationVisibility(false);
    
    switch (matchedVariant) {
      case "classic":
        return <ClassicChess initialGameState={gameState} userId={userId} />
      case "decay":
        return <DecayChess initialGameState={gameState} userId={userId} />
      case "sixpointer":
        return <SixPointerChess initialGameState={gameState} userId={userId} />
      case "crazyhouse":
        return <CrazyHouseChess initialGameState={gameState} userId={userId} />
      default:
        return <Text style={tournamentScreenStyles.errorText}>Unsupported variant: {matchedVariant}</Text>
    }
  } else if (loading) {
    return (
      <View style={tournamentScreenStyles.container}>
        <ActivityIndicator size="large" color="#00A862" />
        <Text style={tournamentScreenStyles.infoText}>Waiting for match to be established...</Text>
      </View>
    )
  }

  // Tournament Lobby UI with Choose.tsx styling
  return (
    <View style={tournamentScreenStyles.container}>
      <ScrollView contentContainerStyle={tournamentScreenStyles.scrollViewContent}>
        {/* Victory Rush Card */}
        <View style={tournamentScreenStyles.victoryRushCard}>
          <View style={tournamentScreenStyles.victoryRushContent}>
            <Image 
              source={require("../../assets/tl.png")} 
              style={tournamentScreenStyles.victoryRushLogo}
              resizeMode="contain"
            />
            <Text style={tournamentScreenStyles.victoryRushSubtitle}>Rack up wins.</Text>
            {activeTournament && (
              <Text style={tournamentScreenStyles.closingTimeText}>
                Closing at {new Date(activeTournament.startTime + activeTournament.duration).toLocaleTimeString()}
              </Text>
            )}
            <TouchableOpacity 
              style={tournamentScreenStyles.joinNowButton}
              onPress={() => router.push({ pathname: "/(main)/streak-master", params: { userId } } as any)}
              disabled={isTournamentQueueing || isJoiningTournament}
            >
              <Text style={tournamentScreenStyles.joinNowText}>Join Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tournament Status */}
        {isTournamentQueueing && (
          <View style={tournamentScreenStyles.connectingContainer}>
            <Text style={tournamentScreenStyles.connectingText}>Searching for tournament match...</Text>
            <ActivityIndicator size="small" color="#00A862" style={{ marginVertical: 10 }} />
            <Text style={tournamentScreenStyles.connectingTimer}>Time in queue: {timer}s</Text>
            {opponent && !isMatchFound && <Text style={tournamentScreenStyles.matchFoundText}>Match Found with {opponent}!</Text>}
          </View>
        )}

        {/* Tournament Options */}
        <View style={tournamentScreenStyles.variantsColumn}>
          <VariantCard
            key={tournamentOptions[0].title}
            variantName={tournamentOptions[0].title}
            activePlayers={activeTournament ? activeTournament.participantsCount : 0}
            description={tournamentOptions[0].description}
            onPlay={() => handlePlay()}
            closingTime="9 PM"
            disabled={isTournamentQueueing || isJoiningTournament || isConnecting}
            // loading={isConnecting && activeButton === tournamentOptions[0].action}
          />
          {isTournamentQueueing && (
            <Text style={tournamentScreenStyles.statusText}>Currently in queue - Tap to leave</Text>
          )}
          {isJoiningTournament && (
            <ActivityIndicator size="small" color="#00A862" style={{ marginTop: 5 }} />
          )}
        </View>
      </ScrollView>
      
      {/* Rules Modal */}
      <Modal visible={showRulesModal} transparent={true} animationType="fade" onRequestClose={closeRulesModal}>
        <View style={tournamentScreenStyles.modalOverlay}>
          <View style={tournamentScreenStyles.rulesModal}>
            <Text style={tournamentScreenStyles.rulesTitle}>{selectedRulesTitle}</Text>
            <ScrollView style={tournamentScreenStyles.rulesContent}>
              <Text style={tournamentScreenStyles.rulesText}>{selectedRulesContent}</Text>
            </ScrollView>
            <TouchableOpacity style={tournamentScreenStyles.closeRulesButton} onPress={closeRulesModal}>
              <Text style={tournamentScreenStyles.closeRulesButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}


