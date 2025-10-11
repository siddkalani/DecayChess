import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, Modal } from "react-native";
import { Socket } from "socket.io-client";

interface GameControlsProps {
  socket: Socket | null;
  sessionId: string;
  gameStatus: string;
  canResign: boolean;
  canOfferDraw: boolean;
}

export default function GameControls({
  socket,
  sessionId,
  gameStatus,
  canResign,
  canOfferDraw,
}: GameControlsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [drawOffered, setDrawOffered] = useState(false);

  const handleResign = () => {
    Alert.alert(
      "Resign Game",
      "Are you sure you want to resign? This will end the game.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Resign", 
          style: "destructive",
          onPress: () => {
            if (socket) {
              socket.emit("game:resign", { sessionId });
            }
          }
        }
      ]
    );
  };

  const handleOfferDraw = () => {
    if (socket && !drawOffered) {
      socket.emit("game:offerDraw", { sessionId });
      setDrawOffered(true);
      Alert.alert("Draw Offered", "Draw offer sent to opponent.");
    }
  };

  const handleAcceptDraw = () => {
    if (socket) {
      socket.emit("game:acceptDraw", { sessionId });
    }
  };

  const handleDeclineDraw = () => {
    if (socket) {
      socket.emit("game:declineDraw", { sessionId });
    }
  };

  const isGameActive = gameStatus === "active";

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => setShowMenu(true)}
        disabled={!isGameActive}
      >
        <Text style={styles.controlButtonText}>⚙️</Text>
      </TouchableOpacity>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Game Menu</Text>
            
            {canOfferDraw && (
              <TouchableOpacity
                style={[styles.menuButton, drawOffered && styles.disabledButton]}
                onPress={handleOfferDraw}
                disabled={drawOffered}
              >
                <Text style={styles.menuButtonText}>
                  {drawOffered ? "Draw Offered" : "Offer Draw"}
                </Text>
              </TouchableOpacity>
            )}

            {canResign && (
              <TouchableOpacity
                style={[styles.menuButton, styles.resignButton]}
                onPress={handleResign}
              >
                <Text style={[styles.menuButtonText, styles.resignButtonText]}>
                  Resign
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenu(false)}
            >
              <Text style={styles.menuButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2C2F33',
    borderRadius: 8,
    marginTop: 10,
  },
  controlButton: {
    backgroundColor: '#36393F',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2C2F33',
    borderRadius: 10,
    padding: 20,
    minWidth: 250,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  menuButton: {
    backgroundColor: '#36393F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    marginVertical: 5,
    minWidth: 150,
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  resignButton: {
    backgroundColor: '#dc3545',
  },
  resignButtonText: {
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  disabledButtonText: {
    color: '#888',
  },
});
