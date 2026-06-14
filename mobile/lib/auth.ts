import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'goldfish_jwt'

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken()
  return token !== null && token.length > 0
}
