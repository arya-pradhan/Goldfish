import * as TaskManager from 'expo-task-manager'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const GEOFENCE_TASK = 'GOLDFISH_GEOFENCE_TASK'

// Keys shared with app/(app)/_layout.tsx
export const PENDING_HOTZONE_KEY = 'PENDING_HOTZONE'
export const ZONE_MAP_KEY = 'ZONE_MAP' // identifier -> zone details, written when geofences are registered

type StoredZone = {
  identifier: string
  zoneLabel: string
  totalSpent: number
  visitCount: number
}

// Runs even when the app is closed. Registered at app root via the import in app/_layout.tsx.
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[Geofence] Task error:', error)
    return
  }

  const { eventType, region } = (data as any) ?? {}
  if (eventType !== Location.GeofencingEventType.Enter || !region) return

  // Look up the rich zone details we cached at registration time so the
  // notification + overlay can show the label and prior spend.
  let zone: StoredZone = {
    identifier: region.identifier ?? '',
    zoneLabel: 'a hot zone',
    totalSpent: 0,
    visitCount: 0,
  }
  try {
    const raw = await AsyncStorage.getItem(ZONE_MAP_KEY)
    if (raw) {
      const map = JSON.parse(raw) as Record<string, StoredZone>
      if (region.identifier && map[region.identifier]) zone = map[region.identifier]
    }
  } catch {}

  // Flag for the app to show the guilt overlay on next open.
  await AsyncStorage.setItem(PENDING_HOTZONE_KEY, JSON.stringify(zone)).catch(console.error)

  // Fire a local notification immediately — works even with the app closed.
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🐟 Goldfish Warning!',
      body: `You're near ${zone.zoneLabel} — you've spent $${Math.round(zone.totalSpent)} here before. The fish sees you.`,
      sound: true,
    },
    trigger: null,
  }).catch(console.error)
})
