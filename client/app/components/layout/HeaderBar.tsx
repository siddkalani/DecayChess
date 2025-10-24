import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import SpeakerIcon from '../ui/SpeakerIcon';

export default function HeaderBar() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const closeMenu = () => setMenuVisible(false);
  const openMenu = () => setMenuVisible(true);

  const goProfile = () => {
    closeMenu();
    router.push('/(main)/profile' as any);
  }

  const goOffline = () => {
    closeMenu();
    router.push('/(offline)' as any);
  }

  const goHome = () => {
    closeMenu();
    router.push('/(main)/choose' as any);
  }

  const goNewsletter = () => {
    router.push('/(main)/newsletter' as any);
  }

  return (
    <View style={styles.headerBar}>
      <TouchableOpacity style={styles.iconButton} activeOpacity={0.6} onPress={openMenu}>
        <Ionicons name="person-circle-outline" size={38} color="white" />
      </TouchableOpacity>

      <View style={styles.brandContainer}>
        <Text style={styles.brandText}>DecayChess</Text>
      </View>

      <TouchableOpacity style={styles.iconButton} activeOpacity={0.6} onPress={goNewsletter}>
        <SpeakerIcon size={40} color="#FFFFFF" strokeWidth={1.4} />
      </TouchableOpacity>

      {/* Simple top-left menu modal */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={closeMenu}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeMenu}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Menu</Text>
            <TouchableOpacity style={styles.menuItem} onPress={goProfile}>
              <Ionicons name="person" size={18} color="#fff" />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={goHome}>
              <Ionicons name="home" size={18} color="#fff" />
              <Text style={styles.menuItemText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={goOffline}>
              <Ionicons name="game-controller" size={18} color="#fff" />
              <Text style={styles.menuItemText}>Offline Mode</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuCard: {
    position: 'absolute',
    top: 58,
    left: 12,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 180,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  menuTitle: {
    color: '#b0b3b8',
    fontSize: 12,
    marginBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 14,
  }
});
