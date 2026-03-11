import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { recordActivity } from '../services/streakService';

const DAILY_PROMPT_KEY = 'daily_prompt_completed_date';

export default function DailyPromptChallenge({ onComplete }: { onComplete?: () => void }) {
    const [userInput, setUserInput] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Check if user already completed the challenge today
    useEffect(() => {
        checkCompletionStatus();
    }, []);

    const checkCompletionStatus = async () => {
        try {
            const lastCompletedDate = await AsyncStorage.getItem(DAILY_PROMPT_KEY);
            const today = new Date().toDateString();
            if (lastCompletedDate === today) {
                setIsCompleted(true);
            }
        } catch (e) {
            console.error('Error checking prompt completion status', e);
        }
    };

    const submitChallenge = async () => {
        if (!userInput.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return;
        }

        setIsSubmitting(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Simulate API delay/processing for effect
        setTimeout(async () => {
            try {
                const today = new Date().toDateString();
                await AsyncStorage.setItem(DAILY_PROMPT_KEY, today);

                // Award streak/points
                await recordActivity();

                setIsCompleted(true);
                setIsSubmitting(false);
                setIsExpanded(false);

                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Notify parent (Home Screen) to refresh the streak UI
                if (onComplete) {
                    onComplete();
                }

                // Redirect user to the Official Urdu AI GPT
                Linking.openURL('https://chatgpt.com/g/g-pE1VKxczG-urdu-ai-official').catch(err => {
                    console.error("Failed to open ChatGPT link", err);
                });

            } catch (e) {
                setIsSubmitting(false);
                console.error('Error submitting challenge', e);
            }
        }, 800);
    };

    if (isCompleted) {
        return (
            <LinearGradient colors={['rgba(79, 209, 197, 0.2)', 'rgba(79, 209, 197, 0.05)']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.headerRow}>
                    <View style={styles.iconCircleSuccess}>
                        <Ionicons name="checkmark-done" size={24} color="#4FD1C5" />
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.titleSuccess}>آج کا چیلنج مکمل!</Text>
                        <Text style={styles.subtitleSuccess}>آپ نے +10 پوائنٹس حاصل کیے 🏆</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.goToGptBtn}
                    activeOpacity={0.8}
                    onPress={() => Linking.openURL('https://chatgpt.com/g/g-pE1VKxczG-urdu-ai-official')}
                >
                    <Text style={styles.goToGptBtnText}>Urdu Ai GPT پر جائیں</Text>
                    <Ionicons name="chatbubbles" size={16} color="#000" />
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => setIsExpanded(!isExpanded)}>
                <View style={styles.headerRow}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="flash" size={24} color="#FFD700" />
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.title}>آج کا AI چیلنج</Text>
                        <Text style={styles.subtitle}>ایک AI سے کہانی لکھوائیں</Text>
                    </View>
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="rgba(255,255,255,0.5)" />
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.expandedContent}>
                    <Text style={styles.instructionText}>
                        نیچے دیے گئے پرامپٹ (Prompt) میں اپنا پسندیدہ <Text style={{ color: '#FFD700', fontFamily: 'Montserrat-Bold' }}>[موضوع]</Text> لکھیں اور AI کو ٹیسٹ کریں:
                    </Text>

                    <View style={styles.promptTemplateBox}>
                        <Text style={styles.promptTemplateText}>
                            "ایک ماہر کہانی نویس کے طور پر کام کریں۔ مجھے <Text style={{ color: '#FFD700' }}>[ {userInput || 'موضوع لکھیں...'} ]</Text> کے بارے میں 100 الفاظ کی ایک دلچسپ اور سبق آموز کہانی لکھ کر دیں۔ کہانی کا انداز بچوں کے لیے پرکشش ہونا چاہیے۔"
                        </Text>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="مثال: ایک بہادر طوطا، اڑنے والی کار..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={userInput}
                        onChangeText={setUserInput}
                        textAlign="right"
                    />

                    <TouchableOpacity
                        style={[styles.submitBtn, !userInput.trim() && styles.submitBtnDisabled]}
                        activeOpacity={0.8}
                        onPress={submitChallenge}
                        disabled={isSubmitting || !userInput.trim()}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#000" size="small" />
                        ) : (
                            <>
                                <Text style={styles.submitBtnText}>پرامپٹ ٹیسٹ کریں</Text>
                                <Ionicons name="send" size={16} color="#000" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        marginBottom: 24,
    },
    headerRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    iconCircleSuccess: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(79, 209, 197, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    title: {
        color: '#FFD700',
        fontFamily: 'Montserrat-Bold',
        fontSize: 18,
        marginBottom: 2,
    },
    titleSuccess: {
        color: '#4FD1C5',
        fontFamily: 'Montserrat-Bold',
        fontSize: 18,
        marginBottom: 2,
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'Montserrat-Regular',
        fontSize: 14,
    },
    subtitleSuccess: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
    },
    expandedContent: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 16,
    },
    instructionText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'Montserrat-Regular',
        fontSize: 14,
        textAlign: 'right',
        marginBottom: 12,
        lineHeight: 22,
    },
    promptTemplateBox: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: '#FFD700',
    },
    promptTemplateText: {
        color: '#E0E0E0',
        fontFamily: 'Montserrat-Regular',
        fontSize: 15,
        textAlign: 'right',
        lineHeight: 24,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        color: '#FFF',
        fontFamily: 'Montserrat-Regular',
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        marginBottom: 16,
    },
    submitBtn: {
        backgroundColor: '#FFD700',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitBtnText: {
        color: '#000',
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
    },
    goToGptBtn: {
        backgroundColor: '#4FD1C5',
        borderRadius: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
    },
    goToGptBtnText: {
        color: '#000',
        fontFamily: 'Montserrat-Bold',
        fontSize: 14,
    }
});
