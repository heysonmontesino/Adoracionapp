import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Text, TouchableOpacity } from 'react-native'
import { ToastProvider, useToast } from '../Toast'

function ToastHarness() {
  const { showToast, hideToast } = useToast()

  return (
    <>
      <TouchableOpacity
        onPress={() => showToast({ message: 'Guardado correctamente', tone: 'success' })}
      >
        <Text>show</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={hideToast}>
        <Text>hide</Text>
      </TouchableOpacity>
    </>
  )
}

describe('ToastProvider', () => {
  it('shows and hides a toast message', async () => {
    const { getByText, queryByText } = render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    )

    fireEvent.press(getByText('show'))
    expect(getByText('Guardado correctamente')).toBeTruthy()

    fireEvent.press(getByText('hide'))

    await waitFor(() => {
      expect(queryByText('Guardado correctamente')).toBeNull()
    })
  })
})
