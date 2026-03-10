import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

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
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <View style={[styles.glowShell, style, disabled && { opacity: 0.7 }]}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        disabled={disabled}
        style={styles.touchable}
      >
        <LinearGradient
          colors={['#FFE168', '#FFD400', '#F9B800']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.gradient, size === 'lg' ? styles.lg : styles.md]}
        >
          <View style={styles.labelWrap}>
            <Text style={[styles.label, size === 'lg' ? styles.labelLg : null]}>{label}</Text>
          </View>
          {emojiLeft ? (
            <View style={[styles.iconBubble, size === 'lg' ? styles.iconBubbleLg : styles.iconBubbleMd]}>
              <Text style={styles.emoji}>{emojiLeft}</Text>
            </View>
          ) : null}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  glowShell: {
    borderRadius: 28,
    padding: 4,
    shadowColor: '#FFD400',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 20,
    elevation: 14,
  },
  touchable: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  md: {
    minHeight: 54,
    paddingLeft: 20,
    paddingRight: 10,
  },
  lg: {
    minHeight: 66,
    paddingLeft: 24,
    paddingRight: 12,
  },
  labelWrap: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#06376E',
  },
  labelLg: {
    fontSize: 18,
  },
  iconBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  iconBubbleMd: {
    width: 36,
    height: 36,
  },
  iconBubbleLg: {
    width: 44,
    height: 44,
  },
  emoji: {
    fontSize: 18,
  },
});

