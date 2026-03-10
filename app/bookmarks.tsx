import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalization } from '../hooks/useLocalization';

interface Bookmark {
    url: string;
    title: string;
    date: string;
}

export default function BookmarksScreen() {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const router = useRouter();
    const { t } = useLocalization();

    const loadBookmarks = async () => {
        try {
            const stored = await AsyncStorage.getItem('urdu_ai_bookmarks');
            if (stored) {
                setBookmarks(JSON.parse(stored));
            }
        } catch (e) {
            // Failed to load bookmarks
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadBookmarks();
        }, [])
    );

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    const handleOpenBookmark = (url: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (url === 'urduai://home') {
            router.replace('/');
            return;
        }
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            router.push({ pathname: '/youtube-player', params: { url } });
        } else {
            router.replace(`/?url=${encodeURIComponent(url)}`);
        }
    };

    const handleRemoveBookmark = async (indexToRemove: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(
            'Remove Bookmark / بک مارک ہٹائیں',
            'Are you sure you want to remove this bookmark?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const newBookmarks = bookmarks.filter((_, i) => i !== indexToRemove);
                            await AsyncStorage.setItem('urdu_ai_bookmarks', JSON.stringify(newBookmarks));
                            setBookmarks(newBookmarks);
                        } catch (e) {
                            // Error removing bookmark
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item, index }: { item: Bookmark; index: number }) => (
        <TouchableOpacity
            style={styles.bookmarkCard}
            onPress={() => handleOpenBookmark(item.url)}
            onLongPress={() => handleRemoveBookmark(index)}
        >
            <View style={styles.cardContent}>
                <Ionicons name="bookmark" size={24} color="#FFD700" style={styles.cardIcon} />
                <View style={styles.textContainer}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.cardUrl} numberOfLines={1}>{item.url}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleRemoveBookmark(index)}>
                    <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor="#003366" />
            <LinearGradient colors={['#003366', '#001933']} style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backEmoji}>←</Text>
                    <Text style={styles.backText}>{t('back') || 'Back'}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>
                    <Text style={styles.listText}>Saved </Text>
                    <Text style={styles.aiText}>Bookmarks</Text>
                </Text>
                <View style={{ width: 80 }} />
            </LinearGradient>

            <View style={styles.content}>
                {bookmarks.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="bookmarks-outline" size={60} color="rgba(255, 255, 255, 0.4)" />
                        <Text style={styles.emptyText}>No bookmarks saved yet.</Text>
                        <Text style={styles.emptySubText}>Tap the bookmark icon while browsing to save a page.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={bookmarks}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#001933',
    },
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
    listText: {
        color: '#FFFFFF',
        fontFamily: 'Montserrat-Bold',
        fontSize: 20,
    },
    aiText: {
        color: '#FFD700',
        fontFamily: 'Montserrat-Bold',
        fontSize: 20,
    },
    content: {
        flex: 1,
    },
    listContainer: {
        padding: 16,
    },
    bookmarkCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIcon: {
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        color: '#FFFFFF',
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        marginBottom: 4,
    },
    cardUrl: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Montserrat-Regular',
        fontSize: 12,
    },
    deleteButton: {
        padding: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#FFFFFF',
        fontFamily: 'Montserrat-Bold',
        fontSize: 20,
        marginTop: 20,
        marginBottom: 10,
    },
    emptySubText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Montserrat-Regular',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
