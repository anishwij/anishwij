import { env } from '@/lib/env.server'
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: env.KV_REST_API_URL,
  token: env.KV_REST_API_TOKEN,
})
