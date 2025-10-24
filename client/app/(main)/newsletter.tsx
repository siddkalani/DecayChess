import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import Layout from '../components/layout/Layout'
import { useRouter } from 'expo-router'

export default function NewsletterPage() {
  const router = useRouter()

  const goProfile = () => router.push('/(main)/profile' as any)
  const goHome = () => router.push('/(main)/choose' as any)
  const goOffline = () => router.push('/(offline)' as any)

  return (
    <Layout
      onProfile={goProfile}
      onLogout={() => router.push('/(auth)/login' as any)}
      onSelectHome={goHome}
      onSelectOffline={goOffline}
      isChooseScreen={false}
      hideTopNav={true}
      activeBottomTab="home"
    >
      <ScrollView style={{ flex: 1, backgroundColor: '#1C1C1E' }} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Newsletter</Text>
        <View style={{ backgroundColor: '#2C2F33', borderRadius: 12, padding: 16 }}>
          <Text style={{ color: '#b0b3b8' }}>
            Coming soon. Subscribe to get updates on new variants, tournaments, and features.
          </Text>
        </View>
      </ScrollView>
    </Layout>
  )
}

