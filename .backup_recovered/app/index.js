import React, { useRef, useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, Platform, StatusBar, Linking, Alert, View, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../notifications';
import * as Sharing from 'expo-sharing';
import * as Network from 'expo-network';
import { logEvent } from '../analytics';
import { useLocalization } from '../hooks/useLocalization';
import * as Haptics from 'expo-haptics';
import OfflineContent from '../components/OfflineContent';
import performanceMonitor from '../utils/performance';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { StatusBar as StatusBarExpo } from 'expo-status-bar';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { useRouter } from 'expo-router';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';

export default function App() {
  const { t, isRTL } = useLocalization();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);
  const webviewRef = useRef(null);

  // Retry connection function
  const retryConnection = async () => {
    const retryStartTime = Date.now();
    performanceMonitor.trackUserInteraction('connection_retry_initiated', 'retry_button');
    setIsRetrying(true);
    
    try {
      const state = await Network.getNetworkStateAsync();
      if (state.isConnected) {
        const retryDuration = Date.now() - retryStartTime;
        setIsOffline(false);
        logEvent('connection_retry_success');
        performanceMonitor.trackUserInteraction('connection_retry_success', 'retry_button', retryDuration);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('Still offline');
      }
    } catch (error) {
      logEvent('connection_retry_failed');
      performanceMonitor.trackError(error, { context: 'connection_retry' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Stay offline
    } finally {
      setIsRetrying(false);
    }
  };

  // Register for push notifications and initialize app
  useEffect(() => {
    // Track app initialization
    performanceMonitor.startTimer('app_init');
    
    // Initialize app
    const initializeApp = async () => {
      try {
        logEvent('app_initialized', { version: '1.0.1' });
        
        // Check network status
        await checkNetwork();
        
        // Initialize performance monitoring
        const performanceMonitor = new PerformanceMonitor();
        await performanceMonitor.startMonitoring();
        
        // Simulate app loading time
        setTimeout(() => {
          setLoading(false);
          logEvent('app_ready', { 
            loadTime: Date.now() - performance.now(),
            isOnline: isOnline 
          });
        }, 2000);
        
      } catch (error) {
        console.error('App initialization error:', error);
        setLoading(false);
      }
    };

    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsOffline(!state.isConnected);
      setIsOnline(state.isConnected);
      logEvent('network_status', { isOffline: !state.isConnected });
    };

    initializeApp();
    
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        logEvent('push_token_registered', { token });
        console.log('Expo Push Token:', token);
      }
    });

    // Listen for incoming notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      logEvent('notification_received', { title: notification.request.content.title });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('notificationTitle'), notification.request.content.body || t('notificationDefault'));
    });
    
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
    };
  }, []);

  // Network status monitoring for offline support
  useEffect(() => {
    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsOffline(!state.isConnected);
      logEvent('network_status', { isOffline: !state.isConnected });
    };
    checkNetwork();
    const interval = setInterval(checkNetwork, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle incoming deep links
  useEffect(() => {
    const handleDeepLink = (event) => {
      logEvent('deep_link_opened', { url: event.url });
      if (webviewRef.current && event.url) {
        webviewRef.current.injectJavaScript(`window.location.href = '${event.url}'; true;`);
      }
    };
    Linking.addEventListener('url', handleDeepLink);
    return () => {
      Linking.removeEventListener('url', handleDeepLink);
    };
  }, []);

  // Send performance reports periodically
  useEffect(() => {
    const performanceReportInterval = setInterval(() => {
      performanceMonitor.sendPerformanceReport();
    }, 300000); // Every 5 minutes

    return () => clearInterval(performanceReportInterval);
  }, []);

  // Share current lesson or app link
  const handleShare = async () => {
    const shareStartTime = Date.now();
    performanceMonitor.trackUserInteraction('share_initiated', 'share_button');

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Sharing.shareAsync(undefined, {
        dialogTitle: t('shareDialogTitle'),
        mimeType: 'text/plain',
        UTI: 'public.text',
        message: t('shareMessage'),
      });

      const shareDuration = Date.now() - shareStartTime;
      logEvent('share_app');
      performanceMonitor.trackUserInteraction('share_completed', 'share_button', shareDuration);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      performanceMonitor.trackError(error, { context: 'share_functionality' });
      Alert.alert(t('shareFailed'), error.message);
    }
  };

  // Navigate to Ai Videis landing page
  const navigateToAiVideis = () => {
    performanceMonitor.trackUserInteraction('ai_videis_navigation', 'floating_button');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/ai-videis');
  };

  // Handle WebView navigation
  const handleWebViewNavigation = (url) => {
    logEvent('webview_navigation', { url });
  };

  if (isOffline) {
    return (
      <LinearGradient
        colors={['#40E0D0', '#4A90E2']}
        style={styles.container}
      >
        <StatusBarExpo style="light" backgroundColor="#40E0D0" />
        <OfflineContent 
          onRetry={retryConnection}
          isRetrying={isRetrying}
          t={t}
        />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#40E0D0', '#4A90E2']}
      style={styles.container}
    >
      <StatusBarExpo style="light" backgroundColor="#40E0D0" />
      {/* Branded Glass Header */}
      <View pointerEvents="box-none" style={styles.headerWrapper}>
        <BlurView intensity={30} tint="dark" style={styles.headerBlur} />
        <View style={styles.headerContent}>
          <Text style={styles.brandTitle}>
            <Text style={styles.brandUrdu}>{t('urdu')}</Text>
            <Text style={styles.brandAi}>{t('ai')}</Text>
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity activeOpacity={0.85} onPress={handleShare} style={styles.iconButton}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.iconButtonGradient}>
                <Text style={styles.iconEmoji}>🔗</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.webViewContainer}>
          <WebView
            ref={webviewRef}
            key={webViewKey}
            source={{ uri: 'https://urduai.org' }}
            style={styles.webView}
            onLoadStart={() => {
              setLoading(true);
              logEvent('webview_load_start');
            }}
            onLoadEnd={() => {
              setLoading(false);
              logEvent('webview_load_end');
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              logEvent('webview_error', { error: nativeEvent.description });
              setLoading(false);
            }}
            userAgent="UrduAI-Mobile/1.0.1"
            allowsBackForwardNavigationGestures={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color="#FFD700" size="large" />
              </View>
            )}
            onNavigationStateChange={(navState) => {
              handleWebViewNavigation(navState.url);
            }}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url;
              
              // Allow navigation within urduai.org domain
              if (url.includes('urduai.org')) {
                return true;
              }
              
              // Handle external links
              try {
                if (url.startsWith('http') || url.startsWith('https')) {
                  logEvent('webview_external_navigation', { url });
                  Linking.openURL(url);
                  return false;
                }
              } catch (e) {
                return true;
              }
            }}
            onMessage={(event) => {
              // Handle messages from the web content
              try {
                const message = JSON.parse(event.nativeEvent.data);
                logEvent('webview_message', { type: message.type });
                
                // Handle different message types
                switch (message.type) {
                  case 'share':
                    handleShare();
                    break;
                  case 'notification':
                    if (message.content) {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert(t('notificationTitle'), message.content);
                    }
                    break;
                  default:
                    break;
                }
              } catch (error) {
                console.warn('Error parsing WebView message:', error);
              }
            }}
            injectedJavaScript={`
              // Inject custom JavaScript for better integration
              (function() {
                // Add native app bridge
                window.UrduAI = {
                  version: '1.0.1',
                  platform: '${Platform.OS}',
                  isNativeApp: true,
                  language: 'ur',
                  share: function(content) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'share',
                      content: content
                    }));
                  },
                  notify: function(message) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'notification',
                      content: message
                    }));
                  }
                };
                
                // Add RTL support to body
                document.body.dir = 'rtl';
                document.body.lang = 'ur';
                
                // Add custom styles for mobile optimization
                const style = document.createElement('style');
                style.textContent = \`
                  * {
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    -khtml-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                  }
                  
                  body {
                    font-family: 'Montserrat', sans-serif;
                    overflow-x: hidden;
                  }
                  
                  .urdu-text {
                    direction: rtl;
                    text-align: right;
                  }
                \`;
                document.head.appendChild(style);
                
                true; // Required for injection
              })();
            `}
          />
        </View>
      </SafeAreaView>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingTitle}>
              <Text style={styles.urduText}>{t('urdu')}</Text>
              <Text style={styles.aiText}>{t('ai')}</Text>
            </Text>
            <ActivityIndicator color="#FFD700" size="large" style={{ marginTop: 20 }} />
            <Text style={styles.loadingSubtitle}>{t('loading')}</Text>
            <Text style={styles.nativeFeatureText}>
              🚀 {t('initializingNativeFeatures')}
            </Text>
          </View>
        </View>
      )}

      {/* Floating Action Button for Ai Videis */}
      {!loading && !isOffline && (
        <View style={styles.primaryCtaWrapper}>
          <PrimaryButton
            size="lg"
            emojiLeft="🎬"
            label={t('aiVideisHeroVideis')}
            onPress={navigateToAiVideis}
            style={styles.primaryCta}
          />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'android' ? 80 : 100,
    zIndex: 10,
  },
  headerBlur: {
    ...StyleSheet.absoluteFillObject,
    borderBottomWidth: StyleSheet.hairlineWidth + 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  headerContent: {
    marginTop: Platform.OS === 'android' ? 20 : 40,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    textAlign: 'left',
  },
  brandUrdu: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
  },
  brandAi: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconButtonGradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 36,
  },
  iconEmoji: {
    fontSize: 16,
    color: '#000',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(64, 224, 208, 0.95)',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadingTitle: {
    fontSize: 48,
    textAlign: 'center',
  },
  urduText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
  },
  aiText: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
  },
  loadingSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
  },
  nativeFeatureText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 15,
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
    opacity: 0.8,
  },
  primaryCtaWrapper: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  primaryCta: {
    borderRadius: 28,
  },
});