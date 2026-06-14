import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import { Transaction } from '../../../../models/Transaction'
import { HotZone } from '../../../../models/HotZone'
import { getUserIdFromRequest } from '../../../../lib/auth'
import { haversineMeters } from '../../../../lib/haversine'

const CLUSTER_RADIUS_M = 200

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromRequest(req)

    const txs = await Transaction.find({
      userId,
      lat: { $exists: true, $ne: null },
      lng: { $exists: true, $ne: null },
    })

    if (txs.length === 0) {
      return NextResponse.json({ zones: [] })
    }

    // Greedy radius clustering
    const assigned = new Set<string>()
    const clusters: Array<{
      txs: typeof txs
      centerLat: number
      centerLng: number
    }> = []

    for (const tx of txs) {
      if (assigned.has(tx._id.toString())) continue

      const cluster = txs.filter((other) => {
        if (assigned.has(other._id.toString())) return false
        return haversineMeters(tx.lat!, tx.lng!, other.lat!, other.lng!) <= CLUSTER_RADIUS_M
      })

      // Centroid
      const centerLat = cluster.reduce((s, t) => s + t.lat!, 0) / cluster.length
      const centerLng = cluster.reduce((s, t) => s + t.lng!, 0) / cluster.length

      cluster.forEach((t) => assigned.add(t._id.toString()))
      clusters.push({ txs: cluster, centerLat, centerLng })
    }

    // Upsert zones
    const savedZones = await Promise.all(
      clusters.map(async (c) => {
        const totalSpend = c.txs.reduce((s, t) => s + t.amount, 0)

        // Most common merchant name = label
        const nameCounts: Record<string, number> = {}
        c.txs.forEach((t) => { nameCounts[t.merchantName] = (nameCounts[t.merchantName] ?? 0) + 1 })
        const label = Object.entries(nameCounts).sort((a, b) => b[1] - a[1])[0][0]

        return HotZone.findOneAndUpdate(
          {
            userId,
            centerLat: { $gte: c.centerLat - 0.0001, $lte: c.centerLat + 0.0001 },
            centerLng: { $gte: c.centerLng - 0.0001, $lte: c.centerLng + 0.0001 },
          },
          {
            userId,
            label,
            centerLat: c.centerLat,
            centerLng: c.centerLng,
            radiusMeters: CLUSTER_RADIUS_M,
            totalSpend,
            visitCount: c.txs.length,
            transactionIds: c.txs.map((t) => t._id),
          },
          { upsert: true, new: true },
        )
      }),
    )

    return NextResponse.json({ zones: savedZones })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
