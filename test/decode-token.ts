/**
 * Privy JWT Token 解码工具
 * 用法：tsx decode-token.ts <jwt_token>
 */

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
      callback(null, key?.getPublicKey())
    }
  })
}

async function decodeToken(token: string): Promise<void> {
  // 先 decode 看基本信息（不验签）
  const raw = jwt.decode(token, { complete: true })
  if (!raw || typeof raw === 'string') {
    console.error('❌ 无法解析 Token，请确认格式正确')
    process.exit(1)
  }

  console.log('\n── Token 基本信息（未验签）──────────────────────')
  console.log(`  iss (issuer)  : ${(raw.payload as any).iss ?? '-'}`)
  console.log(`  aud (audience): ${(raw.payload as any).aud ?? '-'}`)
  console.log(`  sub (user_id) : ${(raw.payload as any).sub ?? '-'}`)
  const iat = (raw.payload as any).iat
  const exp = (raw.payload as any).exp
  if (iat) console.log(`  iat (issued)  : ${new Date(iat * 1000).toISOString()}`)
  if (exp) console.log(`  exp (expires) : ${new Date(exp * 1000).toISOString()}`)
  console.log('────────────────────────────────────────────────\n')

  // 再验签
  console.log('正在验证签名...')
  const userId = await new Promise<string | null>((resolve) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: PRIVY_APP_ID,
        issuer: 'privy.io',
        algorithms: ['RS256', 'ES256'],
      },
      (err, decoded: any) => {
        if (err) {
          if (err.name === 'TokenExpiredError') {
            console.warn('⚠️  Token 已过期，但 sub 仍可读取')
          } else {
            console.error(`❌ 签名验证失败: ${err.message}`)
          }
          resolve(null)
        } else {
          resolve(decoded?.sub ?? null)
        }
      }
    )
  })

  if (userId) {
    console.log(`✅ 签名验证通过`)
    console.log(`\n👤 user_id = ${userId}\n`)
  } else {
    // 签名失败时仍输出 sub（供调试用）
    const sub = (raw.payload as any).sub
    if (sub) {
      console.log(`\n👤 sub (未验签) = ${sub}\n`)
    } else {
      console.log('❌ Token 中没有 sub 字段\n')
    }
  }
}

// ── 入口 ──────────────────────────────────────────────
const token = process.argv[2]

if (!token) {
  console.log('用法: tsx decode-token.ts <jwt_token>')
  console.log('示例: tsx decode-token.ts eyJhbGci...')
  process.exit(1)
}

decodeToken(token).catch((e) => {
  console.error('未知错误:', e)
  process.exit(1)
})
