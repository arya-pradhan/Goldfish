import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import { User } from '../../../../models/User'
import { HotZone } from '../../../../models/HotZone'
import { getUserIdFromRequest } from '../../../../lib/auth'
import { sendGuiltNotification } from '../../../../lib/webpush'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromRequest(req)
    const { hotZoneId } = await req.json()

    const [user, zone] = await Promise.all([
      User.findById(userId),
      HotZone.findById(hotZoneId),
    ])

    if (!user?.expoPushToken || !zone) {
      return NextResponse.json({ message: 'User token or zone not found' }, { status: 404 })
    }

    await sendGuiltNotification(user.expoPushToken, zone.label, zone.totalSpend)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
