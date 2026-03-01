import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

const PRIVY_APP_ID = process.env.PRIVY_APP_ID || 'cmlubuldi02gs0blamh0qewit'
const JWKS_URL = `https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`

const client = jwksClient({
  jwksUri: JWKS_URL,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 60 * 1000,
})

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  if (!header.kid) {
    return callback(new Error('No KID found in token header'), undefined)
  }

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err, undefined)
    } else {
      const signingKey = key?.getPublicKey()
      callback(null, signingKey)
    }
  })
}

/**
 * 验证 Privy JWT token，返回用户 ID (sub)，验证失败返回 null
 * DEV_MODE=true 时跳过签名和过期验证，仅解码 sub（仅供本地测试使用）
 */
export async function verifyPrivyToken(token: string): Promise<string | null> {
  if (process.env.DEV_MODE === 'true') {
    const decoded = jwt.decode(token) as any
    return decoded?.sub ?? null
  }

  return new Promise((resolve) => {
    try {
      const decodedToken = jwt.decode(token, { complete: true })

      if (!decodedToken || typeof decodedToken === 'string' || !decodedToken.header) {
        console.error('Failed to decode JWT token to inspect header.')
        return resolve(null)
      }

      jwt.verify(
        token,
        getKey,
        {
          audience: PRIVY_APP_ID,
          issuer: 'privy.io',
          algorithms: ['RS256', 'ES256'],
          ignoreExpiration: process.env.NODE_ENV !== 'production',
        },
        (err, decoded: any) => {
          if (err) {
            if (err.name === 'TokenExpiredError') {
              console.error('Privy Token has expired.')
            } else {
              console.error(`Invalid Privy Token: ${err.message}`)
            }
            resolve(null)
          } else if (decoded && decoded.sub) {
            resolve(decoded.sub)
          } else {
            console.error('Valid token, but no subject found.')
            resolve(null)
          }
        }
      )
    } catch (e: any) {
      console.error(`Verification failed: ${e.message}`)
      resolve(null)
    }
  })
}
