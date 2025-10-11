import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SpeakerIcon from '../ui/SpeakerIcon';

export default function HeaderBar() {
  return (
    <View style={styles.headerBar}>
      <TouchableOpacity style={styles.iconButton} activeOpacity={0.6}>
        <Ionicons name="person-circle-outline" size={38} color="white" />
      </TouchableOpacity>

      <View style={styles.brandContainer}>
        <Text style={styles.brandText}>DecayChess</Text>
      </View>

      <TouchableOpacity style={styles.iconButton} activeOpacity={0.6}>
        <SpeakerIcon size={40} color="#FFFFFF" strokeWidth={1.4} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconButton: {
    padding: 4,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
