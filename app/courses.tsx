import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import AppHeader from '../components/AppHeader';
import GlowButton from '../components/GlowButton';

import { courseCatalog } from '../data/courseCatalog';
import { getEarnedBadges, BADGE_DEFINITIONS } from '../services/badgeService';

type ProgressMap = Record<string, any>;

export default function CoursesCatalogScreen() {
  const router = useRouter();
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [badgeData, setBadgeData] = useState({ earned: 0, total: 12 });

  const flagshipCourse = useMemo(
    () => courseCatalog.find((course) => course.type === 'flagship_certification'),
    []
  );

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const entries = await Promise.all(
          courseCatalog.map(async (course) => {
            const stored = await AsyncStorage.getItem(`course_progress_${course.id}`);
            return [course.id, stored ? JSON.parse(stored) : null] as const;
          })
        );

        setProgressMap(Object.fromEntries(entries));

        const earned = await getEarnedBadges();
        setBadgeData({ earned: earned.length, total: BADGE_DEFINITIONS.length });
      } catch {
        // Keep the catalog functional even if local progress fails to load.
      }
    };

    loadProgress();
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const ensureCourseProgress = async (courseId: string) => {
    const existing = progressMap[courseId];
    if (existing) return existing;

    const initProgress = {
      enrolled: true,
      enrolledAt: new Date().toISOString(),
      modulesCompleted: [],
      quizScores: {},
      finalExamScore: null,
      certificateId: null,
      playlistVisits: 0,
      completedAt: null,
    };

    await AsyncStorage.setItem(`course_progress_${courseId}`, JSON.stringify(initProgress));
    setProgressMap((prev) => ({ ...prev, [courseId]: initProgress }));
    return initProgress;
  };

  const handleOpenCourse = async (courseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await ensureCourseProgress(courseId);
    router.push({ pathname: '/course-player', params: { courseId } });
  };

  const getCourseProgressSummary = (course: any) => {
    const progress = progressMap[course.id];

    if (!progress?.enrolled) {
      return { label: 'ابھی شروع نہیں کیا', accent: 'rgba(255,255,255,0.65)', percent: 0 };
    }

    if (course.type === 'flagship_certification') {
      const totalModules = course.modules.length;
      const completedCount = progress.modulesCompleted?.length || 0;
      const percent = progress.certificateId
        ? 100
        : Math.round((completedCount / totalModules) * 100);

      if (progress.certificateId) {
        return { label: 'سرٹیفائیڈ', accent: '#4CD964', percent };
      }

      return { label: `${percent}% مکمل`, accent: '#FFD700', percent };
    }

    if (progress.completedAt) {
      return { label: 'مکمل', accent: '#4CD964', percent: 100 };
    }

    if ((progress.playlistVisits || 0) > 0) {
      return { label: 'جاری ہے', accent: '#FFD700', percent: 45 };
    }

    return { label: 'شامل ہو چکے ہیں', accent: '#7FDBFF', percent: 15 };
  };

  return (
    <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
      <StatusBar style="light" backgroundColor="#003366" />
      <AppHeader
        leftAction={{ label: 'ہوم', icon: 'home-outline', onPress: () => router.replace('/') }}
        rightAction={{ label: 'واپس', icon: 'arrow-back', onPress: handleBack }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['rgba(255,215,0,0.22)', 'rgba(255,255,255,0.06)']}
            style={styles.heroGradient}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>4 سیکھنے کے کورسز</Text>
              </View>
              <View style={styles.heroBadgeMuted}>
                <Text style={styles.heroBadgeMutedText}>{badgeData.earned}/{badgeData.total} بیجز</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>اپنا AI سیکھنے کا راستہ منتخب کریں</Text>
            <Text style={styles.heroSubtitle}>اپنے لیے درست کورس چنیں</Text>
            <Text style={styles.heroBody}>
              پہلے Urdu Ai Master Class سے آغاز کریں، پھر آٹومیشن، ویب ڈویلپمنٹ، اور خاندان کے لیے موزوں AI سیکھنے کی طرف بڑھیں۔
            </Text>

            {flagshipCourse ? (
              <GlowButton
                label="Urdu Ai Master Class جاری رکھیں"
                icon="ribbon"
                onPress={() => handleOpenCourse(flagshipCourse.id)}
                style={styles.heroAction}
              />
            ) : null}
          </LinearGradient>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>کورسز</Text>
          <Text style={styles.sectionSubtitle}>مختلف سیکھنے والوں کے اہداف کے مطابق</Text>
        </View>

        {courseCatalog.map((course) => {
          const progress = getCourseProgressSummary(course);
          const isFlagship = course.type === 'flagship_certification';

          return (
            <TouchableOpacity
              key={course.id}
              style={styles.trackCard}
              activeOpacity={0.92}
              onPress={() => handleOpenCourse(course.id)}
            >
              <LinearGradient
                colors={
                  isFlagship
                    ? ['rgba(255,215,0,0.18)', 'rgba(255,255,255,0.06)']
                    : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']
                }
                style={styles.trackGradient}
              >
                <View style={styles.trackTopRow}>
                  <View style={styles.trackBadge}>
                    <Text style={styles.trackBadgeText}>{course.badgeLabelUr || course.badgeLabel}</Text>
                  </View>
                  <Text style={[styles.trackProgressText, { color: progress.accent }]}>{progress.label}</Text>
                </View>

                <Text style={styles.trackTitleUr}>{course.titleUr}</Text>
                <Text style={styles.trackTitleEn}>{course.title}</Text>

                <Text style={styles.trackDescription}>{course.descriptionUr}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Ionicons name="play-circle-outline" size={15} color="#FFD700" />
                    <Text style={styles.metaPillText}>{course.totalVideos} ویڈیوز</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Ionicons name="time-outline" size={15} color="#FFD700" />
                    <Text style={styles.metaPillText}>{course.estimatedHours} گھنٹے</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Ionicons name="sparkles-outline" size={15} color="#FFD700" />
                    <Text style={styles.metaPillText}>{course.difficulty === 'beginner' ? 'ابتدائی' : 'درمیانی'}</Text>
                  </View>
                </View>

                <View style={styles.progressRail}>
                  <View style={[styles.progressFill, { width: `${progress.percent}%`, backgroundColor: progress.accent }]} />
                </View>

                <View style={styles.outcomeCard}>
                  <Text style={styles.outcomeLabel}>نتیجہ</Text>
                  <Text style={styles.outcomeText}>{course.outcomeUr}</Text>
                </View>

                <View style={styles.trackActionRow}>
                  <View style={styles.trackAudience}>
                    <Ionicons name="people-outline" size={16} color="rgba(255,255,255,0.75)" />
                    <Text style={styles.trackAudienceText} numberOfLines={2}>{course.audienceUr}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#FFD700" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity onPress={() => router.push('/achievements' as any)} style={styles.achievementButton}>
          <Text style={styles.achievementEmoji}>🏆</Text>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.achievementTitle}>کامیابیاں</Text>
            <Text style={styles.achievementSubtitle}>
              بیجز، مسلسل دنوں کی گنتی، اور تکمیل کے سنگِ میل کے ساتھ اپنا جذبہ قائم رکھیں
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FFD700" />
        </TouchableOpacity>

        {flagshipCourse ? (
          <TouchableOpacity
            onPress={() => router.push('/scholarship')}
            style={styles.scholarshipCard}
            activeOpacity={0.9}
          >
            <LinearGradient colors={['rgba(76,175,80,0.18)', 'rgba(255,255,255,0.04)']} style={styles.scholarshipGradient}>
              <Ionicons name="school" size={28} color="#4CD964" style={{ marginBottom: 12 }} />
              <Text style={styles.scholarshipTitle}>گوگل اے آئی اسکالرشپ کا راستہ</Text>
              <Text style={styles.scholarshipBody}>
                مرکزی ماسٹر کلاس اب بھی سرٹیفکیٹ اور اسکالرشپ تک رسائی کا آپ کا بہترین راستہ ہے۔
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
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
    padding: 18,
    paddingBottom: 52,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    shadowColor: '#00162D',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  heroGradient: {
    paddingHorizontal: 24,
    paddingVertical: 26,
    backgroundColor: 'rgba(12, 47, 86, 0.44)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  heroBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  heroBadgeText: {
    color: '#003366',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
  },
  heroBadgeMuted: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  heroBadgeMutedText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 30,
    lineHeight: 42,
    textAlign: 'right',
  },
  heroSubtitle: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'right',
  },
  heroBody: {
    color: 'rgba(255,255,255,0.86)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    lineHeight: 26,
    marginTop: 16,
    textAlign: 'right',
  },
  heroAction: {
    marginTop: 24,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.68)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'right',
  },
  trackCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  trackGradient: {
    padding: 22,
  },
  trackTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  trackBadgeText: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
  },
  trackProgressText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
  },
  trackTitleUr: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    textAlign: 'right',
    lineHeight: 34,
  },
  trackTitleEn: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    marginTop: 8,
  },
  trackDescription: {
    color: 'rgba(255,255,255,0.92)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    lineHeight: 24,
    marginTop: 16,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
    justifyContent: 'flex-end',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  metaPillText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    marginLeft: 6,
  },
  progressRail: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    marginTop: 18,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  outcomeCard: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  outcomeLabel: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    marginBottom: 6,
    textAlign: 'right',
  },
  outcomeText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  trackActionRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackAudience: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 14,
  },
  trackAudienceText: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
    textAlign: 'right',
  },
  achievementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    padding: 20,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  achievementEmoji: {
    fontSize: 32,
  },
  achievementTitle: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
  },
  achievementSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  scholarshipCard: {
    marginTop: 18,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.3)',
  },
  scholarshipGradient: {
    padding: 20,
  },
  scholarshipTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
  },
  scholarshipBody: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
});
