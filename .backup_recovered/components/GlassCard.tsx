import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type GlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  withSubtleGradient?: boolean;
  border?: boolean;
};

export default function GlassCard({
  children,
  style,
  intensity = 30,
  withSubtleGradient = true,
  border = true,
}: GlassCardProps) {
  const scheme = useColorScheme() ?? 'light';
  const glass = Colors[scheme].glass;
  const subtle = Colors[scheme].gradients.subtleGlass;

  return (
    <View
      style={[
        styles.container,
        border && { borderColor: glass.border, borderWidth: StyleSheet.hairlineWidth + 1 },
        style,
      ]}
    >
      <BlurView intensity={intensity} tint={scheme} style={StyleSheet.absoluteFillObject} />
      {withSubtleGradient && (
        <LinearGradient
          pointerEvents="none"
          colors={subtle as any}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  content: {
    padding: 24,
  },
});


