import React from 'react'
import { View, Text } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'

type CategorySpend = { category: string; total: number }

type Props = { data: CategorySpend[] }

const COLORS = ['#FF6B35', '#3498db', '#9b59b6', '#e74c3c', '#2ecc71', '#f39c12', '#1abc9c']

export default function SpendChart({ data }: Props) {
  if (data.length === 0) return null

  const max = Math.max(...data.map((d) => d.total))

  const barData = data.map((d, i) => ({
    value: d.total,
    label: d.category.split(' ')[0], // first word only for space
    frontColor: COLORS[i % COLORS.length],
    topLabelComponent: () => (
      <Text style={{ color: '#aaa', fontSize: 10, marginBottom: 2 }}>${d.total.toFixed(0)}</Text>
    ),
  }))

  return (
    <View>
      <BarChart
        data={barData}
        barWidth={36}
        spacing={18}
        roundedTop
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: '#666' }}
        xAxisLabelTextStyle={{ color: '#aaa', fontSize: 10 }}
        noOfSections={4}
        maxValue={max * 1.2}
        isAnimated
        barBorderRadius={6}
      />
    </View>
  )
}
