import React, { useState } from 'react'
import { TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native'
import { create, open, destroy } from 'react-native-plaid-link-sdk'
import type { LinkSuccess, LinkExit } from 'react-native-plaid-link-sdk'
import { apiFetch } from '../lib/api'

type Props = {
  onLinked?: () => void
}

export default function PlaidLinkButton({ onLinked }: Props) {
  const [loading, setLoading] = useState(false)

  async function handlePress() {
    setLoading(true)
    try {
      const { link_token } = await apiFetch<{ link_token: string }>(
        '/api/plaid/create-link-token',
        { method: 'POST' },
      )

      create({ token: link_token })

      open({
        onSuccess: async (success: LinkSuccess) => {
          try {
            await apiFetch('/api/plaid/exchange-token', {
              method: 'POST',
              body: { public_token: success.publicToken },
            })
            await apiFetch('/api/plaid/transactions', { method: 'POST' })
            onLinked?.()
          } catch (e: any) {
            Alert.alert('Link error', e.message)
          } finally {
            destroy()
          }
        },
        onExit: (exit: LinkExit) => {
          if (exit.error) {
            Alert.alert('Plaid exit', exit.error.displayMessage ?? 'Cancelled')
          }
          destroy()
        },
      })
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading}
      style={{ backgroundColor: '#FF6B35', borderRadius: 16, padding: 16, alignItems: 'center' }}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Link Bank Account</Text>
      )}
    </TouchableOpacity>
  )
}
