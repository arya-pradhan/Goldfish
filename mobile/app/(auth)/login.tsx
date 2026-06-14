import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { router, Link } from 'expo-router'
import { apiFetch } from '../../lib/api'
import { saveToken } from '../../lib/auth'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Error', 'Fill in all fields')
    setLoading(true)
    try {
      const { token } = await apiFetch<{ token: string }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        skipAuth: true,
      })
      await saveToken(token)
      router.replace('/(app)/')
    } catch (e: any) {
      Alert.alert('Login failed', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0a0a1a', justifyContent: 'center', padding: 24 }}
    >
      <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🐟</Text>
      <Text style={{ color: '#FF6B35', fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>
        Goldfish
      </Text>
      <Text style={{ color: '#666', textAlign: 'center', marginBottom: 40, fontSize: 14 }}>
        Know where your money swims
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#555"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={inputStyle}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#555"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={[inputStyle, { marginTop: 12 }]}
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{ backgroundColor: '#FF6B35', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 24 }}
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Sign In</Text>
        )}
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
        <Text style={{ color: '#666' }}>No account? </Text>
        <Link href="/(auth)/register">
          <Text style={{ color: '#FF6B35', fontWeight: '600' }}>Register</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  )
}

const inputStyle = {
  backgroundColor: '#1a1a2e',
  color: '#fff',
  borderRadius: 12,
  padding: 16,
  fontSize: 16,
  borderWidth: 1,
  borderColor: '#333',
}
