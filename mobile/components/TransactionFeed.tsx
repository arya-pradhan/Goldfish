import React from 'react'
import { FlatList, View, Text, RefreshControl } from 'react-native'

type Transaction = {
  _id: string
  merchantName: string
  amount: number
  category: string
  date: string
}

type Props = {
  transactions: Transaction[]
  refreshing?: boolean
  onRefresh?: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food and Drink': '#FF6B35',
  Travel: '#3498db',
  Shopping: '#9b59b6',
  Entertainment: '#e74c3c',
  Healthcare: '#2ecc71',
  Other: '#95a5a6',
}

export default function TransactionFeed({ transactions, refreshing, onRefresh }: Props) {
  if (transactions.length === 0) {
    return (
      <View style={{ padding: 32, alignItems: 'center' }}>
        <Text style={{ fontSize: 32 }}>🐟</Text>
        <Text style={{ color: '#888', marginTop: 12, textAlign: 'center' }}>
          No transactions yet.{'\n'}Link your bank to get started!
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item._id}
      scrollEnabled={false}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} /> : undefined
      }
      renderItem={({ item }) => (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 4,
            borderBottomWidth: 1,
            borderBottomColor: '#222',
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }} numberOfLines={1}>
              {item.merchantName}
            </Text>
            <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#FF6B35', fontWeight: '700', fontSize: 15 }}>
              ${item.amount.toFixed(2)}
            </Text>
            <View
              style={{
                backgroundColor: CATEGORY_COLORS[item.category] ?? '#555',
                borderRadius: 8,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginTop: 4,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{item.category}</Text>
            </View>
          </View>
        </View>
      )}
    />
  )
}
