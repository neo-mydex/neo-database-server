import { Router, type Request, type Response } from 'express'
import { contentRepo, userRepo } from '@mydex/database'
import type { SupportedLang } from '@mydex/database'
import { ApiError, asyncHandler, successResponse } from '../middleware/error'
import { authMiddleware } from '../middleware/auth'

const VALID_LANGS: SupportedLang[] = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR']

// Accept-Language header 值 → SupportedLang 映射（前端 i18n 框架常见格式）
const ACCEPT_LANG_MAP: Record<string, SupportedLang> = {
  'en': 'en-US',
  'en-us': 'en-US',
  'en_us': 'en-US',
  'zh': 'zh-CN',
  'zh-cn': 'zh-CN',
  'zh_cn': 'zh-CN',
  'zh-tw': 'zh-CN',
  'zh_tw': 'zh-CN',
  'ko': 'ko-KR',
  'ko-kr': 'ko-KR',
  'ko_kr': 'ko-KR',
  'ja': 'ja-JP',
  'ja-jp': 'ja-JP',
  'ja_jp': 'ja-JP',
}

/**
 * 解析语言：优先 Accept-Language header，其次 ?lang= 参数，最后 fallback zh-CN
 * 兼容大小写（zh-CN / zh-cn 均可）
 */
function parseLang(lang: unknown, req?: Request): SupportedLang {
  // 1. Accept-Language header 优先
  if (req) {
    const header = req.headers['accept-language'] ?? ''
    // 取第一个语言标签（如 "zh-CN,zh;q=0.9,en;q=0.8" → "zh-CN"）
    const first = header.split(',')[0].trim().split(';')[0].trim().toLowerCase()
    if (first && ACCEPT_LANG_MAP[first]) return ACCEPT_LANG_MAP[first]
  }
  // 2. ?lang= 参数兜底（兼容大小写）
  if (lang) {
    const normalized = (lang as string).toLowerCase()
    if (ACCEPT_LANG_MAP[normalized]) return ACCEPT_LANG_MAP[normalized]
    const upper = lang as SupportedLang
    if (VALID_LANGS.includes(upper)) return upper
  }
  // 3. fallback
  return 'zh-CN'
}

function assertTranslationLang(lang: unknown): SupportedLang {
  if (!lang) {
    throw new ApiError(400, 'lang is required', { valid: VALID_LANGS })
  }
  if (!VALID_LANGS.includes(lang as SupportedLang)) {
    throw new ApiError(400, 'Invalid lang parameter', { valid: VALID_LANGS })
  }
  return lang as SupportedLang
}

const router: Router = Router()

// ─── CoinGecko 价格聚合 ────────────────────────────────────────────────────────

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY ?? ''
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

interface TokenMarketData {
  usdPrice: number | null
  change24hPct: number | null
  logo: string | null
}

/**
 * 通过 /search 查单个 symbol，返回 market_cap_rank 最小且 symbol 精确匹配的 coin id 和 logo。
 * 查不到时返回 null。
 */
async function searchCoinBySymbol(symbol: string): Promise<{ id: string; logo: string } | null> {
  try {
    const res = await fetch(`${COINGECKO_BASE}/search?query=${encodeURIComponent(symbol)}`, {
      headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY },
    })
    if (!res.ok) return null
    const json = await res.json() as { coins: Array<{ id: string; symbol: string; market_cap_rank: number | null; large: string }> }
    // 精确匹配 symbol（大小写不敏感），取 market_cap_rank 最小的
    const matches = json.coins
      .filter(c => c.symbol.toLowerCase() === symbol.toLowerCase())
      .sort((a, b) => (a.market_cap_rank ?? Infinity) - (b.market_cap_rank ?? Infinity))
    if (matches.length === 0) return null
    return { id: matches[0].id, logo: matches[0].large }
  } catch {
    return null
  }
}

/**
 * 批量从 CoinGecko 查询多个 token 的实时价格、24h 涨跌幅和 logo。
 * 流程：并行 /search 拿各 symbol 的 coin_id 和 logo → /coins/markets 批量查价格。
 * 返回以 symbol 小写为 key 的 map，查不到时各字段为 null。
 */
async function fetchBatchMarketData(symbols: string[]): Promise<Record<string, TokenMarketData>> {
  const result: Record<string, TokenMarketData> = {}
  for (const s of symbols) {
    result[s.toLowerCase()] = { usdPrice: null, change24hPct: null, logo: null }
  }

  try {
    // 并行 search 拿所有 coin id 和 logo
    const searchResults = await Promise.all(symbols.map(sym => searchCoinBySymbol(sym)))

    const idToSymbol: Record<string, string> = {}
    const idToLogo: Record<string, string> = {}
    const ids: string[] = []

    symbols.forEach((sym, i) => {
      const found = searchResults[i]
      if (found) {
        ids.push(found.id)
        idToSymbol[found.id] = sym.toLowerCase()
        idToLogo[found.id] = found.logo
      }
    })

    if (ids.length === 0) return result

    // 批量查价格和涨跌幅
    const params = new URLSearchParams({
      vs_currency: 'usd',
      ids: ids.join(','),
      price_change_percentage: '24h',
    })
    const res = await fetch(`${COINGECKO_BASE}/coins/markets?${params}`, {
      headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY },
    })

    if (!res.ok) return result

    const markets = await res.json() as Array<{
      id: string
      current_price: number
      price_change_percentage_24h: number
    }>

    for (const market of markets) {
      const sym = idToSymbol[market.id]
      if (!sym) continue
      result[sym] = {
        usdPrice: market.current_price ?? null,
        change24hPct: market.price_change_percentage_24h != null
          ? parseFloat(market.price_change_percentage_24h.toFixed(4))
          : null,
        logo: idToLogo[market.id] ?? null,
      }
    }
  } catch {
    // 查询失败，返回全部 null
  }

  return result
}

/**
 * 对一条内容的 suggested_tokens 批量补充市场数据（单次 CoinGecko 请求）。
 * 无 suggested_tokens 时直接返回原对象。
 */
async function enrichTokens<T extends { suggested_tokens?: unknown }>(content: T): Promise<T> {
  const tokens = content.suggested_tokens
  if (!Array.isArray(tokens) || tokens.length === 0) return content

  const symbols = tokens.map((t: any) => t.symbol as string).filter(Boolean)
  const marketMap = await fetchBatchMarketData(symbols)

  const enriched = tokens.map((token: any) => {
    const sym = token.symbol?.toLowerCase()
    const market = marketMap[sym] ?? { usdPrice: null, change24hPct: null, logo: null }
    return { ...token, ...market }
  })

  return { ...content, suggested_tokens: enriched }
}

/**
 * 批量对多条内容的 suggested_tokens 并行补充市场数据。
 */
async function enrichContents<T extends { suggested_tokens?: unknown }>(contents: T[]): Promise<T[]> {
  return Promise.all(contents.map(enrichTokens))
}

/**
 * GET /raw
 * 批量获取原始内容列表（支持过滤和排序）
 * 查询参数：
 * - content_type: news | edu | social
 * - source: 来源
 * - language: 语言
 * - sort: published_at_desc | published_at_asc
 * - page: 页码（从1开始，默认1）
 * - pageSize: 每页数量（默认20，最大100）
 */
router.get(
  '/raw',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      content_type,
      source,
      language,
      sort = 'published_at_desc',
      page = '1',
      pageSize = '20',
    } = req.query

    const pageNum = parseInt(page as string)
    const pageSizeNum = Math.min(parseInt(pageSize as string), 100)

    if (pageNum < 1 || pageSizeNum < 1) {
      throw new ApiError(400, 'page and pageSize must be greater than 0')
    }

    const offset = (pageNum - 1) * pageSizeNum

    const contents = await contentRepo.findRaw({
      content_type: content_type as any,
      source: source as string,
      language: language as string,
      limit: pageSizeNum,
      offset,
    }, sort as any)

    res.json(successResponse(contents, { count: contents.length, page: pageNum, pageSize: pageSizeNum }))
  })
)

/**
 * POST /raw
 * 创建原始内容
 */
router.post(
  '/raw',
  asyncHandler(async (req: Request, res: Response) => {
    const { title, content_type, content, source, publishedAt, url, author, language, images, social_metrics } = req.body

    if (!title || !content_type || !content || !source || !publishedAt) {
      throw new ApiError(400, 'Missing required fields', {
        required: ['title', 'content_type', 'content', 'source', 'publishedAt'],
      })
    }

    const validContentTypes = ['news', 'edu', 'social']
    if (!validContentTypes.includes(content_type)) {
      throw new ApiError(400, 'Invalid content_type', { valid: validContentTypes })
    }

    const created = await contentRepo.createRaw({
      title,
      content_type,
      content,
      source,
      publishedAt: Number(publishedAt),
      url,
      author,
      language,
      images,
      social_metrics,
    })

    res.status(201).json(successResponse(created))
  })
)

/**
 * POST /raw/batch
 * 批量创建原始内容
 */
router.post(
  '/raw/batch',
  asyncHandler(async (req: Request, res: Response) => {
    const inputs = req.body

    if (!Array.isArray(inputs) || inputs.length === 0) {
      throw new ApiError(400, 'Request body must be a non-empty array')
    }

    const validContentTypes = ['news', 'edu', 'social']
    for (const item of inputs) {
      if (!item.title || !item.content_type || !item.content || !item.source || !item.publishedAt) {
        throw new ApiError(400, 'Each item is missing required fields', {
          required: ['title', 'content_type', 'content', 'source', 'publishedAt'],
        })
      }
      if (!validContentTypes.includes(item.content_type)) {
        throw new ApiError(400, 'Invalid content_type', { valid: validContentTypes })
      }
    }

    const created = await contentRepo.createRawBatch(
      inputs.map(item => ({
        title: item.title,
        content_type: item.content_type,
        content: item.content,
        source: item.source,
        publishedAt: Number(item.publishedAt),
        url: item.url,
        author: item.author,
        language: item.language,
        images: item.images,
        social_metrics: item.social_metrics,
      }))
    )

    res.status(201).json(successResponse(created, { count: created.length }))
  })
)

/**
 * DELETE /raw/:id
 * 删除原始内容
 */
router.delete(
  '/raw/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string

    const existing = await contentRepo.findRawById(id)
    if (!existing) {
      throw new ApiError(404, 'Content not found')
    }

    await contentRepo.deleteRaw(id)
    res.json(successResponse({ message: 'Deleted successfully' }))
  })
)

/**
 * GET /raw/:id
 * 获取单条原始内容
 */
router.get(
  '/raw/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const content = await contentRepo.findRawById(id as string)

    if (!content) {
      throw new ApiError(404, 'Content not found')
    }

    res.json(successResponse(content))
  })
)

/**
 * POST /processed/batch
 * 批量创建处理后内容
 */
router.post(
  '/processed/batch',
  asyncHandler(async (req: Request, res: Response) => {
    const inputs = req.body

    if (!Array.isArray(inputs) || inputs.length === 0) {
      throw new ApiError(400, 'Request body must be a non-empty array')
    }

    const validContentTypes = ['news', 'edu', 'social']
    const validCategories = ['educational', 'tradable', 'macro']
    const validRiskLevels = ['low', 'medium', 'high']

    for (const item of inputs) {
      if (
        !item.title || !item.content_type || !item.content || !item.source || !item.publishedAt ||
        !item.summary || !item.category || !item.risk_level ||
        item.volatility === undefined || !item.detected_language ||
        !Array.isArray(item.evidence_points) || !Array.isArray(item.suggested_questions) || !Array.isArray(item.tags)
      ) {
        throw new ApiError(400, 'Each item is missing required fields', {
          required: [
            'title', 'content_type', 'content', 'source', 'publishedAt',
            'volatility', 'summary', 'evidence_points', 'suggested_questions',
            'detected_language', 'category', 'risk_level', 'tags',
          ],
        })
      }
      if (!validContentTypes.includes(item.content_type)) {
        throw new ApiError(400, 'Invalid content_type', { valid: validContentTypes })
      }
      if (!validCategories.includes(item.category)) {
        throw new ApiError(400, 'Invalid category', { valid: validCategories })
      }
      if (!validRiskLevels.includes(item.risk_level)) {
        throw new ApiError(400, 'Invalid risk_level', { valid: validRiskLevels })
      }
    }

    const created = await contentRepo.createProcessedBatch(
      inputs.map(item => ({
        title: item.title,
        content_type: item.content_type,
        content: item.content,
        source: item.source,
        publishedAt: Number(item.publishedAt),
        url: item.url,
        author: item.author,
        language: item.language,
        images: item.images,
        social_metrics: item.social_metrics,
        volatility: item.volatility,
        summary: item.summary,
        evidence_points: item.evidence_points,
        suggested_questions: item.suggested_questions,
        detected_language: item.detected_language,
        category: item.category,
        risk_level: item.risk_level,
        tags: item.tags,
        suggested_tokens: item.suggested_tokens,
        overall_sentiment: item.overall_sentiment,
      }))
    )

    res.status(201).json(successResponse(created, { count: created.length }))
  })
)

/**
 * POST /processed/:id/translations
 * 写入或更新指定内容的翻译（供 AI 翻译脚本调用）
 * Body: { lang, title, summary, evidence_points, tags, suggested_questions }
 */
router.post(
  '/processed/:id/translations',
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const { lang, title, summary, content, evidence_points, tags, suggested_questions } = req.body

    assertTranslationLang(lang)

    if (!title || !summary) {
      throw new ApiError(400, 'Missing required fields', { required: ['lang', 'title', 'summary'] })
    }

    // 验证对应内容存在
    const existing = await contentRepo.findProcessedById(id)
    if (!existing) {
      throw new ApiError(404, 'Content not found')
    }

    await contentRepo.upsertTranslation({
      content_id: id,
      lang,
      title,
      summary,
      content: typeof content === 'string' ? content : undefined,
      evidence_points: Array.isArray(evidence_points) ? evidence_points : [],
      tags: Array.isArray(tags) ? tags : [],
      suggested_questions: Array.isArray(suggested_questions) ? suggested_questions : [],
    })

    res.status(201).json(successResponse({ message: 'Translation saved' }))
  })
)

/**
 * GET /api/contents/processed/:id
 * 获取处理后内容
 * 查询参数：
 * - lang: zh-CN（默认）| en-US | ja-JP | ko-KR
 */
router.get(
  '/processed/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const lang = parseLang(req.query.lang, req)
    const content = await contentRepo.findProcessedById(id as string, lang)

    if (!content) {
      throw new ApiError(404, 'Content not found')
    }

    res.json(successResponse(await enrichTokens(content)))
  })
)

/**
 * GET /api/contents/processed
 * 获取处理后内容列表（支持过滤和排序）
 * 查询参数：
 * - category: educational | tradable | macro
 * - risk_level: low | medium | high
 * - content_type: news | edu | social
 * - source: 来源
 * - language: 语言
 * - sort: published_at_desc | published_at_asc | volatility_desc | volatility_asc
 * - page: 页码（从1开始，默认1）
 * - pageSize: 每页数量（默认20，最大100）
 * - lang: zh-CN（默认）| en-US | ja-JP | ko-KR
 */
router.get(
  '/processed',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      category,
      risk_level,
      content_type,
      source,
      language,
      sort = 'published_at_desc',
      page = '1',
      pageSize = '20',
    } = req.query

    const lang = parseLang(req.query.lang, req)

    // 参数验证
    const pageNum = parseInt(page as string)
    const pageSizeNum = Math.min(parseInt(pageSize as string), 100)

    if (pageNum < 1 || pageSizeNum < 1) {
      throw new ApiError(400, 'page and pageSize must be greater than 0')
    }

    const offset = (pageNum - 1) * pageSizeNum

    const contents = await contentRepo.findProcessed({
      category: category as any,
      risk_level: risk_level as any,
      content_type: content_type as any,
      source: source as string,
      language: language as string,
      limit: pageSizeNum,
      offset,
      lang,
    }, sort as any)

    const enriched = await enrichContents(contents)
    res.json(successResponse(enriched, { count: enriched.length, page: pageNum, pageSize: pageSizeNum }))
  })
)

/**
 * GET /api/contents/category/:category
 * 按分类获取内容
 * 查询参数：
 * - page: 页码（从1开始，默认1）
 * - pageSize: 每页数量（默认20，最大100）
 * - lang: zh-CN（默认）| en-US | ja-JP | ko-KR
 */
router.get(
  '/category/:category',
  asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params
    const { page = '1', pageSize = '20' } = req.query
    const lang = parseLang(req.query.lang, req)

    // 验证分类参数
    const validCategories = ['educational', 'tradable', 'macro']
    if (!validCategories.includes(category as string)) {
      throw new ApiError(400, 'Invalid category parameter', { valid: validCategories })
    }

    // 参数验证和转换
    const pageNum = parseInt(page as string)
    const pageSizeNum = Math.min(parseInt(pageSize as string), 100)

    if (pageNum < 1 || pageSizeNum < 1) {
      throw new ApiError(400, 'page and pageSize must be greater than 0')
    }

    const offset = (pageNum - 1) * pageSizeNum

    const contents = await contentRepo.getProcessedByCategory(
      category as any,
      pageSizeNum,
      offset,
      lang
    )

    const enriched = await enrichContents(contents)
    res.json(successResponse(enriched, { count: enriched.length, page: pageNum, pageSize: pageSizeNum }))
  })
)

/**
 * GET /api/contents/risk/:riskLevel
 * 按风险等级获取内容
 * 查询参数：
 * - page: 页码（从1开始，默认1）
 * - pageSize: 每页数量（默认20，最大100）
 * - lang: zh-CN（默认）| en-US | ja-JP | ko-KR
 */
router.get(
  '/risk/:riskLevel',
  asyncHandler(async (req: Request, res: Response) => {
    const { riskLevel } = req.params
    const { page = '1', pageSize = '20' } = req.query
    const lang = parseLang(req.query.lang, req)

    // 验证风险等级参数
    const validRiskLevels = ['low', 'medium', 'high']
    if (!validRiskLevels.includes(riskLevel as string)) {
      throw new ApiError(400, 'Invalid risk level parameter', { valid: validRiskLevels })
    }

    // 参数验证和转换
    const pageNum = parseInt(page as string)
    const pageSizeNum = Math.min(parseInt(pageSize as string), 100)

    if (pageNum < 1 || pageSizeNum < 1) {
      throw new ApiError(400, 'page and pageSize must be greater than 0')
    }

    const offset = (pageNum - 1) * pageSizeNum

    const contents = await contentRepo.getProcessedByRiskLevel(
      riskLevel as any,
      pageSizeNum,
      offset,
      lang
    )

    const enriched = await enrichContents(contents)
    res.json(successResponse(enriched, { count: enriched.length, page: pageNum, pageSize: pageSizeNum }))
  })
)

/**
 * GET /api/contents/recommended
 * 需要 Privy JWT 认证，推荐给当前登录用户的内容列表
 * 查询参数与 /api/contents/processed 相同，额外支持：
 * - lang: zh-CN（默认）| en-US | ja-JP | ko-KR
 */
router.get(
  '/recommended',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      category,
      risk_level,
      content_type,
      source,
      language,
      sort = 'published_at_desc',
      page = '1',
      pageSize = '20',
    } = req.query

    const lang = parseLang(req.query.lang, req)

    const pageNum = parseInt(page as string)
    const pageSizeNum = Math.min(parseInt(pageSize as string), 100)

    if (pageNum < 1 || pageSizeNum < 1) {
      throw new ApiError(400, 'page and pageSize must be greater than 0')
    }

    const offset = (pageNum - 1) * pageSizeNum

    // 查询用户画像
    const userProfile = await userRepo.findById(req.userId!)
    console.log(`[recommended] userId: ${req.userId}, profile:`, userProfile)
    // TODO: 根据 userProfile 实现个性化推荐逻辑
    // 例如：userProfile.risk_appetite 高 → 优先 risk_level: high
    //       userProfile.decision_speed 快 → 优先 category: tradable

    const contents = await contentRepo.findProcessed({
      category: category as any,
      risk_level: risk_level as any,
      content_type: content_type as any,
      source: source as string,
      language: language as string,
      limit: pageSizeNum,
      offset,
      lang,
    }, sort as any)

    const enriched = await enrichContents(contents)
    res.json(successResponse(enriched, { count: enriched.length, page: pageNum, pageSize: pageSizeNum, userId: req.userId }))
  })
)

export default router
