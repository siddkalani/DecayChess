import React, { useEffect } from "react";
import { ImageSourcePropType, StyleSheet, View, Image } from "react-native";

interface AnimatedSplashProps {
  onFinish: () => void;
  durationMs?: number;
  logoSource: ImageSourcePropType;
}

export default function AnimatedSplash({ onFinish, durationMs = 1200, logoSource }: AnimatedSplashProps) {
  useEffect(() => {
    // Simply wait for the duration and then finish
    const timeout = setTimeout(() => onFinish(), durationMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [onFinish, durationMs]);

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Image
        source={logoSource}
        resizeMode="contain"
        style={styles.logo}
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
    width: 360,
    height: 360,
    borderRadius: 20,
  },
});
