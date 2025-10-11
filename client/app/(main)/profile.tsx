import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Layout from '../components/layout/Layout';
import { profileScreenStyles } from '../lib/styles/screens';
import Skeleton from '../components/ui/Skeleton';

function Profile({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  if (loadingUser) {
    return <ProfileSkeleton />;
  }

  const name = user?.name || 'Guest';
  const email = user?.email || 'Not provided';
  const firstLetter = name.charAt(0).toUpperCase();

  return (
    <ScrollView style={profileScreenStyles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header Box */}
      <View style={profileScreenStyles.profileBox}>
        <View style={profileScreenStyles.profileHeader}>
          <View style={profileScreenStyles.avatar}>
            <Text style={profileScreenStyles.avatarText}>{firstLetter}</Text>
          </View>
          <Text style={profileScreenStyles.profileName}>{name}</Text>
          <Text style={profileScreenStyles.profilePhone}>{email}</Text>
        </View>
      </View>

      <View style={profileScreenStyles.optionsContainer}>
        {/* Invite & Earn */}
        <TouchableOpacity style={profileScreenStyles.optionButton}>
          <View style={profileScreenStyles.iconContainer}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" fill="#00A862" />
            </Svg>
          </View>
          <Text style={profileScreenStyles.optionText}>Invite & Earn</Text>
        </TouchableOpacity>

        {/* How to Play */}
        <TouchableOpacity style={profileScreenStyles.optionButton}>
          <View style={profileScreenStyles.iconContainer}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" fill="#00A862" />
            </Svg>
          </View>
          <Text style={profileScreenStyles.optionText}>How to Play</Text>
        </TouchableOpacity>

        {/* About Us */}
        <TouchableOpacity style={profileScreenStyles.optionButton}>
          <View style={profileScreenStyles.iconContainer}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#00A862" />
            </Svg>
          </View>
          <Text style={profileScreenStyles.optionText}>About Us</Text>
        </TouchableOpacity>

        {/* Terms & Conditions */}
        <TouchableOpacity style={profileScreenStyles.optionButton}>
          <View style={profileScreenStyles.iconContainer}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm4-6h4v2h-4v-2zm0-3h4v2h-4v-2zm0-3h4v2h-4V8z" fill="#00A862" />
            </Svg>
          </View>
          <Text style={profileScreenStyles.optionText}>Terms & Conditions</Text>
        </TouchableOpacity>

        {/* Help & Support */}
        <TouchableOpacity style={profileScreenStyles.optionButton}>
          <View style={profileScreenStyles.iconContainer}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path d="M12 1C5.9 1 1 5.9 1 12s4.9 11 11 11 11-4.9 11-11S18.1 1 12 1zm0 20c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9zm1-15h-2v2h2V6zm0 4h-2v8h2v-8z" fill="#00A862" />
            </Svg>
          </View>
          <Text style={profileScreenStyles.optionText}>Help & Support</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={profileScreenStyles.optionButton} onPress={onLogout}>
          <View style={profileScreenStyles.iconContainer}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                d="M16 13v-2H9V8l-5 4 5 4v-3h7zm3-10H11c-1.1 0-2 .9-2 2v3h2V5h8v14h-8v-3H9v3c0 1.1.9 2 2 2h8c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2z"
                fill="#FF5C5C"
              />
            </Svg>
          </View>
          <Text style={profileScreenStyles.optionText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ProfileSkeleton() {
  return (
    <ScrollView style={profileScreenStyles.container} showsVerticalScrollIndicator={false}>
      <View style={profileScreenStyles.profileBox}>
        <View style={profileScreenStyles.profileHeader}>
          <Skeleton width={80} height={80} borderRadius={40} style={profileSkeletonStyles.avatar} />
          <Skeleton width="60%" height={24} style={profileSkeletonStyles.headerLine} />
          <Skeleton width="40%" height={16} style={profileSkeletonStyles.headerSubLine} />
        </View>
      </View>

      <View style={profileScreenStyles.optionsContainer}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton
            key={index}
            height={64}
            borderRadius={12}
            style={[
              profileSkeletonStyles.option,
              index === 5 && profileSkeletonStyles.optionLast,
            ]}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const profileSkeletonStyles = StyleSheet.create({
  avatar: {
    marginBottom: 16,
  },
  headerLine: {
    alignSelf: 'center',
    marginBottom: 12,
    borderRadius: 12,
  },
  headerSubLine: {
    alignSelf: 'center',
    borderRadius: 12,
  },
  option: {
    marginBottom: 12,
  },
  optionLast: {
    marginBottom: 0,
  },
});

export default function ProfilePage() {
  const router = useRouter();

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      router.push("/(auth)/login");
    } catch (e) {
      console.error("Error logging out:", e);
      Alert.alert("Error", "Failed to log out.");
    }
  };

  const handleHome = () => {
    router.push('/choose');
  };

  return (
    <Layout
      onProfile={handleProfile}
      onLogout={handleLogout}
      onSelectHome={handleHome}
      isChooseScreen={false}
      hideTopNav={true}
      activeBottomTab="menu"
    >
      <Profile onLogout={handleLogout} />
    </Layout>
  );
}
