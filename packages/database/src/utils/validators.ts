/**
 * 验证工具
 * 用于验证区块链代号和代币地址格式
 */

/**
 * 支持的区块链代号集合
 */
const VALID_CHAINS = new Set<ChainCode>([
  'eth',      // Ethereum
  'sol',      // Solana
  'bsc',      // BNB Smart Chain
  'polygon',  // Polygon
  'avax',     // Avalanche
  'base',     // Coinbase Base
  'op',       // Optimism
  'arb',      // Arbitrum
  'ftm',      // Fantom
  'movr',     // Moonriver
  'glm',      // Moonbeam
  'aurora',   // Aurora
  'metis',    // Metis
  'bnb',      // BNB Chain (旧)
  'cro',      // Cronos
])

/**
 * 支持的区块链代号类型
 */
export type ChainCode =
  | 'eth'      // Ethereum
  | 'sol'      // Solana
  | 'bsc'      // BNB Smart Chain
  | 'polygon'  // Polygon
  | 'avax'     // Avalanche
  | 'base'     // Coinbase Base
  | 'op'       // Optimism
  | 'arb'      // Arbitrum
  | 'ftm'      // Fantom
  | 'movr'     // Moonriver
  | 'glm'      // Moonbeam
  | 'aurora'   // Aurora
  | 'metis'    // Metis
  | 'bnb'      // BNB Chain (旧)
  | 'cro'      // Cronos

/**
 * 验证区块链代号
 * @param chain 区块链代号
 * @returns 是否有效
 */
export function isValidChain(chain: string | null | undefined): boolean {
  if (chain === null || chain === undefined) return true
  if (typeof chain !== 'string') return false
  return VALID_CHAINS.has(chain.toLowerCase() as ChainCode)
}

/**
 * 验证代币地址格式
 * @param address 代币地址
 * @param chain 区块链代号（可选，用于确定验证规则）
 * @returns 是否有效
 */
export function isValidTokenAddress(
  address: string | null | undefined,
  chain?: string | null
): boolean {
  // 空值视为有效（可选字段）
  if (address === null || address === undefined) return true
  if (typeof address !== 'string') return false

  // 根据链类型验证
  if (chain) {
    const normalizedChain = chain.toLowerCase() as ChainCode

    // Solana: base58 编码，32-44位
    if (normalizedChain === 'sol') {
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
    }

    // EVM 链: 0x开头, 40位 hex
    if (VALID_CHAINS.has(normalizedChain)) {
      return /^0x[a-fA-F0-9]{40}$/.test(address)
    }
  }

  // 未指定链时，尝试自动检测
  // EVM 地址格式
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return true
  // Solana 地址格式（base58, 32-44位）
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return true

  return false
}
