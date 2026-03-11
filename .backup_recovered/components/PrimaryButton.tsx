import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  emojiLeft?: string;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg';
  disabled?: boolean;
};

export default function PrimaryButton({
  label,
  onPress,
  emojiLeft,
  style,
  size = 'md',
  disabled = false,
}: PrimaryButtonProps) {
  const scheme = useColorScheme() ?? 'light';
  const gradient = Colors[scheme].gradients.primary as string[];
  const textColor = Colors[scheme].brand.onPrimary;

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={disabled}
      style={[styles.touchable, style, disabled && { opacity: 0.7 }]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, size === 'lg' ? styles.lg : styles.md]}
      >
        {emojiLeft ? <Text style={[styles.emoji, { color: textColor }]}>{emojiLeft}</Text> : null}
        <Text style={[styles.label, { color: textColor }, size === 'lg' ? styles.labelLg : null]}>
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  md: {
    minHeight: 44,
  },
  lg: {
    minHeight: 54,
  },
  label: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
  },
  labelLg: {
    fontSize: 18,
  },
  emoji: {
    fontSize: 18,
  },
});


