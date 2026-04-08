import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Text, View } from 'react-native'

type ToastTone = 'default' | 'success' | 'error'

interface ToastOptions {
  message: string
  tone?: ToastTone
  durationMs?: number
}

interface ToastState extends Required<ToastOptions> {
  id: number
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void
  hideToast: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TONE_LABELS: Record<ToastTone, string> = {
  default: 'Aviso',
  success: 'Listo',
  error: 'Atención',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setToast(null)
  }, [])

  const showToast = useCallback(
    ({ message, tone = 'default', durationMs = 3200 }: ToastOptions) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      setToast({
        id: Date.now(),
        message,
        tone,
        durationMs,
      })

      timeoutRef.current = setTimeout(() => {
        setToast(null)
        timeoutRef.current = null
      }, durationMs)
    },
    [],
  )

  useEffect(() => hideToast, [hideToast])

  const value = useMemo(
    () => ({
      showToast,
      hideToast,
    }),
    [hideToast, showToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          className="absolute bottom-6 left-4 right-4"
        >
          <View className="rounded-3xl bg-surface-container px-5 py-4">
            <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-1">
              {TONE_LABELS[toast.tone]}
            </Text>
            <Text className="font-jakarta-regular text-sm leading-6 text-on-surface">
              {toast.message}
            </Text>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
