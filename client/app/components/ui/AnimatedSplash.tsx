import React, { useEffect, useRef } from "react";
import { Animated, ImageSourcePropType, StyleSheet, View } from "react-native";

interface AnimatedSplashProps {
  onFinish: () => void;
  durationMs?: number;
  logoSource: ImageSourcePropType;
}

export default function AnimatedSplash({ onFinish, durationMs = 1200, logoSource }: AnimatedSplashProps) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 10,
          stiffness: 120,
          mass: 0.6,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(logoScale, { toValue: 1.05, duration: 220, useNativeDriver: true }),
      Animated.timing(logoScale, { toValue: 1.0, duration: 200, useNativeDriver: true }),
    ]);

    animation.start();
    const timeout = setTimeout(() => onFinish(), durationMs);

    return () => {
      animation.stop();
      clearTimeout(timeout);
    };
  }, [logoOpacity, logoScale, onFinish, durationMs]);

  return (
    <View pointerEvents="none" style={styles.overlay}>
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
    backgroundColor: "#0B3D2E",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 20,
  },
});
