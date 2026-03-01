import { connect, disconnect, client } from '@mydex/database'
import rawData from '../docs/raw_content_sample.json'
import processedData from '../docs/processed_content_sample.json'
import userProfileData from '../docs/user_profiles_sample.json'
import chatbotSessionData from '../docs/chatbot_sessions_sample.json'

async function seed() {
  await connect()
  console.log('✅ 连接成功，开始写入假数据...\n')

  console.log('📥 写入 ai_raw_content...')
  for (const item of rawData) {
    await client.query(
      `INSERT INTO ai_raw_content
        (id, title, content_type, content, source, published_at, url, author, language, images, social_metrics)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        item.id,
        item.title,
        item.content_type,
        item.content,
        item.source,
        item.publishedAt,
        item.url ?? null,
        item.author ?? null,
        item.language ?? null,
        item.images ? JSON.stringify(item.images) : null,
        item.social_metrics ? JSON.stringify(item.social_metrics) : null,
      ]
    )
    console.log(`  插入: ${item.id}`)
  }

  console.log('\n📥 写入 ai_user_profiles...')
  for (const item of userProfileData) {
    await client.query(
      `INSERT INTO ai_user_profiles
        (user_id, risk_appetite, patience, info_sensitivity, decision_speed, cat_type, cat_desc, registered_at, trade_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO NOTHING`,
      [
        item.user_id,
        item.risk_appetite,
        item.patience,
        item.info_sensitivity,
        item.decision_speed,
        item.cat_type,
        item.cat_desc,
        item.registered_at,
        item.trade_count,
      ]
    )
    console.log(`  插入: ${item.user_id}`)
  }

  console.log('\n📥 写入 ai_processed_content...')
  for (const item of processedData) {
    await client.query(
      `INSERT INTO ai_processed_content
        (id, title, content_type, content, source, published_at, url, author, language, images, social_metrics,
         volatility, summary, evidence_points, suggested_questions, detected_language, category, risk_level, tags, suggested_tokens, overall_sentiment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       ON CONFLICT (id) DO NOTHING`,
      [
        item.id,
        item.title,
        item.content_type,
        item.content,
        item.source,
        item.publishedAt,
        item.url ?? null,
        item.author ?? null,
        item.language ?? null,
        item.images ? JSON.stringify(item.images) : null,
        item.social_metrics ? JSON.stringify(item.social_metrics) : null,
        item.volatility,
        item.summary,
        JSON.stringify(item.evidence_points),
        JSON.stringify(item.suggested_questions),
        item.detected_language,
        item.category,
        item.risk_level,
        JSON.stringify(item.tags),
        item.suggested_tokens ? JSON.stringify(item.suggested_tokens) : null,
        item.overall_sentiment ?? null,
      ]
    )
    console.log(`  插入: ${item.id}`)
  }

  console.log('\n📥 写入 ai_chatbot_sessions...')
  for (const item of chatbotSessionData) {
    await client.query(
      `INSERT INTO ai_chatbot_sessions
        (user_id, session_id, question, answer, question_verbose, answer_verbose, tools, client_actions, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
      [
        item.user_id,
        item.session_id,
        item.question,
        item.answer,
        item.question_verbose ? JSON.stringify(item.question_verbose) : null,
        item.answer_verbose ? JSON.stringify(item.answer_verbose) : null,
        item.tools ?? null,
        item.client_actions ?? null,
        item.created_at,
      ]
    )
    console.log(`  插入: [${item.session_id}] ${item.question.slice(0, 20)}...`)
  }

  console.log('\n🎉 完成！')
  await disconnect()
}

seed().catch(console.error)
