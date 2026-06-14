import { NextRequest } from 'next/server'
import { verifyToken } from './jwt'

export function getUserIdFromRequest(req: NextRequest): string {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) throw new Error('No token provided')
  const payload = verifyToken(token)
  return payload.userId as string
}
