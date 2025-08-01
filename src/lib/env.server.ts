import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    KV_REST_API_URL: z.string().min(1),
    KV_REST_API_TOKEN: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    NODE_ENV: z.enum(['development', 'production']),
  },
  experimental__runtimeEnv: process.env,
})
