import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Share from 'react-native-share';

import scholarshipCourses from '../data/scholarshipCourses.json';
import { hasCourseCompletion, getSpotsInfo, getApplicationStatus, applyForScholarship, getScholarshipShareMessage } from '../services/scholarshipService';
import { checkAndAwardBadges } from '../services/badgeService';
import BadgeCelebration from '../components/BadgeCelebration';

export default function ScholarshipScreen() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [spotsInfo, setSpotsInfo] = useState<any>(null);
    const [applicationStatus, setApplicationStatus] = useState<any>(null);

    // Modal Form State
    const [formVisible, setFormVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [phone, setPhone] = useState('');

    // Result States
    const [showSuccess, setShowSuccess] = useState(false);
    const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
    const [currentBadgeToShow, setCurrentBadgeToShow] = useState<any>(null);

    const handleBadgeClose = () => {
        const remaining = earnedBadges.slice(1);
        setEarnedBadges(remaining);
        setCurrentBadgeToShow(remaining.length > 0 ? remaining[0] : null);
    };

    useEffect(() => {
        loadScholarshipData();
    }, []);

    const loadScholarshipData = async () => {
        setLoading(true);
        try {
            const unlocked = await hasCourseCompletion();
            setIsUnlocked(unlocked);

            const fetchedSpotsInfo = await getSpotsInfo();
            setSpotsInfo(fetchedSpotsInfo);

            const status = await getApplicationStatus();
            setApplicationStatus(status);

            if (status && status.applied) {
                setShowSuccess(true);
            }

        } catch (error) {
            // Error loading scholarship data
        } finally {
            setLoading(false);
        }
    };

    const handleApplyTap = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFormVisible(true);
    };

    const handleFormSubmit = async () => {
        if (fullName.trim().length < 2 || !email.trim().includes('@') || !city.trim()) {
            Alert.alert("Missing Information", "Please provide your Full Name, valid Email, and City.");
            return;
        }

        setSubmitting(true);
        try {
            const response = await applyForScholarship({ fullName, email, city, phone });

            if (response && response.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setFormVisible(false);
                setApplicationStatus({ applied: true });
                setShowSuccess(true);

                // Award badges for applying
                const newBadges = await checkAndAwardBadges();
                if (newBadges && newBadges.length > 0) {
                    setEarnedBadges(newBadges);
                    setCurrentBadgeToShow(newBadges[0]);
                }
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert("Submission Failed", response?.error || "You may have already applied, or the server is unavailable at this moment.");
            }
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Network Error", "Unable to reach the scholarship server. Please try again later.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleShare = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            await Share.open({
                title: 'Free Google AI Certification',
                message: getScholarshipShareMessage()
            });
        } catch (err) {
            // User likely cancelled share
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/courses');
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar style="light" backgroundColor="#003366" />
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    // STATE: SUCCESS (Just applied) or ALREADY APPLIED
    if (showSuccess || applicationStatus) {
        return (
            <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
                <StatusBar style="light" backgroundColor="#003366" />

                <TouchableOpacity onPress={handleBack} style={styles.backButtonTop}>
                    <Text style={styles.backEmoji}>←</Text>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <View style={styles.successWrapper}>
                    <View style={styles.celebrationCircle}>
                        <Text style={styles.celebrationEmoji}>🎉</Text>
                    </View>

                    <Text style={styles.successTitle}>
                        {applicationStatus?.date ? "You've already applied!" : "Application Submitted!"}
                    </Text>
                    <Text style={styles.successTitleUrdu}>
                        {applicationStatus?.date ? "آپ پہلے ہی درخواست دے چکے ہیں!" : "درخواست جمع ہو گئی!"}
                    </Text>

                    <View style={styles.receiptCard}>
                        {applicationStatus?.date && (
                            <Text style={styles.receiptText}>Applied on: {new Date(applicationStatus.date).toLocaleDateString()}</Text>
                        )}
                        {applicationStatus?.email && (
                            <Text style={styles.receiptTextFocused}>{applicationStatus.email}</Text>
                        )}
                        <View style={styles.divider} />
                        <Text style={styles.receiptBody}>
                            You will receive course access within 48 hours to the email provided above.
                        </Text>
                        <Text style={styles.receiptBodyUrdu}>
                            آپ کو 48 گھنٹوں میں کورس تک رسائی مل جائے گی۔
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                        <Ionicons name="share-social" size={20} color="#003366" style={{ marginRight: 8 }} />
                        <Text style={styles.shareButtonText}>Share with Friends / دوستوں کو بتائیں</Text>
                    </TouchableOpacity>

                    <Text style={styles.shareSubtitle}>
                        Tell your friends about free Google AI certification through Urdu AI!
                    </Text>
                </View>
            </LinearGradient>
        );
    }

    // MAIN VIEW (Locked or Unlocked)
    return (
        <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
            <StatusBar style="light" backgroundColor="#003366" />

            {/* Header Area */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.mainBackButton}>
                    <Text style={styles.backEmoji}>←</Text>
                </TouchableOpacity>

                <View style={styles.logoRow}>
                    <Text style={styles.headerLogoUrdu}>
                        Urdu <Text style={styles.headerLogoAi}>AI</Text>
                    </Text>
                    <Ionicons name="add" size={24} color="rgba(255,255,255,0.5)" style={{ marginHorizontal: 10 }} />
                    <Ionicons name="logo-google" size={30} color="#4285F4" />
                </View>

                <Text style={styles.headerTitleEn}>Google AI Professional Certificate</Text>
                <Text style={styles.headerTitleUr}>گوگل AI پروفیشنل سرٹیفیکیشن</Text>

                {spotsInfo && spotsInfo.displayText && (
                    <View style={styles.spotsBadge}>
                        <Text style={styles.spotsText}>{spotsInfo.displayText}</Text>
                    </View>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Status Banner */}
                {isUnlocked ? (
                    <View style={styles.unlockedBanner}>
                        <Text style={styles.bannerIcon}>🎉</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.unlockedTitle}>UNLOCKED!</Text>
                            <Text style={styles.unlockedBody}>
                                You completed Urdu AI Master Class! Apply now for FREE Google AI Professional Certification.
                            </Text>
                            <Text style={styles.unlockedBodyUrdu}>
                                آپ نے Urdu AI ماسٹر کلاس مکمل کر لی! اب مفت Google AI سرٹیفیکیشن کے لیے درخواست دیں۔
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.lockedBanner}>
                        <Ionicons name="lock-closed" size={32} color="#FFD700" style={{ marginRight: 15 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.lockedTitle}>Complete Urdu AI Master Class to unlock FREE Google AI Scholarship!</Text>
                            <Text style={styles.lockedTitleUrdu}>پہلے Urdu AI ماسٹر کلاس مکمل کریں، پھر مفت سکالرشپ حاصل کریں</Text>

                            <TouchableOpacity
                                style={styles.startCourseBtn}
                                onPress={() => router.push('/courses')}
                            >
                                <Text style={styles.startCourseBtnText}>Start Urdu AI Course →</Text>
                                <Text style={styles.startCourseBtnTextUrdu}>کورس شروع کریں</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Course List Wrapper */}
                <View style={[styles.courseListWrapper, !isUnlocked && styles.lockedOpacity]}>
                    <View style={styles.listHeader}>
                        <Text style={styles.listTitle}>7 Google AI Courses</Text>
                        {!isUnlocked && <Text style={styles.lockedPreviewText}>(Preview Only)</Text>}
                    </View>

                    {scholarshipCourses.map((course, idx) => (
                        <View key={course.id} style={styles.courseItemCard}>
                            <View style={styles.courseItemIcon}>
                                {isUnlocked ? (
                                    <Ionicons name="checkmark-circle" size={24} color="#34A853" />
                                ) : (
                                    <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.4)" />
                                )}
                            </View>
                            <View style={styles.courseItemContent}>
                                <Text style={styles.courseItemUrdu}>{course.titleUr}</Text>
                                <Text style={styles.courseItemEn}>{course.title}</Text>
                                <View style={styles.courseItemMeta}>
                                    <View style={styles.metaBadge}>
                                        <Text style={styles.metaBadgeText}>{course.level}</Text>
                                    </View>
                                    <Text style={styles.metaText}>{course.enrolled} enrolled</Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    {!isUnlocked && (
                        <View style={styles.lockedBottomDisclaimer}>
                            <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.6)" style={{ marginRight: 6 }} />
                            <Text style={styles.lockedBottomDisclaimerText}>Complete Course to Apply / پہلے کورس مکمل کریں</Text>
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* Sticky Bottom Apply Action */}
            {isUnlocked && (
                <View style={styles.stickyFooter}>
                    <TouchableOpacity style={styles.applyStickyBtn} onPress={handleApplyTap}>
                        <Text style={styles.applyStickyBtnLabel}>✨ Apply for Scholarship</Text>
                        <Text style={styles.applyStickyBtnUrdu}>سکالرشپ کے لیے درخواست دیں</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Application Modal */}
            <Modal
                transparent={true}
                visible={formVisible}
                animationType="slide"
                onRequestClose={() => setFormVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitleEn}>Google AI Scholarship Application</Text>
                                <Text style={styles.modalTitleUr}>گوگل AI سکالرشپ درخواست</Text>
                            </View>
                            <TouchableOpacity onPress={() => setFormVisible(false)} style={styles.modalClose}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalForm}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Full Name (Ensure Correct Spelling) *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your full legal name"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email Address *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="your.email@gmail.com"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>City *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Lahore"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={city}
                                    onChangeText={setCity}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 0300 1234567"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                />
                            </View>

                            <View style={styles.validationNote}>
                                <Text style={styles.validationText}>• Name, Email, and City are required.</Text>
                                <Text style={styles.validationText}>• Please verify your email before submitting.</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                                onPress={handleFormSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#003366" />
                                ) : (
                                    <>
                                        <Text style={styles.submitBtnText}>✅ Submit Application</Text>
                                        <Text style={styles.submitBtnUrdu}>درخواست جمع کرائیں</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

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
    container: { flex: 1, backgroundColor: '#003366' },

    // Header
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    backButtonTop: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 50, left: 20, zIndex: 10, flexDirection: 'row', alignItems: 'center' },
    mainBackButton: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 50, left: 20, zIndex: 10, padding: 5 },
    backEmoji: { color: '#FFD700', fontSize: 22, marginRight: 4, fontWeight: 'bold' },
    backText: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat-Regular' },
    logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    headerLogoUrdu: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 24, letterSpacing: 1, fontWeight: '900' },
    headerLogoAi: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 24, letterSpacing: 1, fontWeight: '900' },
    headerTitleEn: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 18, textAlign: 'center' },
    headerTitleUr: { color: '#FFD700', fontFamily: 'Montserrat-Regular', fontSize: 16, marginTop: 4, textAlign: 'center' },
    spotsBadge: { marginTop: 15, backgroundColor: 'rgba(255, 215, 0, 0.15)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.5)' },
    spotsText: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 13 },

    scrollContent: { padding: 16, paddingBottom: 120 },

    // Banners
    unlockedBanner: { flexDirection: 'row', backgroundColor: 'rgba(76, 217, 100, 0.1)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#4CAF50', marginBottom: 20 },
    bannerIcon: { fontSize: 32, marginRight: 15, marginTop: 5 },
    unlockedTitle: { color: '#4CAF50', fontFamily: 'Montserrat-Bold', fontSize: 18, marginBottom: 5 },
    unlockedBody: { color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 13, lineHeight: 20 },
    unlockedBodyUrdu: { color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 14, textAlign: 'right', marginTop: 8 },

    lockedBanner: { flexDirection: 'row', backgroundColor: 'rgba(255, 215, 0, 0.05)', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', marginBottom: 20, alignItems: 'center' },
    lockedTitle: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 14, lineHeight: 22 },
    lockedTitleUrdu: { color: '#FFD700', fontFamily: 'Montserrat-Regular', fontSize: 14, textAlign: 'right', marginTop: 5, marginBottom: 15 },
    startCourseBtn: { backgroundColor: '#FFD700', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 8, alignItems: 'center' },
    startCourseBtnText: { color: '#003366', fontFamily: 'Montserrat-Bold', fontSize: 14 },
    startCourseBtnTextUrdu: { color: '#003366', fontFamily: 'Montserrat-Regular', fontSize: 12, marginTop: 2 },

    // Course List
    courseListWrapper: { paddingVertical: 10 },
    lockedOpacity: { opacity: 0.5 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15, paddingHorizontal: 5 },
    listTitle: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 16 },
    lockedPreviewText: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Montserrat-Regular', fontSize: 13 },

    courseItemCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    courseItemIcon: { width: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    courseItemContent: { flex: 1 },
    courseItemUrdu: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 16, textAlign: 'left', marginBottom: 4 },
    courseItemEn: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Montserrat-Regular', fontSize: 13, marginBottom: 8 },
    courseItemMeta: { flexDirection: 'row', alignItems: 'center' },
    metaBadge: { backgroundColor: 'rgba(66, 133, 244, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginRight: 10 },
    metaBadgeText: { color: '#4285F4', fontFamily: 'Montserrat-Bold', fontSize: 10, textTransform: 'uppercase' },
    metaText: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Montserrat-Regular', fontSize: 12 },

    lockedBottomDisclaimer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: 15, borderRadius: 8, marginTop: 10 },
    lockedBottomDisclaimerText: { color: 'rgba(255,255,255,0.8)', fontFamily: 'Montserrat-Regular', fontSize: 14 },

    // Sticky Footer
    stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 15, backgroundColor: 'rgba(0, 25, 51, 0.95)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    applyStickyBtn: { backgroundColor: '#FFD700', paddingVertical: 15, borderRadius: 30, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.3, shadowRadius: 5 },
    applyStickyBtnLabel: { color: '#003366', fontFamily: 'Montserrat-Bold', fontSize: 16 },
    applyStickyBtnUrdu: { color: '#003366', fontFamily: 'Montserrat-Regular', fontSize: 14, marginTop: 2 },

    // Modal Details
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#001933', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)' },
    modalTitleEn: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 16 },
    modalTitleUr: { color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 14, marginTop: 2 },
    modalClose: { padding: 5 },

    modalForm: { padding: 20 },
    inputGroup: { marginBottom: 20 },
    inputLabel: { color: 'rgba(255,255,255,0.8)', fontFamily: 'Montserrat-Regular', fontSize: 13, marginBottom: 8 },
    input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 15, color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 16 },

    validationNote: { backgroundColor: 'rgba(255, 215, 0, 0.05)', padding: 15, borderRadius: 8, marginBottom: 25 },
    validationText: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Montserrat-Regular', fontSize: 12, marginBottom: 4 },

    submitBtn: { backgroundColor: '#4CAF50', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 16 },
    submitBtnUrdu: { color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 14, marginTop: 4 },

    // Success Screen
    successWrapper: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center' },
    celebrationCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(76, 217, 100, 0.1)', borderWidth: 2, borderColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    celebrationEmoji: { fontSize: 40 },
    successTitle: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 24, textAlign: 'center', marginBottom: 5 },
    successTitleUrdu: { color: '#4CAF50', fontFamily: 'Montserrat-Regular', fontSize: 18, textAlign: 'center', marginBottom: 30 },

    receiptCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 40 },
    receiptText: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Montserrat-Regular', fontSize: 14, textAlign: 'center', marginBottom: 5 },
    receiptTextFocused: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 16, textAlign: 'center' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
    receiptBody: { color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 10 },
    receiptBodyUrdu: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Montserrat-Regular', fontSize: 14, textAlign: 'center' },

    shareButton: { backgroundColor: '#FFD700', width: '100%', flexDirection: 'row', paddingVertical: 18, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    shareButtonText: { color: '#003366', fontFamily: 'Montserrat-Bold', fontSize: 16 },
    shareSubtitle: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Montserrat-Regular', fontSize: 12, textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 }
});
