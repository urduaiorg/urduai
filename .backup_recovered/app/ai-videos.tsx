import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Share,
  ActivityIndicator,
  Image,
  RefreshControl,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { fetchLatestYouTubeVideos, type YouTubeFeedVideo } from '../services/youtubeFeed';
import { courseCatalog } from '../data/courseCatalog';

const VIDEO_CACHE_KEY = 'urdu_ai_latest_videos_cache_v1';
const VIDEO_REFRESH_THROTTLE_MS = 60 * 1000;

const playlistCards = courseCatalog.map((course) => ({
  id: course.id,
  title: course.titleUr,
  description: course.descriptionUr,
  playlistUrl: course.playlistUrl,
  badge: course.badgeLabelUr,
}));

function formatVideoDate(dateString: string) {
  if (!dateString) return '';
  try {
    return new Intl.DateTimeFormat('ur-PK', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(dateString));
  } catch {
    return '';
  }
}

export default function AiVideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<YouTubeFeedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const lastFetchedAtRef = useRef(0);

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

  const openVideo = async (url: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/youtube-player', params: { url } });
  };

  const openChannel = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/youtube-player', params: { url: 'https://youtube.com/@urduaiorg' } });
  };

  const openPlaylist = async (playlistUrl?: string) => {
    if (!playlistUrl) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/youtube-player', params: { url: playlistUrl } });
  };

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: 'تازہ ترین Urdu AI ویڈیوز دیکھیں: https://youtube.com/@urduaiorg',
        title: 'Urdu AI ویڈیوز',
      });
    } catch {
      // ignore share failures
    }
  };

  const loadVideos = async ({ force = false } = {}) => {
    const now = Date.now();
    if (!force && now - lastFetchedAtRef.current < VIDEO_REFRESH_THROTTLE_MS) {
      return;
    }

    if (videos.length === 0) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    let cachedVideos: YouTubeFeedVideo[] | null = null;

    try {
      const cached = await AsyncStorage.getItem(VIDEO_CACHE_KEY);
      if (cached && videos.length === 0) {
        cachedVideos = JSON.parse(cached);
        if (Array.isArray(cachedVideos) && cachedVideos.length > 0) {
          setVideos(cachedVideos);
          setIsLoading(false);
        }
      }

      const latestVideos = await fetchLatestYouTubeVideos(10);
      setVideos(latestVideos);
      lastFetchedAtRef.current = now;
      await AsyncStorage.setItem(VIDEO_CACHE_KEY, JSON.stringify(latestVideos));
    } catch {
      if (!cachedVideos && videos.length === 0) {
        setVideos([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadVideos({ force: true });

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const wasBackgrounded = appStateRef.current.match(/inactive|background/);
      if (wasBackgrounded && nextAppState === 'active') {
        loadVideos({ force: true });
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  const freshCount = videos.filter((video) => {
    if (!video.publishedAt) return false;
    return Date.now() - new Date(video.publishedAt).getTime() < 4 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
      <StatusBar style="light" backgroundColor="#003366" />

      <LinearGradient colors={['#003366', '#001933']} style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backEmoji}>←</Text>
          <Text style={styles.backText}>واپس</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          <Text style={styles.headerUrduText}>Urdu </Text>
          <Text style={styles.headerAiText}>Ai</Text>
        </Text>

        <TouchableOpacity onPress={handleHome} style={styles.homeButton}>
          <Ionicons name="home-outline" size={18} color="#FFD700" />
          <Text style={styles.homeText}>ہوم</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadVideos({ force: true })}
            tintColor="#FFD700"
            colors={['#FFD700']}
            progressBackgroundColor="#003366"
          />
        }
      >
        <GlassCard style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>تازہ ترین اردو AI ویڈیوز</Text>
          <Text style={styles.heroTitle}>تازہ ویڈیوز، طاقتور سیکھنے کی سمت</Text>
          <Text style={styles.heroBody}>
            Urdu Ai چینل کی نئی ویڈیوز یہیں سے دیکھیں۔ تازہ اپلوڈز، مسلسل رہنمائی، اور مکمل ویڈیو لائبریری ایک مضبوط فیڈ میں۔
          </Text>

          <View style={styles.heroSignalRow}>
            <View style={styles.heroSignalPill}>
              <Text style={styles.heroSignalText}>@urduaiorg</Text>
            </View>
            <View style={styles.heroSignalPill}>
              <Text style={styles.heroSignalText}>ہر اوپن پر تازہ ریفریش</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{videos.length}</Text>
              <Text style={styles.heroStatLabel}>اس وقت فیڈ میں</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{freshCount}</Text>
              <Text style={styles.heroStatLabel}>نئی اپلوڈز</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>100+</Text>
              <Text style={styles.heroStatLabel}>کل چینل ویڈیوز</Text>
            </View>
          </View>

          <View style={styles.heroActions}>
            <PrimaryButton
              style={styles.heroPrimaryButton}
              size="lg"
              emojiLeft="▶️"
              label="چینل کھولیں"
              onPress={openChannel}
            />

            <TouchableOpacity style={styles.heroShareButton} onPress={handleShare} activeOpacity={0.85}>
              <Text style={styles.heroShareButtonText}>شیئر</Text>
              <Ionicons name="share-social" size={18} color="#FFD700" />
            </TouchableOpacity>
          </View>
        </GlassCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>تازہ ترین اپلوڈز</Text>
          <Text style={styles.sectionSubtitle}>سب سے نئی ویڈیو اوپر، باقی مسلسل اپڈیٹ ہونے والی فیڈ میں</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#FFD700" size="small" />
            <Text style={styles.loadingText}>تازہ ترین ویڈیوز لائی جا رہی ہیں...</Text>
          </View>
        ) : videos.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>اس وقت ویڈیوز دستیاب نہیں</Text>
            <Text style={styles.emptyBody}>چینل کھول کر تازہ اپلوڈز دیکھیں یا دوبارہ ریفریش کریں۔</Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity style={styles.emptyActionPrimary} onPress={openChannel} activeOpacity={0.86}>
                <Text style={styles.emptyActionPrimaryText}>چینل کھولیں</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emptyActionSecondary} onPress={() => loadVideos({ force: true })} activeOpacity={0.86}>
                <Text style={styles.emptyActionSecondaryText}>دوبارہ چیک کریں</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.videoList}>
            {videos.map((video, index) => (
              <TouchableOpacity
                key={video.id}
                style={[
                  styles.videoCard,
                  index === 0 ? styles.videoCardFeaturedHero : null,
                  index > 0 ? styles.videoCardCompact : null,
                ]}
                activeOpacity={0.88}
                onPress={() => openVideo(video.url)}
              >
                {video.thumbnail ? (
                  <Image
                    source={{ uri: video.thumbnail }}
                    style={[styles.videoImage, index === 0 ? styles.videoImageHero : styles.videoImageCompact]}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.videoImage,
                      index === 0 ? styles.videoImageHero : styles.videoImageCompact,
                      styles.videoImageFallback,
                    ]}
                  >
                    <Ionicons name="logo-youtube" size={34} color="#FFD700" />
                  </View>
                )}

                <LinearGradient
                  colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
                  style={[styles.videoContent, index === 0 ? styles.videoContentHero : styles.videoContentCompact]}
                >
                  <View style={styles.videoMetaRow}>
                    <View style={styles.videoTagPill}>
                      <Text style={styles.videoTagText}>{index === 0 ? 'نئی ویڈیو' : 'ویڈیو'}</Text>
                    </View>
                    <Text style={styles.videoDate}>{formatVideoDate(video.publishedAt)}</Text>
                  </View>

                  <Text style={[styles.videoTitle, index === 0 ? styles.videoTitleHero : styles.videoTitleCompact]} numberOfLines={index === 0 ? 3 : 2}>
                    {video.title}
                  </Text>
                  <Text style={styles.videoMetaText}>{video.author} • YouTube</Text>

                  <View style={styles.watchRow}>
                    <Text style={styles.watchText}>ابھی دیکھیں</Text>
                    <Ionicons name="play-circle" size={20} color="#FFD700" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.sectionHeaderSecondary}>
          <Text style={styles.sectionTitle}>کورس پلے لسٹس</Text>
          <Text style={styles.sectionSubtitle}>اگر آپ ترتیب وار سیکھنا چاہتے ہیں تو یہاں سے مخصوص ٹریک کھولیں</Text>
        </View>

        <View style={styles.playlistList}>
          {playlistCards.map((playlist) => (
            <TouchableOpacity
              key={playlist.id}
              style={styles.playlistCard}
              activeOpacity={0.88}
              onPress={() => openPlaylist(playlist.playlistUrl)}
            >
              <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']} style={styles.playlistGradient}>
                <Text style={styles.playlistBadge}>{playlist.badge}</Text>
                <Text style={styles.playlistTitle}>{playlist.title}</Text>
                <Text style={styles.playlistDescription}>{playlist.description}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 80,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backEmoji: {
    color: '#FFD700',
    fontSize: 18,
    marginRight: 4,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    includeFontPadding: false,
  },
  headerTitle: {
    textAlign: 'center',
  },
  headerUrduText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
  },
  headerAiText: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
  },
  homeButton: {
    width: 80,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  homeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    includeFontPadding: false,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 48,
  },
  heroCard: {
    padding: 22,
    borderRadius: 28,
  },
  heroEyebrow: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    textAlign: 'right',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 27,
    lineHeight: 38,
    textAlign: 'right',
    marginTop: 10,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right',
    marginTop: 12,
  },
  heroSignalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  heroSignalPill: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroSignalText: {
    color: 'rgba(255,255,255,0.86)',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 11,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  heroStatValue: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  heroPrimaryButton: {
    flex: 1,
  },
  heroShareButton: {
    minWidth: 92,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroShareButtonText: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionHeaderSecondary: {
    marginTop: 26,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 23,
    textAlign: 'right',
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    marginTop: 5,
  },
  loadingCard: {
    minHeight: 96,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
  },
  emptyCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 22,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    textAlign: 'right',
  },
  emptyBody: {
    color: 'rgba(255,255,255,0.74)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
    marginTop: 8,
  },
  emptyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  emptyActionPrimary: {
    backgroundColor: '#FFD700',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyActionPrimaryText: {
    color: '#003366',
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
  },
  emptyActionSecondary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  emptyActionSecondaryText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
  },
  videoList: {
    gap: 14,
  },
  videoCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  videoCardFeatured: {
    borderColor: 'rgba(255,215,0,0.2)',
  },
  videoCardFeaturedHero: {
    borderColor: 'rgba(255,215,0,0.28)',
  },
  videoCardCompact: {
  },
  videoImage: {
    width: '100%',
    height: 194,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  videoImageHero: {
    height: 214,
  },
  videoImageCompact: {
    height: 170,
  },
  videoImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContent: {
    padding: 18,
  },
  videoContentHero: {
    paddingBottom: 20,
  },
  videoContentCompact: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  videoMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoTagPill: {
    backgroundColor: 'rgba(255,215,0,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  videoTagText: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
  },
  videoDate: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 11,
  },
  videoTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    lineHeight: 29,
    textAlign: 'right',
  },
  videoTitleHero: {
    fontSize: 22,
    lineHeight: 31,
    minHeight: 92,
  },
  videoTitleCompact: {
    fontSize: 18,
    lineHeight: 27,
    minHeight: 56,
  },
  videoMetaText: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 9,
  },
  watchRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  watchText: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
    marginRight: 8,
  },
  playlistList: {
    gap: 12,
  },
  playlistCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  playlistGradient: {
    padding: 18,
  },
  playlistBadge: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
    textAlign: 'right',
  },
  playlistTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'right',
    marginTop: 8,
  },
  playlistDescription: {
    color: 'rgba(255,255,255,0.76)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    marginTop: 8,
  },
});
