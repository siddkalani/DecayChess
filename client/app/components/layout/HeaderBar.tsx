import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NewsletterIcon from '../ui/NewsletterIcon';
import UserAvatar from '../ui/UserAvatar';

export default function HeaderBar() {
  return (
    <View style={styles.headerBar}>
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <UserAvatar size={32} />
          <View style={styles.titleContainer}>
            <Text style={styles.mainText}>CHESS</Text>
            <Text style={styles.andText}>AND</Text>
            <Text style={styles.cheeseText}>CHEESE</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newsletterButton}>
          <NewsletterIcon size={42} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: "#2C2C2E",
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleContainer: {
    alignItems: "center",
    gap: 0,
  },
  mainText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: 'serif',
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  andText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontFamily: 'serif',
    fontWeight: "400",
    marginVertical: 1,
  },
  cheeseText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: 'serif',
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  newsletterButton: {
    padding: 8,
  },
});
