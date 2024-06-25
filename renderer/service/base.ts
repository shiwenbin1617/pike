import Toast from '../components/base/toast'
import type { AnnotationReply, MessageEnd, MessageReplace, ThoughtItem } from '../components/chat/type'
import type { VisionFile } from '../types/app'

// API前缀
export const API_PREFIX = 'http://192.168.0.222/v1'

// 请求超时时间
const TIME_OUT = 100000

// 内容类型
const ContentType = {
  json: 'application/json',
  stream: 'text/event-stream',
  form: 'application/x-www-form-urlencoded; charset=UTF-8',
  download: 'application/octet-stream', // 下载
}

// 基础选项
const baseOptions = {
  method: 'GET',
  mode: 'cors', // 跨域请求
  credentials: 'include', // 始终发送 cookies、HTTP 基本认证信息
  headers: new Headers({
    'Content-Type': ContentType.json,
  }),
  redirect: 'follow',
}

// 增强日志工具函数
const logWithEmoji = (message: string, emoji: string) => {
  console.log(`${emoji} ${message}`)
}

// 工作流开始响应类型定义
export type WorkflowStartedResponse = {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    workflow_id: string
    sequence_number: number
    created_at: number
  }
}

// 工作流完成响应类型定义
export type WorkflowFinishedResponse = {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    workflow_id: string
    status: string
    outputs: any
    error: string
    elapsed_time: number
    total_tokens: number
    total_steps: number
    created_at: number
    finished_at: number
  }
}

// 节点开始响应类型定义
export type NodeStartedResponse = {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    node_id: string
    node_type: string
    index: number
    predecessor_node_id?: string
    inputs: any
    created_at: number
    extras?: any
  }
}

// 节点完成响应类型定义
export type NodeFinishedResponse = {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    node_id: string
    node_type: string
    index: number
    predecessor_node_id?: string
    inputs: any
    process_data: any
    outputs: any
    status: string
    error: string
    elapsed_time: number
    execution_metadata: {
      total_tokens: number
      total_price: number
      currency: string
    }
    created_at: number
  }
}

// 用于保存额外信息的数据类型定义
export type IOnDataMoreInfo = {
  conversationId?: string
  taskId?: string
  messageId: string
  errorMessage?: string
  errorCode?: string
}

// 各种回调函数类型定义
export type IOnData = (message: string, isFirstMessage: boolean, moreInfo: IOnDataMoreInfo) => void
export type IOnThought = (though: ThoughtItem) => void
export type IOnFile = (file: VisionFile) => void
export type IOnMessageEnd = (messageEnd: MessageEnd) => void
export type IOnMessageReplace = (messageReplace: MessageReplace) => void
export type IOnAnnotationReply = (messageReplace: AnnotationReply) => void
export type IOnCompleted = (hasError?: boolean) => void
export type IOnError = (msg: string, code?: string) => void
export type IOnWorkflowStarted = (workflowStarted: WorkflowStartedResponse) => void
export type IOnWorkflowFinished = (workflowFinished: WorkflowFinishedResponse) => void
export type IOnNodeStarted = (nodeStarted: NodeStartedResponse) => void
export type IOnNodeFinished = (nodeFinished: NodeFinishedResponse) => void

// 其它选项数据类型定义
type IOtherOptions = {
  isPublicAPI?: boolean
  bodyStringify?: boolean
  needAllResponseContent?: boolean
  deleteContentType?: boolean
  onData?: IOnData // 用于流
  onThought?: IOnThought
  onFile?: IOnFile
  onMessageEnd?: IOnMessageEnd
  onMessageReplace?: IOnMessageReplace
  onError?: IOnError
  onCompleted?: IOnCompleted // 用于流
  getAbortController?: (abortController: AbortController) => void
  onWorkflowStarted?: IOnWorkflowStarted
  onWorkflowFinished?: IOnWorkflowFinished
  onNodeStarted?: IOnNodeStarted
  onNodeFinished?: IOnNodeFinished
}

// 将Unicode转换为字符串
function unicodeToChar(text: string) {
  return text.replace(/\\u[0-9a-f]{4}/g, (_match, p1) => {
    return String.fromCharCode(parseInt(p1, 16))
  })
}

// 处理数据流
const handleStream = (
  response: Response,
  onData: IOnData,
  onCompleted?: IOnCompleted,
  onThought?: IOnThought,
  onMessageEnd?: IOnMessageEnd,
  onMessageReplace?: IOnMessageReplace,
  onFile?: IOnFile,
  onWorkflowStarted?: IOnWorkflowStarted,
  onWorkflowFinished?: IOnWorkflowFinished,
  onNodeStarted?: IOnNodeStarted,
  onNodeFinished?: IOnNodeFinished,
) => {
  if (!response.ok) {
    logWithEmoji('Network response was not ok', '❌')
    throw new Error('Network response was not ok')
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let bufferObj: Record<string, any>
  let isFirstMessage = true

  function read() {
    let hasError = false
    reader?.read().then((result: any) => {
      if (result.done) {
        onCompleted && onCompleted()
        logWithEmoji('Stream completed', '✅')
        return
      }

      buffer += decoder.decode(result.value, { stream: true })
      const lines = buffer.split('\n')

      try {
        lines.forEach((message) => {
          if (message.startsWith('data: ')) {
            try {
              bufferObj = JSON.parse(message.substring(6))
            } catch (e) {
              onData('', isFirstMessage, {
                conversationId: bufferObj?.conversation_id,
                messageId: bufferObj?.message_id,
              })
              return
            }

            if (bufferObj.status === 400 || !bufferObj.event) {
              onData('', false, {
                conversationId: undefined,
                messageId: '',
                errorMessage: bufferObj?.message,
                errorCode: bufferObj?.code,
              })
              hasError = true
              onCompleted?.(true)
              return
            }

            switch (bufferObj.event) {
              case 'message':
              case 'agent_message':
                onData(unicodeToChar(bufferObj.answer), isFirstMessage, {
                  conversationId: bufferObj.conversation_id,
                  taskId: bufferObj.task_id,
                  messageId: bufferObj.id,
                })
                isFirstMessage = false
                break
              case 'agent_thought':
                onThought?.(bufferObj as ThoughtItem)
                break
              case 'message_file':
                onFile?.(bufferObj as VisionFile)
                break
              case 'message_end':
                onMessageEnd?.(bufferObj as MessageEnd)
                break
              case 'message_replace':
                onMessageReplace?.(bufferObj as MessageReplace)
                break
              case 'workflow_started':
                onWorkflowStarted?.(bufferObj as WorkflowStartedResponse)
                break
              case 'workflow_finished':
                onWorkflowFinished?.(bufferObj as WorkflowFinishedResponse)
                break
              case 'node_started':
                onNodeStarted?.(bufferObj as NodeStartedResponse)
                break
              case 'node_finished':
                onNodeFinished?.(bufferObj as NodeFinishedResponse)
                break
            }
          }
        })
        buffer = lines[lines.length - 1]
      } catch (e) {
        onData('', false, {
          conversationId: undefined,
          messageId: '',
          errorMessage: `${e}`,
        })
        hasError = true
        onCompleted?.(true)
        return
      }

      if (!hasError) {
        read()
      }
    })
  }

  read()
}

// 基础 fetch 请求
const baseFetch = (url: string, fetchOptions: any, { needAllResponseContent }: IOtherOptions) => {
  const options = Object.assign({}, baseOptions, fetchOptions)
  const urlPrefix = API_PREFIX
  let urlWithPrefix = `${urlPrefix}${url.startsWith('/') ? url : `/${url}`}`

  const { method, params, body } = options
  // 处理查询参数
  if (method === 'GET' && params) {
    const paramsArray: string[] = []
    Object.keys(params).forEach(key =>
      paramsArray.push(`${key}=${encodeURIComponent(params[key])}`),
    )
    if (urlWithPrefix.search(/\?/) === -1)
      urlWithPrefix += `?${paramsArray.join('&')}`
    else
      urlWithPrefix += `&${paramsArray.join('&')}`

    delete options.params
  }

  if (body)
    options.body = JSON.stringify(body)

  // 处理请求超时
  return Promise.race([
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('request timeout'))
      }, TIME_OUT)
    }),
    new Promise((resolve, reject) => {
      globalThis.fetch(urlWithPrefix, options)
        .then((res: any) => {
          const resClone = res.clone()
          // 错误处理
          if (!/^(2|3)\d{2}$/.test(res.status)) {
            try {
              const bodyJson = res.json()
              switch (res.status) {
                case 401: {
                  logWithEmoji('Invalid token', '🚫')
                  Toast({ type: 'error', message: 'Invalid token' })
                  return
                }
                default:
                  new Promise(() => {
                    bodyJson.then((data: any) => {
                      Toast({ type: 'error', message: data.message })
                      logWithEmoji(`Error: ${data.message}`, '⚠️')
                    })
                  })
              }
            } catch (e) {
              logWithEmoji(`Error: ${e}`, '⚠️')
              Toast({ type: 'error', message: `${e}` })
            }

            return Promise.reject(resClone)
          }

          // 处理删除API，删除API不返回内容
          if (res.status === 204) {
            logWithEmoji('Delete API success', '🗑️')
            resolve({ result: 'success' })
            return
          }

          // 返回数据
          const data = options.headers.get('Content-type') === ContentType.download ? res.blob() : res.json()

          resolve(needAllResponseContent ? resClone : data)
        })
        .catch((err) => {
          logWithEmoji(`Error: ${err}`, '⚠️')
          Toast({ type: 'error', message: err })
          reject(err)
        })
    }),
  ])
}

// 上传文件
export const upload = (fetchOptions: any): Promise<any> => {
  const urlPrefix = API_PREFIX
  const urlWithPrefix = `${urlPrefix}/file-upload`
  const defaultOptions = {
    method: 'POST',
    url: `${urlWithPrefix}`,
    data: {},
  }
  const options = { ...defaultOptions, ...fetchOptions }

  return new Promise((resolve, reject) => {
    const xhr = options.xhr
    xhr.open(options.method, options.url)
    for (const key in options.headers)
      xhr.setRequestHeader(key, options.headers[key])

    xhr.withCredentials = true
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          logWithEmoji(`Upload success: ${xhr.response}`, '📤')
          resolve({ id: xhr.response })
        } else {
          logWithEmoji(`Upload failed: ${xhr.status}`, '❌')
          reject(xhr)
        }
      }
    }
    xhr.upload.onprogress = options.onprogress
    xhr.send(options.data)
  })
}

export const ssePost = (
  url: string,
  fetchOptions: any,
  {
    onData,
    onCompleted,
    onThought,
    onFile,
    onMessageEnd,
    onMessageReplace,
    onWorkflowStarted,
    onWorkflowFinished,
    onNodeStarted,
    onNodeFinished,
    onError,
  }: IOtherOptions,
) => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': fetchOptions.headers?.Authorization
  });

  const options = {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    headers: headers,
    body: JSON.stringify(fetchOptions.body)
  };

  const urlPrefix = API_PREFIX;
  const urlWithPrefix = `${urlPrefix}${url.startsWith('/') ? url : `/${url}`}`;

  globalThis.fetch(urlWithPrefix, options)
    .then((res: any) => {
      if (!/^(2|3)\d{2}$/.test(res.status)) {
        res.json().then((data: any) => {
          Toast({ type: 'error', message: data.message || 'Server Error' });
          logWithEmoji(`Error: ${data.message || 'Server Error'}`, '⚠️');
          onError?.('Server Error');
        }).catch((err: any) => {
          const errorMsg = `Could not parse JSON response. Status: ${res.status}, Error: ${err}`;
          onError?.(errorMsg);
          logWithEmoji(`Error: ${err}`, '⚠️');
        });
        return;
      }

      return handleStream(
        res,
        (str: string, isFirstMessage: boolean, moreInfo: IOnDataMoreInfo) => {
          if (moreInfo.errorMessage) {
            Toast({ type: 'error', message: moreInfo.errorMessage });
            logWithEmoji(`Error: ${moreInfo.errorMessage}`, '⚠️');
            onError?.(moreInfo.errorMessage);
            return;
          }
          onData?.(str, isFirstMessage, moreInfo);
        },
        () => {
          onCompleted?.();
          logWithEmoji('Request completed', '✅');
        },
        onThought,
        onMessageEnd,
        onMessageReplace,
        onFile,
        onWorkflowStarted,
        onWorkflowFinished,
        onNodeStarted,
        onNodeFinished
      );
    }).catch((e) => {
      Toast({ type: 'error', message: e.message });
      logWithEmoji(`Error: ${e.message}`, '⚠️');
      onError?.(e.message);
    });
};
// 统一请求函数
export const request = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return baseFetch(url, options, otherOptions || {})
}

// GET 请求
export const get = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'GET' }), otherOptions)
}

// POST 请求
export const post = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'POST' }), otherOptions)
}

// PUT 请求
export const put = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'PUT' }), otherOptions)
}

// DELETE 请求
export const del = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'DELETE' }), otherOptions)
}