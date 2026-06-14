import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { apiFetch } from '../../lib/api'
import { deleteToken } from '../../lib/auth'
import PlaidLinkButton from '../../components/PlaidLinkButton'

type User = { email: string; expoPushToken?: string }
type PlaidItem = { institutionName: string; createdAt: string }

export default function AccountScreen() {
  const [user, setUser] = useState<User | null>(null)
  const [plaidItem, setPlaidItem] = useState<PlaidItem | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    try {
      const [u, item] = await Promise.all([
        apiFetch<User>('/api/auth/me'),
        apiFetch<PlaidItem | null>('/api/plaid/item').catch(() => null),
      ])
      setUser(u)
      setPlaidItem(item)
    } catch {}
  }

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [])

  async function handleSync() {
    setSyncing(true)
    try {
      await apiFetch('/api/plaid/transactions', { method: 'POST' })
      Alert.alert('Synced!', 'Your transactions have been updated.')
    } catch (e: any) {
      Alert.alert('Sync failed', e.message)
    } finally {
      setSyncing(false)
    }
  }

  async function handleLogout() {
    await deleteToken()
    router.replace('/(auth)/login')
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a1a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a1a' }} contentContainerStyle={{ padding: 24, paddingTop: 56, paddingBottom: 60 }}>
      <Text style={{ color: '#FF6B35', fontSize: 24, fontWeight: '800', marginBottom: 4 }}>👤 Account</Text>
      {user && <Text style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>{user.email}</Text>}

      {/* Bank link */}
      <View style={{ backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 12 }}>Bank Account</Text>
        {plaidItem ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#2ecc71', marginRight: 8 }} />
              <Text style={{ color: '#fff', fontSize: 15 }}>{plaidItem.institutionName}</Text>
            </View>
            <TouchableOpacity
              onPress={handleSync}
              disabled={syncing}
              style={{ backgroundColor: '#1A6B8A', borderRadius: 12, padding: 14, alignItems: 'center' }}
            >
              {syncing ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: '#fff', fontWeight: '600' }}>↻ Sync Transactions</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={{ color: '#666', fontSize: 14, marginBottom: 16, lineHeight: 22 }}>
              Link your bank to visualize your spending heatmap and get guilt-tripped by a fish.
            </Text>
            <PlaidLinkButton onLinked={fetchData} />
          </>
        )}
      </View>

      {/* Push token status */}
      <View style={{ backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 8 }}>Notifications</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: user?.expoPushToken ? '#2ecc71' : '#888', marginRight: 8 }} />
          <Text style={{ color: '#aaa', fontSize: 14 }}>
            {user?.expoPushToken ? 'Push notifications enabled' : 'Not registered for notifications'}
          </Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{ backgroundColor: '#2a1a1a', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: '#FF3B30' }}
      >
        <Text style={{ color: '#FF3B30', fontWeight: '700', fontSize: 16 }}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
