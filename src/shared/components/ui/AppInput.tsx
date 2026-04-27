import { useState } from 'react'
import { TextInput, Text, View, StyleSheet, TextInputProps } from 'react-native'
import { Tokens } from '../../constants/tokens'

interface AppInputProps extends TextInputProps {
  error?: string
}

export function AppInput({ error, style, ...props }: AppInputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          !!error && styles.inputError,
          style,
        ]}
        placeholderTextColor={Tokens.colors.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Tokens.spacing[12],
  },
  input: {
    width: '100%',
    height: Tokens.sizing.buttonHeight,
    backgroundColor: Tokens.colors.surfaceLow,
    borderRadius: Tokens.radius.card,
    paddingHorizontal: Tokens.spacing[16],
    color: Tokens.colors.textPrimary,
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: Tokens.typography.fontSize.body,
    borderWidth: 1,
    borderColor: Tokens.colors.surfaceLow,
  },
  inputFocused: {
    borderColor: Tokens.colors.primary,
  },
  inputError: {
    borderColor: Tokens.colors.error,
  },
  errorText: {
    color: Tokens.colors.error,
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: Tokens.typography.fontSize.caption,
    marginTop: Tokens.spacing[4],
  },
})
