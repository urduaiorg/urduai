import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, LayoutAnimation } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import YoutubePlayer from 'react-native-youtube-iframe';

import { getCourseById } from '../data/courseCatalog';
import { recordActivity } from '../services/streakService';
import { checkAndAwardBadges } from '../services/badgeService';
import { recordWeeklyProgressEvent } from '../services/weeklyProgressService';
import { maybeRequestReview } from '../services/reviewPromptService';
import BadgeCelebration from '../components/BadgeCelebration';
import ShareCard from '../components/ShareCard';
import { shareCard } from '../services/shareCardService';

export default function CoursePlayerScreen() {
  const router = useRouter();
  const { courseId } = useLocalSearchParams();
  const [progress, setProgress] = useState<any>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
  const [currentBadgeToShow, setCurrentBadgeToShow] = useState<any>(null);
  const shareCardRef = useRef<any>(null);
  const [shareData, setShareData] = useState<any>({});

  const course: any = getCourseById(courseId);
  const isFlagshipCourse = Boolean(
    course?.type === 'flagship_certification' && course?.modules?.length && course?.finalExam
  );

  const handleBadgeClose = () => {
    const remaining = earnedBadges.slice(1);
    setEarnedBadges(remaining);
    setCurrentBadgeToShow(remaining.length > 0 ? remaining[0] : null);
  };

  useEffect(() => {
    if (!course) return;
    loadProgress();
  }, [course?.id]);

  const loadProgress = async () => {
    try {
      const storageKey = `course_progress_${Array.isArray(courseId) ? courseId[0] : courseId}`;
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        setProgress(JSON.parse(stored));
        return;
      }

      const fallbackProgress = {
        enrolled: true,
        enrolledAt: new Date().toISOString(),
        modulesCompleted: [],
        quizScores: {},
        finalExamScore: null,
        certificateId: null,
        playlistVisits: 0,
        completedAt: null,
      };

      await AsyncStorage.setItem(storageKey, JSON.stringify(fallbackProgress));
      setProgress(fallbackProgress);
    } catch {
      // Keep the screen usable even if persistence fails.
    }
  };

  const persistProgress = async (nextProgress: any) => {
    const resolvedCourseId = Array.isArray(courseId) ? courseId[0] : courseId;
    await AsyncStorage.setItem(`course_progress_${resolvedCourseId}`, JSON.stringify(nextProgress));
    setProgress(nextProgress);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/courses');
    }
  };

  const toggleModule = (moduleId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedModule === moduleId) {
      setExpandedModule(null);
      setVideoReady(false);
    } else {
      setExpandedModule(moduleId);
      Haptics.selectionAsync();
    }
  };

  const markModuleCompleted = async (moduleId: string) => {
    if (!progress || !isFlagshipCourse) return;

    try {
      try {
        await recordActivity();
      } catch {
        // Streak activity should not block course progress.
      }

      const currentCompleted = progress.modulesCompleted || [];
      if (!currentCompleted.includes(moduleId)) {
        const updatedCompleted = [...currentCompleted, moduleId];
        const updatedProgress = { ...progress, modulesCompleted: updatedCompleted };

        await persistProgress(updatedProgress);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const { onModuleComplete } = require('../services/localNotifications');
        const moduleNumber = parseInt(moduleId.replace('module-', ''), 10);
        if (!isNaN(moduleNumber)) {
          await onModuleComplete(moduleNumber);
        }

        await recordWeeklyProgressEvent('course', `${course.id}:${moduleId}`);

        await AsyncStorage.setItem(`@urai_module_timestamp_${moduleId}`, new Date().toISOString());

        const newBadges = await checkAndAwardBadges();
        if (newBadges && newBadges.length > 0) {
          setEarnedBadges(newBadges);
          setCurrentBadgeToShow(newBadges[0]);
        }
      }
    } catch {
      // Ignore persistence failures and keep the session alive.
    }
  };

  const handleTakeQuiz = (moduleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/quiz',
      params: { courseId, moduleId },
    });
  };

  const handleTakeFinalExam = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/quiz',
      params: { courseId, moduleId: 'final-exam' },
    });
  };

  const handleGetCertificate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/certificate',
      params: { courseId, examScore: progress?.finalExamScore || 100 },
    });
  };

  const handleShareModule = async (moduleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const moduleNumber = parseInt(moduleId.replace('module-', ''), 10);
    await shareCard(
      shareCardRef,
      'module_complete',
      { moduleNumber: isNaN(moduleNumber) ? 1 : moduleNumber },
      setShareData
    );
  };

  const handleOpenPlaylist = async () => {
    if (!course?.playlistUrl || !progress) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedProgress = {
      ...progress,
      enrolled: true,
      playlistVisits: (progress.playlistVisits || 0) + 1,
    };
    await persistProgress(updatedProgress);
    router.push({ pathname: '/youtube-player', params: { url: course.playlistUrl } });
  };

  const handleToggleTrackCompletion = async () => {
    if (!progress || isFlagshipCourse) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updatedProgress = {
      ...progress,
      completedAt: progress.completedAt ? null : new Date().toISOString(),
    };
    await persistProgress(updatedProgress);
    if (!progress.completedAt) {
      await recordWeeklyProgressEvent('course', `${course.id}:completed`);
      await maybeRequestReview('course_completion', { courseCompleted: true });
    }
  };

  if (!course) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>کورس نہیں ملا</Text>
        <TouchableOpacity onPress={handleBack} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>واپس جائیں</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isFlagshipCourse) {
    const completed = Boolean(progress?.completedAt);

    return (
      <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
        <StatusBar style="light" backgroundColor="#003366" />

        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>کورسز</Text>
            <Text style={styles.backEmoji}>←</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.trackHeroCard}>
            <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']} style={styles.trackHeroGradient}>
              <View style={styles.trackHeroTopRow}>
                <View style={styles.trackHeroBadge}>
                  <Text style={styles.trackHeroBadgeText}>{course.badgeLabelUr || course.badgeLabel}</Text>
                </View>
                {completed ? (
                  <View style={[styles.trackHeroBadge, { backgroundColor: 'rgba(76,175,80,0.2)' }]}>
                    <Text style={[styles.trackHeroBadgeText, { color: '#4CD964' }]}>مکمل</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.trackHeroTitleUr}>{course.titleUr}</Text>
              <Text style={styles.trackHeroTitleEn}>{course.title}</Text>
              <Text style={styles.trackHeroDescription}>{course.descriptionUr}</Text>

              <View style={styles.trackStatRow}>
                <View style={styles.trackStatItem}>
                  <Text style={styles.trackStatValue}>{course.totalVideos}</Text>
                  <Text style={styles.trackStatLabel}>ویڈیوز</Text>
                </View>
                <View style={styles.trackStatItem}>
                  <Text style={styles.trackStatValue}>{course.estimatedHours}</Text>
                  <Text style={styles.trackStatLabel}>گھنٹے</Text>
                </View>
                <View style={styles.trackStatItem}>
                  <Text style={styles.trackStatValue}>{progress?.playlistVisits || 0}</Text>
                  <Text style={styles.trackStatLabel}>وزٹس</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.trackInfoCard}>
            <Text style={styles.infoLabel}>یہ کورس کن کے لیے ہے</Text>
            <Text style={styles.infoBody}>{course.audienceUr}</Text>

            <View style={styles.infoDivider} />

            <Text style={styles.infoLabel}>آپ کیا حاصل کریں گے</Text>
            <Text style={styles.infoBody}>{course.outcomeUr}</Text>
          </View>

          <Text style={styles.sectionTitle}>آپ کیا سیکھیں گے</Text>
          {course.curriculum?.map((item: string, index: number) => (
            <View key={`${course.id}-curriculum-${index}`} style={styles.curriculumCard}>
              <View style={styles.curriculumIcon}>
                <Text style={styles.curriculumIconText}>{index + 1}</Text>
              </View>
              <Text style={styles.curriculumText}>{item}</Text>
            </View>
          ))}

          <View style={styles.specializationActions}>
            <TouchableOpacity style={styles.primaryActionButton} onPress={handleOpenPlaylist}>
              <Ionicons name="logo-youtube" size={20} color="#003366" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionText}>مکمل پلے لسٹ دیکھیں</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryActionButton} onPress={handleToggleTrackCompletion}>
              <Ionicons
                name={completed ? 'refresh' : 'checkmark-circle-outline'}
                size={20}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.secondaryActionText}>
                {completed ? 'دوبارہ جاری حالت میں لائیں' : 'کورس مکمل نشان زد کریں'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  const modules = course.modules || [];
  const completedSet = new Set(progress?.modulesCompleted || []);
  const hasPassedFinal = progress?.finalExamScore >= course.passingScore;

  return (
    <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
      <StatusBar style="light" backgroundColor="#003366" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backEmoji}>←</Text>
          <Text style={styles.backText}>{course.titleUr}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {modules.map((module: any, index: number) => {
          const isUnlocked = index === 0 || completedSet.has(modules[index - 1].id);
          const isCompleted = completedSet.has(module.id);
          const isExpanded = expandedModule === module.id;
          const qScore = progress?.quizScores?.[module.id];
          const passedQuiz = qScore >= course.passingScore;

          return (
            <View key={module.id} style={[styles.moduleCard, !isUnlocked && styles.moduleLocked]}>
              <TouchableOpacity
                style={styles.moduleHeader}
                onPress={() => (isUnlocked ? toggleModule(module.id) : null)}
                activeOpacity={isUnlocked ? 0.7 : 1}
              >
                <View style={styles.moduleTitleRow}>
                  <View style={styles.moduleNumberBadge}>
                    <Text style={styles.moduleNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.moduleTitleTextContainer}>
                    <Text style={styles.moduleTitleUr}>{module.titleUr}</Text>
                    <Text style={styles.moduleTitleEn}>{module.title}</Text>
                  </View>
                </View>

                <View style={styles.moduleStatusIcon}>
                  {!isUnlocked ? (
                    <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.4)" />
                  ) : isCompleted ? (
                    <Ionicons name="checkmark-circle" size={28} color="#4CD964" />
                  ) : (
                    <Ionicons name="play-circle" size={28} color="#FFD700" />
                  )}
                </View>
              </TouchableOpacity>

              {isExpanded && isUnlocked && (
                <View style={styles.moduleBody}>
                  <View style={styles.videoContainer}>
                    <YoutubePlayer
                      height={200}
                      play={true}
                      videoId={module.videoId}
                      onReady={() => setVideoReady(true)}
                      onChangeState={() => {}}
                    />
                    {!videoReady && (
                      <View style={styles.videoLoadingOverlay}>
                        <Text style={styles.videoLoadingText}>Loading Player...</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.guideContainer}>
                    <Text style={styles.guideTitleUr}>اسٹڈی گائیڈ</Text>
                    <Text style={styles.guideTextUr}>{module.guideUr}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.guideTitleEn}>Study Guide</Text>
                    <Text style={styles.guideTextEn}>{module.guide}</Text>
                  </View>

                  <View style={styles.moduleActions}>
                    {module.quiz && module.quiz.length > 0 ? (
                      <View style={styles.quizActionContainer}>
                        {qScore !== undefined ? (
                          <View style={styles.scoreBadge}>
                            <Text style={styles.scoreText}>
                              Quiz Score: {qScore}% {passedQuiz ? '✅' : '❌'}
                            </Text>
                          </View>
                        ) : null}

                        {!qScore || qScore < course.passingScore ? (
                          <TouchableOpacity
                            style={styles.primaryActionButton}
                            onPress={() => handleTakeQuiz(module.id)}
                          >
                            <Text style={styles.primaryActionText}>Take Module Quiz</Text>
                          </TouchableOpacity>
                        ) : (
                          !isCompleted && (
                            <TouchableOpacity
                              style={styles.successActionButton}
                              onPress={() => markModuleCompleted(module.id)}
                            >
                              <Text style={styles.successActionText}>Mark Module as Done</Text>
                            </TouchableOpacity>
                          )
                        )}

                        {isCompleted && (
                          <TouchableOpacity
                            style={styles.shareActionButton}
                            onPress={() => handleShareModule(module.id)}
                          >
                            <Ionicons
                              name="share-social-outline"
                              size={18}
                              color="#FFF"
                              style={{ marginRight: 6 }}
                            />
                            <Text style={styles.successActionText}>Share Progress</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <>
                        {!isCompleted && (
                          <TouchableOpacity
                            style={styles.successActionButton}
                            onPress={() => markModuleCompleted(module.id)}
                          >
                            <Text style={styles.successActionText}>Mark Module as Done</Text>
                          </TouchableOpacity>
                        )}
                        {isCompleted && (
                          <TouchableOpacity
                            style={styles.shareActionButton}
                            onPress={() => handleShareModule(module.id)}
                          >
                            <Ionicons
                              name="share-social-outline"
                              size={18}
                              color="#FFF"
                              style={{ marginRight: 6 }}
                            />
                            <Text style={styles.successActionText}>Share Progress</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.finalExamCard}>
          <LinearGradient colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']} style={styles.finalExamGradient}>
            <View style={styles.finalExamHeader}>
              <Ionicons name="ribbon" size={40} color="#FFD700" />
              <Text style={styles.finalExamTitleUr}>{course.finalExam.titleUr}</Text>
              <Text style={styles.finalExamTitleEn}>{course.finalExam.title}</Text>
            </View>

            <Text style={styles.finalExamDesc}>{course.finalExam.descriptionUr}</Text>

            {progress?.finalExamScore !== undefined && progress?.finalExamScore !== null && (
              <View style={styles.finalScoreBadge}>
                <Text style={styles.finalScoreText}>
                  Final Score: {progress.finalExamScore}% {hasPassedFinal ? '🌟 PASSED!' : '❌ Failed'}
                </Text>
              </View>
            )}

            {completedSet.size === modules.length ? (
              <View style={styles.finalActionStack}>
                {!hasPassedFinal ? (
                  <TouchableOpacity style={styles.examButton} onPress={handleTakeFinalExam}>
                    <Text style={styles.examButtonText}>Take Final Exam</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.certButton} onPress={handleGetCertificate}>
                    <Ionicons name="cloud-download-outline" size={20} color="#003366" />
                    <Text style={styles.certButtonText}>Get Certificate</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.lockedExamContainer}>
                <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.5)" />
                <Text style={styles.lockedExamText}>Complete all modules to unlock Exam</Text>
              </View>
            )}
          </LinearGradient>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', top: -1000, left: -1000 }}>
        <ShareCard ref={shareCardRef} data={shareData} />
      </View>

      {currentBadgeToShow && (
        <BadgeCelebration
          badge={currentBadgeToShow}
          visible={!!currentBadgeToShow}
          onClose={handleBadgeClose}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#003366' },
  errorText: { color: 'red', fontSize: 18, fontFamily: 'Montserrat-Bold', marginBottom: 20 },
  errorButton: { backgroundColor: '#FFD700', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  errorButtonText: { color: '#000', fontFamily: 'Montserrat-Bold' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end' },
  backEmoji: { color: '#FFD700', fontSize: 18, marginLeft: 8 },
  backText: { color: '#fff', fontSize: 15, fontFamily: 'Montserrat-SemiBold' },
  scrollContent: { padding: 18, paddingBottom: 60 },

  trackHeroCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 18,
  },
  trackHeroGradient: {
    padding: 22,
  },
  trackHeroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  trackHeroBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  trackHeroBadgeText: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
  },
  trackHeroTitleUr: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 29,
    lineHeight: 40,
    textAlign: 'right',
  },
  trackHeroTitleEn: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    marginTop: 8,
  },
  trackHeroDescription: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    lineHeight: 25,
    textAlign: 'right',
    marginTop: 18,
  },
  trackStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  trackStatItem: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  trackStatValue: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
  },
  trackStatLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    marginTop: 4,
  },
  trackInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  infoLabel: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'right',
  },
  infoBody: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    marginBottom: 14,
    textAlign: 'right',
  },
  curriculumCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  curriculumIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,215,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  curriculumIconText: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 15,
  },
  curriculumText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    lineHeight: 21,
    flex: 1,
    textAlign: 'right',
  },
  specializationActions: {
    marginTop: 18,
    gap: 12,
  },

  moduleCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  moduleLocked: { opacity: 0.6 },
  moduleHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  moduleNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,215,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  moduleNumberText: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 16 },
  moduleTitleTextContainer: { flex: 1 },
  moduleTitleUr: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 18, textAlign: 'left' },
  moduleTitleEn: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Montserrat-Regular', fontSize: 13, marginTop: 2 },
  moduleStatusIcon: { marginLeft: 10, width: 30, alignItems: 'center' },

  moduleBody: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  videoContainer: { width: '100%', height: 200, backgroundColor: '#000' },
  videoLoadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  videoLoadingText: { color: '#FFD700', fontFamily: 'Montserrat-Regular' },

  guideContainer: { padding: 20 },
  guideTitleUr: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 18, textAlign: 'right', marginBottom: 8 },
  guideTextUr: { color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 16, textAlign: 'right', lineHeight: 28 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 15 },
  guideTitleEn: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 16, marginBottom: 8 },
  guideTextEn: { color: 'rgba(255,255,255,0.8)', fontFamily: 'Montserrat-Regular', fontSize: 14, lineHeight: 22 },

  moduleActions: { padding: 20, paddingTop: 0 },
  quizActionContainer: { gap: 10 },
  scoreBadge: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 8, alignItems: 'center' },
  scoreText: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 14 },
  primaryActionButton: { backgroundColor: '#FFD700', padding: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  primaryActionText: { color: '#003366', fontFamily: 'Montserrat-Bold', fontSize: 16 },
  successActionButton: { backgroundColor: '#4CD964', padding: 15, borderRadius: 12, alignItems: 'center' },
  secondaryActionButton: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  secondaryActionText: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 16 },
  shareActionButton: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  successActionText: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 16 },

  finalExamCard: { marginTop: 20, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#FFD700' },
  finalExamGradient: { padding: 24, alignItems: 'center' },
  finalExamHeader: { alignItems: 'center', marginBottom: 16 },
  finalExamTitleUr: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 24, marginTop: 10, textAlign: 'center' },
  finalExamTitleEn: { color: 'rgba(255,255,255,0.9)', fontFamily: 'Montserrat-Regular', fontSize: 16, marginTop: 4 },
  finalExamDesc: { color: '#FFF', fontFamily: 'Montserrat-Regular', textAlign: 'center', fontSize: 15, lineHeight: 22, opacity: 0.9, marginBottom: 20 },

  finalScoreBadge: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 8, marginBottom: 20, width: '100%' },
  finalScoreText: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 16, textAlign: 'center' },

  finalActionStack: { width: '100%', gap: 12 },
  examButton: { backgroundColor: '#FFD700', padding: 16, borderRadius: 30, alignItems: 'center', width: '100%' },
  examButtonText: { color: '#003366', fontFamily: 'Montserrat-Bold', fontSize: 18 },

  certButton: { backgroundColor: '#FFD700', flexDirection: 'row', gap: 8, padding: 16, borderRadius: 30, alignItems: 'center', justifyContent: 'center', width: '100%' },
  certButtonText: { color: '#003366', fontFamily: 'Montserrat-Bold', fontSize: 18 },

  lockedExamContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8 },
  lockedExamText: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Montserrat-Regular', fontSize: 14 },
});
