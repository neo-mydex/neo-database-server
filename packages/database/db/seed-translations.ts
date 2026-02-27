/**
 * 多语言翻译假数据 seed 脚本
 * 为 ai_processed_content 的 10 条内容各插入 en-US / ja-JP / ko-KR 三种翻译
 * 共 30 条，使用 ON CONFLICT DO UPDATE（幂等，可重复执行）
 */

import { connect, disconnect, client } from '@mydex/database'

interface Translation {
  content_id: string
  lang: 'en-US' | 'ja-JP' | 'ko-KR'
  title: string
  summary: string
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
    lang: 'en-US',
    title: 'Fed holds rates steady, crypto market briefly surges',
    summary: 'The Fed kept rates at 5.25%-5.50%, in line with expectations. Bitcoin briefly broke $68K before pulling back. Analysts say rate cuts remain possible if inflation continues to cool.',
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
    summary: 'FRBは政策金利を5.25%-5.50%に据え置いた。ビットコインは発表後に一時68,000ドルを突破したが、その後反落。インフレが改善すれば年内利下げの可能性も残る。',
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
    summary: '연준이 금리를 5.25%-5.50%로 동결했다. 비트코인은 발표 직후 일시적으로 6만 8천 달러를 돌파했다가 하락했다. 인플레이션이 계속 개선되면 연내 금리 인하 가능성도 남아있다.',
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
    lang: 'en-US',
    title: 'Solana ecosystem DEX volume hits $5B single-day record',
    summary: "On-chain data shows Solana's DEX ecosystem hit $5B in daily volume — an all-time high. Jupiter alone contributed ~60%. Analysts attribute the surge to meme coin mania driving retail inflows.",
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
    summary: 'チェーン上のデータによると、SolanaエコシステムのDEX取引量が1日50億ドルの過去最高を記録した。JupiterだけでAk60%を占めた。アナリストはミームコインブームによる個人投資家の流入が主因と分析している。',
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
    summary: '온체인 데이터에 따르면 Solana 생태계 DEX의 일일 거래량이 50억 달러 사상 최고치를 기록했다. Jupiter가 약 60%를 기여했으며, 애널리스트들은 밈 코인 열풍으로 인한 개인 투자자 유입을 주요 원인으로 분석했다.',
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
    lang: 'en-US',
    title: 'What is a liquidity pool? How do LP tokens earn money?',
    summary: 'A liquidity pool lets users deposit two tokens into a smart contract to earn trading fees as a Liquidity Provider (LP). You receive LP tokens representing your share. Withdrawing returns tokens at the current pool ratio — price changes cause impermanent loss.',
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
    summary: '流動性プールはDeFiの中核機能で、ユーザーが2種類のトークンをスマートコントラクトに預けると流動性提供者（LP）になり、取引手数料を得られる。LPトークンはプール内のシェアを表す。引き出し時に価格変動があると無常損失が発生する。',
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
    summary: '유동성 풀은 DeFi의 핵심 메커니즘으로, 두 종류의 토큰을 스마트 컨트랙트에 예치해 유동성 공급자(LP)가 되면 거래 수수료를 받을 수 있다. LP 토큰은 풀에서의 지분을 나타내며, 인출 시 가격 변동으로 비영구적 손실이 발생할 수 있다.',
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
    lang: 'en-US',
    title: 'What is a Gas Fee? Why can it get so expensive?',
    summary: 'Gas fees are paid to miners or validators for executing blockchain transactions. Ethereum fees spike during congestion — sometimes tens of dollars. Layer 2 solutions like Arbitrum and Optimism cut fees to under $0.01. Choosing the right chain and timing saves money.',
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
    summary: 'ガス代はブロックチェーン上の取引をマイナーや検証者が処理するために支払う手数料です。イーサリアムのガス代はネットワーク混雑時に数十ドルに達することがある。ArbitrumやOptimismなどのLayer2を使えば1セント未満に抑えられる。',
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
    summary: '가스비는 블록체인에서 거래를 처리하는 채굴자나 검증자에게 지급하는 수수료입니다. 이더리움은 혼잡 시 수십 달러까지 치솟을 수 있습니다. Arbitrum, Optimism 같은 레이어2를 이용하면 1센트 미만으로 줄일 수 있습니다.',
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
  // social_001 — KOL @CryptoWhale 看多 ETH
  // ============================================================
  {
    content_id: 'social_001',
    lang: 'en-US',
    title: 'KOL @CryptoWhale bullish on ETH, targets $5,000',
    summary: 'Top KOL @CryptoWhale is bullish on ETH with a $5,000 target, citing record on-chain accumulation and quiet institutional buying. Note: personal opinion, not financial advice.',
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
    summary: '有名KOL @CryptoWhaleはETHに対して強気で、目標価格を5,000ドルと設定。根拠はオンチェーンの蓄積データが過去最高水準にあり、機関投資家が静かに買い進めていること。個人的見解であり投資助言ではない。',
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
    summary: '유명 KOL @CryptoWhale이 ETH에 강세 전망을 내놓으며 목표가를 5,000달러로 제시했다. 근거는 온체인 누적 데이터가 사상 최고치이고 기관들이 조용히 매집 중이라는 것. 투자 조언이 아닌 개인 의견임에 유의.',
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
    lang: 'en-US',
    title: 'Telegram alert: BTC approaching critical support test at $65K',
    summary: 'Bitcoin is testing the $65,000 critical support level. A breakdown could push it toward $62,000. Holders are advised to set stop-losses and wait for confirmation before adding positions.',
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
    summary: 'ビットコインは65,000ドルの重要サポートラインをテスト中。割り込めば62,000ドルへの下落が予想される。保有者にはストップロスの設定と確認シグナルを待ってからの買い増しを推奨。',
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
    summary: '비트코인이 6만 5천 달러 핵심 지지선을 테스트하고 있다. 이탈 시 6만 2천 달러까지 하락 가능. 보유자는 손절 설정 후 확인 신호를 기다려 추가 매수할 것을 권장한다.',
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
  // social_003 — @SolanaInsider Jupiter 新功能
  // ============================================================
  {
    content_id: 'social_003',
    lang: 'en-US',
    title: "@SolanaInsider: Jupiter's new limit order feature is a game-changer",
    summary: 'KOL @SolanaInsider tested Jupiter\'s new limit order feature on Solana — fills in under 2 seconds. Long-term bullish on $JUP.',
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
    summary: 'KOL @SolanaInsiderがSolana上のJupiterの新しい指値注文機能を試用。2秒未満で約定し、DeFiの理想的な体験と絶賛。$JUPに長期的強気。',
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
    summary: 'KOL @SolanaInsider가 Solana의 Jupiter 새 지정가 주문 기능을 테스트했다. 2초 이내에 체결되어 DeFi가 이래야 한다고 극찬했으며, $JUP에 장기 강세 전망.',
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
    lang: 'en-US',
    title: 'Hong Kong SFC approves first batch of Ethereum spot ETF applications',
    summary: "Hong Kong's SFC has officially approved three asset managers to launch Ethereum spot ETFs, with trading expected as early as next month. ETH surged 4.2% within an hour of the announcement.",
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
    summary: '香港証券先物委員会（SFC）が3社の資産運用会社によるイーサリアム現物ETF申請を正式承認。最短で来月の上場が予定される。発表後1時間でETH価格は約4.2%上昇した。',
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
    summary: '홍콩 증권선물위원회(SFC)가 세 자산운용사의 이더리움 현물 ETF 신청을 공식 승인했다. 빠르면 다음 달 거래 시작 예정이며, 발표 후 1시간 내에 ETH 가격이 약 4.2% 상승했다.',
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
    lang: 'en-US',
    title: 'Perpetual contracts vs spot trading — what is the difference?',
    summary: 'Spot trading means owning real assets. Perpetual contracts are derivatives — you trade price exposure, not the asset itself, with options to go long, short, or use leverage. No expiry date; funding rates keep the contract price anchored to spot.',
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
    summary: '現物取引は本物の資産を直接売買する。無期限先物（パーペチュアル）はデリバティブで、資産そのものではなく価格の権利を取引する。ロング・ショート・レバレッジが可能。有効期限はなく、資金調達率で現物価格に連動する。',
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
    summary: '현물 거래는 실제 자산을 직접 사고파는 것. 무기한 선물(퍼페추얼)은 파생상품으로, 자산 자체가 아닌 가격 노출을 거래하며 롱·숏·레버리지가 가능하다. 만기일 없이 펀딩비로 현물 가격에 연동된다.',
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
  // social_004 — @DeFiResearch 巨鲸建仓 ARB
  // ============================================================
  {
    content_id: 'social_004',
    lang: 'en-US',
    title: '@DeFiResearch: On-chain data shows whales quietly accumulating ARB',
    summary: 'On-chain data reveals 3 whale wallets holding 50M+ USDC have quietly bought ~$12M worth of ARB over 48 hours — smart money moving ahead of a potential narrative.',
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
    summary: 'オンチェーンデータによると、5000万USDC以上を保有する3つのクジラウォレットが48時間以内に約1200万ドル分のARBを静かに買い集めた。特定のナラティブが広まる前にスマートマネーが動いている。',
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
    summary: '온체인 데이터에 따르면 5000만 USDC 이상을 보유한 고래 지갑 3개가 48시간 동안 약 1200만 달러 규모의 ARB을 조용히 매집했다. 내러티브가 확산되기 전에 스마트머니가 움직이고 있는 것으로 보인다.',
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
  console.log(`📊 共 ${translations.length} 条翻译（10 内容 × 3 语言）\n`)

  let successCount = 0
  let errorCount = 0

  for (const t of translations) {
    try {
      await client.query(
        `INSERT INTO ai_processed_content_translations
           (content_id, lang, title, summary, evidence_points, tags, suggested_questions, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (content_id, lang) DO UPDATE SET
           title = EXCLUDED.title,
           summary = EXCLUDED.summary,
           evidence_points = EXCLUDED.evidence_points,
           tags = EXCLUDED.tags,
           suggested_questions = EXCLUDED.suggested_questions,
           updated_at = NOW()`,
        [
          t.content_id,
          t.lang,
          t.title,
          t.summary,
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
