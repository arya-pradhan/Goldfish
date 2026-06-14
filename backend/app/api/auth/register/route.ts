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

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ email, passwordHash })
    const token = signToken({ userId: user._id.toString(), email: user.email })

    return NextResponse.json({ token, email: user.email }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
