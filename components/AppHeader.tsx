import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type HeaderAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  align?: 'left' | 'right';
};

type AppHeaderProps = {
  leftAction?: HeaderAction;
  rightAction?: HeaderAction;
  titleMain?: string;
  titleAccent?: string;
  subtitle?: string;
};

function HeaderActionButton({ label, icon, onPress, align = 'left' }: HeaderAction) {
  const isLeft = align === 'left';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.actionButton, isLeft ? styles.leftAligned : styles.rightAligned]}>
      {isLeft ? (
        <>
          <Ionicons name={icon} size={20} color="#FFD84D" />
          <Text style={styles.actionText}>{label}</Text>
        </>
      ) : (
        <>
          <Text style={styles.actionText}>{label}</Text>
          <Ionicons name={icon} size={20} color="#FFD84D" />
        </>
      )}
    </TouchableOpacity>
  );
}

export default function AppHeader({
  leftAction,
  rightAction,
  titleMain = 'Urdu',
  titleAccent = 'Ai',
  subtitle,
}: AppHeaderProps) {
  return (
    <LinearGradient colors={['#05356D', '#032F62', '#022651']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.shell}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.inner}>
          <View style={styles.side}>
            {leftAction ? <HeaderActionButton {...leftAction} align="left" /> : null}
          </View>

          <View style={styles.brandWrap}>
            <View style={styles.brandPill}>
              <Text style={styles.brandTitle}>
                <Text style={styles.brandMain}>{titleMain} </Text>
                <Text style={styles.brandAccent}>{titleAccent}</Text>
              </Text>
              {subtitle ? <Text style={styles.brandSubtitle}>{subtitle}</Text> : null}
            </View>
          </View>

          <View style={styles.side}>
            {rightAction ? <HeaderActionButton {...rightAction} align="right" /> : null}
          </View>
        </View>
      </SafeAreaView>
      <View style={styles.bottomLine} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120, 183, 255, 0.18)',
    shadowColor: '#00152D',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  safeArea: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  inner: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    width: 92,
    justifyContent: 'center',
  },
  brandWrap: {
    flex: 1,
    alignItems: 'center',
  },
  brandPill: {
    minWidth: 156,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
  },
  brandTitle: {
    textAlign: 'center',
  },
  brandMain: {
    color: '#F7FBFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
  },
  brandAccent: {
    color: '#FFD84D',
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
  },
  brandSubtitle: {
    marginTop: 2,
    color: 'rgba(207, 226, 248, 0.72)',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 10,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  leftAligned: {
    justifyContent: 'flex-start',
  },
  rightAligned: {
    justifyContent: 'flex-end',
  },
  actionText: {
    color: '#F6FAFF',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 15,
  },
  bottomLine: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
