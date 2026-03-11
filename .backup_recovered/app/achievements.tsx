import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';

import { getBadgesForDisplay, checkAndAwardBadges } from '../services/badgeService';
import { getStreakData } from '../services/streakService';
import { getEngagementStats } from '../services/engagementStats';
import BadgeCelebration from '../components/BadgeCelebration';

interface Badge {
  id: string;
  title: string;
  titleUr: string;
  description: string;
  descriptionUr: string;
  emoji: string;
  color: string;
  category: string;
  earned: boolean;
  earnedAt: string | null;
}

type DashboardStats = {
  earned: number;
  total: number;
  currentStreak: number;
  totalDays: number;
  blogsRead: number;
  videosOpened: number;
  uniqueBlogsRead: number;
  uniqueVideosOpened: number;
};

const INITIAL_STATS: DashboardStats = {
  earned: 0,
  total: 0,
  currentStreak: 0,
  totalDays: 0,
  blogsRead: 0,
  videosOpened: 0,
  uniqueBlogsRead: 0,
  uniqueVideosOpened: 0,
};

export default function AchievementsScreen() {
  const router = useRouter();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    await checkAndAwardBadges();

    const [allBadges, streakData, engagementStats] = await Promise.all([
      getBadgesForDisplay(),
      getStreakData(),
      getEngagementStats(),
    ]);

    const earned = allBadges.filter((badge) => badge.earned).length;

    setBadges(allBadges);
    setStats({
      earned,
      total: allBadges.length,
      currentStreak: streakData.currentStreak,
      totalDays: streakData.totalDaysActive,
      ...engagementStats,
    });
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/courses');
    }
  };

  const handleHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/');
  };

  const handleBadgeTap = (badge: Badge) => {
    if (badge.earned) {
      Haptics.selectionAsync();
      setSelectedBadge(badge);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setSelectedBadge(null);
    }
  };

  const groupedBadges = [
    { key: 'course', title: 'کورس ماسٹری', subtitle: 'کورس میں نمایاں کامیابی', items: badges.filter((badge) => badge.category === 'course') },
    { key: 'quiz', title: 'کویز ایکسیلنس', subtitle: 'کویز میں مضبوط کارکردگی', items: badges.filter((badge) => badge.category === 'quiz') },
    { key: 'streak', title: 'مسلسل محنت', subtitle: 'روزانہ سیکھنے کی لگن', items: badges.filter((badge) => badge.category === 'streak') },
    { key: 'other', title: 'اضافی کامیابیاں', subtitle: 'مزید اہم سنگ میل', items: badges.filter((badge) => !['course', 'quiz', 'streak'].includes(badge.category)) },
  ];

  const badgeCompletionPercent = stats.total > 0 ? Math.round((stats.earned / stats.total) * 100) : 0;
  const learningMomentumPercent = Math.min(100, Math.round((stats.currentStreak / 30) * 100));
  const mediaEngagementPercent = Math.min(
    100,
    Math.round(((stats.blogsRead + stats.videosOpened) / 40) * 100)
  );

  const insightCards = [
    {
      id: 'badges',
      label: 'بیجز حاصل کیے',
      value: `${stats.earned}/${stats.total}`,
      detail: `${badgeCompletionPercent}% مکمل`,
      icon: 'trophy',
      accent: '#FFD700',
    },
    {
      id: 'streak',
      label: 'موجودہ مسلسل دن',
      value: `${stats.currentStreak}`,
      detail: `${stats.totalDays} فعال دن`,
      icon: 'flame',
      accent: '#FF9B3D',
    },
    {
      id: 'blogs',
      label: 'اردو بلاگز پڑھے',
      value: `${stats.blogsRead}`,
      detail: `${stats.uniqueBlogsRead} منفرد بلاگز`,
      icon: 'newspaper',
      accent: '#4FD1C5',
    },
    {
      id: 'videos',
      label: 'ویڈیوز کھولیں',
      value: `${stats.videosOpened}`,
      detail: `${stats.uniqueVideosOpened} منفرد ویڈیوز`,
      icon: 'play-circle',
      accent: '#7DDC6B',
    },
  ];

  const renderProgressRail = (label: string, value: string, percent: number, accent: string) => (
    <View style={styles.progressRail}>
      <View style={styles.progressRailHeader}>
        <Text style={styles.progressValue}>{value}</Text>
        <Text style={styles.progressLabel}>{label}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: accent }]} />
      </View>
    </View>
  );

  const renderBadgeGrid = (badgeList: Badge[]) => (
    <View style={styles.badgeGrid}>
      {badgeList.map((badge) => {
        if (badge.earned) {
          return (
            <TouchableOpacity key={badge.id} style={styles.badgeTileEarned} onPress={() => handleBadgeTap(badge)} activeOpacity={0.88}>
              <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.04)']} style={styles.badgeTileGradient}>
                <View style={[styles.badgeAccentDot, { backgroundColor: badge.color }]} />
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <Text style={styles.badgeTitleUr}>{badge.titleUr}</Text>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={badge.id} style={styles.badgeTileLocked} onPress={() => handleBadgeTap(badge)} activeOpacity={0.96}>
            <Ionicons name="lock-closed" size={18} color="rgba(255,255,255,0.45)" />
            <Text style={styles.badgeTitleDim}>{badge.titleUr}</Text>
            <Text style={styles.badgeDescDim} numberOfLines={2}>{badge.descriptionUr}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
      <StatusBar style="light" backgroundColor="#003366" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backEmoji}>←</Text>
          <Text style={styles.backText}>واپس</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          <Text style={styles.headerBrandUrdu}>Urdu </Text>
          <Text style={styles.headerBrandAi}>Ai</Text>
        </Text>

        <TouchableOpacity onPress={handleHome} style={styles.homeButton}>
          <Ionicons name="home-outline" size={18} color="#FFD700" />
          <Text style={styles.homeText}>ہوم</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={['rgba(255,215,0,0.20)', 'rgba(255,255,255,0.05)']} style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>آپ کی ترقی کا پریمیم ڈیش بورڈ</Text>
          <Text style={styles.heroTitle}>بیجز، مسلسل محنت، بلاگ ریڈنگ اور ویڈیو لرننگ سب ایک جگہ</Text>
          <Text style={styles.heroBody}>
            یہ صرف اسٹیٹس بار نہیں، بلکہ آپ کی اصل لرننگ رفتار ہے۔ جتنی زیادہ ریڈنگ، واچنگ، اور مسلسل محنت ہوگی اتنی ہی مضبوط آپ کی AI جرنی بنے گی۔
          </Text>

          <View style={styles.insightGrid}>
            {insightCards.map((card) => (
              <LinearGradient
                key={card.id}
                colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)']}
                style={styles.insightCard}
              >
                <View style={styles.insightHeader}>
                  <Ionicons name={card.icon as any} size={20} color={card.accent} />
                  <Text style={[styles.insightDetail, { color: card.accent }]}>{card.detail}</Text>
                </View>
                <Text style={styles.insightValue}>{card.value}</Text>
                <Text style={styles.insightLabel}>{card.label}</Text>
              </LinearGradient>
            ))}
          </View>

          <View style={styles.progressPanel}>
            {renderProgressRail('بیج کمپلیشن', `${badgeCompletionPercent}%`, badgeCompletionPercent, '#FFD700')}
            {renderProgressRail('لرننگ مومینٹم', `${stats.currentStreak} دن`, learningMomentumPercent, '#FF9B3D')}
            {renderProgressRail('ریڈنگ + واچنگ ایکٹیویٹی', `${stats.blogsRead + stats.videosOpened}`, mediaEngagementPercent, '#4FD1C5')}
          </View>
        </LinearGradient>

        {groupedBadges.map((group) => (
          <View key={group.key} style={styles.sectionBlock}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{group.items.filter((badge) => badge.earned).length}/{group.items.length || 0}</Text>
            </View>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            <Text style={styles.sectionSubtitle}>{group.subtitle}</Text>
            {renderBadgeGrid(group.items)}
          </View>
        ))}
      </ScrollView>

      <BadgeCelebration badge={selectedBadge} visible={!!selectedBadge} onClose={() => setSelectedBadge(null)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 86,
  },
  backEmoji: {
    color: '#FFD700',
    fontSize: 18,
    marginRight: 8,
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
  headerBrandUrdu: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 21,
  },
  headerBrandAi: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 21,
  },
  homeButton: {
    width: 86,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.22)',
    marginBottom: 26,
  },
  heroEyebrow: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    textAlign: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 26,
    lineHeight: 36,
    textAlign: 'center',
    marginTop: 10,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
  insightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  insightCard: {
    width: '48.5%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightDetail: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 11,
  },
  insightValue: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 27,
    marginTop: 12,
    textAlign: 'right',
  },
  insightLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 6,
    lineHeight: 18,
  },
  progressPanel: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  progressRail: {
    marginBottom: 14,
  },
  progressRailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 13,
    textAlign: 'right',
  },
  progressValue: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  sectionBlock: {
    marginBottom: 22,
    borderRadius: 24,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  sectionBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,215,0,0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  sectionBadgeText: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
  },
  sectionTitle: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    textAlign: 'center',
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.68)',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeTileEarned: {
    width: '48.5%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
  },
  badgeTileGradient: {
    minHeight: 142,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
  },
  badgeAccentDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  badgeEmoji: {
    fontSize: 34,
    marginBottom: 14,
    textAlign: 'right',
  },
  badgeTitleUr: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 15,
    textAlign: 'right',
    lineHeight: 22,
  },
  badgeTitle: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
    lineHeight: 16,
  },
  badgeTileLocked: {
    width: '48.5%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minHeight: 142,
    justifyContent: 'space-between',
  },
  badgeTitleDim: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
    lineHeight: 20,
  },
  badgeDescDim: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'right',
    lineHeight: 16,
  },
});
