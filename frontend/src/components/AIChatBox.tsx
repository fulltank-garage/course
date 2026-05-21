import { useEffect, useRef, useState } from 'react'
import { Bot, Send, Trash2, UserRound } from 'lucide-react'
import { api, authStorage } from '../services/api'

interface Message {
  id: string
  sender: 'user' | 'ai'
  text: string
  createdAt: string
}

interface AIChatBoxProps {
  lessonId: string
  lessonTitle: string
  className?: string
  embedded?: boolean
}

const chatStoragePrefix = 'mycourse_ai_chat'

const getChatOwnerId = () => authStorage.getSession()?.user.id ?? 'guest'

const createWelcomeMessage = (lessonTitle: string): Message => ({
  id: 'm-1',
  sender: 'ai',
  text: `มีตรงไหนใน "${lessonTitle}" ที่ยังไม่เข้าใจ ถามได้เลยครับ`,
  createdAt: new Date().toISOString(),
})

const getChatStorageKey = (lessonId: string) => `${chatStoragePrefix}:${getChatOwnerId()}:${lessonId}`

const getStoredMessages = (lessonId: string, lessonTitle: string): Message[] => {
  const raw = localStorage.getItem(getChatStorageKey(lessonId))

  if (!raw) return [createWelcomeMessage(lessonTitle)]

  try {
    const messages = JSON.parse(raw)

    if (!Array.isArray(messages)) return [createWelcomeMessage(lessonTitle)]

    const normalizedMessages = messages
      .filter(
        (message): message is Message =>
          typeof message?.id === 'string' &&
          (message.sender === 'user' || message.sender === 'ai') &&
          typeof message.text === 'string',
      )
      .map((message) => ({
        ...message,
        createdAt: typeof message.createdAt === 'string' ? message.createdAt : new Date().toISOString(),
      }))

    return normalizedMessages.length > 0 ? normalizedMessages : [createWelcomeMessage(lessonTitle)]
  } catch {
    return [createWelcomeMessage(lessonTitle)]
  }
}

const formatMessageTime = (value: string) =>
  new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

export default function AIChatBox({ lessonId, lessonTitle, className = 'h-[560px] max-h-[70vh]', embedded = false }: AIChatBoxProps) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => getStoredMessages(lessonId, lessonTitle))
  const [focusedAiMessageId, setFocusedAiMessageId] = useState<string | null>(null)
  const scrollPanelRef = useRef<HTMLDivElement | null>(null)
  const focusedAiMessageRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMessages(getStoredMessages(lessonId, lessonTitle))
  }, [lessonId, lessonTitle])

  useEffect(() => {
    localStorage.setItem(getChatStorageKey(lessonId), JSON.stringify(messages))
  }, [lessonId, messages])

  useEffect(() => {
    if (!loading) return

    messagesEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [loading])

  useEffect(() => {
    if (!focusedAiMessageId) return

    const scrollPanel = scrollPanelRef.current
    const aiMessage = focusedAiMessageRef.current

    if (!scrollPanel || !aiMessage) return

    requestAnimationFrame(() => {
      scrollPanel.scrollTo({
        top: Math.max(0, aiMessage.offsetTop - scrollPanel.offsetTop - 8),
        behavior: 'smooth',
      })
    })
  }, [focusedAiMessageId, messages])

  const clearChat = () => {
    const welcomeMessage = createWelcomeMessage(lessonTitle)

    localStorage.removeItem(getChatStorageKey(lessonId))
    setQuestion('')
    setFocusedAiMessageId(null)
    setMessages([welcomeMessage])
  }

  const askQuestion = async (text: string) => {
    const trimmed = text.trim()

    if (!trimmed || loading) return

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      createdAt: new Date().toISOString(),
    }
    setMessages((current) => [...current, userMessage])
    setFocusedAiMessageId(null)
    setQuestion('')
    setLoading(true)

    try {
      const result = await api.askLesson(lessonId, trimmed)
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.answer,
        createdAt: new Date().toISOString(),
      }

      setFocusedAiMessageId(aiMessage.id)
      setMessages((current) => [
        ...current,
        aiMessage,
      ])
    } catch (error) {
      const errorMessage: Message = {
        id: `ai-error-${Date.now()}`,
        sender: 'ai',
        text: error instanceof Error ? error.message : 'ไม่สามารถเชื่อมต่อ AI ได้ครับ กรุณาตรวจสอบ Gemini API',
        createdAt: new Date().toISOString(),
      }

      setFocusedAiMessageId(errorMessage.id)
      setMessages((current) => [
        ...current,
        errorMessage,
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={[
        embedded
          ? 'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]'
          : 'flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm',
        className,
      ].join(' ')}
    >
      <div className={embedded
          ? 'flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/80 px-3 py-3'
          : 'flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3'}>
        {embedded ? <div className="min-w-0 flex-1" /> : null}
        {!embedded ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black text-white">
              <Bot size={16} />
            </span>
            <h2 className="min-w-0 truncate text-sm font-semibold text-black">AI ผู้ช่วย</h2>
          </div>
        ) : null}
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="เคลียร์ข้อความแชท"
          title="เคลียร์ข้อความแชท"
          onClick={clearChat}
          disabled={loading}
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div ref={scrollPanelRef} className="ai-scroll-panel flex-1 space-y-4 overflow-y-auto bg-zinc-50/70 px-3 py-3">
        {messages.map((message) => (
          <div
            key={message.id}
            ref={message.id === focusedAiMessageId ? focusedAiMessageRef : null}
            className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'ai' ? (
              <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black text-white sm:inline-flex">
                <Bot size={15} />
              </span>
            ) : null}

            <div
              className={`min-h-0 max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm sm:max-w-[82%] ${
                message.sender === 'user'
                  ? 'rounded-br-md bg-black text-white'
                  : 'rounded-bl-xl border border-zinc-200 bg-white text-zinc-800'
              }`}
            >
              {message.text}
              <span
                className={`mt-2 block text-[11px] leading-none ${
                  message.sender === 'user' ? 'text-white/60' : 'text-zinc-400'
                }`}
              >
                {formatMessageTime(message.createdAt)}
              </span>
            </div>

            {message.sender === 'user' ? (
              <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-700 ring-1 ring-zinc-200 sm:inline-flex">
                <UserRound size={15} />
              </span>
            ) : null}
          </div>
        ))}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-zinc-400" />
            กำลังตอบคำถาม...
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t border-zinc-100 bg-zinc-50/70 px-3 pb-3 pt-3">
        <form
          className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm focus-within:border-black focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.03)]"
          onSubmit={(event) => {
            event.preventDefault()
            askQuestion(question)
          }}
        >
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                askQuestion(question)
              }
            }}
            rows={2}
            className="mt-0 max-h-28 min-h-12 w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 text-black outline-none placeholder:text-zinc-400"
            placeholder="พิมพ์คำถามเกี่ยวกับบทเรียน"
            disabled={loading}
          />
          <button
            type="submit"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="ส่งคำถาม"
            disabled={loading}
          >
            <Send size={19} />
          </button>
        </form>
      </div>
    </div>
  )
}
