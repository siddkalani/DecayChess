import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Octicons from '@expo/vector-icons/Octicons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TopNavBarProps {
  isChooseScreen: boolean;
  onSelectChoose: () => void;
  onSelectTournament: () => void;
}

export default function TopNavBar({ isChooseScreen, onSelectChoose, onSelectTournament }: TopNavBarProps) {
  const [hoveredButton, setHoveredButton] = useState<'1v1' | 'tournament' | null>(null);
  const iconColor = '#FFFFFF';
  const activeColor = '#4CAF50';
  const iconSize = 26;

  return (
    <View style={styles.topNavBar}>
      <TouchableOpacity 
        style={[
          styles.topNavButton, 
          isChooseScreen ? styles.activeButton : styles.inactiveButton
        ]} 
        onPress={onSelectChoose}
        onPressIn={() => setHoveredButton('1v1')}
        onPressOut={() => setHoveredButton(null)}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="chess-knight"
            size={iconSize}
            color={hoveredButton === '1v1' || isChooseScreen ? activeColor : iconColor}
            style={styles.navIcon}
          />
          <Text
            style={[
              styles.topNavButtonText,
              (hoveredButton === '1v1' || isChooseScreen) && styles.hoveredText,
            ]}
          >
            1 VS 1
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.topNavButton, 
          !isChooseScreen ? styles.activeButton : styles.inactiveButton
        ]} 
        onPress={onSelectTournament}
        onPressIn={() => setHoveredButton('tournament')}
        onPressOut={() => setHoveredButton(null)}
      >
        <View style={styles.iconContainer}>
          <Ionicons
          name="trophy-outline"
            size={iconSize}
            color={hoveredButton === 'tournament' || !isChooseScreen ? activeColor : iconColor}
            style={styles.navIcon}
          />
          <Text
            style={[
              styles.topNavButtonText,
              (hoveredButton === 'tournament' || !isChooseScreen) && styles.hoveredText,
            ]}
          >
            TOURNAMENT
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  topNavBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#2C2C2E",
    gap: 32,
  },
  topNavButton: {
    position: 'relative',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  activeButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  inactiveButton: {
    opacity: 0.7,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 0,
  },
  navIcon: {
    marginBottom: 2,
  },
  hoveredText: {
    color: '#4CAF50',
  },
  topNavButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    textAlign: 'center',
    letterSpacing: 1,
  },
  inactiveText: {
    opacity: 0.7,
  },
});
