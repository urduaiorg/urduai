import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface OfflineContentProps {
  onRetry: () => void;
  isRetrying: boolean;
  t: (key: string) => string;
}

const OfflineContent: React.FC<OfflineContentProps> = ({ onRetry, isRetrying, t }) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [retryAttempts, setRetryAttempts] = useState(0);

  useEffect(() => {
    // Pulse animation for the icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRetryAttempts(prev => prev + 1);
    onRetry();
  };

  const cachedContent = [
    {
      title: t('ai'),
      description: t('artificialIntelligence'),
      content: 'مصنوعی ذہانت کے بنیادی اصول',
    },
    {
      title: t('machinelearning'),
      description: 'Machine Learning کی بنیادی باتیں',
      content: 'مشین لرننگ کے اہم نکات',
    },
    {
      title: t('deepLearning'),
      description: 'Deep Learning کا تعارف',
      content: 'ڈیپ لرننگ کی بنیادی معلومات',
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.iconText}>📡</Text>
        </Animated.View>
        <Text style={styles.title}>{t('appName')}</Text>
        <Text style={styles.subtitle}>{t('offlineTitle')}</Text>
      </View>

      <View style={styles.messageContainer}>
        <Text style={styles.message}>{t('offlineMessage')}</Text>
        {retryAttempts > 0 && (
          <Text style={styles.retryCount}>
            {t('retry')} {retryAttempts} / 5
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <ActivityIndicator color="#003366" size="small" />
          ) : (
            <Text style={styles.buttonText}>{t('retry')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.cachedContentContainer}>
        <Text style={styles.cachedTitle}>محفوظ کردہ مواد</Text>
        {cachedContent.map((item, index) => (
          <TouchableOpacity key={index} style={styles.cachedItem}>
            <Text style={styles.cachedItemTitle}>{item.title}</Text>
            <Text style={styles.cachedItemDescription}>{item.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>تجاویز</Text>
        <Text style={styles.tipText}>• Wi-Fi یا موبائل ڈیٹا چیک کریں</Text>
        <Text style={styles.tipText}>• ایپ دوبارہ شروع کریں</Text>
        <Text style={styles.tipText}>• کچھ وقت بعد دوبارہ کوشش کریں</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#003366',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFD700',
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Montserrat-Regular',
    lineHeight: 24,
  },
  retryCount: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Montserrat-Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 40,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#FFD700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  buttonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-SemiBold',
  },
  secondaryButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-SemiBold',
  },
  cachedContentContainer: {
    width: '100%',
    marginBottom: 30,
  },
  cachedTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  cachedItem: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  cachedItemTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 5,
  },
  cachedItemDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Montserrat-Regular',
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  tipsTitle: {
    fontSize: 18,
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 5,
    textAlign: 'right',
  },
});

export default OfflineContent; 