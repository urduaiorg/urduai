import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import courseData from '../data/courses.json';
import { recordActivity } from '../services/streakService';
import { checkAndAwardBadges } from '../services/badgeService';
import BadgeCelebration from '../components/BadgeCelebration';
import ShareCard from '../components/ShareCard';
import { shareCard } from '../services/shareCardService';

const { width } = Dimensions.get('window');

export default function QuizScreen() {
    const router = useRouter();
    const { courseId, moduleId } = useLocalSearchParams();

    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [finalScore, setFinalScore] = useState(0); // Stores the accurate final score for results display
    const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
    const [currentBadgeToShow, setCurrentBadgeToShow] = useState<any>(null);

    // Timer state for Final Exam
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const timerRef = useRef<any>(null);
    const shareCardRef = useRef<any>(null);
    const [shareData, setShareData] = useState<any>({});

    const [course, setCourse] = useState<any>(null);
    const [moduleDetails, setModuleDetails] = useState<any>(null);
    const isFinalExam = moduleId === 'final-exam';

    // Animation values
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const c = courseData.courses.find(cd => cd.id === courseId);
        if (!c) return;
        setCourse(c);

        if (isFinalExam) {
            setQuestions(shuffleArray([...c.finalExam.questions]));
            setModuleDetails(c.finalExam);

            // Start timer
            const totalSeconds = (c.finalExam.timeLimit || 30) * 60;
            setTimeLeft(totalSeconds);
        } else {
            const m = c.modules.find(md => md.id === moduleId);
            if (m && m.quiz) {
                setModuleDetails(m);
                setQuestions(shuffleArray([...m.quiz]));
            }
        }
    }, [courseId, moduleId]);

    // Format timer
    useEffect(() => {
        if (timeLeft === null || isFinished) return;

        if (timeLeft <= 0) {
            handleAutoSubmitTimer();
            return;
        }

        timerRef.current = setTimeout(() => {
            setTimeLeft(prev => prev !== null ? prev - 1 : null);
        }, 1000);

        return () => clearTimeout(timerRef.current);
    }, [timeLeft, isFinished]);

    // Animate progress bar
    useEffect(() => {
        if (questions.length > 0) {
            Animated.timing(progressAnim, {
                toValue: (currentQuestionIdx / questions.length) * 100,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    }, [currentQuestionIdx, questions.length]);


    const shuffleArray = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const handleAutoSubmitTimer = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Time Up', 'Time is up! Auto-submitting your exam.');
        finishQuiz(score);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleOptionSelect = (optionIndex: number) => {
        if (selectedOption !== null) return; // Prevent changing answer

        Haptics.selectionAsync();
        setSelectedOption(optionIndex);

        const isCorrect = optionIndex === questions[currentQuestionIdx].correct;

        if (isCorrect) {
            setScore(prev => prev + 1);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (currentQuestionIdx < questions.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
            setSelectedOption(null);
        } else {
            // Last question answered
            // Calculate final score using current score block + 1 if the last option picked was correct
            const isCorrect = selectedOption === questions[currentQuestionIdx].correct;
            const finalScoreCount = isCorrect ? score + 1 : score;
            finishQuiz(finalScoreCount);
        }
    };

    const finishQuiz = async (finalRawScore: number) => {
        setIsFinished(true);
        setFinalScore(finalRawScore); // Store accurate score for results screen
        if (timerRef.current) clearTimeout(timerRef.current);

        const percentScore = Math.round((finalRawScore / questions.length) * 100);

        // Schedule Push Notification
        if (!isFinalExam) {
            const { onQuizComplete } = require('../services/localNotifications');
            const moduleNumber = parseInt((moduleId as string).replace('module-', ''), 10);
            if (!isNaN(moduleNumber)) {
                await onQuizComplete(moduleNumber, percentScore);
            }
        }

        // Record Daily Streak Activity
        try {
            await recordActivity();
        } catch (e) {
            // Failed to record streak activity from quiz
        }

        // Save to AsyncStorage
        try {
            const stored = await AsyncStorage.getItem(`course_progress_${courseId}`);
            if (stored) {
                const progressData = JSON.parse(stored);

                if (isFinalExam) {
                    progressData.finalExamScore = Math.max(progressData.finalExamScore || 0, percentScore);
                } else {
                    if (!progressData.quizScores) progressData.quizScores = {};
                    progressData.quizScores[moduleId as string] = Math.max(progressData.quizScores[moduleId as string] || 0, percentScore);
                }

                await AsyncStorage.setItem(`course_progress_${courseId}`, JSON.stringify(progressData));
            }

            // Check for new badges
            const newBadges = await checkAndAwardBadges();
            if (newBadges && newBadges.length > 0) {
                setEarnedBadges(newBadges);
                setCurrentBadgeToShow(newBadges[0]);
            }
        } catch (e) {
            // Error saving quiz score
        }
    };

    const handleBadgeClose = () => {
        const remaining = earnedBadges.slice(1);
        setEarnedBadges(remaining);
        setCurrentBadgeToShow(remaining.length > 0 ? remaining[0] : null);
    };

    const handleRetry = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setQuestions(shuffleArray([...questions]));
        setCurrentQuestionIdx(0);
        setSelectedOption(null);
        setScore(0);
        setFinalScore(0);
        setIsFinished(false);
        if (isFinalExam) {
            setTimeLeft((course.finalExam.timeLimit || 30) * 60);
        }
    };

    const handleBackToCourse = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleGetCertificate = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const percentScore = Math.round((finalScore / questions.length) * 100);
        router.push({
            pathname: '/certificate',
            params: { courseId, examScore: percentScore }
        });
    };

    const handleShareScore = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const percentScore = Math.round((finalScore / questions.length) * 100);
        const moduleNumber = parseInt((moduleId as string).replace('module-', ''), 10);
        await shareCard(shareCardRef, 'quiz_pass', { score: percentScore, moduleNumber: isNaN(moduleNumber) ? 1 : moduleNumber }, setShareData);
    };

    // Render loading or missing data state
    if (!questions || questions.length === 0) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No questions found.</Text>
                <TouchableOpacity onPress={handleBackToCourse} style={styles.errorButton}>
                    <Text style={styles.errorButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Results Screen rendering
    if (isFinished) {
        const percentScore = Math.round((finalScore / questions.length) * 100);
        const isPassed = percentScore >= course.passingScore;

        return (
            <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.resultsContainer}>

                    {isPassed ? (
                        <View style={styles.celebrationCircle}>
                            <Text style={styles.celebrationEmoji}>🏆</Text>
                        </View>
                    ) : (
                        <View style={[styles.celebrationCircle, { backgroundColor: 'rgba(255, 59, 48, 0.2)', borderColor: '#FF3B30' }]}>
                            <Ionicons name="close" size={60} color="#FF3B30" />
                        </View>
                    )}

                    <Text style={styles.resultsTitle}>
                        {isPassed ? 'Congratulations! / مبارک ہو!' : 'Try Again / دوبارہ کوشش کریں'}
                    </Text>

                    <View style={styles.scoreCard}>
                        <Text style={styles.scoreNumber}>{percentScore}%</Text>
                        <Text style={styles.scoreDetails}>
                            {finalScore} out of {questions.length} correct
                        </Text>
                    </View>

                    <Text style={styles.resultsMessage}>
                        {isPassed
                            ? `You have successfully passed the ${isFinalExam ? 'Final Exam' : 'Quiz'}.`
                            : `You need ${course.passingScore}% to pass. Review the material and try again.`}
                    </Text>

                    <View style={styles.resultsActions}>
                        {!isPassed ? (
                            <>
                                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                                    <Ionicons name="refresh" size={20} color="#000" />
                                    <Text style={styles.retryButtonText}>Retry Quiz</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.outlineButton} onPress={handleBackToCourse}>
                                    <Text style={styles.outlineButtonText}>Review Material</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {isFinalExam ? (
                                    <TouchableOpacity style={styles.certButton} onPress={handleGetCertificate}>
                                        <Ionicons name="ribbon" size={20} color="#000" />
                                        <Text style={styles.certButtonText}>Get Certificate</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={styles.certButton} onPress={handleBackToCourse}>
                                        <Text style={styles.certButtonText}>Continue Course</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.outlineButton} onPress={handleShareScore}>
                                    <Ionicons name="share-social-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.outlineButtonText}>Share Score</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                </View>

                {/* Hidden Share Card */}
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

    // Active Quiz Screen rendering
    const q = questions[currentQuestionIdx];

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
                <StatusBar style="light" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBackToCourse} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.progressText}>
                            Question {currentQuestionIdx + 1} of {questions.length}
                        </Text>
                        {isFinalExam && timeLeft !== null && (
                            <View style={styles.timerBadge}>
                                <Ionicons name="time-outline" size={16} color="#FFD700" style={{ marginRight: 4 }} />
                                <Text style={[styles.timerText, timeLeft < 60 && { color: '#FF3B30' }]}>
                                    {formatTime(timeLeft)}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={{ width: 28 }} />
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                    <Animated.View style={[styles.progressBarFill, {
                        width: progressAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%']
                        })
                    }]} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* Question Card */}
                    <View style={styles.questionCard}>
                        <Text style={styles.questionUrdu}>{q.question}</Text>
                        {q.questionEn && <Text style={styles.questionEn}>{q.questionEn}</Text>}
                    </View>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {q.options.map((optionText: string, idx: number) => {

                            let optionStyle: any = styles.optionButton;
                            let optionTextStyle = styles.optionTextUrdu;
                            let optionTextEnStyle = styles.optionTextEn;
                            let iconName: any = "ellipse-outline";
                            let iconColor = "rgba(255,255,255,0.3)";

                            if (selectedOption !== null) {
                                // Answer locked in
                                if (idx === q.correct) {
                                    optionStyle = [styles.optionButton, styles.optionCorrect];
                                    iconName = "checkmark-circle";
                                    iconColor = "#4CD964";
                                } else if (idx === selectedOption) {
                                    optionStyle = [styles.optionButton, styles.optionWrong];
                                    iconName = "close-circle";
                                    iconColor = "#FF3B30";
                                } else {
                                    optionStyle = [styles.optionButton, { opacity: 0.5 }];
                                }
                            }

                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={optionStyle}
                                    onPress={() => handleOptionSelect(idx)}
                                    activeOpacity={selectedOption !== null ? 1 : 0.7}
                                >
                                    <View style={styles.optionContent}>
                                        <Text style={optionTextStyle}>{optionText}</Text>
                                        {q.optionsEn && q.optionsEn[idx] && (
                                            <Text style={optionTextEnStyle}>{q.optionsEn[idx]}</Text>
                                        )}
                                    </View>
                                    <Ionicons name={iconName} size={24} color={iconColor} style={styles.optionIcon} />
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                </ScrollView>

                {/* Footer Next Button */}
                {selectedOption !== null && (
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                            <Text style={styles.nextButtonText}>
                                {currentQuestionIdx < questions.length - 1 ? 'Next Question / اگلا سوال' : 'View Results / نتائج دیکھیں'}
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color="#000" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                )}

            </LinearGradient>
        </View>
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
        paddingBottom: 15,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    closeButton: { padding: 4 },
    headerCenter: { alignItems: 'center' },
    progressText: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Montserrat-Bold', fontSize: 14 },
    timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
    timerText: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 12 },

    progressBarContainer: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%' },
    progressBarFill: { height: '100%', backgroundColor: '#FFD700' },

    scrollContent: { padding: 20, paddingBottom: 100 },

    questionCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 24,
        borderRadius: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
        alignItems: 'center',
    },
    questionUrdu: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 24, textAlign: 'center', lineHeight: 36 },
    questionEn: { color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 16, textAlign: 'center', marginTop: 15, opacity: 0.9, lineHeight: 24 },

    optionsContainer: { gap: 15 },
    optionButton: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionCorrect: { backgroundColor: 'rgba(76, 217, 100, 0.1)', borderColor: '#4CD964' },
    optionWrong: { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: '#FF3B30' },

    optionContent: { flex: 1, paddingRight: 15 },
    optionTextUrdu: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 18, textAlign: 'right' },
    optionTextEn: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Montserrat-Regular', fontSize: 14, textAlign: 'right', marginTop: 4 },
    optionIcon: {},

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#001933',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    nextButton: {
        backgroundColor: '#FFD700',
        padding: 18,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    nextButtonText: { color: '#003366', fontFamily: 'Montserrat-Bold', fontSize: 18, fontWeight: '900' },

    // Results styles
    resultsContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
    celebrationCircle: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(255,215,0,0.1)',
        borderWidth: 3, borderColor: '#FFD700',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 30,
    },
    celebrationEmoji: { fontSize: 60 },
    resultsTitle: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 28, textAlign: 'center', marginBottom: 20 },

    scoreCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 25, borderRadius: 20,
        alignItems: 'center', width: '100%',
        marginBottom: 20,
    },
    scoreNumber: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 48, marginBottom: 5 },
    scoreDetails: { color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 16, opacity: 0.8 },
    resultsMessage: { color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 40, opacity: 0.9 },

    resultsActions: { width: '100%', gap: 15 },
    certButton: { backgroundColor: '#FFD700', padding: 18, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    certButtonText: { color: '#000', fontFamily: 'Montserrat-Bold', fontSize: 18 },
    retryButton: { backgroundColor: '#FFF', padding: 18, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    retryButtonText: { color: '#000', fontFamily: 'Montserrat-Bold', fontSize: 18 },
    outlineButton: { backgroundColor: 'transparent', padding: 18, borderRadius: 30, borderWidth: 2, borderColor: '#FFF', alignItems: 'center' },
    outlineButtonText: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 18 },
});
