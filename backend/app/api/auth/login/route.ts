import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '../../../../lib/mongodb'
import { User } from '../../../../models/User'
import { signToken } from '../../../../lib/jwt'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    const token = signToken({ userId: user._id.toString(), email: user.email })
    return NextResponse.json({ token, email: user.email })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
