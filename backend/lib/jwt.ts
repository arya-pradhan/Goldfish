import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET!

export function signToken(payload: object): string {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, SECRET) as jwt.JwtPayload
}
