import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { EmptyState } from '../EmptyState'

describe('EmptyState', () => {
  it('renders the message and optional action', () => {
    const onAction = jest.fn()

    const { getByText } = render(
      <EmptyState
        title="Sin anuncios"
        message="Todavía no hay anuncios publicados."
        actionLabel="Reintentar"
        onAction={onAction}
      />,
    )

    expect(getByText('Sin anuncios')).toBeTruthy()
    expect(getByText('Todavía no hay anuncios publicados.')).toBeTruthy()

    fireEvent.press(getByText('Reintentar'))
    expect(onAction).toHaveBeenCalledTimes(1)
  })
})
