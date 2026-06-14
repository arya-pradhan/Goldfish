import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native'
import * as Location from 'expo-location'
import * as ExpoLocation from 'expo-location'
import { apiFetch } from '../../lib/api'
import { GEOFENCE_TASK } from '../../tasks/geofenceTask'

// Mapbox is unavailable in Expo Go — use a placeholder map view
// that falls back gracefully. When building with EAS, replace this
// with the real @rnmapbox/maps import.
let MapView: any = null
let HeatmapLayer: any = null
let ShapeSource: any = null
let CircleLayer: any = null
let Camera: any = null
try {
  const Mapbox = require('@rnmapbox/maps')
  MapView = Mapbox.MapView
  HeatmapLayer = Mapbox.HeatmapLayer
  ShapeSource = Mapbox.ShapeSource
  CircleLayer = Mapbox.CircleLayer
  Camera = Mapbox.Camera
  Mapbox.default?.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '')
} catch {}

type Transaction = { _id: string; lat: number; lng: number; amount: number; merchantName: string }
type Zone = { _id: string; centerLat: number; centerLng: number; radiusMeters: number; label: string; totalSpend: number }

export default function MapScreen() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [syncing, setSyncing] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location is required for the heatmap.')
      return
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })

    await loadData()
    setMapReady(true)
  }

  async function loadData() {
    try {
      const [txData, zonesData] = await Promise.all([
        apiFetch<{ transactions: Transaction[] }>('/api/plaid/transactions').catch(() => ({ transactions: [] })),
        apiFetch<{ zones: Zone[] }>('/api/zones/list').catch(() => ({ zones: [] })),
      ])
      setTransactions(txData.transactions.filter((t) => t.lat && t.lng))
      setZones(zonesData.zones)

      // Register geofences
      if (zonesData.zones.length > 0) {
        const { status } = await Location.requestBackgroundPermissionsAsync()
        if (status === 'granted') {
          const isRegistered = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false)
          if (isRegistered) await Location.stopGeofencingAsync(GEOFENCE_TASK).catch(() => {})
          await Location.startGeofencingAsync(
            GEOFENCE_TASK,
            zonesData.zones.map((z) => ({
              identifier: z._id,
              latitude: z.centerLat,
              longitude: z.centerLng,
              radius: z.radiusMeters,
              notifyOnEnter: true,
              notifyOnExit: false,
            })),
          )
        }
      }
    } catch (e: any) {
      console.warn('loadData error', e.message)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      await apiFetch('/api/plaid/transactions', { method: 'POST' })
      await loadData()
    } catch (e: any) {
      Alert.alert('Sync failed', e.message)
    } finally {
      setSyncing(false)
    }
  }

  const geojson = {
    type: 'FeatureCollection' as const,
    features: transactions.map((t) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [t.lng, t.lat] },
      properties: { amount: t.amount },
    })),
  }

  // Fallback UI when Mapbox unavailable (Expo Go)
  if (!MapView) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 48 }}>🗺️</Text>
        <Text style={{ color: '#FF6B35', fontWeight: '700', fontSize: 20, marginTop: 16, textAlign: 'center' }}>
          Map requires a native build
        </Text>
        <Text style={{ color: '#666', fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
          Run{' '}
          <Text style={{ color: '#aaa', fontFamily: 'monospace' }}>eas build</Text>
          {' '}to get the full Mapbox heatmap experience.{'\n\n'}
          Transactions loaded: {transactions.length}{'\n'}
          Hot zones: {zones.length}
        </Text>
        <TouchableOpacity
          onPress={handleSync}
          disabled={syncing}
          style={{ marginTop: 24, backgroundColor: '#FF6B35', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 }}
        >
          {syncing ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Sync Transactions</Text>}
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {location ? (
        <MapView style={StyleSheet.absoluteFillObject} styleURL="mapbox://styles/mapbox/dark-v11">
          <Camera zoomLevel={13} centerCoordinate={[location.lng, location.lat]} animationDuration={0} />

          {transactions.length > 0 && (
            <ShapeSource id="transactions" shape={geojson}>
              <HeatmapLayer
                id="spend-heat"
                sourceID="transactions"
                style={{
                  heatmapWeight: ['interpolate', ['linear'], ['get', 'amount'], 0, 0, 500, 1],
                  heatmapIntensity: 1.5,
                  heatmapColor: [
                    'interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(0,0,255,0)',
                    0.2, 'rgba(0,128,255,0.5)',
                    0.5, 'rgba(255,165,0,0.8)',
                    1, 'rgba(255,30,30,1)',
                  ],
                  heatmapRadius: 30,
                  heatmapOpacity: 0.8,
                }}
              />
            </ShapeSource>
          )}

          {zones.map((zone) => (
            <ShapeSource
              key={zone._id}
              id={`zone-${zone._id}`}
              shape={{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [zone.centerLng, zone.centerLat] },
                properties: { radius: zone.radiusMeters },
              }}
            >
              <CircleLayer
                id={`circle-${zone._id}`}
                style={{
                  circleRadius: zone.radiusMeters / 10,
                  circleColor: 'rgba(255, 80, 80, 0.25)',
                  circleStrokeColor: 'rgba(255, 80, 80, 0.6)',
                  circleStrokeWidth: 1.5,
                }}
              />
            </ShapeSource>
          ))}
        </MapView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#FF6B35" size="large" />
        </View>
      )}

      {/* Sync FAB */}
      <TouchableOpacity
        onPress={handleSync}
        disabled={syncing}
        style={{
          position: 'absolute', bottom: 32, right: 20,
          backgroundColor: '#FF6B35', borderRadius: 28,
          paddingHorizontal: 20, paddingVertical: 14,
          flexDirection: 'row', alignItems: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4, shadowRadius: 6, elevation: 8,
        }}
      >
        {syncing ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>↻ Sync</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
})
