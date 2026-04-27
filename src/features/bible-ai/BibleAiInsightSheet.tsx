import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Pressable } from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { Tokens } from '../../shared/constants/tokens'
import type { BibleAiInsight } from './types'

type BibleAiInsightSheetProps = {
  visible: boolean
  onClose: () => void
  insight: BibleAiInsight | null
  loading: boolean
  error: string | null
}

export function BibleAiInsightSheet({ visible, onClose, insight, loading, error }: BibleAiInsightSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>

        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Tokens.colors.primary} />
              <Text style={styles.loadingText}>Consultando IA...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="rgba(255,100,100,0.8)" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.closeBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          ) : insight ? (
            <>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.title}>{insight.title}</Text>
                  {insight.subtitle && <Text style={styles.subtitle}>{insight.subtitle}</Text>}
                </View>
                <TouchableOpacity style={styles.closeIcon} onPress={onClose} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {insight.sections.map((section, index) => (
                  <View key={index} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <Text style={styles.sectionBody}>{section.body}</Text>
                  </View>
                ))}

                <View style={styles.disclaimer}>
                  <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.disclaimerText}>{insight.disclaimer}</Text>
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.doneBtnText}>Entendido</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#1A1826',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingBottom: 42,
    paddingHorizontal: 24,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  dragHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 14,
    color: 'rgba(255,100,100,0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 28,
    color: Tokens.colors.textPrimary,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 11,
    color: Tokens.colors.primary,
    letterSpacing: 1,
    marginTop: 4,
  },
  closeIcon: {
    marginTop: -4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 14,
    color: Tokens.colors.primary,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sectionBody: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.82)',
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  disclaimerText: {
    flex: 1,
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.45)',
  },
  doneBtn: {
    marginTop: 20,
    height: 54,
    borderRadius: 18,
    backgroundColor: Tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 13,
    color: '#0D0B14',
    letterSpacing: 1,
  },
  closeBtn: {
    marginTop: 12,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 12,
    color: Tokens.colors.textPrimary,
    letterSpacing: 0.8,
  },
})
