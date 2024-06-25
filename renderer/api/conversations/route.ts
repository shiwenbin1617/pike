// 强制使页面成为动态页面
export const dynamic = 'force-dynamic'

// 导入必要的类型和方法
import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '../utils/common'

// 定义一个异步的 GET 方法，用于处理传入的 HTTP 请求
export async function GET(request: NextRequest) {
  // 从请求中获取会话 ID 和用户信息
  const { sessionId, user } = getInfo(request)

  try {
    // 调用客户端方法获取用户的对话信息
    const { data }: any = await client.getConversations(user)

    // 返回包含对话数据的响应，同时设置会话 ID 到响应头部
    return NextResponse.json(data, {
      headers: setSession(sessionId),
    })
  } catch (error) {
    // 如果发生错误，返回一个空数组
    return NextResponse.json([]);
  }
}