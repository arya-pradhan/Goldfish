import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import { plaidClient } from '../../../../lib/plaid'
import { PlaidItem } from '../../../../models/PlaidItem'
import { getUserIdFromRequest } from '../../../../lib/auth'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromRequest(req)
    const { public_token } = await req.json()

    if (!public_token) {
      return NextResponse.json({ message: 'public_token is required' }, { status: 400 })
    }

    const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token })
    const { access_token, item_id } = exchangeRes.data

    // Get institution name
    const itemRes = await plaidClient.itemGet({ access_token })
    const institutionId = itemRes.data.item.institution_id
    let institutionName = 'Unknown Bank'
    if (institutionId) {
      const instRes = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: ['US' as any],
      })
      institutionName = instRes.data.institution.name
    }

    await PlaidItem.findOneAndUpdate(
      { userId },
      { userId, accessToken: access_token, itemId: item_id, institutionName },
      { upsert: true, new: true },
    )

    return NextResponse.json({ success: true, institutionName })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
