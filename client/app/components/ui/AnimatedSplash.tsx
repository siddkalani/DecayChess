import React, { useEffect, useRef, useState } from "react";
import { Animated, ImageSourcePropType, StyleSheet, View, Text } from "react-native";

interface AnimatedSplashProps {
  onFinish: () => void;
  durationMs?: number;
  logoSource: ImageSourcePropType;
}

export default function AnimatedSplash({ onFinish, durationMs = 1200, logoSource }: AnimatedSplashProps) {
  // Typewriter state for the title
  const [typedText, setTypedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  // Logo animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const title = "Decay Chess";
    let i = 0;
    const perCharMs = 70; // typing speed

    const interval = setInterval(() => {
      i += 1;
      setTypedText(title.slice(0, i));
      if (i >= title.length) {
        clearInterval(interval);
        setTypingDone(true);
      }
    }, perCharMs);

    return () => clearInterval(interval);
  }, []);

  // Start logo animation once typing is done
  useEffect(() => {
    if (!typingDone) return;
    const appearDelay = 200; // small pause after typing
    const run = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(logoScale, { toValue: 1, duration: 450, useNativeDriver: true }),
        ]),
        Animated.timing(logoScale, { toValue: 1.06, duration: 250, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1.0, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        // Allow the splash to linger briefly, then finish
        setTimeout(() => onFinish(), Math.max(0, durationMs - 900));
      });
    };
    const t = setTimeout(run, appearDelay);
    return () => clearTimeout(t);
  }, [typingDone, logoOpacity, logoScale, onFinish, durationMs]);

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Text style={styles.title}>{typedText}</Text>
      <Animated.Image
        source={logoSource}
        resizeMode="contain"
        style={[
          styles.logo,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  title: {
    color: "#00A862",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 16,
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 24, // rounded corners for the logo
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#2C2C2E",
  },
});
