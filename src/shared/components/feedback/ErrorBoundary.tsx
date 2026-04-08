import React, { ErrorInfo, ReactNode } from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../ui/Button'

interface ErrorBoundaryProps {
  children: ReactNode
  onRetry?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // Reserved for future crash reporting integration.
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false })
    this.props.onRetry?.()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center px-6">
          <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-3">
            ALGO SALIÓ{'\n'}MAL
          </Text>
          <Text className="font-jakarta-regular text-base text-on-surface/70 mb-8 leading-relaxed">
            La app encontró un error inesperado. Puedes intentar nuevamente sin
            perder el rumbo.
          </Text>
          <Button label="Intentar de nuevo" onPress={this.handleRetry} />
        </View>
      </SafeAreaView>
    )
  }
}
