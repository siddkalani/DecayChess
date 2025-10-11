import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TopNavBarProps {
  isChooseScreen: boolean;
  onSelectChoose: () => void;
  onSelectTournament: () => void;
}

export default function TopNavBar({ isChooseScreen, onSelectChoose, onSelectTournament }: TopNavBarProps) {
  const [hoveredButton, setHoveredButton] = useState<'1v1' | 'tournament' | null>(null);

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
            <Image 
              source={require('../../../assets/1v1.svg')} 
              style={[
                styles.navIcon,
                hoveredButton === '1v1' && styles.hoveredIcon
              ]}
            />
            <Text style={[
              styles.topNavButtonText,
              hoveredButton === '1v1' && styles.hoveredText
            ]}>1 vs 1</Text>
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
            <Image 
              source={require('../../../assets/cup.svg')} 
              style={[
                styles.navIcon,
                hoveredButton === 'tournament' && styles.hoveredIcon
              ]} 
            />
          <Text style={[
            styles.topNavButtonText,
            hoveredButton === 'tournament' && styles.hoveredText
          ]}>TOURNAMENT</Text>
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
    gap: 6,
  },
  navIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  hoveredIcon: {
    tintColor: '#4CAF50',
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
