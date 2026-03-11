import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, Platform, Alert, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../notifications';
import * as Network from 'expo-network';
import { logEvent } from '../analytics';
import { useLocalization } from '../hooks/useLocalization';
import * as Haptics from 'expo-haptics';
import OfflineContent from '../components/OfflineContent';
import DailyPromptChallenge from '../components/DailyPromptChallenge';
import performanceMonitor from '../utils/performance';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { StatusBar as StatusBarExpo } from 'expo-status-bar';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getStreakData } from '../services/streakService';
import { getBadgesForDisplay, checkAndAwardBadges } from '../services/badgeService';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const { t, isRTL } = useLocalization();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [stats, setStats] = useState({ currentStreak: 0, earnedBadges: 0, totalBadges: 12 });
  const [livePosts, setLivePosts] = useState([]);
  const [featuredPost, setFeaturedPost] = useState(null);
  const loadStats = async () => {
    await checkAndAwardBadges();
    const streakData = await getStreakData();
    const badges = await getBadgesForDisplay();
    setStats({
      currentStreak: streakData.currentStreak || 0,
      earnedBadges: badges.filter(b => b.earned).length,
      totalBadges: badges.length
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  const retryConnection = async () => {
    setIsRetrying(true);
    try {
      const state = await Network.getNetworkStateAsync();
      if (state.isConnected) {
        setIsOffline(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('Still offline');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setIsOffline(!state.isConnected);
        setTimeout(() => setLoading(false), 800);
        // Fetch live WordPress posts from urduai.org
        try {
          const wpResponse = await fetch('https://urduai.org/wp-json/wp/v2/posts?per_page=4&_embed');
          if (wpResponse.ok) {
            const postsData = await wpResponse.json();
            if (postsData && postsData.length > 0) {
              // Set the first post as featured
              setFeaturedPost(postsData[0]);
              // Set the next 3 as live posts (mini blogs)
              setLivePosts(postsData.slice(1, 4));
            }
          }
        } catch (wpError) {
          console.log('Failed to fetch WP posts:', wpError);
        }

      } catch (error) {
        setLoading(false);
      }
    };

    initializeApp();
    registerForPushNotificationsAsync().then(token => { });

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('notificationTitle'), notification.request.content.body || t('notificationDefault'));
    });

    return () => Notifications.removeNotificationSubscription(notificationListener);
  }, []);

  if (isOffline) {
    return (
      <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
        <StatusBarExpo style="light" backgroundColor="#40E0D0" />
        <OfflineContent onRetry={retryConnection} isRetrying={isRetrying} t={t} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
      <StatusBarExpo style="light" backgroundColor="#003366" />

      {/* Restored Native Streak Header */}
      <View pointerEvents="box-none" style={styles.headerWrapper}>
        <View style={styles.headerContent}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/achievements')} style={styles.streakPillContainer}>
            <View style={styles.streakPill}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>{stats.currentStreak} دن</Text>
              <Text style={styles.streakDivider}>|</Text>
              <Text style={styles.badgeText}>{stats.earnedBadges}/{stats.totalBadges}</Text>
              <Text style={styles.streakEmoji}>🏆</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Urdu <Text style={{ color: '#FFD700' }}>Ai</Text> کی تازہ اپڈیٹس</Text>
            <Text style={styles.heroSubtitle}>اے آئی کی دنیا کی تازہ اپڈیٹس آسان الفاظ میں۔</Text>
          </View>

          {/* Search Bar Mockup */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" />
            <Text style={styles.searchText}>اے آئی ٹولز، بلاگز یا کورسز تلاش کریں...</Text>
            <View style={styles.searchFilter}>
              <Ionicons name="options" size={20} color="#000" />
            </View>
          </View>

          {/* Explicit Quick Actions for Courses & Guides */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickActionMenuBtn} activeOpacity={0.85} onPress={() => router.push('/courses')}>
              <View style={[styles.qaIconWrap, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}>
                <Ionicons name="play-circle" size={26} color="#FFD700" />
              </View>
              <Text style={styles.qaText}>Urdu Ai Courses</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionMenuBtn} activeOpacity={0.85} onPress={() => router.push('/library')}>
              <View style={[styles.qaIconWrap, { backgroundColor: 'rgba(79, 209, 197, 0.2)' }]}>
                <Ionicons name="book" size={24} color="#4FD1C5" />
              </View>
              <Text style={styles.qaText}>Urdu Ai Guides</Text>
            </TouchableOpacity>
          </View>


          {/* Stats Grid */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValueYellow}>روزانہ</Text>
              <Text style={styles.statLabel}>نئی اپڈیٹس</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValueYellow}>50K+</Text>
              <Text style={styles.statLabel}>پلے اسٹور انسٹالز</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValueYellow}>1M+</Text>
              <Text style={styles.statLabel}>کمیونٹی</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#FFD700" size="large" />
            </View>
          ) : (
            <>
              {/* Daily AI Prompt Challenge moved to top for maximum visibility */}
              <View style={{ marginTop: 24 }}>
                <DailyPromptChallenge onComplete={loadStats} />
              </View>

              {/* Featured Article Card (Hero Blog) */}
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>اہم خبریں</Text>
              </View>

              {featuredPost && (
                <TouchableOpacity style={styles.newsCard} activeOpacity={0.9} onPress={() => router.push({ pathname: '/article-reader', params: { url: featuredPost.link } })}>
                  <View style={styles.newsImageContainer}>
                    <Image
                      source={{ uri: (featuredPost._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800').replace(/\.avif$/i, '.png') }}
                      style={styles.newsImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.newsContent}>
                    <View style={styles.newsHeaderRow}>
                      <View style={styles.newsBadges}>
                        <View style={styles.badgeYellow}><Text style={styles.badgeTextBlack}>نیا ✨</Text></View>
                        <View style={styles.badgeDark}><Text style={styles.badgeTextYellow}>Blog</Text></View>
                      </View>
                      <Text style={styles.newsDate}>{new Date(featuredPost.date).toLocaleDateString('ur-PK', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                    <Text style={styles.newsTitle} numberOfLines={2}>{featuredPost.title.rendered.replace(/&#8211;/g, '-').replace(/&#8217;/g, "'")}</Text>
                    <Text style={styles.newsExcerpt} numberOfLines={2}>{featuredPost.excerpt.rendered.replace(/<[^>]+>/g, '').replace(/\[&hellip;\]/g, '...').trim()}</Text>

                    <View style={styles.readMoreRow}>
                      <Ionicons name="arrow-back" size={16} color="#FFD700" style={{ marginRight: 6 }} />
                      <Text style={styles.readMoreText}>مکمل بلاگ پڑھیں</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* More Blogs - Horizontal Scroll */}
              {livePosts.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>مزید مضامین</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.blogScroll}>
                    {livePosts.map((blog) => (
                      <TouchableOpacity key={blog.id} style={styles.miniBlogCard} activeOpacity={0.9} onPress={() => router.push({ pathname: '/article-reader', params: { url: blog.link } })}>
                        <Image
                          source={{ uri: (blog._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400').replace(/\.avif$/i, '.png') }}
                          style={styles.miniBlogImage}
                          resizeMode="cover"
                        />
                        <LinearGradient colors={['transparent', 'rgba(0,25,51,0.9)']} style={styles.miniBlogOverlay}>
                          <Text style={styles.miniBlogDate}>{new Date(blog.date).toLocaleDateString('ur-PK', { day: 'numeric', month: 'short' })}</Text>
                          <Text style={styles.miniBlogTitle} numberOfLines={2}>{blog.title.rendered.replace(/&#8211;/g, '-').replace(/&#8217;/g, "'")}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* AI Courses Quick Links */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>مقبول کورسز</Text>
              </View>
              <View style={styles.coursesGrid}>
                <TouchableOpacity style={styles.courseBlock} activeOpacity={0.85} onPress={() => router.push('/courses')}>
                  <View style={[styles.courseIconWrap, { backgroundColor: 'rgba(79, 209, 197, 0.2)' }]}>
                    <Ionicons name="rocket" size={24} color="#4FD1C5" />
                  </View>
                  <Text style={styles.courseTitle}>بنیادی AI</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.courseBlock} activeOpacity={0.85} onPress={() => router.push('/courses')}>
                  <View style={[styles.courseIconWrap, { backgroundColor: 'rgba(255, 155, 61, 0.2)' }]}>
                    <Ionicons name="bulb" size={24} color="#FF9B3D" />
                  </View>
                  <Text style={styles.courseTitle}>پرامپٹ انجینئرنگ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.courseBlock} activeOpacity={0.85} onPress={() => router.push('/courses')}>
                  <View style={[styles.courseIconWrap, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}>
                    <Ionicons name="cash" size={24} color="#FFD700" />
                  </View>
                  <Text style={styles.courseTitle}>فری لانسنگ</Text>
                </TouchableOpacity>
              </View>


              {/* Video Feature Card */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>ویڈیو لائبریری</Text>
              </View>
              <TouchableOpacity style={styles.videoCard} activeOpacity={0.9} onPress={() => router.push('/ai-videos')}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800' }} style={styles.videoCardBgImage} />
                <View style={styles.videoOverlay}>
                  <View style={styles.videoPlayIcon}>
                    <Ionicons name="play" size={32} color="#000" />
                  </View>
                  <Text style={styles.videoOverlayTitle}>گوگل نے نینو بنانا 2 جاری کر دیا، متن کی تفصیلات</Text>
                  <View style={styles.videoButton}>
                    <Text style={styles.videoButtonText}>تمام ویڈیوز دیکھیں 🎬</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
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
    height: Platform.OS === 'android' ? 70 : 100,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  headerContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakPillContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 51, 102, 0.8)',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  streakText: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 14 },
  badgeText: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 14 },
  streakDivider: { color: 'rgba(255, 215, 0, 0.5)', marginHorizontal: 4, fontSize: 14 },
  streakEmoji: { fontSize: 14 },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 70 : 100,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 26,
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#A0B4C8',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    textAlign: 'right',
    marginRight: 10,
  },
  searchFilter: {
    backgroundColor: '#FFD700',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  quickActionMenuBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  qaIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  qaText: {
    flex: 1,
    color: '#FFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(13, 58, 102, 0.6)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  statValueYellow: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 11,
    color: '#A0B4C8',
    textAlign: 'center',
  },
  newsCard: {
    backgroundColor: 'rgba(13, 58, 102, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  newsImageContainer: {
    padding: 12,
  },
  newsImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  newsContent: {
    padding: 16,
    paddingTop: 4,
  },
  newsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
    direction: 'rtl',
  },
  newsBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeYellow: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTextBlack: {
    color: '#000',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
  },
  badgeDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  badgeTextYellow: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
  },
  newsDate: {
    color: '#A0B4C8',
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
  },
  newsTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 28,
  },
  newsExcerpt: {
    color: '#A0B4C8',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 16,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  readMoreText: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 14,
    width: '100%',
  },
  sectionTitle: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    textAlign: 'right',
  },
  blogScroll: {
    paddingRight: 4,
    gap: 12,
    marginBottom: 10,
  },
  miniBlogCard: {
    width: 220,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  miniBlogImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  miniBlogOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 12,
  },
  miniBlogDate: {
    color: '#FFD700',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 11,
    textAlign: 'right',
    marginBottom: 4,
  },
  miniBlogTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 20,
  },
  coursesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  courseBlock: {
    backgroundColor: 'rgba(13, 58, 102, 0.6)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    width: '31%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  courseIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  courseTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
    textAlign: 'center',
  },
  tipCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 24,
  },
  tipHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    marginRight: 8,
  },
  tipText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 22,
  },
  videoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  videoCardBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 25, 51, 0.6)',
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoPlayIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingLeft: 4, // center play icon visually
  },
  videoOverlayTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    textAlign: 'center',
    width: '100%',
    marginTop: 10,
  },
  videoButton: {
    backgroundColor: '#FFB800',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  videoButtonText: {
    color: '#000000',
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 51, 102, 0.9)',
  }
});