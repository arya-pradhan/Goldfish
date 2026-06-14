import React, { useEffect, useState, useCallback } from 'react'
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { apiFetch } from '../../lib/api'
import TransactionFeed from '../../components/TransactionFeed'
import SpendChart from '../../components/SpendChart'

type Transaction = {
  _id: string
  merchantName: string
  amount: number
  category: string
  date: string
}

type Zone = {
  _id: string
  label: string
  totalSpend: number
  visitCount: number
}

type User = { email: string; expoPushToken?: string }

export default function DashboardScreen() {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [resistCount, setResistCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchAll() {
    try {
      const [u, txData, zonesData, resistData] = await Promise.all([
        apiFetch<User>('/api/auth/me'),
        apiFetch<{ transactions: Transaction[] }>('/api/plaid/transactions').catch(() => ({ transactions: [] })),
        apiFetch<{ zones: Zone[] }>('/api/zones/list').catch(() => ({ zones: [] })),
        apiFetch<{ count: number }>('/api/resist').catch(() => ({ count: 0 })),
      ])
      setUser(u)
      setTransactions(txData.transactions)
      setZones(zonesData.zones)
      setResistCount(resistData.count)
    } catch {}
  }

  useEffect(() => {
    fetchAll().finally(() => setLoading(false))
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchAll()
    setRefreshing(false)
  }, [])

  // Compute category spend from transactions
  const categorySpend = Object.values(
    transactions.reduce<Record<string, { category: string; total: number }>>((acc, tx) => {
      const cat = tx.category || 'Other'
      if (!acc[cat]) acc[cat] = { category: cat, total: 0 }
      acc[cat].total += tx.amount
      return acc
    }, {}),
  ).sort((a, b) => b.total - a.total).slice(0, 6)

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a1a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0a0a1a' }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />}
    >
      {/* Header */}
      <View style={{ padding: 24, paddingTop: 56 }}>
        <Text style={{ color: '#FF6B35', fontSize: 28, fontWeight: '800' }}>🐟 Goldfish</Text>
        {user && <Text style={{ color: '#666', fontSize: 14, marginTop: 4 }}>{user.email}</Text>}
      </View>

      {/* Resist counter */}
      <View style={{ marginHorizontal: 16, backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <Text style={{ color: '#2ecc71', fontSize: 32, fontWeight: '800', textAlign: 'center' }}>
          {resistCount}
        </Text>
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 4, fontSize: 14 }}>
          Times I stayed strong 💪
        </Text>
      </View>

      {/* Spend chart */}
      {categorySpend.length > 0 && (
        <View style={{ marginHorizontal: 16, backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 16 }}>Spend by Category</Text>
          <SpendChart data={categorySpend} />
        </View>
      )}

      {/* Hot zones */}
      <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 12 }}>🔥 Hot Zones</Text>
        {zones.length === 0 ? (
          <Text style={{ color: '#555', fontSize: 14 }}>No hot zones yet. Sync transactions to compute zones.</Text>
        ) : (
          zones.slice(0, 5).map((zone) => (
            <View
              key={zone._id}
              style={{ backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, flex: 1 }} numberOfLines={1}>
                {zone.label}
              </Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#FF6B35', fontWeight: '700', fontSize: 16 }}>
                  ${zone.totalSpend.toFixed(0)}
                </Text>
                <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>{zone.visitCount} visits</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Recent transactions */}
      <View style={{ marginHorizontal: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 12 }}>Recent Transactions</Text>
        <TransactionFeed transactions={transactions.slice(0, 20)} />
      </View>
    </ScrollView>
  )
}
