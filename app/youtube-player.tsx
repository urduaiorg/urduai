import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalization } from '../hooks/useLocalization';
import { recordVideoOpen } from '../services/engagementStats';
import { recordWeeklyProgressEvent } from '../services/weeklyProgressService';

export default function YouTubePlayerScreen() {
    const { url } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useLocalization();

    const resolvedUrl = Array.isArray(url) ? url[0] : url;

    useEffect(() => {
        if (resolvedUrl?.includes('youtube.com') || resolvedUrl?.includes('youtu.be')) {
            recordVideoOpen(resolvedUrl);
            recordWeeklyProgressEvent('video', resolvedUrl);
        }
    }, [resolvedUrl]);

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    if (!resolvedUrl) {
        return (
            <View style={styles.container}>
                <StatusBar style="light" backgroundColor="#003366" />
                <LinearGradient colors={['#003366', '#001933']} style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Text style={styles.backEmoji}>←</Text>
                        <Text style={styles.backText}>{t('back') || 'Back'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        <Text style={styles.urduText}>Urdu </Text>
                        <Text style={styles.aiText}>AI</Text>
                    </Text>
                    <View style={{ width: 80 }} />
                </LinearGradient>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Video URL not available</Text>
                    <TouchableOpacity onPress={handleBack} style={styles.errorButton}>
                        <Text style={styles.errorButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor="#003366" />
            <LinearGradient colors={['#003366', '#001933']} style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backEmoji}>←</Text>
                    <Text style={styles.backText}>{t('back') || 'Back'}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>
                    <Text style={styles.urduText}>Urdu </Text>
                    <Text style={styles.aiText}>AI</Text>
                </Text>
                <View style={{ width: 80 }} />
            </LinearGradient>
            <WebView
                source={{ uri: resolvedUrl }}
                style={styles.webview}
                allowsFullscreenVideo={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                userAgent="UrduAI-Mobile/3.0.8"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        paddingTop: 45,
        paddingBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        width: 80,
    },
    backEmoji: {
        color: '#FFD700',
        fontSize: 18,
        marginRight: 4,
    },
    backText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Montserrat-Regular',
    },
    title: {
        textAlign: 'center',
    },
    urduText: {
        color: '#FFFFFF',
        fontFamily: 'Montserrat-Bold',
        fontWeight: '900',
        fontSize: 20,
    },
    aiText: {
        color: '#FFD700',
        fontFamily: 'Montserrat-Bold',
        fontWeight: '900',
        fontSize: 20,
    },
    webview: { flex: 1, backgroundColor: '#000' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#003366' },
    errorText: { color: '#FFF', fontSize: 18, fontFamily: 'Montserrat-Bold', marginBottom: 20 },
    errorButton: { backgroundColor: '#FFD700', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    errorButtonText: { color: '#003366', fontFamily: 'Montserrat-Bold' },
});
