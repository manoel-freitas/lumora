import type { Context } from 'hono'
import { sign, verify } from 'hono/utils/jwt/jwt'
import { JwtTokenExpired, JwtTokenInvalid } from 'hono/utils/jwt/types'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

export const SESSION_COOKIE = 'lumora_session'
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

export type SessionPayload = {
  sub: string // user id
  email: string
  iat?: number
  exp?: number
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set (>=16 chars) in production.')
    }
    return 'dev-only-insecure-session-secret-change-me'
  }
  return secret
}

export async function signSession(payload: Omit<SessionPayload, 'iat' | 'exp'>, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const full: SessionPayload = { ...payload, iat: now, exp: now + ttlSeconds }
  return sign(full, getSecret(), 'HS256')
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const decoded = (await verify(token, getSecret(), 'HS256')) as SessionPayload
    if (!decoded?.sub) return null
    return decoded
  } catch (err) {
    if (err instanceof JwtTokenExpired || err instanceof JwtTokenInvalid) return null
    return null
  }
}

export function setSessionCookie(c: Context, token: string, ttlSeconds = DEFAULT_TTL_SECONDS): void {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ttlSeconds,
  })
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}

export function readSessionCookie(c: Context): string | undefined {
  return getCookie(c, SESSION_COOKIE)
}
