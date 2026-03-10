import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const ONBOARDING_PAGES = [
    {
        key: '1',
        title: 'Welcome to ',
        titleUrdu: 'Urdu ',
        titleAi: 'AI',
        subtitle: 'اردو زبان میں مصنوعی ذہانت سیکھیں',
        emoji: '🚀',
        description: 'The first platform dedicated to teaching AI in Pakistan.',
    },
    {
        key: '2',
        title: 'Find Your Path',
        subtitle: 'اپنا راستہ خود منتخب کریں',
        emoji: '🎯',
        description: 'Whether you are a Beginner, a Content Creator, or an Automation pro, we have a curated YouTube track for you.',
    },
    {
        key: '3',
        title: 'Stay Notified',
        subtitle: 'ہمیشہ باخبر رہیں',
        emoji: '🔔',
        description: 'We will send you push notifications when new AI courses or masterclasses become available.',
    }
];

export default function OnboardingScreen() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(0);

    const completeOnboarding = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            await AsyncStorage.setItem('has_completed_onboarding', 'true');
            router.replace('/');
        } catch (e) {
            router.replace('/');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor="#003366" />
            <LinearGradient colors={['#003366', '#001933']} style={styles.container}>

                <PagerView
                    style={styles.pagerView}
                    initialPage={0}
                    onPageSelected={(e) => {
                        setCurrentPage(e.nativeEvent.position);
                        Haptics.selectionAsync();
                    }}
                >
                    {ONBOARDING_PAGES.map((page, index) => (
                        <View key={page.key} style={styles.page}>
                            <View style={styles.emojiContainer}>
                                <Text style={styles.emoji}>{page.emoji}</Text>
                            </View>
                            {index === 0 ? (
                                <Text style={styles.title}>
                                    {page.title}
                                    <Text style={styles.titleUrdu}>{page.titleUrdu}</Text>
                                    <Text style={styles.titleGold}>{page.titleAi}</Text>
                                </Text>
                            ) : (
                                <Text style={styles.title}>{page.title}</Text>
                            )}
                            <Text style={styles.subtitle}>{page.subtitle}</Text>
                            <Text style={styles.description}>{page.description}</Text>

                            {index === 2 && (
                                <TouchableOpacity style={styles.startButton} onPress={completeOnboarding}>
                                    <Text style={styles.startButtonText}>Get Started / شروع کریں</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#003366" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </PagerView>

                {/* Setup Pagination Dots */}
                <View style={styles.dotsContainer}>
                    {ONBOARDING_PAGES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentPage === index ? styles.activeDot : null
                            ]}
                        />
                    ))}
                </View>

            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    pagerView: {
        flex: 1,
    },
    page: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    emojiContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    emoji: {
        fontSize: 60,
    },
    title: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 28,
        color: '#FFD700',
        textAlign: 'center',
        marginBottom: 10,
    },
    titleUrdu: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 28,
        color: '#FFF',
    },
    titleGold: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 28,
        color: '#FFD700',
    },
    subtitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 20,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 20,
    },
    description: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.8,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    startButton: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    startButtonText: {
        color: '#003366',
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 4,
    },
    activeDot: {
        width: 24,
        backgroundColor: '#FFD700',
    },
});
