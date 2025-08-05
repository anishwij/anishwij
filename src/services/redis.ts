// @ts-nocheck
/* eslint-disable */

import { nanoid } from 'nanoid'

const SESSION_TTL = 60 * 60 * 24 * 7
const SESSION_PREFIX = 'sess:'

export function createSessionId() {
  return `${SESSION_PREFIX}:${nanoid(21)}`
}

function mapSessionData(sessionId, utmData, metadata) {
  return {
    utm_source: utmData.utm_source || null,
  }
}

export async function createSession(sessionId, utmData, metadata) {
  try {
    const sessionData = mapSessionData(sessionId, utmData, metadata)
  } catch (error) {}
}
