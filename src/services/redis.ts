// @ts-nocheck
/* eslint-disable */

import { nanoid } from 'nanoid'

const SESSION_TTL = 60 * 60 * 24 * 7
const SESSION_PREFIX = 'sess:'

export function createSessionId() {
  return `${SESSION_PREFIX}:${nanoid(21)}`
}

export async function createSession(sessionId, utmData, metadata) {
  try {
    const sessionData = {
      utm_source: utmData.utm_source || null,
    }
  } catch (error) {}
}
