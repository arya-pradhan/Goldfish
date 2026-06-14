import { NextRequest, NextResponse } from 'next/server'
import { Products, CountryCode } from 'plaid'
import { connectDB } from '../../../../lib/mongodb'
import { plaidClient } from '../../../../lib/plaid'
import { getUserIdFromRequest } from '../../../../lib/auth'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromRequest(req)

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Goldfish',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    })

    return NextResponse.json({ link_token: response.data.link_token })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
