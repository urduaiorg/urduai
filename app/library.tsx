import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import guidesData from '../data/guides.json';
import {
    downloadGuide,
    isGuideDownloaded,
    openGuide,
    deleteGuide,
    deleteAllGuides,
    getDownloadedSize
} from '../services/downloadManager';
import { checkAndAwardBadges } from '../services/badgeService';
import BadgeCelebration from '../components/BadgeCelebration';

// Split guides by category
const beginnerGuides = guidesData.filter(g => g.category === 'beginner');
const diffIntermediateGuides = guidesData.filter(g => g.category === 'intermediate');
const diffAdvancedGuides = guidesData.filter(g => g.category === 'advanced');

export default function LibraryScreen() {
    const router = useRouter();

    const [downloadedState, setDownloadedState] = useState<any>({});
    const [downloadingState, setDownloadingState] = useState<any>({});
    const [progressState, setProgressState] = useState<any>({});
    const [totalSize, setTotalSize] = useState<string | number>('0.0');
    const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
    const [currentBadgeToShow, setCurrentBadgeToShow] = useState<any>(null);

    const handleBadgeClose = () => {
        const remaining = earnedBadges.slice(1);
        setEarnedBadges(remaining);
        setCurrentBadgeToShow(remaining.length > 0 ? remaining[0] : null);
    };

    useEffect(() => {
        refreshStorageState();
    }, []);

    const refreshStorageState = async () => {
        try {
            const size = await getDownloadedSize();
            setTotalSize(size);

            let stateObj: any = {};
            for (const guide of guidesData) {
                const isDownloaded = await isGuideDownloaded(guide.id);
                stateObj[guide.id] = isDownloaded;
            }
            setDownloadedState(stateObj);
        } catch (e) {
            // Storage refresh error
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

    const handleDownload = async (guide: any) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Mark as downloading locally UI
            setDownloadingState((prev: any) => ({ ...prev, [guide.id]: true }));
            setProgressState((prev: any) => ({ ...prev, [guide.id]: 0.1 }));

            const result: any = await downloadGuide(guide.driveFileId, guide.id, (progress: number) => {
                setProgressState((prev: any) => ({ ...prev, [guide.id]: progress }));
            });

            if (result && result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                try {
                    const existingRaw = await AsyncStorage.getItem('@urai_downloads');
                    const existing = existingRaw ? JSON.parse(existingRaw) : [];
                    if (!existing.includes(guide.id)) {
                        existing.push(guide.id);
                        await AsyncStorage.setItem('@urai_downloads', JSON.stringify(existing));
                    }
                } catch (e) {
                    // Error saving download to AsyncStorage
                }
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert("Download Failed", "Unable to download the guide. Check your internet connection.");
            }

            // Clean up UI hooks and refresh metrics
            setDownloadingState((prev: any) => ({ ...prev, [guide.id]: false }));
            setProgressState((prev: any) => ({ ...prev, [guide.id]: 0 }));
            await refreshStorageState();
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Download Failed", "An unexpected error occurred during download.");
            setDownloadingState((prev: any) => ({ ...prev, [guide.id]: false }));
            setProgressState((prev: any) => ({ ...prev, [guide.id]: 0 }));
        }
    };

    const handleOpen = async (guide: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const opened = await openGuide(guide.id);
        if (!opened) {
            Alert.alert("Cannot Open", "No PDF reader found on your device or the file is corrupted. Try deleting and re-downloading.");
        } else {
            // Check for new badges
            const newBadges = await checkAndAwardBadges();
            if (newBadges && newBadges.length > 0) {
                setEarnedBadges(newBadges);
                setCurrentBadgeToShow(newBadges[0]);
            }
        }
    };

    const handleDelete = async (guide: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            "Delete Guide",
            "Are you sure you want to remove this guide from your offline storage?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteGuide(guide.id);
                        await refreshStorageState();
                    }
                }
            ]
        );
    };

    const handleDownloadAll = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            "Download All Guides",
            "This will download 9 PDF files to your device for offline reading (~15MB). Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Download All",
                    onPress: async () => {
                        // Iterate and download sequentially
                        for (const guide of guidesData) {
                            if (!downloadedState[guide.id] && !downloadingState[guide.id]) {
                                await handleDownload(guide);
                            }
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAll = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(
            "Clear Storage",
            "Are you sure you want to delete all downloaded guides from your device?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear All",
                    style: "destructive",
                    onPress: async () => {
                        await deleteAllGuides();
                        await refreshStorageState();
                    }
                }
            ]
        );
    };

    const renderGuideItem = (guide: any) => {
        const isDownloaded = downloadedState[guide.id];
        const isDownloading = downloadingState[guide.id];
        const progress = progressState[guide.id] || 0;

        return (
            <View key={guide.id} style={styles.guideCard}>
                <View style={styles.guideHeaderRow}>
                    <Ionicons name={guide.icon} size={24} color="#FFD700" style={{ marginRight: 15 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.guideTitleUrdu}>{guide.titleUr}</Text>
                        <Text style={styles.guideTitleEn}>{guide.title}</Text>
                    </View>
                </View>

                {/* Progress Bar while downloading */}
                {isDownloading && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    {isDownloaded ? (
                        <>
                            <TouchableOpacity style={styles.openBtn} onPress={() => handleOpen(guide)}>
                                <Ionicons name="book" size={16} color="#FFF" style={{ marginRight: 6 }} />
                                <Text style={styles.openBtnText}>Open / کھولیں</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteIconBtn} onPress={() => handleDelete(guide)}>
                                <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.5)" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity style={[styles.downloadBtn, isDownloading && { opacity: 0.5 }]} disabled={isDownloading} onPress={() => handleDownload(guide)}>
                            {isDownloading ? (
                                <ActivityIndicator size="small" color="#003366" />
                            ) : (
                                <>
                                    <Ionicons name="cloud-download-outline" size={18} color="#003366" style={{ marginRight: 6 }} />
                                    <Text style={styles.downloadBtnText}>Download / ڈاؤنلوڈ</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
            <StatusBar style="light" backgroundColor="#003366" />

            {/* Header Area */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButtonTop}>
                    <Text style={styles.backEmoji}>←</Text>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <View style={styles.logoRow}>
                    <Ionicons name="library" size={28} color="#FFD700" style={{ marginRight: 10 }} />
                    <Text style={styles.headerLogoWhite}>
                        AI <Text style={styles.headerLogoGold}>Library</Text>
                    </Text>
                </View>

                <Text style={styles.headerSubtitle}>9 Free Guides • Read Offline</Text>
                <Text style={styles.headerSubtitleUrdu}>مفت گائیڈز • آف لائن پڑھیں</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Beginner Category */}
                <View style={styles.categoryHeader}>
                    <View style={styles.categoryLine} />
                    <Text style={styles.categoryTitle}>Beginner / بنیادی</Text>
                    <View style={styles.categoryLine} />
                </View>
                {beginnerGuides.map(renderGuideItem)}

                {/* Intermediate Category */}
                <View style={[styles.categoryHeader, { marginTop: 10 }]}>
                    <View style={styles.categoryLine} />
                    <Text style={styles.categoryTitle}>Intermediate / درمیانی</Text>
                    <View style={styles.categoryLine} />
                </View>
                {diffIntermediateGuides.map(renderGuideItem)}

                {/* Advanced Category */}
                <View style={[styles.categoryHeader, { marginTop: 10 }]}>
                    <View style={styles.categoryLine} />
                    <Text style={styles.categoryTitle}>Advanced / ایڈوانسڈ</Text>
                    <View style={styles.categoryLine} />
                </View>
                {diffAdvancedGuides.map(renderGuideItem)}

                {/* Storage Manager Footer */}
                <View style={styles.storageCard}>
                    <Text style={styles.storageText}>
                        Storage used: <Text style={styles.storageSize}>{totalSize} MB</Text>
                    </Text>
                    <View style={styles.storageButtonsRow}>
                        <TouchableOpacity style={styles.storageBtnDownload} onPress={handleDownloadAll}>
                            <Ionicons name="cloud-download" size={16} color="#003366" style={{ marginRight: 6 }} />
                            <Text style={styles.storageBtnDownloadText}>Download All</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.storageBtnDelete} onPress={handleDeleteAll}>
                            <Ionicons name="trash" size={16} color="rgba(255,255,255,0.7)" style={{ marginRight: 6 }} />
                            <Text style={styles.storageBtnDeleteText}>Delete All</Text>
                        </TouchableOpacity>
                    </View>
                </View>

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
    backEmoji: { color: '#FFD700', fontSize: 22, marginRight: 4, fontWeight: 'bold' },
    backText: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat-Regular' },

    logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 5 },
    headerLogoWhite: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 26, letterSpacing: 1 },
    headerLogoGold: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 26, letterSpacing: 1 },
    headerSubtitle: { color: '#FFF', fontFamily: 'Montserrat-Regular', fontSize: 14, opacity: 0.9 },
    headerSubtitleUrdu: { color: '#FFD700', fontFamily: 'Montserrat-Regular', fontSize: 13, marginTop: 4 },

    scrollContent: { padding: 16, paddingBottom: 40 },

    // Category Dividers
    categoryHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    categoryLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 215, 0, 0.2)' },
    categoryTitle: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 14, textTransform: 'uppercase', paddingHorizontal: 15 },

    // Cards
    guideCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    guideHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
    guideTitleUrdu: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 18, textAlign: 'right', marginBottom: 4 },
    guideTitleEn: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Montserrat-Regular', fontSize: 14, textAlign: 'right' },

    // Progress
    progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    progressBarBg: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginRight: 10 },
    progressBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },
    progressText: { color: '#FFD700', fontFamily: 'Montserrat-Bold', fontSize: 12, width: 35, textAlign: 'right' },

    // Actions
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    downloadBtn: { backgroundColor: '#FFD700', flex: 1, flexDirection: 'row', paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    downloadBtnText: { color: '#003366', fontFamily: 'Montserrat-Bold', fontSize: 14 },
    openBtn: { backgroundColor: '#4CAF50', flex: 1, flexDirection: 'row', paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    openBtnText: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 14 },
    deleteIconBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 },

    // Storage Footer
    storageCard: { marginTop: 30, backgroundColor: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    storageText: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Montserrat-Regular', fontSize: 14, textAlign: 'center', marginBottom: 20 },
    storageSize: { color: '#FFD700', fontFamily: 'Montserrat-Bold' },
    storageButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    storageBtnDownload: { flex: 1, backgroundColor: '#FFD700', flexDirection: 'row', paddingVertical: 14, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    storageBtnDownloadText: { color: '#003366', fontFamily: 'Montserrat-Bold', fontSize: 13 },
    storageBtnDelete: { flex: 1, backgroundColor: 'rgba(234, 67, 53, 0.2)', flexDirection: 'row', paddingVertical: 14, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(234, 67, 53, 0.5)' },
    storageBtnDeleteText: { color: 'rgba(255,255,255,0.8)', fontFamily: 'Montserrat-Bold', fontSize: 13 }
});
