// @ts-nocheck
/* eslint-disable */

import crypto from 'crypto'
import { env } from '@/lib/env.server'

const metaPixelId = env.META_PIXEL_ID
const metaAccessToken = env.META_ACCESS_TOKEN

function hashForMeta(value: string) {
  if (!value) return null
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex')
}

async function sendMetaEvent(eventName, sessionData, eventParams = {}) {
  const userData = prepareMetaUserData(sessionData)
}
