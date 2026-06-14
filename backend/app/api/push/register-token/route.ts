import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import { User } from '../../../../models/User'
import { getUserIdFromRequest } from '../../../../lib/auth'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromRequest(req)
    const { expoPushToken } = await req.json()

    if (!expoPushToken) {
      return NextResponse.json({ message: 'expoPushToken is required' }, { status: 400 })
    }

    await User.findByIdAndUpdate(userId, { expoPushToken })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 401 })
  }
}
