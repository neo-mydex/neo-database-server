#!/bin/bash

# MyDex Database Server API 测试脚本
# 使用 curl 测试所有端点

BASE_URL="http://localhost:3000"

echo "=========================================="
echo "  MyDex Database Server API 测试"
echo "=========================================="
echo ""

# 1. 健康检查
echo "1. 健康检查"
curl -s "${BASE_URL}/health" | jq '.'
echo ""

# 2. 获取处理后内容列表
echo "2. 获取处理后内容列表 (前3条)"
curl -s "${BASE_URL}/api/contents/processed?page=1&pageSize=3" | jq '.data.data[] | {id, title, category, risk_level}'
echo ""

# 3. 获取单条内容
echo "3. 获取单条内容详情 (news_001)"
curl -s "${BASE_URL}/api/contents/processed/news_001" | jq '.data.data | {title, summary, tags}'
echo ""

# 4. 按分类获取
echo "4. 按分类获取 (tradable)"
curl -s "${BASE_URL}/api/contents/category/tradable?page=1&pageSize=2" | jq '.data.data[] | {title, category}'
echo ""

# 5. 按风险等级获取
echo "5. 按风险等级获取 (medium)"
curl -s "${BASE_URL}/api/contents/risk/medium?page=1&pageSize=2" | jq '.data.data[] | {title, risk_level}'
echo ""

# 6. 创建用户
echo "6. 创建用户"
USER_ID="test_user_$(date +%s)"
curl -s -X POST "${BASE_URL}/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"${USER_ID}\",
    \"risk_appetite\": 7,
    \"patience\": 5,
    \"info_sensitivity\": 8,
    \"decision_speed\": 6,
    \"cat_type\": \"激进型\",
    \"cat_desc\": \"追求高收益\"
  }" | jq '.'
echo ""

# 7. 获取用户信息
echo "7. 获取用户信息"
curl -s "${BASE_URL}/api/users/${USER_ID}" | jq '.data.data'
echo ""

# 8. 更新用户维度
echo "8. 更新用户维度"
curl -s -X PATCH "${BASE_URL}/api/users/${USER_ID}/traits" \
  -H "Content-Type: application/json" \
  -d '{"risk_appetite": 9, "patience": 3}' | jq '.'
echo ""

# 9. 创建聊天记录
echo "9. 创建聊天记录"
SESSION_ID="test_session_$(date +%s)"
curl -s -X POST "${BASE_URL}/api/chats" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"${USER_ID}\",
    \"session_id\": \"${SESSION_ID}\",
    \"question\": \"SOL 现在价格多少？\",
    \"answer\": \"\$139.76\"
  }" | jq '.'
echo ""

# 10. 获取用户聊天记录
echo "10. 获取用户聊天记录"
curl -s "${BASE_URL}/api/chats/user/${USER_ID}" | jq '.data.data[] | {id, question}'
echo ""

echo "=========================================="
echo "  ✅ 测试完成"
echo "=========================================="
echo ""
echo "测试用户 ID: ${USER_ID}"
echo "可以在数据库中查看测试数据"
