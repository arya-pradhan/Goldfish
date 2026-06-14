import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import { HotZone } from '../../../../models/HotZone'
import { getUserIdFromRequest } from '../../../../lib/auth'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromRequest(req)
    const zones = await HotZone.find({ userId }).sort({ totalSpend: -1 })
    return NextResponse.json({ zones })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 401 })
  }
}
