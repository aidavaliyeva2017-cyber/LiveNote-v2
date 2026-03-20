import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Share,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/ProfileStack';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { FamilyMember } from '../../types/family';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Family'>;

// ─── Member Row ───────────────────────────────────────────────────────────────
const MemberRow = ({
  member,
  isMe,
  isOwner,
  onRemove,
}: {
  member: FamilyMember;
  isMe: boolean;
  isOwner: boolean;
  onRemove?: () => void;
}) => (
  <View style={styles.memberRow}>
    <View style={[styles.memberAvatar, { backgroundColor: member.color + '33', borderColor: member.color + '66' }]}>
      <Text style={[styles.memberInitials, { color: member.color }]}>
        {member.displayName.slice(0, 2).toUpperCase()}
      </Text>
    </View>
    <View style={styles.memberInfo}>
      <Text style={styles.memberName}>
        {member.displayName}{isMe ? ' (You)' : ''}
      </Text>
      <Text style={styles.memberEmail}>{member.memberEmail}</Text>
    </View>
    <View style={styles.memberRight}>
      {member.role === 'owner' && (
        <View style={styles.ownerBadge}>
          <Text style={styles.ownerBadgeText}>Owner</Text>
        </View>
      )}
      {isOwner && !isMe && member.role !== 'owner' && onRemove && (
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="person-remove-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// ─── Invite Sheet ─────────────────────────────────────────────────────────────
const InviteSheet = ({
  visible,
  code,
  familyName,
  onClose,
}: {
  visible: boolean;
  code: string;
  familyName: string;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await Share.share({
      message: `Join my family calendar "${familyName}" on LiveNote!\n\nInvite code: ${code}`,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Invite Members</Text>
        <Text style={styles.sheetSubtitle}>Share this code so others can join "{familyName}"</Text>

        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{code}</Text>
        </View>

        <TouchableOpacity style={styles.sheetBtn} onPress={handleCopy} activeOpacity={0.8}>
          <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={20} color={copied ? colors.success : colors.primary} />
          <Text style={[styles.sheetBtnText, copied && { color: colors.success }]}>
            {copied ? 'Copied!' : 'Copy Code'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.sheetBtn, styles.sheetBtnFilled]} onPress={handleShare} activeOpacity={0.8}>
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text style={[styles.sheetBtnText, { color: '#fff' }]}>Share Link</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sheetCancelBtn} onPress={onClose}>
          <Text style={styles.sheetCancelText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const FamilyScreen: React.FC<Props> = ({ navigation }) => {
  const { family, members, createFamily, leaveFamily } = useFamily();
  const { user, userName } = useAuth();
  const email = user?.email ?? '';

  const [createMode, setCreateMode] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);

  const myMember = members.find(m => m.memberEmail === email);
  const isOwner = myMember?.role === 'owner';

  const handleCreate = async () => {
    const name = familyName.trim();
    if (!name) return;
    if (!email) {
      Alert.alert('Error', 'Could not determine your account. Please sign out and back in.');
      return;
    }
    setLoadingCreate(true);
    try {
      await createFamily(name, email);
      setCreateMode(false);
      setFamilyName('');
    } catch (err: any) {
      Alert.alert('Could not create group', err?.message ?? 'Please try again.');
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleRemoveMember = (member: FamilyMember) => {
    Alert.alert(
      'Remove Member',
      `Remove ${member.displayName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveFamily(member.memberEmail);
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Could not remove member.');
            }
          },
        },
      ],
    );
  };

  const handleLeave = () => {
    Alert.alert(
      isOwner ? 'Delete Group' : 'Leave Group',
      isOwner
        ? 'This will delete the group and remove all members. This cannot be undone.'
        : 'Are you sure you want to leave this family group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isOwner ? 'Delete' : 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveFamily(email);
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Could not leave group.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      {/* Back header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Calendar</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── No Family ── */}
        {!family && !createMode && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Family Group</Text>
            <Text style={styles.emptySubtitle}>
              Create a group to share events with family or friends, or join an existing one with an invite code.
            </Text>

            <TouchableOpacity
              style={styles.primaryAction}
              activeOpacity={0.85}
              onPress={() => setCreateMode(true)}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Create a Group</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAction}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('JoinFamily')}
            >
              <Ionicons name="enter-outline" size={20} color={colors.primary} />
              <Text style={styles.secondaryActionText}>Join with Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Create Form ── */}
        {!family && createMode && (
          <View style={styles.createForm}>
            <Text style={styles.sectionTitle}>Create a Family Group</Text>
            <Text style={styles.sectionSubtitle}>Choose a name for your group</Text>

            <TextInput
              style={styles.nameInput}
              value={familyName}
              onChangeText={setFamilyName}
              placeholder="e.g. Smith Family"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />

            <TouchableOpacity
              style={styles.primaryAction}
              activeOpacity={0.85}
              onPress={handleCreate}
              disabled={loadingCreate || !familyName.trim()}
            >
              <LinearGradient
                colors={familyName.trim() ? [colors.primary, colors.primaryDark] : [colors.surfaceVariant, colors.surfaceVariant]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                {loadingCreate ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.actionBtnText, !familyName.trim() && { color: colors.textTertiary }]}>
                    Create Group
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setCreateMode(false); setFamilyName(''); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Has Family ── */}
        {family && (
          <>
            {/* Family header card */}
            <View style={styles.familyCard}>
              <View style={styles.familyCardTop}>
                <View style={styles.familyIconWrap}>
                  <Ionicons name="home-outline" size={28} color={colors.primary} />
                </View>
                <View style={styles.familyCardInfo}>
                  <Text style={styles.familyName}>{family.name}</Text>
                  <Text style={styles.familyMeta}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>
                </View>
                <TouchableOpacity
                  style={styles.inviteBtn}
                  onPress={() => setInviteVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                  <Text style={styles.inviteBtnText}>Invite</Text>
                </TouchableOpacity>
              </View>

              {/* Invite code display */}
              <View style={styles.codeRow}>
                <Ionicons name="key-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.codeLabel}>Invite code:</Text>
                <Text style={styles.codeValue}>{family.inviteCode}</Text>
                <TouchableOpacity
                  onPress={async () => {
                    await Clipboard.setStringAsync(family.inviteCode);
                    Alert.alert('Copied!', 'Invite code copied to clipboard.');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="copy-outline" size={14} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Members list */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Members</Text>
              {members.map(member => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isMe={member.memberEmail === email}
                  isOwner={isOwner}
                  onRemove={isOwner && member.role !== 'owner' ? () => handleRemoveMember(member) : undefined}
                />
              ))}
            </View>

            {/* Actions */}
            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} activeOpacity={0.8}>
              <Ionicons
                name={isOwner ? 'trash-outline' : 'exit-outline'}
                size={18}
                color={colors.error}
              />
              <Text style={styles.leaveBtnText}>
                {isOwner ? 'Delete Group' : 'Leave Group'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {family && (
        <InviteSheet
          visible={inviteVisible}
          code={family.inviteCode}
          familyName={family.name}
          onClose={() => setInviteVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.h3,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: colors.primary + '22',
    borderWidth: 1.5,
    borderColor: colors.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },

  primaryAction: { width: '100%', marginBottom: spacing.md },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  actionBtnText: {
    fontSize: typography.body,
    fontWeight: typography.bold as any,
    color: '#fff',
  },

  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.primary + '66',
    backgroundColor: colors.primary + '11',
    width: '100%',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: typography.body,
    fontWeight: typography.semibold as any,
    color: colors.primary,
  },

  // Create form
  createForm: { paddingTop: spacing.md },
  sectionTitle: {
    fontSize: 22,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.large,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelBtnText: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },

  // Family card
  familyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  familyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  familyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyCardInfo: { flex: 1 },
  familyName: {
    fontSize: typography.h3,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
  },
  familyMeta: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.primary + '22',
    borderWidth: 1,
    borderColor: colors.primary + '55',
  },
  inviteBtnText: {
    fontSize: typography.caption,
    fontWeight: typography.semibold as any,
    color: colors.primary,
  },

  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  codeLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  codeValue: {
    flex: 1,
    fontSize: typography.caption,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    letterSpacing: 3,
  },

  // Members card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.caption,
    fontWeight: typography.semibold as any,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  } as any,

  // Member row
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitials: {
    fontSize: typography.body,
    fontWeight: typography.bold as any,
  },
  memberInfo: { flex: 1 },
  memberName: {
    fontSize: typography.body,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  memberEmail: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ownerBadge: {
    backgroundColor: colors.primary + '22',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  ownerBadgeText: {
    fontSize: typography.tiny,
    color: colors.primary,
    fontWeight: typography.semibold as any,
  },

  // Leave
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.large,
    backgroundColor: colors.error + '11',
    borderWidth: 1,
    borderColor: colors.error + '33',
    marginBottom: spacing.md,
  },
  leaveBtnText: {
    fontSize: typography.body,
    fontWeight: typography.semibold as any,
    color: colors.error,
  },

  // Invite Sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: 48,
    gap: spacing.md,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: typography.h3,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  codeBox: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeText: {
    fontSize: 32,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    letterSpacing: 10,
  },
  sheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.primary + '55',
    backgroundColor: colors.primary + '11',
  },
  sheetBtnFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sheetBtnText: {
    fontSize: typography.body,
    fontWeight: typography.semibold as any,
    color: colors.primary,
  },
  sheetCancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  sheetCancelText: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
});
