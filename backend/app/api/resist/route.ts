import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import { ResistEvent } from '../../../models/ResistEvent'
import { getUserIdFromRequest } from '../../../lib/auth'

// POST: log a resist event
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromRequest(req)
    const { hotZoneId } = await req.json()

    await ResistEvent.create({ userId, hotZoneId })
    const count = await ResistEvent.countDocuments({ userId })
    return NextResponse.json({ success: true, count })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

// GET: return total resist count
export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromRequest(req)
    const count = await ResistEvent.countDocuments({ userId })
    return NextResponse.json({ count })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 401 })
  }
}
