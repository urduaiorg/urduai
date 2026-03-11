import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
  Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useLocalization } from '../hooks/useLocalization';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '../hooks/useThemeColor';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';

const { width, height } = Dimensions.get('window');

export default function AiVideisLandingPage() {
  const { t } = useLocalization();

  const handleSubscribe = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const youtubeUrl = 'https://youtube.com/@urduaiorg';
    try {
      await Linking.openURL(youtubeUrl);
    } catch (error) {
      console.error('Error opening YouTube:', error);
    }
  };

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${t('aiVideisShareMessage')} https://youtube.com/@urduaiorg`,
        title: t('aiVideisShareTitle'),
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const videos = [
    {
      id: 1,
      title: t('aiVideisVideo1Title'),
      description: t('aiVideisVideo1Desc'),
      thumbnail: '🎬',
      duration: '15:30'
    },
    {
      id: 2,
      title: t('aiVideisVideo2Title'),
      description: t('aiVideisVideo2Desc'),
      thumbnail: '🤖',
      duration: '12:45'
    },
    {
      id: 3,
      title: t('aiVideisVideo3Title'),
      description: t('aiVideisVideo3Desc'),
      thumbnail: '📚',
      duration: '20:15'
    }
  ];

  return (
    <LinearGradient
      colors={['#40E0D0', '#4A90E2']}
      style={styles.container}
    >
      <StatusBar style="light" backgroundColor="#40E0D0" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <GlassCard style={styles.heroCard}>
            <Text style={styles.heroTitle}>
              <Text style={styles.heroUrduText}>{t('aiVideisHeroUrdu')}</Text>
              <Text style={styles.heroAiText}>{t('aiVideisHeroAi')}</Text>
            </Text>
            <Text style={styles.heroTitleContinued}>
              {t('aiVideisHeroVideis')}
            </Text>

            <Text style={styles.heroSubtitle}>
              {t('aiVideisHeroSubtitle')}
            </Text>

            <View style={styles.heroStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>500+</Text>
                <Text style={styles.statLabel}>{t('aiVideisStatSubscribers')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>50+</Text>
                <Text style={styles.statLabel}>{t('aiVideisStatVideos')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>10K+</Text>
                <Text style={styles.statLabel}>{t('aiVideisStatViews')}</Text>
              </View>
            </View>

            <PrimaryButton
              style={styles.subscribeButton}
              size="lg"
              emojiLeft="⭐"
              label={t('aiVideisSubscribeButton')}
              onPress={handleSubscribe}
            />
          </GlassCard>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.card}
          >
            <Text style={styles.sectionTitle}>
              {t('aiVideisAboutTitle')}
            </Text>
            <Text style={styles.aboutText}>
              {t('aiVideisAboutText')}
            </Text>

            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🎯</Text>
                <Text style={styles.featureTitle}>{t('aiVideisFeature1Title')}</Text>
                <Text style={styles.featureDesc}>{t('aiVideisFeature1Desc')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🌟</Text>
                <Text style={styles.featureTitle}>{t('aiVideisFeature2Title')}</Text>
                <Text style={styles.featureDesc}>{t('aiVideisFeature2Desc')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🚀</Text>
                <Text style={styles.featureTitle}>{t('aiVideisFeature3Title')}</Text>
                <Text style={styles.featureDesc}>{t('aiVideisFeature3Desc')}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Videos Section */}
        <View style={styles.section}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.card}
          >
            <Text style={styles.sectionTitle}>
              {t('aiVideisLatestVideos')}
            </Text>

            {videos.map((video) => (
              <TouchableOpacity
                key={video.id}
                style={styles.videoItem}
                onPress={handleSubscribe}
                activeOpacity={0.7}
              >
                <View style={styles.videoThumbnail}>
                  <Text style={styles.videoThumbnailEmoji}>{video.thumbnail}</Text>
                  <Text style={styles.videoDuration}>{video.duration}</Text>
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle}>{video.title}</Text>
                  <Text style={styles.videoDescription}>{video.description}</Text>
                  <View style={styles.videoMeta}>
                    <Text style={styles.videoChannel}>@urduaiorg</Text>
                    <Text style={styles.videoDate}>{t('aiVideisRecentlyUploaded')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.moreVideosButton}
              onPress={handleSubscribe}
              activeOpacity={0.8}
            >
              <Text style={styles.moreVideosText}>
                {t('aiVideisMoreVideosButton')}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* CTA Section */}
        <View style={styles.section}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 165, 0, 0.1)']}
            style={styles.ctaCard}
          >
            <Text style={styles.ctaTitle}>
              {t('aiVideisCTAQuestion')}
            </Text>
            <Text style={styles.ctaSubtitle}>
              {t('aiVideisCTADescription')}
            </Text>

            <View style={styles.ctaButtons}>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleSubscribe}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.ctaButtonGradient}
                >
                  <Text style={styles.ctaButtonText}>
                    {t('aiVideisSubscribeNow')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Text style={styles.shareButtonText}>
                  {t('aiVideisShareButton')}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('aiVideisFooterText')}
          </Text>
          <Text style={styles.footerChannel}>
            @urduaiorg
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
  },
  heroCard: {
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'Montserrat-Bold',
  },
  heroTitleContinued: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#FFFFFF',
  },
  heroUrduText: {
    color: '#FFFFFF',
  },
  heroAiText: {
    color: '#FFD700',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 26,
    fontFamily: 'Montserrat-Regular',
    opacity: 0.9,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 5,
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
  },
  subscribeButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  subscribeButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  card: {
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Montserrat-Bold',
  },
  aboutText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 25,
    fontFamily: 'Montserrat-Regular',
    opacity: 0.9,
    textAlign: 'right',
  },
  featuresGrid: {
    gap: 20,
  },
  featureItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Montserrat-Regular',
    opacity: 0.8,
  },
  videoItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  videoThumbnail: {
    width: 100,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  videoThumbnailEmoji: {
    fontSize: 30,
  },
  videoDuration: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#FFFFFF',
    fontSize: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    fontFamily: 'Montserrat-Bold',
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    fontFamily: 'Montserrat-Bold',
  },
  videoDescription: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 8,
    lineHeight: 16,
    fontFamily: 'Montserrat-Regular',
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoChannel: {
    fontSize: 11,
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
  },
  videoDate: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.6,
    fontFamily: 'Montserrat-Regular',
  },
  moreVideosButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  moreVideosText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  ctaCard: {
    borderRadius: 20,
    padding: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Montserrat-Bold',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    fontFamily: 'Montserrat-Regular',
    opacity: 0.9,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  ctaButton: {
    flex: 2,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  ctaButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  shareButton: {
    flex: 1,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'Montserrat-Regular',
  },
  footerChannel: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
});
