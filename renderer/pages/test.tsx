/* eslint-disable @typescript-eslint/no-use-before-define */
'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import produce, { setAutoFreeze } from 'immer'
import { useBoolean, useGetState } from 'ahooks'
import { Box, Flex, useToast, Text, Divider, Spinner, Button } from '@chakra-ui/react'
import useConversation from '../hooks/use-conversation'
import Sidebar from '../components/sidebar'
import ConfigSence from '../components/config-scence'
import Header from '../components/header'
import { fetchAppParams, fetchChatList, fetchConversations, generationConversationName, sendChatMessage, updateFeedback } from '../service'
import type { ChatItem, ConversationItem, Feedbacktype, PromptConfig, VisionFile, VisionSettings } from '../types/app'
import { Resolution, TransferMethod, WorkflowRunningStatus } from '../types/app'
import Chat from '../components/chat'
import { setLocaleOnClient } from '../i18n/client'
import useBreakpoints, { MediaType } from '../hooks/use-breakpoints'
import { replaceVarWithValues, userInputsFormToPromptVariables } from '../utils/prompt'
import AppUnavailable from '../components/app-unavailable'
import { API_KEY, APP_ID, APP_INFO, isShowPrompt, promptTemplate } from '../../config'
import { addFileInfos, sortAgentSorts } from '../utils/tools'

const Main: FC = () => {
  const { t } = useTranslation()
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const hasSetAppConfig = APP_ID && API_KEY
  const toast = useToast()

  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknwonReason, setIsUnknwonReason] = useState<boolean>(false)
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)
  const [inited, setInited] = useState<boolean>(false)
  const [isShowSidebar, { setTrue: showSidebar, setFalse: hideSidebar }] = useBoolean(false)
  const [visionConfig, setVisionConfig] = useState<VisionSettings | undefined>({
    enabled: false,
    number_limits: 2,
    detail: Resolution.low,
    transfer_methods: [TransferMethod.local_file],
  })

  useEffect(() => {
    if (APP_INFO?.title)
      document.title = `${APP_INFO.title} - Powered by Dify`
  }, [APP_INFO?.title])

  useEffect(() => {
    setAutoFreeze(false)
    return () => {
      setAutoFreeze(true)
    }
  }, [])

  const {
    conversationList,
    setConversationList,
    currConversationId,
    getCurrConversationId,
    setCurrConversationId,
    getConversationIdFromStorage,
    isNewConversation,
    currConversationInfo,
    currInputs,
    newConversationInputs,
    resetNewConversationInputs,
    setCurrInputs,
    setNewConversationInfo,
    setExistConversationInfo,
  } = useConversation()

  const [conversationIdChangeBecauseOfNew, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)
  const [isChatStarted, { setTrue: setChatStarted, setFalse: setChatNotStarted }] = useBoolean(false)
  const handleStartChat = (inputs: Record<string, any>) => {
    createNewChat()
    setConversationIdChangeBecauseOfNew(true)
    setCurrInputs(inputs)
    setChatStarted()
    setChatList(generateNewChatListWithOpenstatement('', inputs))
  }
  const hasSetInputs = (!isNewConversation) || isChatStarted

  const conversationName = currConversationInfo?.name || t('app.chat.newChatDefaultName') as string
  const conversationIntroduction = currConversationInfo?.introduction || ''

  const handleConversationSwitch = () => {
    if (!inited)
      return

    let notSyncToStateIntroduction = ''
    let notSyncToStateInputs: Record<string, any> | undefined | null = {}
    if (!isNewConversation) {
      const item = conversationList.find(item => item.id === currConversationId)
      notSyncToStateInputs = item?.inputs || {}
      setCurrInputs(notSyncToStateInputs as any)
      notSyncToStateIntroduction = item?.introduction || ''
      setExistConversationInfo({
        name: item?.name || '',
        introduction: notSyncToStateIntroduction,
      })
    }
    else {
      notSyncToStateInputs = newConversationInputs
      setCurrInputs(notSyncToStateInputs)
    }

    if (!isNewConversation && !conversationIdChangeBecauseOfNew && !isResponsing) {
      fetchChatList(currConversationId).then((res: any) => {
        const { data } = res
        const newChatList: ChatItem[] = generateNewChatListWithOpenstatement(notSyncToStateIntroduction, notSyncToStateInputs)

        data.forEach((item: any) => {
          newChatList.push({
            id: `question-${item.id}`,
            content: item.query,
            isAnswer: false,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'user') || [],
          })
          newChatList.push({
            id: item.id,
            content: item.answer,
            agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files),
            feedback: item.feedback,
            isAnswer: true,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || [],
          })
        })
        setChatList(newChatList)
      })
    }

    if (isNewConversation && isChatStarted)
      setChatList(generateNewChatListWithOpenstatement())
  }
  useEffect(handleConversationSwitch, [currConversationId, inited])

  const handleConversationIdChange = (id: string) => {
    if (id === '-1') {
      createNewChat()
      setConversationIdChangeBecauseOfNew(true)
    }
    else {
      setConversationIdChangeBecauseOfNew(false)
    }
    setCurrConversationId(id, APP_ID)
    hideSidebar()
  }
  const [chatList, setChatList, getChatList] = useGetState<ChatItem[]>([])
  const chatListDomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (chatListDomRef.current)
      chatListDomRef.current.scrollTop = chatListDomRef.current.scrollHeight
  }, [chatList, currConversationId])
  const canEditInpus = !chatList.some(item => item.isAnswer === false) && isNewConversation
  const createNewChat = () => {
    if (conversationList.some(item => item.id === '-1'))
      return

    setConversationList(produce(conversationList, (draft) => {
      draft.unshift({
        id: '-1',
        name: t('app.chat.newChatDefaultName'),
        inputs: newConversationInputs,
        introduction: conversationIntroduction,
      })
    }))
  }
  const generateNewChatListWithOpenstatement = (introduction?: string, inputs?: Record<string, any> | null) => {
    let caculatedIntroduction = introduction || conversationIntroduction || ''
    const caculatedPromptVariables = inputs || currInputs || null
    if (caculatedIntroduction && caculatedPromptVariables)
      caculatedIntroduction = replaceVarWithValues(caculatedIntroduction, promptConfig?.prompt_variables || [], caculatedPromptVariables)

    const openstatement = {
      id: `${Date.now()}`,
      content: caculatedIntroduction,
      isAnswer: true,
      feedbackDisabled: true,
      isOpeningStatement: isShowPrompt,
    }
    if (caculatedIntroduction)
      return [openstatement]

    return []
  }

  useEffect(() => {
    if (!hasSetAppConfig) {
      setAppUnavailable(true)
      return
    }
    (async () => {
      try {
        const [conversationData, appParams] = await Promise.all([fetchConversations(), fetchAppParams()])

        const { data: conversations } = conversationData as { data: ConversationItem[] }
        const _conversationId = getConversationIdFromStorage(APP_ID)
        const isNotNewConversation = conversations.some(item => item.id === _conversationId)

        const { user_input_form, opening_statement: introduction, file_upload, system_parameters }: any = appParams
        setLocaleOnClient(APP_INFO.default_language, true)
        setNewConversationInfo({
          name: t('app.chat.newChatDefaultName'),
          introduction,
        })
        const prompt_variables = userInputsFormToPromptVariables(user_input_form)
        setPromptConfig({
          prompt_template: promptTemplate,
          prompt_variables,
        } as PromptConfig)
        setVisionConfig({
          ...file_upload?.image,
          image_file_size_limit: system_parameters?.system_parameters || 0,
        })
        setConversationList(conversations as ConversationItem[])

        if (isNotNewConversation)
          setCurrConversationId(_conversationId, APP_ID, false)

        setInited(true)
      }
      catch (e: any) {
        if (e.status === 404) {
          setAppUnavailable(true)
        } else {
          setIsUnknwonReason(true)
          setAppUnavailable(true)
        }
      }
    })()
  }, [])

  const [isResponsing, { setTrue: setResponsingTrue, setFalse: setResponsingFalse }] = useBoolean(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const logError = (message: string) => {
    toast({ status: 'error', description: message })
  }

  const checkCanSend = () => {
    if (currConversationId !== '-1')
      return true

    if (!currInputs || !promptConfig?.prompt_variables)
      return true

    const inputLens = Object.values(currInputs).length
    const promptVariablesLens = promptConfig.prompt_variables.length

    const emytyInput = inputLens < promptVariablesLens || Object.values(currInputs).find(v => !v)
    if (emytyInput) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  const [controlFocus, setControlFocus] = useState(0)
  const [messageTaskId, setMessageTaskId] = useState('')
  const [userQuery, setUserQuery] = useState('')

  const handleSend = async (message: string, files?: VisionFile[]) => {
    if (isResponsing) {
      toast({ status: 'info', description: t('app.errorMessage.waitForResponse') })
      return
    }
    const data: Record<string, any> = {
      inputs: currInputs,
      query: message,
      conversation_id: isNewConversation ? null : currConversationId,
    }

    if (visionConfig?.enabled && files && files?.length > 0) {
      data.files = files.map((item) => {
        if (item.transfer_method === TransferMethod.local_file) {
          return {
            ...item,
            url: '',
          }
        }
        return item
      })
    }

    const questionId = `question-${Date.now()}`
    const questionItem = {
      id: questionId,
      content: message,
      isAnswer: false,
      message_files: files,
    }

    const placeholderAnswerId = `answer-placeholder-${Date.now()}`
    const placeholderAnswerItem = {
      id: placeholderAnswerId,
      content: '',
      isAnswer: true,
    }

    const newList = [...getChatList(), questionItem, placeholderAnswerItem]
    setChatList(newList)

    const responseItem: ChatItem = {
      id: `${Date.now()}`,
      content: '',
      agent_thoughts: [],
      message_files: [],
      isAnswer: true,
    }
    let hasSetResponseId = false

    const prevTempNewConversationId = getCurrConversationId() || '-1'
    let tempNewConversationId = ''

    setResponsingTrue()
    sendChatMessage(data, {
      getAbortController: (abortController) => {
        setAbortController(abortController)
      },
      onData: (msg: string, isFirstMessage: boolean, {conversationId: newConversationId, messageId, taskId}: any) => {
        responseItem.content = responseItem.content + msg

        if (messageId && !hasSetResponseId) {
          responseItem.id = messageId
          hasSetResponseId = true
        }

        if (isFirstMessage && newConversationId)
          tempNewConversationId = newConversationId

        setMessageTaskId(taskId)

        const newListWithAnswer = produce(
          getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
          (draft) => {
            if (!draft.find(item => item.id === questionId))
              draft.push({...questionItem})

            draft.push({...responseItem})
          })
        setChatList(newListWithAnswer)
      },
      async onCompleted(hasError?: boolean) {
        if (hasError)
          return

        if (getConversationIdChangeBecauseOfNew()) {
          const {data: allConversations}: any = await fetchConversations()
          const newItem: any = await generationConversationName(allConversations[0].id)

          const newAllConversations = produce(allConversations, (draft: any) => {
            draft[0].name = newItem.name
          })
          setConversationList(newAllConversations as any)
        }
        setConversationIdChangeBecauseOfNew(false)
        resetNewConversationInputs()
        setChatNotStarted()
        setCurrConversationId(tempNewConversationId, APP_ID, true)
        setResponsingFalse()
      },
      onError() {
        setResponsingFalse()
        setChatList(produce(getChatList(), (draft) => {
          draft.splice(draft.findIndex(item => item.id === placeholderAnswerId), 1)
        }))
      },
    })
  }

  const handleFeedback = async (messageId: string, feedback: Feedbacktype) => {
    await updateFeedback({ url: `/messages/${messageId}/feedbacks`, body: { rating: feedback.rating } })
    const newChatList = chatList.map((item) => {
      if (item.id === messageId) {
        return {
          ...item,
          feedback,
        }
      }
      return item
    })
    setChatList(newChatList)
    toast({ status: 'success', description: t('common.api.success') })
  }

  const renderSidebar = () => {
    if (!APP_ID || !APP_INFO || !promptConfig)
      return null
    return (
      <Sidebar
        list={conversationList}
        onCurrentIdChange={handleConversationIdChange}
        currentId={currConversationId}
        copyRight={APP_INFO.copyright || APP_INFO.title}
      />
    )
  }

  if (appUnavailable)
    return <AppUnavailable isUnknwonReason={isUnknwonReason} errMessage={!hasSetAppConfig ? 'Please set APP_ID and API_KEY in config/index.tsx' : ''} />

  if (!APP_ID || !APP_INFO || !promptConfig)
    return (
      <Flex justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    )

  return (
    <Box bg="gray.100">
      <Header
        title={APP_INFO.title}
        isMobile={isMobile}
        onShowSideBar={showSidebar}
        onCreateNewChat={() => handleConversationIdChange('-1')}
      />
      <Flex direction={isMobile ? 'column' : 'row'} roundedTop="2xl" bg="white" overflow="hidden">
        {!isMobile && renderSidebar()}
        {isMobile && isShowSidebar && (
          <Box
            fixed="true"
            inset="0"
            zIndex="50"
            bg="rgba(35, 56, 118, 0.2)"
            onClick={hideSidebar}
          >
            <Box inlineSize="true" onClick={e => e.stopPropagation()}>
              {renderSidebar()}
            </Box>
          </Box>
        )}
        <Flex grow="1" direction="column" height={isMobile ? '100vh' : 'calc(100vh - 3rem)'} overflowY="auto">
          <ConfigSence
            conversationName={conversationName}
            hasSetInputs={hasSetInputs}
            isPublicVersion={isShowPrompt}
            siteInfo={APP_INFO}
            promptConfig={promptConfig}
            onStartChat={handleStartChat}
            canEidtInpus={canEditInpus}
            savedInputs={currInputs as Record<string, any>}
            onInputsChange={setCurrInputs}
          />
          {hasSetInputs && (
            <Box relative grow="1" height={isMobile ? '200px' : '100%'} maxW="full" p="4" overflow="hidden">
              <Box height="full" overflowY="auto" ref={chatListDomRef}>
                <Chat
                  chatList={chatList}
                  onSend={handleSend}
                  onFeedback={handleFeedback}
                  isResponsing={isResponsing}
                  checkCanSend={checkCanSend}
                  visionConfig={visionConfig}
                />
              </Box>
            </Box>
          )}
        </Flex>
      </Flex>
    </Box>
  )
}

export default React.memo(Main)