import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Button } from '../Button'

describe('Button', () => {
  it('renders the label', () => {
    const { getByText } = render(<Button label="Continuar" onPress={() => {}} />)
    expect(getByText('Continuar')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Button label="Tap" onPress={onPress} />)
    fireEvent.press(getByText('Tap'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Button label="Disabled" onPress={onPress} disabled />)
    fireEvent.press(getByText('Disabled'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('does not call onPress when isLoading', () => {
    const onPress = jest.fn()
    const { queryByText, getByTestId } = render(
      <Button label="Loading" onPress={onPress} isLoading testID="btn" />,
    )
    fireEvent.press(getByTestId('btn'))
    expect(onPress).not.toHaveBeenCalled()
    expect(queryByText('Loading')).toBeNull()
  })
})
