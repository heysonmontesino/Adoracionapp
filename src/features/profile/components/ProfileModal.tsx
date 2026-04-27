import React from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppButton } from '../../../shared/components/ui/AppButton'
import { Tokens } from '../../../shared/constants/tokens'
import { signOut } from '../../../features/auth/repository'
import { MOCK_DATA } from '../../../shared/utils/mockData'
import { Config } from '../../../shared/constants/config'
import { useProgress, useUpdateCharacterOverride } from '../../progress/hooks/useProgress'
import { buildProgressSnapshot } from '../../progress/engine/progressEngine'
import { STAGES } from '../../progress/constants/stages'
import type { CharacterGender } from '../../character/types'

function Avatar({ name }: { name: string }) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?'
  return (
    <View style={styles.avatarRing}>
      <View style={styles.avatarInner}>
        <Text style={styles.avatarInitial}>{initial}</Text>
      </View>
    </View>
  )
}

function SectionRow({ label, onPress }: { label: string; onPress?: () => void }) {
  const isPlaceholder = !onPress
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={isPlaceholder}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={[styles.rowLabel, isPlaceholder && styles.rowLabelPlaceholder]}>{label}</Text>
      <Text style={[styles.chevron, { color: isPlaceholder ? 'rgba(229,223,253,0.2)' : 'rgba(229,223,253,0.35)' }]}>›</Text>
    </TouchableOpacity>
  )
}

function Section({ title, rows }: { title: string; rows: { label: string; onPress?: () => void }[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBlock}>
        {rows.map((row, i) => (
          <View key={row.label}>
            <SectionRow label={row.label} onPress={row.onPress} />
            {i < rows.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </View>
    </View>
  )
}

export function ProfileModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const profile = Config.DEMO_UI_MODE ? MOCK_DATA.profile : null

  const handleLogout = async () => {
    if (!Config.DEMO_UI_MODE) {
      await signOut()
    }
    onClose()
    router.replace('/(auth)/login')
  }

  const name = profile?.name ?? 'Usuario'
  const email = profile?.email ?? ''
  const memberSince = profile?.membershipDate ?? ''

  // QA preview controls — visible when Config.PREVIEW_QA_MODE is true (TestFlight review builds)
  const { data: progressData } = useProgress()
  const { mutate: updateOverride } = useUpdateCharacterOverride()
  const rawXP = progressData?.xp ?? 0
  const rawStreak = progressData?.streakDays ?? 0
  const stageOverride = progressData?.stageOverride ?? null
  const genderOverride = progressData?.genderOverride ?? null
  const realStageId = buildProgressSnapshot(rawXP, rawStreak).stage.id
  let currentStageId: number = realStageId
  if (typeof stageOverride === 'number') currentStageId = stageOverride
  else if (typeof stageOverride === 'string') {
    currentStageId = STAGES.find(s => s.characterStage === stageOverride)?.id ?? realStageId
  }
  const currentStage = STAGES.find(s => s.id === currentStageId) ?? STAGES[0]
  const hasOverride = stageOverride !== null || genderOverride !== null

  const stepStage = (delta: number) => {
    const nextId = Math.max(1, Math.min(5, currentStageId + delta))
    updateOverride({ stage: nextId, gender: genderOverride ?? null })
  }
  const setGender = (g: CharacterGender) => {
    updateOverride({ stage: stageOverride ?? null, gender: g })
  }
  const resetOverride = () => {
    updateOverride({ stage: null, gender: null })
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>PERFIL</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Tokens.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Identity card */}
          <View style={styles.identityCard}>
            <Avatar name={name} />
            <View style={styles.identityText}>
              <Text style={styles.identityName}>{name}</Text>
              <Text style={styles.identityChurch}>Miembro de Iglesia Adoración</Text>
              {!!email && <Text style={styles.identitySecondary}>{email}</Text>}
              {!!memberSince && <Text style={styles.identitySecondary}>Desde {memberSince}</Text>}
            </View>
          </View>

          <Section
            title="CUENTA"
            rows={[
              { label: 'Datos personales', onPress: () => { onClose(); router.push('/profile/personal-data') } },
              { label: 'Cuenta', onPress: () => { onClose(); router.push('/profile/account') } },
              { label: 'Acceso', onPress: () => { onClose(); router.push('/profile/detail?title=Acceso') } },
            ]}
          />

          <Section
            title="PREFERENCIAS"
            rows={[
              { label: 'Notificaciones', onPress: () => { onClose(); router.push('/profile/notifications') } },
              { label: 'Privacidad', onPress: () => { onClose(); router.push('/profile/detail?title=Privacidad') } },
              { label: 'Preferencias', onPress: () => { onClose(); router.push('/profile/detail?title=Preferencias') } },
            ]}
          />

          <Section
            title="AYUDA"
            rows={[
              { label: 'Ayuda', onPress: () => { onClose(); router.push('/profile/help') } },
              { label: 'Información', onPress: () => { onClose(); router.push('/profile/detail?title=Información') } },
            ]}
          />

          {Config.PREVIEW_QA_MODE && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>VISTA PREVIA</Text>
              <View style={styles.sectionBlock}>
                {/* Stage selector */}
                <View style={[styles.row, preview.controlRow]}>
                  <Text style={styles.rowLabel}>Etapa espiritual</Text>
                  <View style={preview.stageControl}>
                    <Pressable onPress={() => stepStage(-1)} style={preview.stageArrow}>
                      <Text style={preview.stageArrowText}>‹</Text>
                    </Pressable>
                    <Text style={preview.stageLabel}>{currentStage.visibleName}</Text>
                    <Pressable onPress={() => stepStage(1)} style={preview.stageArrow}>
                      <Text style={preview.stageArrowText}>›</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.separator} />
                {/* Gender selector */}
                <View style={[styles.row, preview.controlRow]}>
                  <Text style={styles.rowLabel}>Personaje</Text>
                  <View style={preview.genderGroup}>
                    {(['male', 'female'] as CharacterGender[]).map(g => (
                      <Pressable
                        key={g}
                        onPress={() => setGender(g)}
                        style={[preview.genderPill, genderOverride === g && preview.genderPillActive]}
                      >
                        <Text style={[preview.genderText, genderOverride === g && preview.genderTextActive]}>
                          {g === 'male' ? 'Hombre' : 'Mujer'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                {hasOverride && (
                  <>
                    <View style={styles.separator} />
                    <Pressable style={styles.row} onPress={resetOverride}>
                      <Text style={preview.resetLabel}>Restaurar vista real</Text>
                      <Text style={[styles.chevron, { color: 'rgba(229,223,253,0.35)' }]}>›</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Logout */}
          <View style={styles.logoutBlock}>
            <AppButton
              label="Cerrar sesión"
              variant="secondary"
              onPress={handleLogout}
              style={styles.logoutButton}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Tokens.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Tokens.spacing.screenPadding,
    paddingTop: Tokens.spacing[24],
    paddingBottom: Tokens.spacing[16],
  },
  modalTitle: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: Tokens.typography.fontSize.h2,
    color: Tokens.colors.textPrimary,
    letterSpacing: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 223, 253, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Tokens.spacing.screenPadding,
    gap: Tokens.spacing[24],
  },

  // Avatar
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: Tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 223, 223, 0.05)',
  },
  avatarInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Tokens.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 32,
    color: Tokens.colors.primary,
    lineHeight: 36,
    letterSpacing: -0.5,
  },

  // Identity card
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing[16],
    backgroundColor: 'rgba(38, 36, 49, 0.9)',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  identityName: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 22,
    color: Tokens.colors.textPrimary,
    letterSpacing: -0.2,
  },
  identityChurch: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  identitySecondary: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.35)',
  },

  // Section
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingLeft: 4,
  },
  sectionBlock: {
    backgroundColor: 'rgba(22, 19, 42, 0.4)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rowLabel: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: 15,
    color: Tokens.colors.textPrimary,
  },
  rowLabelPlaceholder: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 20,
  },

  // Row chevron
  chevron: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.2)',
    fontFamily: Tokens.typography.fontFamily.regular,
  },

  // Logout
  logoutBlock: {
    marginTop: Tokens.spacing[8],
  },
  logoutButton: {
    borderColor: Tokens.colors.error + '22',
    backgroundColor: 'rgba(255, 77, 77, 0.02)',
  },
})

const preview = StyleSheet.create({
  controlRow: {
    justifyContent: 'space-between',
  },
  stageControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageArrowText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 18,
    color: Tokens.colors.primary,
    lineHeight: 22,
  },
  stageLabel: {
    fontFamily: Tokens.typography.fontFamily.semiBold,
    fontSize: 14,
    color: Tokens.colors.textPrimary,
    minWidth: 72,
    textAlign: 'center',
  },
  genderGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  genderPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  genderPillActive: {
    backgroundColor: Tokens.colors.primary,
    borderColor: Tokens.colors.primary,
  },
  genderText: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  genderTextActive: {
    color: '#000',
  },
  resetLabel: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: 15,
    color: 'rgba(229, 223, 253, 0.5)',
  },
})
