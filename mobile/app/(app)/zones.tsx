import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native'
import { apiFetch } from '../../lib/api'

type Zone = {
  _id: string
  label: string
  totalSpend: number
  visitCount: number
  radiusMeters: number
}

export default function ZonesScreen() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchZones() {
    const data = await apiFetch<{ zones: Zone[] }>('/api/zones/list').catch(() => ({ zones: [] }))
    setZones(data.zones)
  }

  useEffect(() => {
    fetchZones().finally(() => setLoading(false))
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchZones()
    setRefreshing(false)
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a1a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a1a' }}>
      <View style={{ padding: 24, paddingTop: 56 }}>
        <Text style={{ color: '#FF6B35', fontSize: 24, fontWeight: '800' }}>🔥 Hot Zones</Text>
        <Text style={{ color: '#666', fontSize: 14, marginTop: 4 }}>Ranked by total spend</Text>
      </View>

      <FlatList
        data={zones}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40 }}>🐟</Text>
            <Text style={{ color: '#555', textAlign: 'center', marginTop: 12, fontSize: 15, lineHeight: 24 }}>
              No zones yet.{'\n'}Sync transactions to discover your spending hot spots.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View
            style={{
              backgroundColor: '#1a1a2e',
              borderRadius: 16,
              padding: 20,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: index === 0 ? '#FF3B30' : index === 1 ? '#FF6B35' : '#333',
                justifyContent: 'center', alignItems: 'center', marginRight: 16,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>#{index + 1}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>
                {item.visitCount} visits · ~{item.radiusMeters}m radius
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#FF6B35', fontWeight: '800', fontSize: 20 }}>
                ${item.totalSpend.toFixed(0)}
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>total spent</Text>
            </View>
          </View>
        )}
      />
    </View>
  )
}
