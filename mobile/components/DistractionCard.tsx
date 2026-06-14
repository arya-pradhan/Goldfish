import React, { useRef } from 'react'
import { View, Text, Animated, PanResponder, Dimensions } from 'react-native'
import { getRandomTip } from '../constants/motivationTips'

type Props = {
  zoneLabel: string
  totalSpent: number
  visitCount: number
  onDismiss: () => void
}

const { height } = Dimensions.get('window')

export default function DistractionCard({ zoneLabel, totalSpent, visitCount, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(0)).current
  const tip = getRandomTip()
  const avgSpend = visitCount > 0 ? (totalSpent / visitCount).toFixed(2) : '0.00'

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
    onPanResponderMove: (_, g) => {
      if (g.dy > 0) translateY.setValue(g.dy)
    },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 80) {
        Animated.timing(translateY, { toValue: height, duration: 200, useNativeDriver: true }).start(onDismiss)
      } else {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start()
      }
    },
  })

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        transform: [{ translateY }],
        backgroundColor: '#0f3460',
        borderRadius: 20,
        padding: 20,
        margin: 16,
      }}
    >
      {/* swipe indicator */}
      <View style={{ width: 40, height: 4, backgroundColor: '#555', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

      <Text style={{ color: '#FF6B35', fontWeight: '700', fontSize: 18, marginBottom: 12 }}>
        📊 Zone Stats: {zoneLabel}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Stat label="Total spent" value={`$${totalSpent.toFixed(2)}`} />
        <Stat label="Visits" value={String(visitCount)} />
        <Stat label="Avg / visit" value={`$${avgSpend}`} />
      </View>

      <View style={{ backgroundColor: '#1a4a8a', borderRadius: 12, padding: 14, marginTop: 8 }}>
        <Text style={{ color: '#90caf9', fontSize: 14, lineHeight: 20 }}>💡 {tip}</Text>
      </View>

      <Text style={{ color: '#555', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
        Swipe down to dismiss
      </Text>
    </Animated.View>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>{value}</Text>
      <Text style={{ color: '#aaa', fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  )
}
