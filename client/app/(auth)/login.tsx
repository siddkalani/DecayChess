import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginUser } from "../lib/APIservice/service";
import Skeleton from "../components/ui/Skeleton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // If already authenticated, skip login screen entirely
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [token, user] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('user'),
        ]);
        if (mounted && token && user) {
          router.replace('/(main)/choose');
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleLogin = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    let shouldResetLoading = true;
    try {
      const result = await loginUser(email, password);
      
      if (result.success) {
        const data = result.data;
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        shouldResetLoading = false;
        router.replace('/(main)/choose');
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert('An unexpected error occurred. Please try again.');
    } finally {
      if (shouldResetLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/Home');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#23272A" }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16 }}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={{ paddingVertical: 6, paddingHorizontal: 4 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: "#00A862", fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Login</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Image
            source={{ uri: "https://www.chess.com/bundles/web/images/offline-play/standardboard.84a92436.png" }}
            style={{ width: 80, height: 80, marginBottom: 16, borderRadius: 12 }}
          />
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 8 }}>Welcome Back</Text>
          <Text style={{ color: "#b0b3b8", fontSize: 16, marginBottom: 24 }}>Log in to continue your chess journey!</Text>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#b0b3b8"
            value={email}
            onChangeText={setEmail}
            style={{ width: "100%", backgroundColor: "#2C2F33", color: "#fff", borderWidth: 0, marginBottom: 12, padding: 14, borderRadius: 10, fontSize: 16 }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#b0b3b8"
            value={password}
            onChangeText={setPassword}
            style={{ width: "100%", backgroundColor: "#2C2F33", color: "#fff", borderWidth: 0, marginBottom: 20, padding: 14, borderRadius: 10, fontSize: 16 }}
            secureTextEntry
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={handleLogin}
            style={{
              backgroundColor: "#00A862",
              paddingVertical: 16,
              borderRadius: 30,
              width: "100%",
              alignItems: "center",
              marginBottom: 16,
              opacity: isLoading ? 0.6 : 1,
            }}
            disabled={isLoading}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Login & Play</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")} style={{ marginTop: 8 }}>
            <Text style={{ color: "#b0b3b8", fontSize: 16 }}>Don't have an account? <Text style={{ color: "#00A862", fontWeight: "bold" }}>Sign up</Text></Text>
          </TouchableOpacity>
          <View style={{ marginTop: 32, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>🏆 Compete, win, and climb the leaderboard!</Text>
            <Text style={{ color: "#b0b3b8", fontSize: 14, marginTop: 4 }}>Track your stats and earn rewards.</Text>
          </View>
        </View>
      </View>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Skeleton width={64} height={64} borderRadius={16} style={styles.loadingLineCentered} />
            <Skeleton width="65%" height={24} style={styles.loadingLine} />
            <Skeleton width="80%" height={16} style={styles.loadingLine} />
            <Skeleton width="100%" height={48} style={styles.loadingLine} />
            <Skeleton width="100%" height={48} style={styles.loadingLine} />
            <Skeleton width="70%" height={48} style={[styles.loadingLine, styles.loadingLineLast]} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#2C2F33",
    borderRadius: 16,
    padding: 24,
  },
  loadingLine: {
    marginBottom: 16,
    borderRadius: 12,
  },
  loadingLineLast: {
    marginBottom: 0,
  },
  loadingLineCentered: {
    alignSelf: "center",
    marginBottom: 24,
  },
});
