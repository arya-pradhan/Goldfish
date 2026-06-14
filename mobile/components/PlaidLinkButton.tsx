import React, { useState } from 'react'
import { TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native'
import { PlaidLink, LinkSuccess, LinkExit } from 'react-native-plaid-link-sdk'
import { apiFetch } from '../lib/api'

type Props = {
  onLinked?: () => void
}

export default function PlaidLinkButton({ onLinked }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchLinkToken() {
    setLoading(true)
    try {
      const { link_token } = await apiFetch<{ link_token: string }>(
        '/api/plaid/create-link-token',
        { method: 'POST' },
      )
      setLinkToken(link_token)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSuccess(success: LinkSuccess) {
    try {
      await apiFetch('/api/plaid/exchange-token', {
        method: 'POST',
        body: { public_token: success.publicToken },
      })
      await apiFetch('/api/plaid/transactions', { method: 'POST' })
      onLinked?.()
    } catch (e: any) {
      Alert.alert('Link error', e.message)
    }
  }

  function handleExit(exit: LinkExit) {
    if (exit.error) Alert.alert('Plaid exit', exit.error.displayMessage ?? 'Cancelled')
    setLinkToken(null)
  }

  if (linkToken) {
    return (
      <PlaidLink
        tokenConfig={{ token: linkToken }}
        onSuccess={handleSuccess}
        onExit={handleExit}
      >
        <TouchableOpacity className="bg-ocean px-6 py-3 rounded-2xl items-center">
          <Text className="text-white font-semibold text-base">Opening Plaid…</Text>
        </TouchableOpacity>
      </PlaidLink>
    )
  }

  return (
    <TouchableOpacity
      onPress={fetchLinkToken}
      disabled={loading}
      className="bg-brand px-6 py-3 rounded-2xl items-center"
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-white font-semibold text-base">Link Bank Account</Text>
      )}
    </TouchableOpacity>
  )
}
