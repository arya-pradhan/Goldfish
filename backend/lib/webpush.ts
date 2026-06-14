import { Expo, ExpoPushMessage } from 'expo-server-sdk'

export const expo = new Expo()

export async function sendGuiltNotification(pushToken: string, zoneLabel: string, totalSpent: number) {
  if (!Expo.isExpoPushToken(pushToken)) return

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title: '🐟 Goldfish Warning!',
    body: `You're near ${zoneLabel} — you've spent $${totalSpent.toFixed(0)} here before. The fish sees you.`,
    data: { zoneLabel, totalSpent },
  }

  const chunks = expo.chunkPushNotifications([message])
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk)
  }
}
