import React, { useEffect, useRef } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { getRandomGuiltLine } from '../constants/guiltLines'
import { apiFetch } from '../lib/api'

const { height } = Dimensions.get('window')

type Props = {
  visible: boolean
  zoneId?: string
  zoneLabel: string
  totalSpent: number
  onDismiss: (resisted: boolean) => void
}

export default function HotZoneOverlay({ visible, zoneId, zoneLabel, totalSpent, onDismiss }: Props) {
  const translateY = useSharedValue(height)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 })
      translateY.value = withSpring(0, { damping: 18, stiffness: 120 })
    } else {
      opacity.value = withTiming(0, { duration: 200 })
      translateY.value = withTiming(height, { duration: 250 })
    }
  }, [visible])

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))

  const caption = getRandomGuiltLine(zoneLabel, Math.round(totalSpent))

  async function handleResist() {
    try {
      if (zoneId) await apiFetch('/api/resist', { method: 'POST', body: { hotZoneId: zoneId } })
    } catch {}
    onDismiss(true)
  }

  function handleGiveIn() {
    onDismiss(false)
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View
        style={[overlayStyle, { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }]}
      >
        <Animated.View
          style={[cardStyle, { backgroundColor: '#1a1a2e', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28 }]}
        >
          {/* Fish emoji as stand-in — swap LottieView when .json asset is added */}
          <Text style={{ fontSize: 72, textAlign: 'center', marginBottom: 16 }}>🐟</Text>

          <Text style={{ color: '#FF6B35', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
            🐟 Goldfish Warning!
          </Text>

          <Text style={{ color: '#e0e0e0', fontSize: 16, textAlign: 'center', marginBottom: 28, lineHeight: 24 }}>
            {caption}
          </Text>

          <TouchableOpacity
            onPress={handleResist}
            style={{ backgroundColor: '#2ecc71', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>I'll be strong 💪</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGiveIn}
            style={{ backgroundColor: '#333', borderRadius: 16, padding: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#aaa', fontWeight: '600', fontSize: 16 }}>I'm definitely buying something 🙈</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}
