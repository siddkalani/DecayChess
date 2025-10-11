import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import BottomBar from './BottomBar';
import HeaderBar from './HeaderBar';
import TopNavBar from './TopNavBar';

interface LayoutProps {
  children: React.ReactNode;
  onProfile: () => void;
  onLogout: () => void;
  onSelectHome: () => void;
  onSelectTournament?: () => void;
  isChooseScreen?: boolean;
  hideTopNav?: boolean;
  hideNavigation?: boolean; // Added to hide all navigation elements
  activeBottomTab?: "home" | "menu";
}

export default function Layout({ 
  children, 
  onProfile, 
  onLogout, 
  onSelectHome,
  onSelectTournament,
  isChooseScreen = true,
  hideTopNav = false,
  hideNavigation = false,
  activeBottomTab = "home",
}: LayoutProps) {
  return (
    <SafeAreaView style={styles.container}>
      {!hideNavigation && <HeaderBar />}
      {!hideNavigation && !hideTopNav && onSelectTournament && (
        <TopNavBar 
          isChooseScreen={isChooseScreen}
          onSelectChoose={onSelectHome}
          onSelectTournament={onSelectTournament}
        />
      )}
      <View style={styles.content}>
        {children}
      </View>
      {!hideNavigation && (
        <BottomBar
          onProfile={onProfile}
          onLogout={onLogout}
          onHome={onSelectHome}
          activeTab={activeBottomTab}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1E",
  },
  content: {
    flex: 1,
  },
});
