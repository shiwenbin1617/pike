import { type NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { v4 } from 'uuid'
// import { API_KEY, API_URL, APP_ID } from '../../config'
const APP_ID = '058f4d4f-d1da-44ee-90e8-90fbc101f710'
const userPrefix = `user_${APP_ID}:`

/**
 * 获取会话信息
 * @param request - Next.js 的请求对象
 * @returns 包含 sessionId 和 user 的对象
 */
export const getInfo = (request: NextRequest) => {
  const sessionId = request.cookies.get('session_id')?.value || v4()
  const user = userPrefix + sessionId
  return {
    sessionId,
    user,
  }
}

/**
 * 设置会话信息
 * @param sessionId - 会话 ID
 * @returns 包含 Set-Cookie 头的对象
 */
export const setSession = (sessionId: string) => {
  return { 'Set-Cookie': `session_id=${sessionId}` }
}

// 创建 ChatClient 实例
const API_KEY = 'app-6AaUmgcmdP6ouy2y4pJmXhEv'
const API_URL='http://192.168.0.222/v1'
export const client = new ChatClient(API_KEY, API_URL || undefined)