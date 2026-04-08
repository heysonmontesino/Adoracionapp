import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { ErrorBoundary } from '../ErrorBoundary'

function CrashingChild({ shouldCrash }: { shouldCrash: boolean }) {
  if (shouldCrash) {
    throw new Error('boom')
  }

  return <Text>todo bien</Text>
}

function ErrorBoundaryHarness() {
  const [shouldCrash, setShouldCrash] = React.useState(true)

  return (
    <ErrorBoundary onRetry={() => setShouldCrash(false)}>
      <CrashingChild shouldCrash={shouldCrash} />
    </ErrorBoundary>
  )
}

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error

  beforeAll(() => {
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = originalConsoleError
  })

  it('renders fallback UI and retries', () => {
    const { getByText } = render(<ErrorBoundaryHarness />)

    expect(getByText('ALGO SALIÓ\nMAL')).toBeTruthy()

    fireEvent.press(getByText('Intentar de nuevo'))

    expect(getByText('todo bien')).toBeTruthy()
  })
})
