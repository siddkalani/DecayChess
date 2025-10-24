import React, { useState } from 'react'
import { Text, TouchableOpacity, View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Layout from '../components/layout/Layout'

const timeControls = [
  { key: 'bullet', label: 'Bullet', description: '1+0 (1 min, no increment)', baseTime: 60000, increment: 0 },
  { key: 'standard', label: 'Standard', description: '10+0 (10 min, no increment)', baseTime: 600000, increment: 0 },
]

export default function OfflineMenu() {
  const router = useRouter()
  const [selected, setSelected] = useState(0)

  const handleProfile = () => {
    router.push('/(main)/profile' as any)
  }

  const handleLogout = () => {
    router.push('/(auth)/login' as any)
  }

  const handleHome = () => {
    router.push('/(main)/choose' as any)
  }

  const handleStart = () => {
    const tc = timeControls[selected]
    router.push({ pathname: '/(offline)/classic', params: { baseTime: String(tc.baseTime), increment: String(tc.increment) } } as any)
  }

  return (
    <Layout
      onProfile={handleProfile}
      onLogout={handleLogout}
      onSelectHome={handleHome}
      onSelectOffline={() => {}}
      isChooseScreen={false}
      hideTopNav={true}
      activeBottomTab="offline"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }}>
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>Offline Mode</Text>
          </View>

          <Text style={{ color: '#b0b3b8', fontSize: 16, marginTop: 8, marginBottom: 24 }}>
            Play on the same device. No internet required.
          </Text>

          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Classic • Time Control</Text>
          {timeControls.map((tc, idx) => (
            <TouchableOpacity
              key={tc.key}
              onPress={() => setSelected(idx)}
              style={{
                backgroundColor: selected === idx ? '#00A862' : '#2C2F33',
                borderRadius: 14,
                padding: 18,
                marginBottom: 14,
                borderWidth: selected === idx ? 2 : 0,
                borderColor: selected === idx ? '#fff' : undefined,
              }}
            >
              <Text style={{ color: selected === idx ? '#fff' : '#00A862', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>{tc.label}</Text>
              <Text style={{ color: '#b0b3b8', fontSize: 14 }}>{tc.description}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={{
              backgroundColor: '#00A862',
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 8,
            }}
            onPress={handleStart}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Start Classic Local Game</Text>
          </TouchableOpacity>

          <View style={{ marginTop: 36 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 10 }}>More Variants (Offline)</Text>
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#2C2F33', borderRadius: 12, padding: 16 }}
                onPress={() => router.push({ pathname: '/(offline)/crazyhouse', params: { baseTime: String(180000), increment: String(0) } } as any)}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>Crazyhouse (with Timer)</Text>
                <Text style={{ color: '#b0b3b8' }}>3:00 each, no increment; sequential pocket drops with 10s drop timer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#2C2F33', borderRadius: 12, padding: 16 }}
                onPress={() => router.push({ pathname: '/(offline)/decay', params: { baseTime: String(180000), increment: String(0) } } as any)}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>Decay</Text>
                <Text style={{ color: '#b0b3b8' }}>3:00 each, no increment; queen then major piece decay timers</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Layout>
  )
}
