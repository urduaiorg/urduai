import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ShareCard = forwardRef(({ data }: { data: any }, ref: any) => (
    <View ref={ref} collapsable={false} style={styles.cardWrapper}>
        <LinearGradient colors={['#003366', '#001933']} style={styles.card}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logoText}>Urdu <Text style={styles.logoGold}>AI</Text></Text>
            </View>

            {/* Main Emoji */}
            <Text style={styles.emoji}>{data?.emoji || '🚀'}</Text>

            {/* Headline (Urdu) */}
            <Text style={styles.headline}>{data?.headline || 'Urdu AI سیکھ رہا ہوں! 📱'}</Text>

            {/* English subtitle */}
            <Text style={styles.subtitleEn}>{data?.headlineEn || 'Learning AI in Urdu'}</Text>

            {/* Subtext */}
            <Text style={styles.subtext}>{data?.subtext || ''}</Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                {(data?.stats || [
                    { value: data?.streak || 0, label: '🔥 سٹریک' },
                    { value: `${data?.modulesCompleted || 0}/${data?.totalModules || 8}`, label: '📚 ماڈیولز' },
                    { value: data?.totalDays || 0, label: '📅 دن' },
                ]).map((stat: any, index: number) => (
                    <React.Fragment key={`${stat.label}-${index}`}>
                        {index > 0 ? <View style={styles.statDivider} /> : null}
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    </React.Fragment>
                ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerUrl}>urduai.org/app</Text>
                <Text style={styles.footerTag}>{data?.footerTag || `Pakistan's First AI Learning App`}</Text>
            </View>

        </LinearGradient>
    </View>
));

const styles = StyleSheet.create({
    cardWrapper: {
        width: 360,
        height: 360,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    card: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
    },
    logoText: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 22,
        color: '#fff',
    },
    logoGold: {
        color: '#FFD700',
    },
    emoji: {
        fontSize: 48,
    },
    headline: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 22,
        color: '#fff',
        textAlign: 'center',
    },
    subtitleEn: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 13,
        color: '#FFD700',
        textAlign: 'center',
        marginTop: -4,
    },
    subtext: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 18,
        color: '#FFD700',
    },
    statLabel: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    footer: {
        alignItems: 'center',
    },
    footerUrl: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 14,
        color: '#FFD700',
    },
    footerTag: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
    },
});

export default ShareCard;
