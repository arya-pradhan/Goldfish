import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import { User } from '../../../../models/User'
import { getUserIdFromRequest } from '../../../../lib/auth'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromRequest(req)
    const user = await User.findById(userId).select('-passwordHash')
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })
    return NextResponse.json({ email: user.email, expoPushToken: user.expoPushToken })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 401 })
  }
}
