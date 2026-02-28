/**
 * 多语言翻译假数据 seed 脚本
 * 为 ai_processed_content 的 10 条内容各插入 zh-CN / en-US / ja-JP / ko-KR 四种翻译
 * 共 40 条，使用 ON CONFLICT DO UPDATE（幂等，可重复执行）
 */

import { connect, disconnect, client } from '@mydex/database'

interface Translation {
  content_id: string
  lang: 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'
  title: string
  summary: string
  content: string
  evidence_points: string[]
  tags: string[]
  suggested_questions: Array<{ label: string; action: string; payload: string }>
}

const translations: Translation[] = [
  // ============================================================
  // news_001 — 美联储维持利率不变
  // ============================================================
  {
    content_id: 'news_001',
    lang: 'zh-CN',
    title: '美联储宣布维持利率不变，加密市场短暂上涨',
    summary: '美联储维持利率不变，比特币短暂突破 6.8 万美元后回落。若通胀持续改善，年内降息仍有可能，市场情绪整体偏谨慎乐观。',
    content: '美联储周三宣布维持联邦基金利率在5.25%-5.50%区间不变，符合市场预期。声明发布后比特币短暂突破6.8万美元，随后回落至6.75万美元附近。分析师认为，若通胀数据持续回落，年内降息概率仍然存在。',
    evidence_points: [
      '利率维持在 5.25%-5.50%，符合市场预期，避免了超预期紧缩的恐慌',
      'BTC 价格在消息发布后快速拉升，说明市场已提前消化利好',
      '分析师提到年内降息概率仍存，为中期行情提供支撑',
    ],
    tags: ['宏观', '美联储', '利率', 'BTC', '利多'],
    suggested_questions: [
      { label: '降息对加密市场有什么影响？', action: 'chat', payload: '{"message":"降息对加密市场有什么影响？"}' },
      { label: '现在适合买入 BTC 吗？', action: 'chat', payload: '{"message":"现在适合买入比特币吗？"}' },
      { label: '查看 BTC 行情', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"BTC"}}' },
      { label: '我的资产', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'news_001',
    lang: 'en-US',
    title: 'Fed holds rates steady, crypto market briefly surges',
    summary: 'The Fed kept rates at 5.25%-5.50%, in line with expectations. Bitcoin briefly broke $68K before pulling back. Rate cuts remain possible if inflation continues to cool.',
    content: 'The Federal Reserve announced Wednesday it will hold the federal funds rate at 5.25%-5.50%, as expected. Bitcoin briefly broke $68,000 after the statement before retreating to around $67,500. Analysts say rate cuts remain possible this year if inflation continues to decline.',
    evidence_points: [
      'Rates held at 5.25%-5.50%, no surprise tightening — avoids panic selling',
      'BTC spiked immediately after the announcement, signaling pre-priced optimism',
      'Analysts still see room for rate cuts this year, supporting medium-term outlook',
    ],
    tags: ['Macro', 'Fed', 'Interest Rate', 'BTC', 'Bullish'],
    suggested_questions: [
      { label: 'How does a rate cut affect crypto?', action: 'chat', payload: '{"message":"How does a Fed rate cut affect the crypto market?"}' },
      { label: 'Is now a good time to buy BTC?', action: 'chat', payload: '{"message":"Is it a good time to buy Bitcoin now?"}' },
      { label: 'View BTC market', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"BTC"}}' },
      { label: 'My assets', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'news_001',
    lang: 'ja-JP',
    title: 'FRBが金利据え置きを発表、暗号資産市場が一時上昇',
    summary: 'FRBは政策金利を5.25%-5.50%に据え置いた。BTCは一時68,000ドルを突破したが反落。インフレ改善が続けば年内利下げの可能性も残る。',
    content: '米連邦準備制度理事会（FRB）は水曜日、政策金利を5.25%-5.50%に据え置くと発表した。市場予想通りの結果で、声明後にビットコインは一時68,000ドルを突破したが、その後67,500ドル付近まで反落した。',
    evidence_points: [
      '金利は5.25%-5.50%に据え置き、予想通りで市場の安心感につながった',
      'BTC価格は発表直後に急騰し、市場が楽観的に反応したことを示している',
      'アナリストは年内利下げの可能性を指摘しており、中期的な上昇余地を支持する',
    ],
    tags: ['マクロ', 'FRB', '金利', 'BTC', '強気'],
    suggested_questions: [
      { label: '利下げはなぜ暗号資産に有利？', action: 'chat', payload: '{"message":"FRBの利下げはなぜ暗号資産市場に有利なのですか？"}' },
      { label: '今BTCを買うべき？', action: 'chat', payload: '{"message":"今ビットコインを買うのは良いタイミングですか？"}' },
      { label: 'BTC相場を見る', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"BTC"}}' },
      { label: '私の資産', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'news_001',
    lang: 'ko-KR',
    title: '연준, 금리 동결 발표…비트코인 일시 68K 돌파',
    summary: '연준이 금리를 5.25%-5.50%로 동결했다. BTC는 발표 직후 68,000달러를 돌파했다가 하락했다. 인플레이션이 개선되면 연내 금리 인하 가능성도 남아있다.',
    content: '미 연방준비제도(연준)는 수요일 기준금리를 5.25%-5.50%로 동결한다고 발표했다. 시장 예상에 부합한 결과로, 성명 발표 후 비트코인이 일시적으로 68,000달러를 돌파했다가 67,500달러 부근으로 하락했다.',
    evidence_points: [
      '금리 동결은 시장 예상에 부합해 추가 긴축 우려를 해소했다',
      'BTC 가격이 발표 직후 급등해 시장의 낙관적 반응을 보여줬다',
      '애널리스트들은 연내 금리 인하 가능성을 언급하며 중기 상승 여지를 지지한다',
    ],
    tags: ['거시경제', '연준', '금리', 'BTC', '강세'],
    suggested_questions: [
      { label: '금리 인하가 암호화폐에 미치는 영향은?', action: 'chat', payload: '{"message":"연준 금리 인하가 암호화폐 시장에 어떤 영향을 미치나요?"}' },
      { label: '지금 BTC 매수 타이밍인가요?', action: 'chat', payload: '{"message":"지금 비트코인을 매수하기 좋은 타이밍인가요?"}' },
      { label: 'BTC 시세 보기', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"BTC"}}' },
      { label: '내 자산', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },

  // ============================================================
  // news_002 — Solana DEX 交易量突破 50 亿
  // ============================================================
  {
    content_id: 'news_002',
    lang: 'zh-CN',
    title: 'Solana 生态 DEX 交易量单日突破 50 亿美元',
    summary: 'Solana 生态 DEX 单日交易量突破 50 亿美元历史新高，Jupiter 贡献六成。此轮增长主要由 meme 币热潮驱动，散户活跃度显著上升。',
    content: '据链上数据显示，Solana 生态去中心化交易所昨日总交易量突破 50 亿美元，创历史新高。其中 Jupiter 贡献约 60% 的交易量。分析师认为此轮增长主要来自 meme 币热潮带动的散户涌入。',
    evidence_points: [
      '链上数据可直接验证，数据可信度高',
      'Jupiter 占比 60%，说明生态集中度较高，头部效应明显',
      'meme 币驱动意味着交易量可持续性存疑，需关注热度衰退风险',
    ],
    tags: ['Solana', 'DEX', '链上数据', 'JUP', '可交易'],
    suggested_questions: [
      { label: 'SOL 现在能买吗？', action: 'chat', payload: '{"message":"Solana 现在值得投资吗？"}' },
      { label: '什么是 DEX？', action: 'chat', payload: '{"message":"去中心化交易所和中心化交易所有什么区别？"}' },
      { label: '查看 SOL 行情', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"SOL"}}' },
      { label: '查看 JUP 行情', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"JUP"}}' },
    ],
  },
  {
    content_id: 'news_002',
    lang: 'en-US',
    title: 'Solana ecosystem DEX volume hits $5B single-day record',
    summary: "Solana's DEX ecosystem hit $5B in daily volume — an all-time high. Jupiter alone contributed ~60%. The surge is attributed to meme coin mania driving retail inflows.",
    content: "On-chain data shows Solana's DEX ecosystem reached $5 billion in daily trading volume, an all-time high. Jupiter accounted for approximately 60% of the volume. Analysts attribute the surge primarily to meme coin mania driving retail investor inflows.",
    evidence_points: [
      'On-chain data is directly verifiable, making the volume claim highly credible',
      "Jupiter's 60% share shows heavy concentration; the ecosystem's head-tail effect is strong",
      'Meme coin-driven volume raises sustainability questions — watch for hype cool-down risk',
    ],
    tags: ['Solana', 'DEX', 'On-chain Data', 'JUP', 'Tradable'],
    suggested_questions: [
      { label: 'Is SOL worth buying now?', action: 'chat', payload: '{"message":"Is Solana a good investment right now?"}' },
      { label: 'What is a DEX?', action: 'chat', payload: '{"message":"What is the difference between a DEX and a CEX?"}' },
      { label: 'View SOL market', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"SOL"}}' },
      { label: 'View JUP market', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"JUP"}}' },
    ],
  },
  {
    content_id: 'news_002',
    lang: 'ja-JP',
    title: 'SolanaエコシステムのDEX取引量が1日50億ドルの過去最高を記録',
    summary: 'SolanaエコシステムのDEX取引量が1日50億ドルの過去最高を記録した。JupiterだけでAk60%を占めた。ミームコインブームによる個人投資家の流入が主因とされている。',
    content: 'チェーン上のデータによると、Solanaエコシステムの分散型取引所の1日の取引量が50億ドルの過去最高を記録した。Jupiterだけで約60%を占め、アナリストはミームコインブームによる個人投資家の流入が主因と分析している。',
    evidence_points: [
      'オンチェーンデータは直接検証可能であり、信頼性が高い',
      'JupiterのAk60%シェアはエコシステムの集中度が高いことを示す',
      'ミームコイン主導の出来高は持続性に疑問符がつく',
    ],
    tags: ['Solana', 'DEX', 'オンチェーン', 'JUP', 'トレード可能'],
    suggested_questions: [
      { label: 'SOLは今買いですか？', action: 'chat', payload: '{"message":"Solanaは今投資する価値がありますか？"}' },
      { label: 'DEXとは何ですか？', action: 'chat', payload: '{"message":"分散型取引所と中央集権型取引所の違いは何ですか？"}' },
      { label: 'SOL相場を見る', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"SOL"}}' },
      { label: 'JUP相場を見る', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"JUP"}}' },
    ],
  },
  {
    content_id: 'news_002',
    lang: 'ko-KR',
    title: 'Solana 생태계 DEX 거래량, 하루 50억 달러 사상 최고',
    summary: 'Solana 생태계 DEX의 일일 거래량이 50억 달러 사상 최고치를 기록했다. Jupiter가 약 60%를 기여했으며, 밈 코인 열풍으로 인한 개인 투자자 유입이 주요 원인이다.',
    content: '온체인 데이터에 따르면 Solana 생태계 탈중앙화 거래소의 일일 거래량이 50억 달러 사상 최고치를 기록했다. Jupiter가 약 60%를 차지했으며, 애널리스트들은 밈 코인 열풍으로 인한 개인 투자자 유입이 주요 원인이라고 분석했다.',
    evidence_points: [
      '온체인 데이터는 직접 검증 가능해 신뢰도가 높다',
      'Jupiter의 60% 점유율은 생태계 집중도가 높음을 보여준다',
      '밈 코인 주도의 거래량 급증은 지속성에 의문이 남는다',
    ],
    tags: ['Solana', 'DEX', '온체인', 'JUP', '거래 가능'],
    suggested_questions: [
      { label: 'SOL 지금 매수할 만한가요?', action: 'chat', payload: '{"message":"솔라나는 지금 투자할 만한가요?"}' },
      { label: 'DEX가 뭔가요?', action: 'chat', payload: '{"message":"탈중앙화 거래소와 중앙화 거래소의 차이는 무엇인가요?"}' },
      { label: 'SOL 시세 보기', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"SOL"}}' },
      { label: 'JUP 시세 보기', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"JUP"}}' },
    ],
  },

  // ============================================================
  // edu_001 — 流动性池 & LP Token
  // ============================================================
  {
    content_id: 'edu_001',
    lang: 'zh-CN',
    title: '什么是流动性池？LP Token 怎么赚钱？',
    summary: '流动性池让用户把代币存入智能合约赚取手续费，但取出时若价格变化会产生无常损失。LP Token 代表你的池子份额。',
    content: '流动性池是 DeFi 的核心机制之一。用户将两种代币按比例存入智能合约，成为流动性提供者（LP），从而获得交易手续费分成。存入后你会收到 LP Token，代表你在池子里的份额。取出时按当前池子比例换回代币，若价格发生变化会产生无常损失。',
    evidence_points: [
      'LP 机制是 Uniswap、Curve 等主流 DEX 的核心运作方式',
      '无常损失是 LP 参与者最常被忽视的风险点',
      '手续费收益与无常损失之间的权衡决定了 LP 是否划算',
    ],
    tags: ['AI喵科普', 'DeFi', '流动性池', '新手入门', 'LP'],
    suggested_questions: [
      { label: '无常损失怎么计算？', action: 'chat', payload: '{"message":"无常损失是怎么计算的？举个例子"}' },
      { label: '哪些平台可以提供流动性？', action: 'chat', payload: '{"message":"在哪些平台可以做流动性提供者？"}' },
      { label: 'LP 收益高吗？', action: 'chat', payload: '{"message":"做流动性提供者的年化收益大概是多少？"}' },
      { label: '我的资产', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'edu_001',
    lang: 'en-US',
    title: 'What is a liquidity pool? How do LP tokens earn money?',
    summary: 'A liquidity pool lets users deposit two tokens into a smart contract to earn trading fees as an LP. You receive LP tokens representing your share. Price changes cause impermanent loss on withdrawal.',
    content: 'A liquidity pool is one of the core mechanisms of DeFi. Users deposit two tokens proportionally into a smart contract, becoming Liquidity Providers (LPs) and earning a share of trading fees. You receive LP tokens representing your share of the pool. When withdrawing, tokens are returned at the current pool ratio — price changes cause impermanent loss.',
    evidence_points: [
      'LP mechanics power Uniswap, Curve, and most major DEXs — it is battle-tested',
      'Impermanent loss is the most commonly overlooked risk for LP participants',
      'The trade-off between fee income and impermanent loss determines LP profitability',
    ],
    tags: ['DeFi Basics', 'DeFi', 'Liquidity Pool', 'Beginner', 'LP'],
    suggested_questions: [
      { label: 'How is impermanent loss calculated?', action: 'chat', payload: '{"message":"How is impermanent loss calculated? Give me an example."}' },
      { label: 'Which platforms support LP?', action: 'chat', payload: '{"message":"Which platforms can I provide liquidity on?"}' },
      { label: 'Is LP yield high?', action: 'chat', payload: '{"message":"What is the typical APY for being a liquidity provider?"}' },
      { label: 'My assets', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'edu_001',
    lang: 'ja-JP',
    title: '流動性プールとは？LPトークンはどうやって稼ぐ？',
    summary: '流動性プールはDeFiの中核機能で、ユーザーが2種類のトークンをスマートコントラクトに預けてLPになり取引手数料を得られる。引き出し時に価格変動があると無常損失が発生する。',
    content: '流動性プールはDeFiの中核メカニズムの一つです。ユーザーが2種類のトークンをスマートコントラクトに預けると流動性提供者（LP）になり、取引手数料を得られます。LPトークンはプール内のシェアを表します。引き出し時に価格変動があると無常損失が発生します。',
    evidence_points: [
      'LPの仕組みはUniswapやCurveなど主要DEXの中核で、実績が豊富',
      '無常損失はLP参加者が見落としがちな最大のリスク',
      '手数料収益と無常損失のトレードオフがLPの収益性を左右する',
    ],
    tags: ['DeFi入門', 'DeFi', '流動性プール', '初心者', 'LP'],
    suggested_questions: [
      { label: '無常損失の計算方法は？', action: 'chat', payload: '{"message":"無常損失はどのように計算しますか？具体例を教えてください。"}' },
      { label: 'どのプラットフォームで流動性を提供できる？', action: 'chat', payload: '{"message":"どのプラットフォームで流動性を提供できますか？"}' },
      { label: 'LP利回りは高い？', action: 'chat', payload: '{"message":"流動性提供者の年利は大体どのくらいですか？"}' },
      { label: '私の資産', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'edu_001',
    lang: 'ko-KR',
    title: '유동성 풀이란? LP 토큰으로 어떻게 수익을 얻나요?',
    summary: '유동성 풀은 두 토큰을 스마트 컨트랙트에 예치해 LP가 되어 거래 수수료를 받는 DeFi 메커니즘이다. 인출 시 가격 변동으로 비영구적 손실이 발생할 수 있다.',
    content: '유동성 풀은 DeFi의 핵심 메커니즘 중 하나입니다. 사용자가 두 종류의 토큰을 스마트 컨트랙트에 비율에 맞게 예치하면 유동성 공급자(LP)가 되어 거래 수수료를 받을 수 있습니다. LP 토큰은 풀에서의 지분을 나타내며, 인출 시 가격 변동으로 비영구적 손실이 발생할 수 있습니다.',
    evidence_points: [
      'LP 메커니즘은 Uniswap, Curve 등 주요 DEX의 핵심으로 검증된 방식이다',
      '비영구적 손실은 LP 참여자들이 가장 많이 간과하는 리스크다',
      '수수료 수익과 비영구적 손실의 트레이드오프가 LP 수익성을 결정한다',
    ],
    tags: ['DeFi 기초', 'DeFi', '유동성 풀', '초보자', 'LP'],
    suggested_questions: [
      { label: '비영구적 손실은 어떻게 계산하나요?', action: 'chat', payload: '{"message":"비영구적 손실은 어떻게 계산하나요? 예시를 들어주세요."}' },
      { label: '어떤 플랫폼에서 유동성을 공급할 수 있나요?', action: 'chat', payload: '{"message":"어떤 플랫폼에서 유동성을 공급할 수 있나요?"}' },
      { label: 'LP 수익률은 높은가요?', action: 'chat', payload: '{"message":"유동성 공급자의 연간 수익률은 보통 어느 정도인가요?"}' },
      { label: '내 자산', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },

  // ============================================================
  // edu_002 — Gas Fee
  // ============================================================
  {
    content_id: 'edu_002',
    lang: 'zh-CN',
    title: 'Gas Fee 是什么？为什么有时候那么贵？',
    summary: 'Gas Fee 是区块链交易的手续费，以太坊高峰期可能很贵。使用 Layer 2（如 Arbitrum、Optimism）可大幅降低成本。',
    content: 'Gas Fee 是在区块链上执行交易时支付给矿工或验证者的费用。以太坊的 Gas 价格由网络拥堵程度决定，高峰期可能高达数十美元。Layer 2 方案如 Arbitrum、Optimism 可将手续费降低至不足 1 美分。选择合适的链和时间可以大幅节省成本。',
    evidence_points: [
      'Gas 价格由网络拥堵程度决定，不是固定值',
      'Layer 2 通过批量打包交易降低单笔成本，技术上已成熟',
      '选对链和时间点可以节省大量手续费',
    ],
    tags: ['AI喵科普', 'Gas', 'Layer2', '以太坊', '新手入门'],
    suggested_questions: [
      { label: '怎么查当前 Gas 价格？', action: 'chat', payload: '{"message":"怎么查以太坊当前的 Gas 价格？"}' },
      { label: 'Arbitrum 和 Optimism 怎么选？', action: 'chat', payload: '{"message":"Arbitrum 和 Optimism 有什么区别？"}' },
      { label: '什么是 Layer 2？', action: 'chat', payload: '{"message":"Layer 2 是什么？和以太坊主网有什么关系？"}' },
      { label: '交易设置', action: 'component', payload: '{"type":"settings_card"}' },
    ],
  },
  {
    content_id: 'edu_002',
    lang: 'en-US',
    title: 'What is a Gas Fee? Why can it get so expensive?',
    summary: 'Gas fees are paid to miners or validators for executing blockchain transactions. Ethereum fees spike during congestion. Layer 2 solutions like Arbitrum cut fees to under $0.01.',
    content: 'Gas fees are paid to miners or validators for executing transactions on the blockchain. Ethereum gas prices are determined by network congestion and can reach tens of dollars during peak times. Layer 2 solutions like Arbitrum and Optimism can reduce fees to under $0.01. Choosing the right chain and timing saves significant costs.',
    evidence_points: [
      'Gas price is determined by network congestion — it is variable, not fixed',
      'Layer 2 batches transactions to reduce per-unit cost; the technology is mature',
      'Choosing the right chain and timing can save significant amounts on fees',
    ],
    tags: ['DeFi Basics', 'Gas', 'Layer2', 'Ethereum', 'Beginner'],
    suggested_questions: [
      { label: 'How do I check the current Gas price?', action: 'chat', payload: '{"message":"How can I check the current Ethereum Gas price?"}' },
      { label: 'Arbitrum vs Optimism — which to choose?', action: 'chat', payload: '{"message":"What is the difference between Arbitrum and Optimism?"}' },
      { label: 'What is Layer 2?', action: 'chat', payload: '{"message":"What is Layer 2 and how does it relate to Ethereum mainnet?"}' },
      { label: 'Transaction settings', action: 'component', payload: '{"type":"settings_card"}' },
    ],
  },
  {
    content_id: 'edu_002',
    lang: 'ja-JP',
    title: 'ガス代とは？なぜ高くなることがあるの？',
    summary: 'ガス代はブロックチェーン上の取引処理に支払う手数料。イーサリアムは混雑時に数十ドルに達することがある。Layer2を使えば1セント未満に抑えられる。',
    content: 'ガス代はブロックチェーン上の取引をマイナーや検証者が処理するために支払う手数料です。イーサリアムのガス価格はネットワーク混雑度によって決まり、高峰時は数十ドルに達することがあります。ArbitrumやOptimismなどのLayer2を使えば1セント未満に抑えられます。',
    evidence_points: [
      'ガス価格はネットワーク混雑度によって変動し、固定ではない',
      'Layer2は取引をバッチ処理してコストを削減する成熟した技術',
      '適切なチェーンとタイミングを選べばガス代を大幅に節約できる',
    ],
    tags: ['DeFi入門', 'ガス代', 'Layer2', 'イーサリアム', '初心者'],
    suggested_questions: [
      { label: '現在のガス代を確認する方法は？', action: 'chat', payload: '{"message":"イーサリアムの現在のガス代を確認する方法を教えてください。"}' },
      { label: 'ArbitrumとOptimismはどちらが良い？', action: 'chat', payload: '{"message":"ArbitrumとOptimismの違いは何ですか？"}' },
      { label: 'Layer2とは何ですか？', action: 'chat', payload: '{"message":"Layer2とは何ですか？イーサリアムメインネットとの関係は？"}' },
      { label: '取引設定', action: 'component', payload: '{"type":"settings_card"}' },
    ],
  },
  {
    content_id: 'edu_002',
    lang: 'ko-KR',
    title: '가스비란 무엇인가요? 왜 때로는 그렇게 비싼가요?',
    summary: '가스비는 블록체인 거래 처리에 지급하는 수수료. 이더리움은 혼잡 시 수십 달러까지 치솟을 수 있다. 레이어2를 이용하면 1센트 미만으로 줄일 수 있다.',
    content: '가스비는 블록체인에서 거래를 처리하는 채굴자나 검증자에게 지급하는 수수료입니다. 이더리움의 가스 가격은 네트워크 혼잡도에 따라 결정되며, 혼잡 시 수십 달러까지 치솟을 수 있습니다. Arbitrum, Optimism 같은 레이어2를 이용하면 1센트 미만으로 줄일 수 있습니다.',
    evidence_points: [
      '가스 가격은 네트워크 혼잡도에 따라 변동하며 고정 값이 아니다',
      '레이어2는 거래를 묶어 처리해 단위 비용을 낮추는 검증된 기술이다',
      '적절한 체인과 타이밍을 선택하면 가스비를 크게 절약할 수 있다',
    ],
    tags: ['DeFi 기초', '가스비', '레이어2', '이더리움', '초보자'],
    suggested_questions: [
      { label: '현재 가스비 확인 방법은?', action: 'chat', payload: '{"message":"이더리움 현재 가스 가격을 어떻게 확인하나요?"}' },
      { label: 'Arbitrum vs Optimism 뭐가 나은가요?', action: 'chat', payload: '{"message":"Arbitrum과 Optimism의 차이점은 무엇인가요?"}' },
      { label: '레이어2가 뭔가요?', action: 'chat', payload: '{"message":"레이어2란 무엇이며 이더리움 메인넷과 어떤 관계인가요?"}' },
      { label: '거래 설정', action: 'component', payload: '{"type":"settings_card"}' },
    ],
  },

  // ============================================================
  // social_001 — KOL @CryptoWhale 看多 ETH（原文英文）
  // ============================================================
  {
    content_id: 'social_001',
    lang: 'zh-CN',
    title: 'KOL @CryptoWhale 看多 ETH，目标价 5000 美元',
    summary: '知名 KOL @CryptoWhale 看多 ETH，目标价 5000 美元，理由是链上积累数据创新高且机构持续买入。需注意这是个人观点，不构成投资建议。',
    content: 'ETH 正在突破 6 个月的整理区间。链上积累数据创历史新高。机构正在悄悄建仓。目标价：Q1 前达到 5000 美元。这不是投资建议，请自行研究。',
    evidence_points: [
      '链上积累数据处于历史高位，是较强的看多信号',
      '机构持续买入是近期市场的重要叙事',
      'KOL 粉丝 52 万且获得认证，影响力较大，需警惕跟风情绪',
    ],
    tags: ['KOL观点', 'ETH', '看多', '可交易', '机构动向'],
    suggested_questions: [
      { label: 'ETH 现在值得买吗？', action: 'chat', payload: '{"message":"以太坊现在值得投资吗？"}' },
      { label: '查看 ETH 行情', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"ETH"}}' },
      { label: '什么是链上积累数据？', action: 'chat', payload: '{"message":"链上积累数据是什么指标？怎么看？"}' },
      { label: '我的持仓', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'social_001',
    lang: 'en-US',
    title: 'KOL @CryptoWhale bullish on ETH, targets $5,000',
    summary: 'Top KOL @CryptoWhale is bullish on ETH with a $5,000 target, citing record on-chain accumulation and quiet institutional buying. Personal opinion, not financial advice.',
    content: 'ETH breaking out of 6-month consolidation. On-chain accumulation at all-time highs. Institutions are quietly loading bags. My target: $5000 by Q1. Not financial advice but DYOR.',
    evidence_points: [
      'On-chain accumulation at all-time highs is a strong bullish signal',
      'Institutional buying is a key narrative driving the recent market',
      'KOL has 520K verified followers — significant influence, but beware of herd mentality',
    ],
    tags: ['KOL View', 'ETH', 'Bullish', 'Tradable', 'Institutional'],
    suggested_questions: [
      { label: 'Is ETH worth buying now?', action: 'chat', payload: '{"message":"Is Ethereum worth investing in right now?"}' },
      { label: 'View ETH market', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"ETH"}}' },
      { label: 'What is on-chain accumulation data?', action: 'chat', payload: '{"message":"What is on-chain accumulation data and how do I read it?"}' },
      { label: 'My portfolio', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'social_001',
    lang: 'ja-JP',
    title: 'KOL @CryptoWhaleがETHを強気視、目標価格5,000ドル',
    summary: '有名KOL @CryptoWhaleはETHに対して強気で、目標価格を5,000ドルと設定。オンチェーン蓄積が過去最高で機関が静かに買い進めている。個人的見解であり投資助言ではない。',
    content: 'ETHは6ヶ月の整理から抜け出している。オンチェーン蓄積は過去最高水準。機関が静かに買い集めている。目標：Q1までに5,000ドル。投資助言ではないが自分で調査を。',
    evidence_points: [
      'オンチェーン蓄積データが過去最高水準 — 強気シグナルとして信頼性が高い',
      '機関投資家の参入は最近の市場の重要な語り口',
      'KOLは52万人の認証フォロワーを持つ。影響力は大きいが追随ムードに注意',
    ],
    tags: ['KOLの見解', 'ETH', '強気', 'トレード可能', '機関投資家'],
    suggested_questions: [
      { label: 'ETHは今買いですか？', action: 'chat', payload: '{"message":"イーサリアムは今投資する価値がありますか？"}' },
      { label: 'ETH相場を見る', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"ETH"}}' },
      { label: 'オンチェーン蓄積データとは？', action: 'chat', payload: '{"message":"オンチェーン蓄積データとは何ですか？どう見るのですか？"}' },
      { label: '私のポートフォリオ', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'social_001',
    lang: 'ko-KR',
    title: 'KOL @CryptoWhale, ETH 강세 전망…목표가 5,000달러',
    summary: '유명 KOL @CryptoWhale이 ETH에 강세 전망을 내놓으며 목표가를 5,000달러로 제시했다. 온체인 누적 사상 최고치, 기관 매집이 근거다. 투자 조언이 아닌 개인 의견임에 유의.',
    content: 'ETH가 6개월간의 횡보를 돌파하고 있다. 온체인 누적 데이터 사상 최고치. 기관들이 조용히 매집 중. 목표: Q1까지 5,000달러. 투자 조언이 아니니 직접 조사하세요.',
    evidence_points: [
      '온체인 누적 데이터 사상 최고치 — 강력한 강세 신호로 신뢰도 높음',
      '기관 매집은 최근 시장의 핵심 내러티브',
      'KOL은 52만 인증 팔로워 보유 — 영향력이 크지만 군중심리에 주의',
    ],
    tags: ['KOL 의견', 'ETH', '강세', '거래 가능', '기관'],
    suggested_questions: [
      { label: '지금 ETH 살 만한가요?', action: 'chat', payload: '{"message":"이더리움은 지금 투자할 만한가요?"}' },
      { label: 'ETH 시세 보기', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"ETH"}}' },
      { label: '온체인 누적 데이터가 뭔가요?', action: 'chat', payload: '{"message":"온체인 누적 데이터란 무엇이며 어떻게 보나요?"}' },
      { label: '내 포트폴리오', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },

  // ============================================================
  // social_002 — BTC 关键支撑位考验
  // ============================================================
  {
    content_id: 'social_002',
    lang: 'zh-CN',
    title: 'Telegram 频道：BTC 即将面临关键支撑位考验',
    summary: 'BTC 正在测试 65000 美元关键支撑位，若跌破将下探 62000。建议持仓者设好止损，谨慎操作。',
    content: '比特币当前价格正在测试 65000 美元关键支撑，若跌破将下探 62000。建议持仓者设好止损，等待确认信号再加仓。',
    evidence_points: [
      '65000 美元是近期多次被验证的关键支撑位',
      '跌破关键支撑后通常会加速下行，止损设置合理',
      '来源为 Telegram 频道，非 KOL，可信度需打折扣',
    ],
    tags: ['BTC', '技术分析', '支撑位', '风险提示', '止损'],
    suggested_questions: [
      { label: 'BTC 跌破支撑怎么办？', action: 'chat', payload: '{"message":"BTC 跌破关键支撑位我该怎么操作？"}' },
      { label: '怎么设置止损？', action: 'chat', payload: '{"message":"如何在 MyDex 设置止损单？"}' },
      { label: '查看 BTC 行情', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"BTC"}}' },
      { label: '交易历史', action: 'component', payload: '{"type":"history_card"}' },
    ],
  },
  {
    content_id: 'social_002',
    lang: 'en-US',
    title: 'Telegram alert: BTC approaching critical support test at $65K',
    summary: 'Bitcoin is testing the $65,000 critical support level. A breakdown could push it toward $62,000. Holders are advised to set stop-losses and wait for confirmation before adding positions.',
    content: 'Bitcoin is currently testing the critical $65,000 support level. If it breaks down, the next target is $62,000. Holders are advised to set stop-losses and wait for a confirmation signal before adding positions.',
    evidence_points: [
      '$65K has been validated as key support multiple times in recent weeks',
      'Breaking key support typically accelerates downside — stop-loss advice is sound',
      'Source is a Telegram channel, not a KOL — credibility should be discounted',
    ],
    tags: ['BTC', 'Technical Analysis', 'Support Level', 'Risk Warning', 'Stop-Loss'],
    suggested_questions: [
      { label: 'What to do if BTC breaks support?', action: 'chat', payload: '{"message":"What should I do if BTC breaks the key support level?"}' },
      { label: 'How do I set a stop-loss?', action: 'chat', payload: '{"message":"How do I set a stop-loss order on MyDex?"}' },
      { label: 'View BTC market', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"BTC"}}' },
      { label: 'Trade history', action: 'component', payload: '{"type":"history_card"}' },
    ],
  },
  {
    content_id: 'social_002',
    lang: 'ja-JP',
    title: 'Telegramアラート：BTCが65,000ドルの重要サポートをテスト中',
    summary: 'BTCは65,000ドルの重要サポートラインをテスト中。割り込めば62,000ドルへの下落が予想される。保有者にはストップロスの設定を推奨。',
    content: 'ビットコインは現在65,000ドルの重要サポートラインをテスト中。割り込めば次のターゲットは62,000ドル。保有者はストップロスを設定し、確認シグナルを待ってから追加購入することを推奨。',
    evidence_points: [
      '65,000ドルは直近で何度も確認された重要サポートライン',
      'キーサポート割れ後は下落が加速しやすく、ストップロス設定は合理的',
      'ソースはTelegramチャンネルでKOLではない。信頼度は割り引く必要がある',
    ],
    tags: ['BTC', 'テクニカル分析', 'サポートライン', 'リスク警告', 'ストップロス'],
    suggested_questions: [
      { label: 'BTCがサポートを割ったらどうする？', action: 'chat', payload: '{"message":"BTCが重要なサポートラインを割ったらどうすればいいですか？"}' },
      { label: 'ストップロスの設定方法は？', action: 'chat', payload: '{"message":"MyDexでストップロス注文はどう設定しますか？"}' },
      { label: 'BTC相場を見る', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"BTC"}}' },
      { label: '取引履歴', action: 'component', payload: '{"type":"history_card"}' },
    ],
  },
  {
    content_id: 'social_002',
    lang: 'ko-KR',
    title: '텔레그램 알림: BTC, 6만 5천 달러 핵심 지지선 테스트 중',
    summary: 'BTC가 6만 5천 달러 핵심 지지선을 테스트하고 있다. 이탈 시 6만 2천 달러까지 하락 가능. 보유자는 손절 설정 후 확인 신호를 기다릴 것을 권장한다.',
    content: '비트코인이 현재 6만 5천 달러 핵심 지지선을 테스트하고 있다. 이탈 시 6만 2천 달러까지 하락 가능. 보유자는 손절 설정 후 확인 신호를 기다려 추가 매수할 것을 권장한다.',
    evidence_points: [
      '6만 5천 달러는 최근 여러 번 확인된 핵심 지지선이다',
      '핵심 지지선 이탈 후에는 하락이 가속화되는 경향이 있어 손절 설정이 합리적',
      '출처가 텔레그램 채널로 KOL이 아니므로 신뢰도를 낮춰서 봐야 한다',
    ],
    tags: ['BTC', '기술적 분석', '지지선', '위험 경고', '손절'],
    suggested_questions: [
      { label: 'BTC가 지지선을 이탈하면 어떻게 해야 하나요?', action: 'chat', payload: '{"message":"BTC가 핵심 지지선을 이탈하면 어떻게 대응해야 하나요?"}' },
      { label: '손절 설정 방법은?', action: 'chat', payload: '{"message":"MyDex에서 손절 주문은 어떻게 설정하나요?"}' },
      { label: 'BTC 시세 보기', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"BTC"}}' },
      { label: '거래 내역', action: 'component', payload: '{"type":"history_card"}' },
    ],
  },

  // ============================================================
  // social_003 — @SolanaInsider Jupiter 新功能（原文英文）
  // ============================================================
  {
    content_id: 'social_003',
    lang: 'zh-CN',
    title: '@SolanaInsider：Jupiter 新功能上线，体验拉满',
    summary: 'KOL @SolanaInsider 体验了 Jupiter 新限价单功能，成交速度不到 2 秒，对 JUP 长期看好。',
    content: '刚刚试用了 Solana 上 Jupiter 的新限价单功能。执行速度惊人，不到 2 秒就成交了。这才是 DeFi 该有的体验。长期看好 $JUP。',
    evidence_points: [
      '限价单功能是 DEX 的重要产品升级，降低了用户使用门槛',
      '2 秒成交速度具体可验证，具备说服力',
      '作者粉丝 9.5 万，具有一定影响力',
    ],
    tags: ['Solana', 'Jupiter', 'JUP', '产品更新', '看多'],
    suggested_questions: [
      { label: 'Jupiter 怎么用？', action: 'chat', payload: '{"message":"Jupiter 交易所怎么使用？"}' },
      { label: '查看 JUP 行情', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"JUP"}}' },
      { label: '限价单和市价单区别？', action: 'chat', payload: '{"message":"限价单和市价单有什么区别？"}' },
      { label: '查看 SOL 行情', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"SOL"}}' },
    ],
  },
  {
    content_id: 'social_003',
    lang: 'en-US',
    title: "@SolanaInsider: Jupiter's new limit order feature is a game-changer",
    summary: 'KOL @SolanaInsider tested Jupiter\'s new limit order feature on Solana — fills in under 2 seconds. Long-term bullish on $JUP.',
    content: 'Just tried Jupiter\'s new limit order feature on Solana. Execution speed is insane, filled in under 2 seconds. This is what DeFi should feel like. Bullish on $JUP long term.',
    evidence_points: [
      'Limit orders are a major UX upgrade for DEXs, lowering barriers for mainstream users',
      'Sub-2-second execution is specific and verifiable — a compelling data point',
      'Author has 95K followers with credible influence in the Solana ecosystem',
    ],
    tags: ['Solana', 'Jupiter', 'JUP', 'Product Update', 'Bullish'],
    suggested_questions: [
      { label: 'How do I use Jupiter?', action: 'chat', payload: '{"message":"How do I use the Jupiter exchange?"}' },
      { label: 'View JUP market', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"JUP"}}' },
      { label: 'Limit order vs market order?', action: 'chat', payload: '{"message":"What is the difference between a limit order and a market order?"}' },
      { label: 'View SOL market', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"SOL"}}' },
    ],
  },
  {
    content_id: 'social_003',
    lang: 'ja-JP',
    title: '@SolanaInsider：Jupiterの新機能で体験が一変',
    summary: 'KOL @SolanaInsiderがJupiterの新しい指値注文機能を試用。2秒未満で約定し絶賛。$JUPに長期的強気。',
    content: 'Solana上のJupiterの新しい指値注文機能を試してみた。実行速度が驚異的で、2秒未満で約定した。これがDeFiの理想的な体験。$JUPは長期的に強気。',
    evidence_points: [
      '指値注文機能はDEXの重要なUX改善で、一般ユーザーの敷居を下げる',
      '2秒未満の約定速度は具体的かつ検証可能な説得力あるデータ',
      'フォロワー9.5万人でSolanaエコシステムへの影響力は信頼性がある',
    ],
    tags: ['Solana', 'Jupiter', 'JUP', '製品アップデート', '強気'],
    suggested_questions: [
      { label: 'Jupiterの使い方は？', action: 'chat', payload: '{"message":"Jupiter取引所はどうやって使いますか？"}' },
      { label: 'JUP相場を見る', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"JUP"}}' },
      { label: '指値注文と成行注文の違い？', action: 'chat', payload: '{"message":"指値注文と成行注文の違いは何ですか？"}' },
      { label: 'SOL相場を見る', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"SOL"}}' },
    ],
  },
  {
    content_id: 'social_003',
    lang: 'ko-KR',
    title: '@SolanaInsider: Jupiter 새 기능 출시, 체험 만점',
    summary: 'KOL @SolanaInsider가 Jupiter 새 지정가 주문 기능을 테스트했다. 2초 이내에 체결되어 극찬했으며, $JUP에 장기 강세 전망.',
    content: 'Solana의 Jupiter 새 지정가 주문 기능을 방금 시험해봤다. 실행 속도가 엄청나서 2초 이내에 체결됐다. 이게 DeFi가 되어야 할 모습이다. $JUP 장기 강세.',
    evidence_points: [
      '지정가 주문 기능은 DEX의 중요한 UX 개선으로 일반 사용자 진입 장벽을 낮춘다',
      '2초 미만 체결 속도는 구체적이고 검증 가능한 설득력 있는 데이터다',
      '팔로워 9.5만 명으로 Solana 생태계에서 신뢰할 만한 영향력을 보유한다',
    ],
    tags: ['Solana', 'Jupiter', 'JUP', '제품 업데이트', '강세'],
    suggested_questions: [
      { label: 'Jupiter 사용법은?', action: 'chat', payload: '{"message":"Jupiter 거래소는 어떻게 사용하나요?"}' },
      { label: 'JUP 시세 보기', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"JUP"}}' },
      { label: '지정가와 시장가 주문 차이는?', action: 'chat', payload: '{"message":"지정가 주문과 시장가 주문의 차이는 무엇인가요?"}' },
      { label: 'SOL 시세 보기', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"SOL"}}' },
    ],
  },

  // ============================================================
  // news_003 — 香港 ETH 现货 ETF
  // ============================================================
  {
    content_id: 'news_003',
    lang: 'zh-CN',
    title: '香港证监会批准首批以太坊现货 ETF 申请',
    summary: '香港证监会批准首批以太坊现货 ETF，ETH 价格一小时内涨 4.2%。这是继比特币 ETF 之后的重要里程碑，有望吸引更多机构资金入场。',
    content: '香港证监会今日正式批准三家资产管理公司提交的以太坊现货 ETF 申请，预计最快下月上市交易。此消息被市场解读为重大利好，ETH 价格在消息公布后一小时内上涨约 4.2%。',
    evidence_points: [
      '监管层批准是强力利多信号，直接打开机构合规入场通道',
      'ETH 价格快速反应 4.2%，市场情绪积极',
      '香港作为亚洲金融中心，对亚太地区机构资金有示范效应',
    ],
    tags: ['ETH', 'ETF', '香港', '机构', '重大利好', '可交易'],
    suggested_questions: [
      { label: 'ETF 对 ETH 价格影响多大？', action: 'chat', payload: '{"message":"以太坊现货 ETF 获批对价格的影响有多大？"}' },
      { label: '查看 ETH 行情', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"ETH"}}' },
      { label: '什么是现货 ETF？', action: 'chat', payload: '{"message":"加密货币现货 ETF 是什么？和期货 ETF 有什么区别？"}' },
      { label: '我的资产', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'news_003',
    lang: 'en-US',
    title: 'Hong Kong SFC approves first batch of Ethereum spot ETF applications',
    summary: "Hong Kong's SFC has officially approved three asset managers to launch Ethereum spot ETFs, with trading expected as early as next month. ETH surged 4.2% within an hour of the announcement.",
    content: "Hong Kong's Securities and Futures Commission today officially approved three asset management companies to launch Ethereum spot ETFs, with trading expected to begin as early as next month. The market interpreted this as a major bullish catalyst, with ETH rising approximately 4.2% within one hour of the announcement.",
    evidence_points: [
      'Regulatory approval is a strong bullish catalyst, opening the door for compliant institutional entry',
      'ETH price reacted quickly with a 4.2% gain, showing positive market sentiment',
      "Hong Kong as Asia's financial hub has a demonstration effect on institutional capital flows across Asia-Pacific",
    ],
    tags: ['ETH', 'ETF', 'Hong Kong', 'Institutional', 'Major Catalyst', 'Tradable'],
    suggested_questions: [
      { label: 'How much will an ETF affect ETH price?', action: 'chat', payload: '{"message":"How significant is the impact of an Ethereum spot ETF approval on price?"}' },
      { label: 'View ETH market', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"ETH"}}' },
      { label: 'What is a spot ETF?', action: 'chat', payload: '{"message":"What is a crypto spot ETF? How is it different from a futures ETF?"}' },
      { label: 'My assets', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'news_003',
    lang: 'ja-JP',
    title: '香港証監会、初のイーサリアム現物ETFを承認',
    summary: '香港SFCが3社の資産運用会社によるETH現物ETF申請を正式承認。最短で来月上場予定。発表後1時間でETHが約4.2%上昇した。',
    content: '香港証券先物委員会（SFC）は本日、3社の資産運用会社が提出したイーサリアム現物ETF申請を正式に承認した。最短で来月に取引が開始される見通しで、ETH価格は発表後1時間で約4.2%上昇した。',
    evidence_points: [
      '規制当局の承認は強力な強気触媒で、機関投資家の合規参入への扉を開く',
      '発表後1時間でETHが4.2%上昇し、市場の肯定的な反応を示した',
      'アジアの金融センターとしての香港は、アジア太平洋の機関マネーに対して先例効果を持つ',
    ],
    tags: ['ETH', 'ETF', '香港', '機関投資家', '重大触媒', 'トレード可能'],
    suggested_questions: [
      { label: 'ETFはETH価格にどれほど影響する？', action: 'chat', payload: '{"message":"イーサリアム現物ETF承認は価格にどれほど影響しますか？"}' },
      { label: 'ETH相場を見る', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"ETH"}}' },
      { label: '現物ETFとは？', action: 'chat', payload: '{"message":"暗号資産の現物ETFとは何ですか？先物ETFとの違いは？"}' },
      { label: '私の資産', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'news_003',
    lang: 'ko-KR',
    title: '홍콩 증권선물위원회, 첫 이더리움 현물 ETF 승인',
    summary: '홍콩 SFC가 세 자산운용사의 ETH 현물 ETF 신청을 공식 승인했다. 빠르면 다음 달 거래 시작 예정. 발표 후 1시간 내에 ETH가 약 4.2% 상승했다.',
    content: '홍콩 증권선물위원회(SFC)가 오늘 세 자산운용사의 이더리움 현물 ETF 신청을 공식 승인했다. 빠르면 다음 달 거래가 시작될 전망이며, ETH 가격은 발표 후 1시간 내에 약 4.2% 상승했다.',
    evidence_points: [
      '규제 승인은 강력한 상승 촉매로, 기관 투자자의 합법적 진입 통로를 열었다',
      '발표 후 1시간 내 ETH 4.2% 상승은 시장의 긍정적 반응을 보여준다',
      '아시아 금융 허브인 홍콩은 아시아태평양 기관 자금에 선례 효과를 갖는다',
    ],
    tags: ['ETH', 'ETF', '홍콩', '기관', '주요 촉매', '거래 가능'],
    suggested_questions: [
      { label: 'ETF가 ETH 가격에 얼마나 영향을 미치나요?', action: 'chat', payload: '{"message":"이더리움 현물 ETF 승인이 가격에 얼마나 영향을 미치나요?"}' },
      { label: 'ETH 시세 보기', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"ETH"}}' },
      { label: '현물 ETF가 뭔가요?', action: 'chat', payload: '{"message":"암호화폐 현물 ETF란 무엇인가요? 선물 ETF와 차이점은?"}' },
      { label: '내 자산', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },

  // ============================================================
  // edu_003 — 永续合约 vs 现货
  // ============================================================
  {
    content_id: 'edu_003',
    lang: 'zh-CN',
    title: '永续合约和现货有什么区别？',
    summary: '永续合约是衍生品，可做多做空还能加杠杆，但风险远高于现货。通过资金费率锚定现货价格，没有到期日。',
    content: '现货交易是直接买卖真实资产，你持有的是真正的代币。永续合约是一种衍生品，你交易的是价格合约而非资产本身，可以做多也可以做空，还可以加杠杆放大收益（同时也放大风险）。永续合约没有到期日，通过资金费率机制让合约价格锚定现货价格。',
    evidence_points: [
      '永续合约允许做空，是对冲现货持仓风险的常用工具',
      '杠杆放大收益的同时等比放大损失，新手需谨慎',
      '资金费率机制是永续合约价格锚定的核心，理解它有助于判断市场多空情绪',
    ],
    tags: ['AI喵科普', '永续合约', '杠杆', '新手入门', '风险提示'],
    suggested_questions: [
      { label: '杠杆怎么用才安全？', action: 'chat', payload: '{"message":"加杠杆交易有哪些风险控制技巧？"}' },
      { label: '什么是资金费率？', action: 'chat', payload: '{"message":"永续合约的资金费率是什么？怎么影响我的收益？"}' },
      { label: '现货和合约哪个适合新手？', action: 'chat', payload: '{"message":"我是新手，应该从现货还是合约开始？"}' },
      { label: '交易设置', action: 'component', payload: '{"type":"settings_card"}' },
    ],
  },
  {
    content_id: 'edu_003',
    lang: 'en-US',
    title: 'Perpetual contracts vs spot trading — what is the difference?',
    summary: 'Spot trading means owning real assets. Perpetual contracts are derivatives — you trade price exposure with options to go long, short, or use leverage. No expiry date; funding rates keep prices anchored to spot.',
    content: 'Spot trading means directly buying and selling real assets — you hold the actual tokens. Perpetual contracts are derivatives where you trade price contracts rather than the assets themselves. You can go long, short, or use leverage. There is no expiry date; the funding rate mechanism keeps contract prices anchored to spot prices.',
    evidence_points: [
      'Perps allow shorting — a common tool for hedging spot holdings against downside',
      'Leverage amplifies both gains and losses proportionally — caution advised for beginners',
      'Understanding funding rates is key to reading market sentiment and managing perp positions',
    ],
    tags: ['DeFi Basics', 'Perpetual Contract', 'Leverage', 'Beginner', 'Risk Warning'],
    suggested_questions: [
      { label: 'How to use leverage safely?', action: 'chat', payload: '{"message":"What are the risk management tips for leveraged trading?"}' },
      { label: 'What is a funding rate?', action: 'chat', payload: '{"message":"What is the funding rate in perpetual contracts and how does it affect my returns?"}' },
      { label: 'Spot or perps for beginners?', action: 'chat', payload: '{"message":"I am a beginner — should I start with spot or perpetual contracts?"}' },
      { label: 'Transaction settings', action: 'component', payload: '{"type":"settings_card"}' },
    ],
  },
  {
    content_id: 'edu_003',
    lang: 'ja-JP',
    title: '無期限先物と現物取引の違いは？',
    summary: '現物取引は本物の資産を売買する。無期限先物はデリバティブで、ロング・ショート・レバレッジが可能。有効期限はなく資金調達率で現物価格に連動する。',
    content: '現物取引は実際の資産を直接売買するもので、本物のトークンを保有します。無期限先物はデリバティブで、資産そのものではなく価格合約を取引します。ロング・ショート・レバレッジが可能で、有効期限はなく、資金調達率で現物価格に連動します。',
    evidence_points: [
      '無期限先物はショートが可能で、現物保有のリスクヘッジによく使われる',
      'レバレッジは収益も損失も等倍で拡大する。初心者は慎重に',
      '資金調達率の理解は市場センチメントを読む上で重要',
    ],
    tags: ['DeFi入門', '無期限先物', 'レバレッジ', '初心者', 'リスク警告'],
    suggested_questions: [
      { label: 'レバレッジを安全に使う方法は？', action: 'chat', payload: '{"message":"レバレッジ取引のリスク管理のコツを教えてください。"}' },
      { label: '資金調達率とは？', action: 'chat', payload: '{"message":"無期限先物の資金調達率とは何ですか？収益にどう影響しますか？"}' },
      { label: '初心者は現物と先物どちらから？', action: 'chat', payload: '{"message":"初心者は現物取引から始めるべきですか、それとも先物ですか？"}' },
      { label: '取引設定', action: 'component', payload: '{"type":"settings_card"}' },
    ],
  },
  {
    content_id: 'edu_003',
    lang: 'ko-KR',
    title: '무기한 선물 vs 현물 거래, 차이가 뭔가요?',
    summary: '현물 거래는 실제 자산을 직접 사고파는 것. 무기한 선물은 파생상품으로 롱·숏·레버리지가 가능하다. 만기일 없이 펀딩비로 현물 가격에 연동된다.',
    content: '현물 거래는 실제 자산을 직접 사고파는 것으로, 실제 토큰을 보유하게 됩니다. 무기한 선물(퍼페추얼)은 파생상품으로, 자산 자체가 아닌 가격 계약을 거래합니다. 롱·숏·레버리지가 가능하며, 만기일 없이 펀딩비로 현물 가격에 연동됩니다.',
    evidence_points: [
      '무기한 선물은 숏이 가능해 현물 보유 포지션의 헤지 도구로 자주 쓰인다',
      '레버리지는 수익과 손실을 동일 비율로 확대한다. 초보자는 주의가 필요하다',
      '펀딩비 이해는 시장 심리를 읽고 선물 포지션을 관리하는 핵심이다',
    ],
    tags: ['DeFi 기초', '무기한 선물', '레버리지', '초보자', '위험 경고'],
    suggested_questions: [
      { label: '레버리지를 안전하게 쓰는 방법은?', action: 'chat', payload: '{"message":"레버리지 거래의 리스크 관리 팁을 알려주세요."}' },
      { label: '펀딩비가 뭔가요?', action: 'chat', payload: '{"message":"무기한 선물의 펀딩비란 무엇이며 수익에 어떤 영향을 미치나요?"}' },
      { label: '초보는 현물과 선물 중 어디서 시작해야?', action: 'chat', payload: '{"message":"초보자는 현물 거래부터 시작해야 하나요, 아니면 선물인가요?"}' },
      { label: '거래 설정', action: 'component', payload: '{"type":"settings_card"}' },
    ],
  },

  // ============================================================
  // social_004 — @DeFiResearch 巨鲸建仓 ARB（原文英文）
  // ============================================================
  {
    content_id: 'social_004',
    lang: 'zh-CN',
    title: '@DeFiResearch：链上数据显示巨鲸正在悄悄建仓',
    summary: '链上数据显示三个巨鲸钱包在 48 小时内悄悄买入约 1200 万美元的 ARB，疑似提前布局某个叙事。',
    content: '链上预警：3 个持有 5000 万以上 USDC 的钱包在过去 48 小时内开始积累 $ARB。总买入量约 1200 万美元。叙事还没发酵，聪明钱已在悄悄行动。',
    evidence_points: [
      '链上数据可公开验证，可信度较高',
      '三个持有 5000 万以上 USDC 的钱包同步行动，协同性强',
      '1200 万美元的买入规模对 ARB 流动性而言属于大额建仓',
    ],
    tags: ['ARB', '巨鲸动向', '链上数据', '可交易', '建仓信号'],
    suggested_questions: [
      { label: 'ARB 最近有什么利好？', action: 'chat', payload: '{"message":"Arbitrum 最近有什么重要消息或催化剂？"}' },
      { label: '查看 ARB 行情', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"ARB"}}' },
      { label: '怎么追踪巨鲸动向？', action: 'chat', payload: '{"message":"有什么工具可以追踪链上巨鲸的动向？"}' },
      { label: '我的持仓', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'social_004',
    lang: 'en-US',
    title: '@DeFiResearch: On-chain data shows whales quietly accumulating ARB',
    summary: 'On-chain data reveals 3 whale wallets holding 50M+ USDC have quietly bought ~$12M worth of ARB over 48 hours — smart money moving ahead of a potential narrative.',
    content: 'On-chain alert: 3 wallets holding 50M+ USDC have started accumulating $ARB over the past 48 hours. Total bought: ~$12M worth. Smart money moving quietly before the narrative catches on.',
    evidence_points: [
      'On-chain data is publicly verifiable, making this a high-credibility signal',
      'Three wallets with 50M+ USDC acting in sync suggests coordinated accumulation',
      '$12M in ARB buys is a large position relative to ARB\'s typical daily liquidity',
    ],
    tags: ['ARB', 'Whale Activity', 'On-chain Data', 'Tradable', 'Accumulation Signal'],
    suggested_questions: [
      { label: 'Any recent catalysts for ARB?', action: 'chat', payload: '{"message":"What are the recent news or catalysts for Arbitrum?"}' },
      { label: 'View ARB market', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"ARB"}}' },
      { label: 'How to track whale movements?', action: 'chat', payload: '{"message":"What tools can I use to track on-chain whale activity?"}' },
      { label: 'My portfolio', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'social_004',
    lang: 'ja-JP',
    title: '@DeFiResearch：オンチェーンデータがクジラの静かな買い集めを示す',
    summary: 'オンチェーンデータによると5000万USDC以上保有の3クジラが48時間で約1200万ドル分のARBを静かに買い集めた。ナラティブが広まる前にスマートマネーが動いている。',
    content: 'オンチェーンアラート：5000万USDC以上を保有する3つのウォレットが過去48時間でARBを積み上げ始めた。合計買い付け額は約1200万ドル。ナラティブが広まる前にスマートマネーが静かに動いている。',
    evidence_points: [
      'オンチェーンデータは公開検証が可能で信頼性が高い',
      '5000万USDC以上の3つのウォレットが協調行動しており、組織的な買い集めを示唆',
      '1200万ドルの買いはARBの通常の日次流動性に対して大規模なポジション',
    ],
    tags: ['ARB', 'クジラ動向', 'オンチェーン', 'トレード可能', '蓄積シグナル'],
    suggested_questions: [
      { label: 'ARBに最近の材料は？', action: 'chat', payload: '{"message":"Arbitrumに関する最近のニュースや触媒は何ですか？"}' },
      { label: 'ARB相場を見る', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"ARB"}}' },
      { label: 'クジラの動向を追跡するには？', action: 'chat', payload: '{"message":"オンチェーンのクジラ動向を追跡するツールを教えてください。"}' },
      { label: '私のポートフォリオ', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
  {
    content_id: 'social_004',
    lang: 'ko-KR',
    title: '@DeFiResearch: 온체인 데이터, 고래들이 ARB 조용히 매집 중',
    summary: '온체인 데이터에 따르면 5000만 USDC 이상 보유 고래 지갑 3개가 48시간 동안 약 1200만 달러 규모의 ARB을 조용히 매집했다. 내러티브 확산 전에 스마트머니가 움직이고 있다.',
    content: '온체인 경보: 5000만 USDC 이상을 보유한 지갑 3개가 지난 48시간 동안 $ARB를 매집하기 시작했다. 총 매수액 약 1200만 달러. 내러티브가 퍼지기 전에 스마트머니가 조용히 움직이고 있다.',
    evidence_points: [
      '온체인 데이터는 공개적으로 검증 가능해 신뢰도가 높다',
      '5000만 USDC 이상 보유한 지갑 3개가 동시에 움직여 조직적 매집을 시사한다',
      '1200만 달러 ARB 매수는 ARB의 일반적인 일일 유동성 대비 대규모 포지션이다',
    ],
    tags: ['ARB', '고래 동향', '온체인', '거래 가능', '매집 신호'],
    suggested_questions: [
      { label: 'ARB 최근 호재가 있나요?', action: 'chat', payload: '{"message":"Arbitrum 관련 최근 뉴스나 촉매제는 무엇인가요?"}' },
      { label: 'ARB 시세 보기', action: 'component', payload: '{"type":"trade_card","params":{"symbol":"ARB"}}' },
      { label: '고래 동향 추적 방법은?', action: 'chat', payload: '{"message":"온체인 고래 동향을 추적할 수 있는 도구가 있나요?"}' },
      { label: '내 포트폴리오', action: 'component', payload: '{"type":"assets_card"}' },
    ],
  },
]

async function seedTranslations() {
  await connect()
  console.log('✅ 连接成功，开始写入翻译假数据...\n')
  console.log(`📊 共 ${translations.length} 条翻译（10 内容 × 4 语言）\n`)

  let successCount = 0
  let errorCount = 0

  for (const t of translations) {
    try {
      await client.query(
        `INSERT INTO ai_processed_content_translations
           (content_id, lang, title, summary, content, evidence_points, tags, suggested_questions, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (content_id, lang) DO UPDATE SET
           title = EXCLUDED.title,
           summary = EXCLUDED.summary,
           content = EXCLUDED.content,
           evidence_points = EXCLUDED.evidence_points,
           tags = EXCLUDED.tags,
           suggested_questions = EXCLUDED.suggested_questions,
           updated_at = NOW()`,
        [
          t.content_id,
          t.lang,
          t.title,
          t.summary,
          t.content,
          JSON.stringify(t.evidence_points),
          JSON.stringify(t.tags),
          JSON.stringify(t.suggested_questions),
        ]
      )
      console.log(`  ✅ ${t.content_id} [${t.lang}]`)
      successCount++
    } catch (err: any) {
      console.error(`  ❌ ${t.content_id} [${t.lang}]: ${err.message}`)
      errorCount++
    }
  }

  console.log(`\n🎉 完成！成功 ${successCount} 条，失败 ${errorCount} 条`)
  await disconnect()
}

seedTranslations().catch(console.error)
