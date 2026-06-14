import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import { PlaidItem } from '../../../../models/PlaidItem'
import { getUserIdFromRequest } from '../../../../lib/auth'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromRequest(req)
    const item = await PlaidItem.findOne({ userId }).select('-accessToken')
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 401 })
  }
}
