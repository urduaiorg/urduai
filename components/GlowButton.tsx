import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type GlowButtonProps = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg';
};

export default function GlowButton({ label, onPress, icon, style, size = 'lg' }: GlowButtonProps) {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <View style={[styles.outerGlow, size === 'lg' ? styles.outerGlowLg : styles.outerGlowMd, style]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.touchable}>
        <LinearGradient colors={['#FFE168', '#FFD400', '#F9B800']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.button, size === 'lg' ? styles.buttonLg : styles.buttonMd]}>
          <View style={styles.textWrap}>
            <Text style={[styles.label, size === 'lg' ? styles.labelLg : null]}>{label}</Text>
          </View>
          {icon ? (
            <View style={styles.iconBubble}>
              <Ionicons name={icon} size={size === 'lg' ? 24 : 18} color="#08386F" />
            </View>
          ) : null}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outerGlow: {
    borderRadius: 999,
    shadowColor: '#FFD400',
    shadowOpacity: 0.46,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  outerGlowMd: {
    padding: 4,
  },
  outerGlowLg: {
    padding: 5,
  },
  touchable: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  button: {
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  buttonMd: {
    minHeight: 54,
    paddingLeft: 22,
    paddingRight: 10,
  },
  buttonLg: {
    minHeight: 68,
    paddingLeft: 26,
    paddingRight: 12,
  },
  textWrap: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    color: '#042E61',
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    textAlign: 'center',
  },
  labelLg: {
    fontSize: 18,
  },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
