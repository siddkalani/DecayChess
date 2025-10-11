import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { registerUser } from "../lib/APIservice/service";

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      const result = await registerUser(name, email, password);
      
      if (result.success) {
        const data = result.data;
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        router.replace('/(main)/choose');
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert('An unexpected error occurred. Please try again.');
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
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Sign Up</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Image
            source={{ uri: "https://www.chess.com/bundles/web/images/offline-play/standardboard.84a92436.png" }}
            style={{ width: 80, height: 80, marginBottom: 16, borderRadius: 12 }}
          />
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 8 }}>Create Account</Text>
          <Text style={{ color: "#b0b3b8", fontSize: 16, marginBottom: 24 }}>Join the game and challenge the world!</Text>
          <TextInput
            placeholder="Name"
            placeholderTextColor="#b0b3b8"
            value={name}
            onChangeText={setName}
            style={{ width: "100%", backgroundColor: "#2C2F33", color: "#fff", borderWidth: 0, marginBottom: 12, padding: 14, borderRadius: 10, fontSize: 16 }}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#b0b3b8"
            value={email}
            onChangeText={setEmail}
            style={{ width: "100%", backgroundColor: "#2C2F33", color: "#fff", borderWidth: 0, marginBottom: 12, padding: 14, borderRadius: 10, fontSize: 16 }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#b0b3b8"
            value={password}
            onChangeText={setPassword}
            style={{ width: "100%", backgroundColor: "#2C2F33", color: "#fff", borderWidth: 0, marginBottom: 12, padding: 14, borderRadius: 10, fontSize: 16 }}
            secureTextEntry
          />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#b0b3b8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={{ width: "100%", backgroundColor: "#2C2F33", color: "#fff", borderWidth: 0, marginBottom: 20, padding: 14, borderRadius: 10, fontSize: 16 }}
            secureTextEntry
          />
          <TouchableOpacity
            onPress={handleSignup}
            style={{ backgroundColor: "#00A862", paddingVertical: 16, borderRadius: 30, width: "100%", alignItems: "center", marginBottom: 16 }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Sign Up & Play</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={{ marginTop: 8 }}>
            <Text style={{ color: "#b0b3b8", fontSize: 16 }}>Already have an account? <Text style={{ color: "#00A862", fontWeight: "bold" }}>Login</Text></Text>
          </TouchableOpacity>
          <View style={{ marginTop: 32, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>🎉 Unlock achievements as you play!</Text>
            <Text style={{ color: "#b0b3b8", fontSize: 14, marginTop: 4 }}>Earn trophies, badges, and more.</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
