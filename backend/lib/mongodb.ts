import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) throw new Error('MONGODB_URI env var is not set')

// On serverless (Vercel) each cold start re-imports this module. Cache the
// connection on the global object so warm invocations reuse a single connection
// instead of opening a new one per request (which would exhaust Atlas's pool).
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined
}

const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null }
global._mongoose = cached

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    // bufferCommands:false → queries fail fast instead of hanging if the
    // connection isn't ready, which surfaces cold-start issues clearly.
    cached.promise = mongoose.connect(MONGODB_URI!, { bufferCommands: false })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    // Clear the failed promise so the next request retries instead of being
    // permanently poisoned by a one-off cold-start failure.
    cached.promise = null
    throw err
  }

  return cached.conn
}
