import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Share, Alert, Animated, Easing } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { recordBlogRead } from '../services/engagementStats';
import { recordWeeklyProgressEvent } from '../services/weeklyProgressService';

export default function ArticleReaderScreen() {
  const { url, title, image, date, category, excerpt } = useLocalSearchParams();
  const router = useRouter();
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  const resolvedUrl = Array.isArray(url) ? url[0] : url;
  const resolvedTitle = Array.isArray(title) ? title[0] : title;
  const resolvedImage = Array.isArray(image) ? image[0] : image;
  const resolvedDate = Array.isArray(date) ? date[0] : date;
  const resolvedCategory = Array.isArray(category) ? category[0] : category;
  const resolvedExcerpt = Array.isArray(excerpt) ? excerpt[0] : excerpt;
  const spinnerAnim = useRef(new Animated.Value(0)).current;
  const articleCleanupScript = `
    (function() {
      var style = document.createElement('style');
      style.innerHTML = [
        'header, nav, .site-header, .main-header, .top-header, .topbar, .header-top, .header-bottom, .navbar, .nav-bar, .elementor-location-header, .ast-above-header, .ast-primary-header-bar, .site-branding, .mobile-menu, .menu-toggle, .search-toggle, .search-form, .search-bar, .elementor-widget-social-icons { display: none !important; }',
        'body { margin-top: 0 !important; padding-top: 0 !important; }',
        'html, body, main, article, .site-main, .content-area, .entry-content, .elementor-location-single { background: #ffffff !important; }',
        'main, article, .site-main, .content-area { margin-top: 0 !important; }'
      ].join(' ');
      document.head.appendChild(style);
      window.scrollTo(0, 0);
      true;
    })();
  `;

  useEffect(() => {
    if (resolvedUrl?.includes('urduai.org')) {
      recordBlogRead(resolvedUrl);
      recordWeeklyProgressEvent('blog', resolvedUrl);
    }
  }, [resolvedUrl]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinnerAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();

    return () => {
      loop.stop();
      spinnerAnim.setValue(0);
    };
  }, [spinnerAnim]);

  const spinnerStyle = {
    transform: [
      {
        rotate: spinnerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  const formatPostDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Intl.DateTimeFormat('ur-PK', {
        day: 'numeric',
        month: 'short',
      }).format(new Date(dateString));
    } catch {
      return '';
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/');
  };

  const handleShare = async () => {
    if (!resolvedUrl) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: resolvedTitle || 'Urdu Ai Article',
        message: `${resolvedTitle ? `${resolvedTitle}\n\n` : ''}Urdu Ai پر یہ مضمون پڑھیں:\n${resolvedUrl}`,
        url: resolvedUrl,
      });
    } catch {
      // ignore share failures
    }
  };

  const handleSave = async () => {
    if (!resolvedUrl) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const stored = await AsyncStorage.getItem('urdu_ai_bookmarks');
      const bookmarks = stored ? JSON.parse(stored) : [];
      if (bookmarks.some((bookmark: any) => bookmark.url === resolvedUrl)) {
        Alert.alert('پہلے سے محفوظ', 'یہ مضمون پہلے ہی آپ کے بک مارکس میں موجود ہے۔');
        return;
      }

      const nextBookmark = {
        url: resolvedUrl,
        title: resolvedTitle || 'Urdu Ai Article',
        date: new Date().toISOString(),
      };

      await AsyncStorage.setItem('urdu_ai_bookmarks', JSON.stringify([nextBookmark, ...bookmarks]));
      Alert.alert('محفوظ ہوگیا', 'یہ مضمون آپ کے بک مارکس میں شامل کر دیا گیا ہے۔');
    } catch {
      Alert.alert('خرابی', 'مضمون محفوظ نہیں ہو سکا۔');
    }
  };

  if (!resolvedUrl) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor="#003366" />
        <LinearGradient colors={['#003366', '#001933']} style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>واپس</Text>
            <Text style={styles.backEmoji}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitleFallback}>مضمون</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>مضمون دستیاب نہیں</Text>
          <TouchableOpacity onPress={handleBack} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>واپس جائیں</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#003366" />
      <LinearGradient colors={['#003366', '#001933']} style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>واپس</Text>
          <Text style={styles.backEmoji}>←</Text>
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.brandTitle} allowFontScaling={false}>
            <Text style={styles.brandUrdu}>{'\u200EUrdu '}</Text>
            <Text style={styles.brandAi}>{'\u200EAi'}</Text>
          </Text>
        </View>

        <TouchableOpacity onPress={handleHome} style={styles.homeButton} activeOpacity={0.82}>
          <Text style={styles.homeText}>ہوم</Text>
          <Text style={styles.homeEmoji}>⌂</Text>
        </TouchableOpacity>
      </LinearGradient>

      {isPageLoaded ? (
        <View style={styles.actionStrip}>
          <TouchableOpacity style={styles.actionStripButton} activeOpacity={0.86} onPress={handleSave}>
            <Text style={styles.actionStripText}>محفوظ کریں</Text>
            <Text style={styles.actionStripEmoji}>✦</Text>
          </TouchableOpacity>

          <View style={styles.actionStripDivider} />

          <TouchableOpacity style={styles.actionStripButton} activeOpacity={0.86} onPress={handleShare}>
            <Text style={styles.actionStripText}>شیئر کریں</Text>
            <Text style={styles.actionStripEmoji}>↗</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <WebView
        source={{ uri: resolvedUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled={true}
        userAgent="UrduAI-Mobile/3.0.1"
        injectedJavaScript={articleCleanupScript}
        startInLoadingState={true}
        onLoadEnd={() => setIsPageLoaded(true)}
        renderLoading={() => (
          <LinearGradient colors={['#003366', '#001933']} style={styles.loadingState}>
            <View style={styles.loadingCard}>
              {resolvedImage ? (
                <Image source={{ uri: resolvedImage }} style={styles.loadingImage} resizeMode="cover" />
              ) : (
                <View style={styles.loadingImageFallback}>
                  <Text style={styles.loadingImageFallbackText}>Urdu Ai</Text>
                </View>
              )}

              <View style={styles.loadingMetaRow}>
                <View style={styles.loadingMetaPill}>
                  <Text style={styles.loadingMetaPillText}>{resolvedCategory || 'Blog'}</Text>
                </View>
                <Text style={styles.loadingDate}>{formatPostDate(resolvedDate)}</Text>
              </View>

              {resolvedTitle ? (
                <Text style={styles.loadingTitle} numberOfLines={3}>
                  {resolvedTitle}
                </Text>
              ) : null}

              {resolvedExcerpt ? (
                <Text style={styles.loadingExcerpt} numberOfLines={2}>
                  {resolvedExcerpt}
                </Text>
              ) : null}

              <View style={styles.loadingIndicatorRow}>
                <Animated.View style={[styles.loadingSpinnerWrap, spinnerStyle]}>
                  <Ionicons name="sync-outline" size={21} color="#FFD700" />
                </Animated.View>
                <Text style={styles.loadingIndicatorText}>مضمون کھولا جا رہا ہے...</Text>
              </View>
            </View>
          </LinearGradient>
        )}
      />

      {!isPageLoaded ? (
        <LinearGradient pointerEvents="none" colors={['#003366', '#001933']} style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            {resolvedImage ? (
              <Image source={{ uri: resolvedImage }} style={styles.loadingImage} resizeMode="cover" />
            ) : (
              <View style={styles.loadingImageFallback}>
                <Text style={styles.loadingImageFallbackText}>Urdu Ai</Text>
              </View>
            )}

            <View style={styles.loadingMetaRow}>
              <View style={styles.loadingMetaPill}>
                <Text style={styles.loadingMetaPillText}>{resolvedCategory || 'Blog'}</Text>
              </View>
              <Text style={styles.loadingDate}>{formatPostDate(resolvedDate)}</Text>
            </View>

            {resolvedTitle ? (
              <Text style={styles.loadingTitle} numberOfLines={3}>
                {resolvedTitle}
              </Text>
            ) : null}

            {resolvedExcerpt ? (
              <Text style={styles.loadingExcerpt} numberOfLines={2}>
                {resolvedExcerpt}
              </Text>
            ) : null}

            <View style={styles.loadingIndicatorRow}>
              <Animated.View style={[styles.loadingSpinnerWrap, spinnerStyle]}>
                <Ionicons name="sync-outline" size={21} color="#FFD700" />
              </Animated.View>
              <Text style={styles.loadingIndicatorText}>مضمون کھولا جا رہا ہے...</Text>
            </View>
          </View>
        </LinearGradient>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001933' },
  header: {
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    minWidth: 84,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 24,
    includeFontPadding: false,
  },
  backEmoji: {
    color: '#FFD700',
    fontSize: 18,
    marginLeft: 6,
  },
  titleWrap: {
    flex: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 21,
    writingDirection: 'ltr',
    textAlign: 'center',
    includeFontPadding: false,
  },
  brandUrdu: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 21,
    writingDirection: 'ltr',
  },
  brandAi: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 21,
    writingDirection: 'ltr',
  },
  headerTitleFallback: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    textAlign: 'right',
  },
  subtitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
  headerSpacer: {
    width: 84,
  },
  homeButton: {
    minWidth: 84,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  homeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 24,
    includeFontPadding: false,
  },
  homeEmoji: {
    color: '#FFD700',
    fontSize: 17,
    marginLeft: 6,
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  actionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 52,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  actionStripButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionStripDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  actionStripText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 24,
    includeFontPadding: false,
  },
  actionStripEmoji: {
    color: '#FFD700',
    fontSize: 14,
    marginLeft: 7,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 81,
    padding: 18,
    justifyContent: 'center',
  },
  loadingCard: {
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  loadingImage: {
    width: '100%',
    height: 190,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  loadingImageFallback: {
    width: '100%',
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  loadingImageFallbackText: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 28,
  },
  loadingMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  loadingMetaPill: {
    backgroundColor: 'rgba(255,215,0,0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  loadingMetaPillText: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
  },
  loadingDate: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 11,
  },
  loadingTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
    lineHeight: 32,
    textAlign: 'right',
    paddingHorizontal: 18,
    marginTop: 14,
  },
  loadingExcerpt: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    paddingHorizontal: 18,
    marginTop: 10,
  },
  loadingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  loadingIndicatorText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 13,
  },
  loadingSpinnerWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.28)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    marginBottom: 18,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#FFD700',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  errorButtonText: {
    color: '#003366',
    fontFamily: 'Montserrat-Bold',
    fontSize: 15,
  },
});
