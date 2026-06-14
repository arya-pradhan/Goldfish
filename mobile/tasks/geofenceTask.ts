import * as TaskManager from 'expo-task-manager'
import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const GEOFENCE_TASK = 'GOLDFISH_GEOFENCE_TASK'

TaskManager.defineTask(GEOFENCE_TASK, ({ data, error }) => {
  if (error) {
    console.error('[Geofence] Task error:', error)
    return
  }

  const { eventType, region } = (data as any) ?? {}

  if (eventType === Location.GeofencingEventType.Enter && region) {
    AsyncStorage.setItem('PENDING_HOTZONE', JSON.stringify(region)).catch(console.error)
  }
})
