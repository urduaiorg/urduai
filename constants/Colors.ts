/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// UrduAI brand tokens
const urduAi = {
  gold: '#FFD700',
  goldDeep: '#FFA500',
  teal: '#40E0D0',
  blue: '#4A90E2',
  white: '#FFFFFF',
  black: '#000000',
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    brand: {
      primary: urduAi.gold,
      secondary: urduAi.teal,
      accent: urduAi.blue,
      onPrimary: urduAi.black,
      onBackground: '#11181C',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.6)',
      border: 'rgba(0, 0, 0, 0.08)',
      elevated: 'rgba(255, 255, 255, 0.75)',
      text: '#11181C',
    },
    gradients: {
      brand: [urduAi.teal, urduAi.blue],
      primary: [urduAi.gold, urduAi.goldDeep],
      subtleGlass: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
    },
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    brand: {
      primary: urduAi.gold,
      secondary: urduAi.teal,
      accent: urduAi.blue,
      onPrimary: urduAi.black,
      onBackground: '#ECEDEE',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.18)',
      elevated: 'rgba(255, 255, 255, 0.12)',
      text: '#ECEDEE',
    },
    gradients: {
      brand: [urduAi.teal, urduAi.blue],
      primary: [urduAi.gold, urduAi.goldDeep],
      subtleGlass: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)'],
    },
  },
};
