import { TextStyle } from 'react-native'

export const Typography = {
  displayLg: {
    fontFamily: 'HUMANE-Bold',
    fontSize: 56,
    lineHeight: 56,
    letterSpacing: 0,
  } satisfies TextStyle,
  headlineMd: {
    fontFamily: 'HUMANE-Bold',
    fontSize: 28,
    lineHeight: 28,
  } satisfies TextStyle,
  titleLg: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 22,
    lineHeight: 28,
  } satisfies TextStyle,
  bodyLg: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 16,
    lineHeight: 26,
  } satisfies TextStyle,
  labelMd: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } satisfies TextStyle,
} as const
