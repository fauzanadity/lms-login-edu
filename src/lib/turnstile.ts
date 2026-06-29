/**
 * Verifies a Cloudflare Turnstile token on the server side.
 * 
 * @param token - The token received from the client-side Turnstile widget
 * @returns true if the token is valid, false otherwise
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    console.error('[Turnstile] TURNSTILE_SECRET_KEY is not set')
    // In development without keys, allow (with warning)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Turnstile] Skipping verification in development mode')
      return true
    }
    return false
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      }
    )

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('[Turnstile] Verification failed:', error)
    return false
  }
}
