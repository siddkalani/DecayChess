import React, { useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface VariantCardProps {
  variantName: string;
  activePlayers: number;
  description: string;
  onPlay: () => void;
  closingTime?: string;
  disabled: boolean;
}

export default function VariantCard({ 
  variantName, 
  activePlayers, 
  description, 
  onPlay,
  closingTime,
  disabled
}: VariantCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const expandAnim = React.useRef(new Animated.Value(0)).current;
  console.log(disabled)

  React.useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.2,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]);

    Animated.loop(pulse).start();
  }, []);

  React.useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const maxHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200], // Adjust this value based on your content
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.variantName}>{variantName}</Text>
            {closingTime && (
              <Text style={styles.closingTime}>Closing at {closingTime}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.playButton} onPress={onPlay} disabled={disabled}>
            <Text style={styles.playButtonText}>PLAY</Text>
          </TouchableOpacity>
        </View>

       

        <View style={styles.liveSection}>
          <TouchableOpacity style={styles.playerSection} onPress={toggleExpand}>
            <View style={styles.playersInfo}>
              <Animated.View 
                style={[
                  styles.activeDot,
                  { opacity: pulseAnim }
                ]} 
              />
              <Text style={styles.playersText}>{activePlayers} live players</Text>
            </View>
            <Animated.View 
              style={[
                styles.dropdownIcon,
                {
                  transform: [{
                    rotate: expandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg']
                    })
                  }]
                }
              ]}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path 
                  d="M7 10l5 5 5-5"
                  stroke="#808080" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
          </TouchableOpacity>

          <Animated.View style={[styles.description, { maxHeight }]}>
            <Text style={styles.descriptionText}>{description}</Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2c2b29',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    paddingBottom: 0,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  titleSection: {
    flex: 1,
    marginRight: 16,
  },
  variantName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
  },
  closingTime: {
    color: '#FFA500',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  liveSection: {
    marginHorizontal: -16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  playerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  playersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  playersText: {
    color: '#808080',
    fontSize: 13,
    fontWeight: '500',
  },
  dropdownIcon: {
    padding: 4,
  },
  description: {
    overflow: 'hidden',
  },
  descriptionText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    lineHeight: 20,
    padding: 16,
    paddingTop: 0,
  },
  playButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
