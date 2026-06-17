import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Tabs, router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import * as Location from 'expo-location'
import { isAuthenticated } from '../../lib/auth'
import { apiFetch } from '../../lib/api'
import HotZoneOverlay from '../../components/HotZoneOverlay'
import DistractionCard from '../../components/DistractionCard'
import { GEOFENCE_TASK, ZONE_MAP_KEY, PENDING_HOTZONE_KEY } from '../../tasks/geofenceTask'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

type ActiveZone = {
  identifier: string
  zoneLabel: string
  totalSpent: number
  visitCount: number
}

export default function AppLayout() {
  const [checking, setChecking] = useState(true)
  const [activeZone, setActiveZone] = useState<ActiveZone | null>(null)
  const [showCard, setShowCard] = useState(false)

  useEffect(() => {
    async function init() {
      const authed = await isAuthenticated()
      if (!authed) {
        router.replace('/(auth)/login')
        return
      }
      setChecking(false)

      await registerPushToken()
      await registerGeofences()
      await checkPendingZone()

      if (__DEV__ && process.env.EXPO_PUBLIC_SIMULATE_HOTZONE === 'true') {
        setActiveZone({ identifier: 'demo', zoneLabel: 'Demo Starbucks', totalSpent: 847, visitCount: 23 })
      }
    }
    init()
  }, [])

  async function registerPushToken() {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return
    const tokenData = await Notifications.getExpoPushTokenAsync()
    apiFetch('/api/push/register-token', {
      method: 'POST',
      body: { expoPushToken: tokenData.data },
    }).catch(() => {})
  }

  // Fetch the user's hot zones, cache their details for the background task,
  // and register them as native geofences so ENTER events fire even when closed.
  async function registerGeofences() {
    try {
      const fg = await Location.requestForegroundPermissionsAsync()
      if (fg.status !== 'granted') return
      // Background ("Always") permission is required for geofencing to fire when closed.
      await Location.requestBackgroundPermissionsAsync()

      const data = await apiFetch<{ zones: any[] }>('/api/zones/list')
      const zones: any[] = data?.zones ?? []
      if (zones.length === 0) return

      // Cache identifier -> rich details so the background task can build a
      // meaningful notification + overlay payload.
      const zoneMap: Record<string, ActiveZone> = {}
      const regions = zones.map((z) => {
        const identifier = String(z._id)
        zoneMap[identifier] = {
          identifier,
          zoneLabel: z.label ?? 'Hot Zone',
          totalSpent: z.totalSpend ?? 0,
          visitCount: z.visitCount ?? 0,
        }
        return {
          identifier,
          latitude: z.centerLat,
          longitude: z.centerLng,
          radius: z.radiusMeters ?? 200,
          notifyOnEnter: true,
          notifyOnExit: false,
        }
      })

      await AsyncStorage.setItem(ZONE_MAP_KEY, JSON.stringify(zoneMap))
      await Location.startGeofencingAsync(GEOFENCE_TASK, regions)
    } catch (e) {
      console.warn('[Geofence] registration failed:', e)
    }
  }

  async function checkPendingZone() {
    const raw = await AsyncStorage.getItem(PENDING_HOTZONE_KEY)
    if (!raw) return
    await AsyncStorage.removeItem(PENDING_HOTZONE_KEY)
    try {
      const zone = JSON.parse(raw)
      setActiveZone({
        identifier: zone.identifier ?? '',
        zoneLabel: zone.zoneLabel ?? 'Hot Zone',
        totalSpent: zone.totalSpent ?? 0,
        visitCount: zone.visitCount ?? 0,
      })
    } catch {}
  }

  function handleOverlayDismiss(resisted: boolean) {
    if (resisted && activeZone) setShowCard(true)
    else setActiveZone(null)
  }

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a1a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    )
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: '#0a0a1a', borderTopColor: '#222' },
          tabBarActiveTintColor: '#FF6B35',
          tabBarInactiveTintColor: '#555',
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: () => <TabIcon emoji="🏠" /> }} />
        <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: () => <TabIcon emoji="🗺️" /> }} />
        <Tabs.Screen name="zones" options={{ title: 'Zones', tabBarIcon: () => <TabIcon emoji="🔥" /> }} />
        <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: () => <TabIcon emoji="👤" /> }} />
      </Tabs>

      {activeZone && (
        <HotZoneOverlay
          visible={true}
          zoneId={activeZone.identifier}
          zoneLabel={activeZone.zoneLabel}
          totalSpent={activeZone.totalSpent}
          onDismiss={handleOverlayDismiss}
        />
      )}

      {showCard && activeZone && (
        <View style={{ position: 'absolute', bottom: 80, left: 0, right: 0, zIndex: 100 }}>
          <DistractionCard
            zoneLabel={activeZone.zoneLabel}
            totalSpent={activeZone.totalSpent}
            visitCount={activeZone.visitCount}
            onDismiss={() => { setShowCard(false); setActiveZone(null) }}
          />
        </View>
      )}
    </>
  )
}

function TabIcon({ emoji }: { emoji: string }) {
  const { Text } = require('react-native')
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>
}
