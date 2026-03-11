import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Share from 'react-native-share';
import { queueCertificate, syncCertificates, getDeviceId, getSyncStatus } from '../services/certificateSync';
import { checkAndAwardBadges } from '../services/badgeService';
import BadgeCelebration from '../components/BadgeCelebration';

import courseData from '../data/courses.json';

const { width } = Dimensions.get('window');

// Utility to generate random unique string
const generateCertId = () => {
    return 'URAI-' + Math.random().toString(36).substring(2, 10).toUpperCase();
};

export default function CertificateScreen() {
    const router = useRouter();
    const { courseId, examScore } = useLocalSearchParams();

    const [course, setCourse] = useState<any>(null);
    const [step, setStep] = useState(1);
    const [nameUr, setNameUr] = useState('');
    const [nameEn, setNameEn] = useState('');
    const [email, setEmail] = useState('');
    const [certificateId, setCertificateId] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<any>(null);
    const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
    const [currentBadgeToShow, setCurrentBadgeToShow] = useState<any>(null);

    useEffect(() => {
        const c = courseData.courses.find(cd => cd.id === courseId);
        if (c) setCourse(c);

        // Load potentially existing cert details
        checkExisting();
    }, [courseId]);

    const handleBadgeClose = () => {
        const remaining = earnedBadges.slice(1);
        setEarnedBadges(remaining);
        setCurrentBadgeToShow(remaining.length > 0 ? remaining[0] : null);
    };

    const checkExisting = async () => {
        try {
            const stored = await AsyncStorage.getItem(`course_progress_${courseId}`);
            if (stored) {
                const progressData = JSON.parse(stored);
                if (progressData.certificateId) {
                    setCertificateId(progressData.certificateId);
                    setNameUr(progressData.nameUr || '');
                    setNameEn(progressData.nameEn || '');
                    setEmail(progressData.email || '');
                    setIssueDate(progressData.issuedAt ? new Date(progressData.issuedAt).toLocaleDateString() : new Date().toLocaleDateString());
                    setStep(2);

                    const status = await getSyncStatus();
                    setSyncStatus(status);
                }
            }
        } catch (e) {
            // Error fetching cert info
        }
    };

    const handleGenerate = async () => {
        if (!nameUr.trim() || !nameEn.trim() || !email.trim()) {
            Alert.alert('Missing Info', 'Please provide your name in both Urdu and English, and your Email Address.');
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const newCertId = generateCertId();
        const currentDate = new Date().toISOString();

        setCertificateId(newCertId);
        setIssueDate(new Date(currentDate).toLocaleDateString());
        setStep(2);
        setSyncing(true);
        try {
            const storedProgress = await AsyncStorage.getItem(`course_progress_${courseId}`);
            if (storedProgress) {
                const progressData = JSON.parse(storedProgress);
                progressData.certificateId = newCertId;
                progressData.nameUr = nameUr;
                progressData.nameEn = nameEn;
                progressData.email = email;
                progressData.issuedAt = currentDate;
                await AsyncStorage.setItem(`course_progress_${courseId}`, JSON.stringify(progressData));
            }

            const deviceId = await getDeviceId();

            await queueCertificate({
                certificateId: newCertId,
                nameEn: nameEn,
                nameUr: nameUr,
                email: email,
                score: examScore,
                courseName: 'Urdu AI Master Class',
                issuedAt: currentDate,
                deviceId: deviceId
            });

            // Try to sync immediately
            const result = await syncCertificates();
            setSyncStatus(result);

            // Push Notification Hook
            const { onCertificateEarned } = require('../services/localNotifications');
            await onCertificateEarned();

            // Check for new badges
            const newBadges = await checkAndAwardBadges();
            if (newBadges && newBadges.length > 0) {
                setEarnedBadges(newBadges);
                setCurrentBadgeToShow(newBadges[0]);
            }

        } catch (error: any) {
            setSyncStatus({ synced: 0, pending: 1, error: error?.message || 'Certificate sync failed.' });
        } finally {
            setSyncing(false);
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (step === 2 && !certificateId) {
            setStep(1);
        } else if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/courses');
        }
    };

    const handleShareCertificate = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await Share.open({
                title: 'Urdu AI Certificate',
                message:
                    '🎓 میں نے Urdu AI Master Class مکمل کر لی!\n\n' +
                    'I just completed the Urdu AI Master Class!\n' +
                    'Certificate ID: ' + certificateId + '\n\n' +
                    'Verify: https://urduai.org/verify/?id=' + certificateId + '\n\n' +
                    'Start your AI journey: https://urduai.org/app\n\n' +
                    '#UrduAI #AIinUrdu #Certificate',
            });
        } catch (err) {
            // User cancelled share
        }
    };

    const handleNavigateToScholarship = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/scholarship');
    };

    if (!course) {
        return (
            <View style={styles.container}>
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 100 }} />
            </View>
        );
    }

    return (
        <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backEmoji}>←</Text>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Certificate</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {step === 1 ? (
                    <View style={styles.inputCard}>
                        <Ionicons name="ribbon" size={60} color="#FFD700" style={{ marginBottom: 20 }} />
                        <Text style={styles.cardTitle}>You Passed!</Text>
                        <Text style={styles.cardDesc}>
                            Enter your name below exactly as you want it to appear on your certificate.
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabelUr}>مکمل نام (اردو میں)</Text>
                            <TextInput
                                style={[styles.input, { textAlign: 'right', fontFamily: 'Montserrat-Bold', fontSize: 20 }]}
                                placeholder="مثلاً: قیصر رونجھا"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={nameUr}
                                onChangeText={setNameUr}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Full Name (English)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Qaisar Roonjha"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={nameEn}
                                onChangeText={setNameEn}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabelUr}>آپ کی ای میل</Text>
                            <TextInput
                                style={[styles.input, { textAlign: 'right', fontFamily: 'Montserrat-Regular', fontSize: 16 }]}
                                placeholder="e.g. user@gmail.com"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Text style={{ color: '#888', fontSize: 10, textAlign: 'center', marginTop: 5 }}>سرٹیفکیٹ آپ کی ای میل پر بھیجا جائے گا — Certificate will be sent to your email</Text>
                        </View>

                        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
                            <Text style={styles.generateBtnText}>Generate Certificate</Text>
                        </TouchableOpacity>
                    </View>

                ) : (
                    <View style={styles.successContainer}>
                        <Ionicons name="checkmark-circle" size={80} color="#4CAF50" style={{ marginBottom: 20 }} />
                        <Text style={styles.successTitle}>Certificate Created!</Text>

                        <Text style={styles.successText}>
                            Your certificate details have been recorded.
                        </Text>

                        <Text style={styles.successTextEmail}>
                            A high-quality certificate replica will be generated and sent directly to:
                            {'\n'}
                            <Text style={{ fontFamily: 'Montserrat-Bold', color: '#FFD700' }}>{email}</Text>
                        </Text>

                        <View style={styles.verifyBox}>
                            <Text style={styles.verifyTitle}>Certificate ID:</Text>
                            <Text style={styles.verifyId} selectable={true}>{certificateId}</Text>
                            <Text style={styles.verifyInfo}>
                                You can verify this credential anytime at:{'\n'}
                                <Text style={styles.verifyLink}>www.urduai.org/verify</Text>
                            </Text>
                        </View>

                        {/* Sync Status Banner */}
                        <View style={styles.syncStatusCard}>
                            {syncing ? (
                                <ActivityIndicator size="small" color="#FFD700" />
                            ) : syncStatus?.error ? (
                                <Text style={styles.syncStatusTextWarning}>
                                    ⚠️ Certificate saved on this device, but server sync is not working right now. It has not been confirmed in Google Sheets yet.
                                </Text>
                            ) : syncStatus?.pending > 0 ? (
                                <Text style={styles.syncStatusText}>
                                    📶 Saved offline. It will be emailed to you automatically the moment you connect to the internet.
                                </Text>
                            ) : (
                                <Text style={styles.syncStatusTextSuccess}>
                                    ✉️ Successfully synced! Check your inbox shortly.
                                </Text>
                            )}
                        </View>

                        {/* Share & Google AI CTA Buttons */}
                        <TouchableOpacity style={styles.shareBtn} onPress={handleShareCertificate}>
                            <Ionicons name="share-social" size={20} color="#003366" style={{ marginRight: 8 }} />
                            <Text style={styles.shareBtnText}>Share Certificate / سرٹیفکیٹ شیئر کریں</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.googleAiBtn} onPress={handleNavigateToScholarship}>
                            <Ionicons name="school" size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <View>
                                <Text style={styles.googleAiBtnText}>Get FREE Google AI Cert</Text>
                                <Text style={styles.googleAiBtnUrdu}>مفت Google AI سرٹیفیکیشن حاصل کریں</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.backToCoursesBtn} onPress={handleBack}>
                            <Text style={styles.backToCoursesText}>Back to Courses</Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>

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
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 45,
        paddingBottom: 15,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 18 },
    backButton: { flexDirection: 'row', alignItems: 'center' },
    backEmoji: { color: '#FFD700', fontSize: 18, marginRight: 4 },
    backText: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat-Regular' },

    scrollContent: { padding: 20, flexGrow: 1, justifyContent: 'center' },

    inputCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
    cardTitle: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 28, marginBottom: 10 },
    cardDesc: { color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 14, textAlign: 'center', opacity: 0.8, marginBottom: 30 },

    inputGroup: { width: '100%', marginBottom: 20 },
    inputLabel: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 14, marginBottom: 8 },
    inputLabelUr: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 14, marginBottom: 8, textAlign: 'right' },
    input: { backgroundColor: 'rgba(0,0,0,0.3)', color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 16, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    generateBtn: { backgroundColor: '#FFD700', width: '100%', padding: 18, borderRadius: 30, alignItems: 'center', marginTop: 10 },
    generateBtnText: { color: '#003366', fontFamily: 'Montserrat-Bold', fontSize: 18 },

    // Success Screen Layout
    successContainer: { padding: 30, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(76, 175, 80, 0.3)', marginTop: 20 },
    successTitle: { color: '#4CAF50', fontFamily: 'Montserrat-Bold', fontSize: 26, marginBottom: 15, textAlign: 'center' },
    successText: { color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 16, textAlign: 'center', marginBottom: 10, lineHeight: 24, opacity: 0.9 },
    successTextEmail: { color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 16, textAlign: 'center', marginTop: 10, lineHeight: 24 },

    verifyBox: { marginTop: 20, padding: 15, backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: '#FFD700', width: '100%', alignItems: 'center' },
    verifyTitle: { color: '#FFD700', fontFamily: 'Montserrat-Regular', fontSize: 12, textTransform: 'uppercase' },
    verifyId: { color: '#FFF', fontFamily: 'Montserrat-SemiBold', fontSize: 18, marginVertical: 5, letterSpacing: 1 },
    verifyInfo: { color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 12, textAlign: 'center', opacity: 0.8, marginTop: 5 },
    verifyLink: { color: '#4CAF50', fontFamily: 'Montserrat-Bold' },

    syncStatusCard: { marginTop: 25, padding: 15, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, width: '100%', alignItems: 'center' },
    syncStatusText: { color: '#FFD700', fontFamily: 'Montserrat-Regular', fontSize: 13, textAlign: 'center', lineHeight: 20 },
    syncStatusTextSuccess: { color: '#4CAF50', fontFamily: 'Montserrat-Bold', fontSize: 14, textAlign: 'center' },
    syncStatusTextWarning: { color: '#FFB347', fontFamily: 'Montserrat-Bold', fontSize: 14, textAlign: 'center', lineHeight: 20 },

    shareBtn: { backgroundColor: '#FFD700', width: '100%', flexDirection: 'row', padding: 16, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginTop: 25 },
    shareBtnText: { color: '#003366', fontFamily: 'Montserrat-Bold', fontSize: 15 },

    googleAiBtn: { backgroundColor: '#4285F4', width: '100%', flexDirection: 'row', padding: 16, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
    googleAiBtnText: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 15 },
    googleAiBtnUrdu: { color: 'rgba(255,255,255,0.8)', fontFamily: 'Montserrat-Regular', fontSize: 12, marginTop: 2 },

    backToCoursesBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', width: '100%', padding: 18, borderRadius: 30, alignItems: 'center', marginTop: 12 },
    backToCoursesText: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 16 },
});
