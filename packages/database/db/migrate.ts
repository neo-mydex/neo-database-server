import { connect, disconnect, client } from '@mydex/database'
import fs from 'fs'
import path from 'path'

async function migrate() {
  await connect()
  console.log('✅ 连接成功，开始执行 migration...\n')

  const files = [
    'migrations/001_create_ai_raw_content.sql',
    'migrations/002_create_ai_processed_content.sql',
    'migrations/003_create_ai_user_profiles.sql',
    'migrations/004_create_ai_processed_content_translations.sql',
    'migrations/005_create_ai_chatbot_sessions.sql',
    'migrations/006_chatbot_sessions_uuid_id.sql',
    'migrations/007_create_ai_cat_map.sql',
    'migrations/008_patch_ai_cat_map_insert.sql',
    'migrations/009_add_address_to_user_profiles.sql',
    'migrations/010_add_hotness_score_to_processed_content.sql',
  ]

  for (const file of files) {
    try {
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf-8')
      await client.query(sql)
      console.log(`  ✅ ${file}`)
    } catch (error: any) {
      // 忽略 "already exists" 错误
      if (error.message.includes('already exists')) {
        console.log(`  ⏭️  ${file} (已存在，跳过)`)
      } else {
        console.error(`  ❌ ${file}: ${error.message}`)
        // 继续执行其他文件
      }
    }
  }

  console.log('\n🎉 Migration 完成！')

  await disconnect()
}

migrate().catch(console.error)
