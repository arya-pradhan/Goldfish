import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import { plaidClient } from '../../../../lib/plaid'
import { PlaidItem } from '../../../../models/PlaidItem'
import { Transaction } from '../../../../models/Transaction'
import { getUserIdFromRequest } from '../../../../lib/auth'

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN

async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN || !query) return null
  try {
    const encoded = encodeURIComponent(query)
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=1`,
    )
    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature) return null
    const [lng, lat] = feature.center
    return { lat, lng }
  } catch {
    return null
  }
}

// GET: return cached transactions
export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromRequest(req)
    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(200)
    return NextResponse.json({ transactions })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 401 })
  }
}

// POST: fetch from Plaid, geocode, cache
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromRequest(req)

    const plaidItem = await PlaidItem.findOne({ userId })
    if (!plaidItem) {
      return NextResponse.json({ message: 'No linked bank account' }, { status: 400 })
    }

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const response = await plaidClient.transactionsGet({
      access_token: plaidItem.accessToken,
      start_date: startDate,
      end_date: endDate,
      options: { count: 500 },
    })

    const plaidTxs = response.data.transactions

    for (const tx of plaidTxs) {
      let lat: number | undefined = tx.location?.lat ?? undefined
      let lng: number | undefined = tx.location?.lon ?? undefined
      let geocodedFallback = false

      if (!lat || !lng) {
        const query = [
          tx.merchant_name,
          tx.location?.address,
          tx.location?.city,
          tx.location?.region,
        ]
          .filter(Boolean)
          .join(', ')

        if (query) {
          const coords = await geocodeAddress(query)
          if (coords) {
            lat = coords.lat
            lng = coords.lng
            geocodedFallback = true
          }
        }
      }

      const category = Array.isArray(tx.category) && tx.category.length > 0
        ? tx.category[0]
        : 'Other'

      await Transaction.findOneAndUpdate(
        { userId, plaidTransactionId: tx.transaction_id },
        {
          userId,
          plaidTransactionId: tx.transaction_id,
          amount: tx.amount,
          merchantName: tx.merchant_name ?? tx.name ?? 'Unknown',
          category,
          lat,
          lng,
          date: new Date(tx.date),
          geocodedFallback,
        },
        { upsert: true, new: true },
      )
    }

    // Trigger zone recompute
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const authHeader = req.headers.get('Authorization') ?? ''
    fetch(`${baseUrl}/api/zones/compute`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    }).catch(() => {})

    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(200)
    return NextResponse.json({ synced: plaidTxs.length, transactions })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
