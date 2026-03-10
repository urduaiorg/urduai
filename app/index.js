import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, Platform, Alert, View, Text, TouchableOpacity, ScrollView, Image, Linking, Modal, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../notifications';
import * as Network from 'expo-network';
import { logEvent } from '../analytics';
import { useLocalization } from '../hooks/useLocalization';
import * as Haptics from 'expo-haptics';
import OfflineContent from '../components/OfflineContent';
import performanceMonitor from '../utils/performance';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { StatusBar as StatusBarExpo } from 'expo-status-bar';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getStreakData } from '../services/streakService';
import { getBadgesForDisplay, checkAndAwardBadges } from '../services/badgeService';
import { Ionicons } from '@expo/vector-icons';
import GlowButton from '../components/GlowButton';
import AppHeader from '../components/AppHeader';
import { fetchLatestBlogPosts } from '../services/blogFeed';

const PROMPT_COLLECTION = [
  {
    id: 'image-brand',
    tag: 'امیج پرامپٹ',
    title: 'برانڈ پوسٹر چند سیکنڈ میں',
    shortPrompt: 'میری پروڈکٹ کے لیے ایک پریمیم، جدید اور پاکستانی آڈینس کو پسند آنے والا پوسٹر بنائیں۔',
    fullPrompt: 'You are a premium visual ad director. Create a clean, high-converting poster concept for my product. Use bold composition, warm premium lighting, realistic textures, modern Urdu-friendly typography spacing, and a visual style suitable for Pakistani social media audiences. Include color suggestions, headline ideas, image composition, and a CTA area.',
    accent: '#FFD700',
    icon: 'image-outline',
  },
  {
    id: 'daily-work',
    tag: 'روزمرہ استعمال',
    title: 'WhatsApp میسج کو پروفیشنل بنائیں',
    shortPrompt: 'اس میسج کو شائستہ، مختصر اور پروفیشنل WhatsApp انداز میں دوبارہ لکھیں۔',
    fullPrompt: 'Rewrite my message in a professional but warm WhatsApp tone. Keep it concise, polite, clear, and natural. Give me 3 versions: formal, friendly, and persuasive. Also suggest one short subject line or opening sentence if I want to use it in email.',
    accent: '#4FD1C5',
    icon: 'chatbubble-ellipses-outline',
  },
  {
    id: 'creative-reel',
    tag: 'کریئیٹوٹی',
    title: 'ریلز اور شارٹس کے آئیڈیاز',
    shortPrompt: 'میرے niche کے لیے 15 viral reel ideas دیں جن میں hook، script اور caption شامل ہو۔',
    fullPrompt: 'Act like a viral content strategist. Generate 15 short-form reel ideas for my niche. For each idea give a 1-line hook, a 20-second speaking script, on-screen text, caption suggestion, and CTA. Keep them practical, emotional, and easy to record on a phone.',
    accent: '#FF9B3D',
    icon: 'sparkles-outline',
  },
  {
    id: 'income-help',
    tag: 'پروفیشنل استعمال',
    title: 'چھوٹے بزنس کے لیے آفر پلان',
    shortPrompt: 'میرے چھوٹے کاروبار کے لیے ایک 7 دن کا promotion plan بنائیں۔',
    fullPrompt: 'You are a practical growth consultant for small businesses. Build a 7-day promotion plan for my business with daily offers, WhatsApp copy, caption ideas, customer follow-up lines, and one low-cost ad angle. Keep the ideas realistic for a small Pakistani business owner.',
    accent: '#7DDC6B',
    icon: 'briefcase-outline',
  },
  {
    id: 'study-smart',
    tag: 'طالب علم',
    title: 'مشکل موضوع آسان انداز میں',
    shortPrompt: 'اس topic کو 10 سال کے بچے کی مثالوں سے آسان بنا کر سمجھائیں۔',
    fullPrompt: 'Explain this topic in very simple Urdu using everyday examples, step-by-step teaching, and one memory trick. Then give me 5 short quiz questions and 3 common mistakes students make about this topic.',
    accent: '#8AB4FF',
    icon: 'school-outline',
  },
  {
    id: 'resume-upgrade',
    tag: 'کیرئیر',
    title: 'CV اور LinkedIn کو اپگریڈ کریں',
    shortPrompt: 'میرے تجربے کو results-based CV bullets اور LinkedIn summary میں بدل دیں۔',
    fullPrompt: 'Turn my work experience into strong, results-focused CV bullet points and a LinkedIn summary. Make it sound confident, modern, and human. Highlight measurable outcomes, transferable skills, and professional positioning for better hiring chances.',
    accent: '#F58DB6',
    icon: 'document-text-outline',
  },
];

function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

const FALLBACK_FEATURED_BLOG = {
  url: 'https://urduai.org/its-now-easier-than-ever-to-ask-perplexity-questions-on-whatsapp/',
  title: 'واٹس ایپ پر اب پرپلیکسٹی سے سوال پوچھنا پہلے سے بھی آسان',
  date: '2025-05-10',
  category: 'Blog',
  excerpt: 'واٹس ایپ کے اندر سوال پوچھنے، تصویر بنوانے اور فوری معلومات لینے کا نیا آسان طریقہ عام صارفین کے لیے کتنا مفید ہے؟',
  image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
};

const FALLBACK_MORE_BLOGS = [
  {
    id: 1,
    title: 'واٹس ایپ چیٹ جی پی ٹی آپ کے وائس نوٹ اور امیج کو سمجھتا ہے۔',
    date: '2025-02-05',
    displayDate: '5 فروری',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=400',
    url: 'https://urduai.org/whatsapp-chatgpt-understands-your-voice-note-image/',
    excerpt: 'اب واٹس ایپ پر وائس نوٹ اور تصویر کے ذریعے ChatGPT سے اردو میں جواب لینا پہلے سے کہیں زیادہ آسان ہو گیا ہے۔',
  },
  {
    id: 2,
    title: 'ڈاکٹروں کے مقابلے میں چیٹ جی پی ٹی کی تیز کارکردگی۔',
    date: '2024-11-18',
    displayDate: '18 نومبر',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400',
    url: 'https://urduai.org/%DA%88%D8%A7%DA%A9%D9%B9%D8%B1%D9%88%DA%BA-%DA%A9%DB%92-%D9%85%D9%82%D8%A7%D8%A8%D9%84%DB%92-%D9%85%DB%8C%DA%BA-%DA%86%DB%8C%D9%B9-%D8%AC%DB%8C-%D9%BE%DB%8C-%D9%B9%DB%8C-%DA%A9%DB%8C-%D8%AA%DB%8C/',
    excerpt: 'ایک نئی تحقیق میں ChatGPT کی تشخیصی کارکردگی نے سب کو حیران کر دیا، اور یہ سوال اٹھا کہ AI صحت کے شعبے کو کہاں لے جا سکتا ہے۔',
  },
  {
    id: 3,
    title: 'دو ہزار چوبیس میں مصنوعی ذہانت کی نئی ایجادات اور ٹولز',
    date: '2024-09-22',
    displayDate: '22 ستمبر',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=400',
    url: 'https://urduai.org/2024/',
    excerpt: '2024 میں AI کی دنیا میں کون سے نئے ٹولز، فیچرز اور تبدیلیاں آئیں اور وہ عام زندگی کو کیسے متاثر کر رہی ہیں؟',
  },
];

const WHATSAPP_COMMUNITY_URL = 'https://whatsapp.com/channel/0029VaXXgd00AgW6jAZGw83j';
const FULL_WEBSITE_URL = 'https://urduai.org/';
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@urduaiorg';
const HOME_BOOKMARK_URL = 'urduai://home';

export default function App() {
  const { t, isRTL } = useLocalization();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [activePrompt, setActivePrompt] = useState(null);
  const [stats, setStats] = useState({ currentStreak: 0, earnedBadges: 0, totalBadges: 12 });
  const [featuredBlog, setFeaturedBlog] = useState(FALLBACK_FEATURED_BLOG);
  const [moreBlogs, setMoreBlogs] = useState(FALLBACK_MORE_BLOGS);
  const promptOfTheDay = PROMPT_COLLECTION[getDayOfYear() % PROMPT_COLLECTION.length];
  const promptHighlights = PROMPT_COLLECTION.filter((prompt) => prompt.id !== promptOfTheDay.id).slice(0, 4);

  useFocusEffect(
    React.useCallback(() => {
      const loadStats = async () => {
        await checkAndAwardBadges();
        const streakData = await getStreakData();
        const badges = await getBadgesForDisplay();
        setStats({
          currentStreak: streakData.currentStreak || 0,
          earnedBadges: badges.filter(b => b.earned).length,
          totalBadges: badges.length
        });
      };
      loadStats();
    }, [])
  );

  const retryConnection = async () => {
    setIsRetrying(true);
    try {
      const state = await Network.getNetworkStateAsync();
      if (state.isConnected) {
        setIsOffline(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('Still offline');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handlePromptPreview = async (prompt) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePrompt(prompt);
  };

  const handlePromptShare = async () => {
    if (!activePrompt) return;

    try {
      await Share.share({
        title: activePrompt.title,
        message: `${activePrompt.title}\n\n${activePrompt.fullPrompt}`,
      });
    } catch {
      Alert.alert('خرابی', 'پرامپٹ شیئر نہیں ہو سکا۔');
    }
  };

  const handleExternalOpen = async (url) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('خرابی', 'لنک نہیں کھل سکا۔');
    }
  };

  const saveHomeBookmark = async () => {
    try {
      const stored = await AsyncStorage.getItem('urdu_ai_bookmarks');
      const bookmarks = stored ? JSON.parse(stored) : [];
      if (bookmarks.some((bookmark) => bookmark.url === HOME_BOOKMARK_URL)) {
        Alert.alert('بک مارک موجود ہے', 'ہوم اسکرین پہلے ہی بک مارکس میں شامل ہے۔');
        return;
      }

      const homeBookmark = {
        title: 'Urdu AI ہوم',
        url: HOME_BOOKMARK_URL,
        excerpt: 'اہم خبریں، پرامپٹس، ویڈیوز اور فوری لنکس ایک جگہ۔',
        image: 'https://urduai.org/wp-content/uploads/2024/12/UrduAi-Logo.png',
        date: new Date().toISOString(),
        category: 'Home',
      };

      await AsyncStorage.setItem('urdu_ai_bookmarks', JSON.stringify([homeBookmark, ...bookmarks]));
      Alert.alert('بک مارک ہو گیا', 'ہوم اسکرین آپ کے بک مارکس میں شامل کر دی گئی ہے۔');
    } catch {
      Alert.alert('خرابی', 'بک مارک محفوظ نہیں ہو سکا۔');
    }
  };

  const handleQuickAction = async (action) => {
    setFabExpanded(false);

    if (action === 'close') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    switch (action) {
      case 'bookmarks':
        router.push('/bookmarks');
        break;
      case 'save-bookmark':
        saveHomeBookmark();
        break;
      case 'library':
        router.push('/library');
        break;
      case 'courses':
        router.push('/courses');
        break;
      case 'website':
        handleExternalOpen(FULL_WEBSITE_URL);
        break;
      case 'whatsapp':
        handleExternalOpen(WHATSAPP_COMMUNITY_URL);
        break;
      case 'youtube':
        handleExternalOpen(YOUTUBE_CHANNEL_URL);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setIsOffline(!state.isConnected);
        if (state.isConnected) {
          try {
            const latestBlogs = await fetchLatestBlogPosts(4);
            if (latestBlogs.length) {
              const [latest, ...rest] = latestBlogs;
              setFeaturedBlog({
                url: latest.url,
                title: latest.title,
                date: latest.date,
                category: latest.category || 'Blog',
                excerpt: latest.excerpt,
                image: latest.image || FALLBACK_FEATURED_BLOG.image,
              });
              setMoreBlogs(
                rest.map((blog) => ({
                  id: blog.id,
                  title: blog.title,
                  date: blog.date,
                  displayDate: new Intl.DateTimeFormat('ur-PK', {
                    day: 'numeric',
                    month: 'short',
                  }).format(new Date(blog.date)),
                  image: blog.image || FALLBACK_FEATURED_BLOG.image,
                  url: blog.url,
                  excerpt: blog.excerpt,
                }))
              );
            }
          } catch {
            // Keep fallback blog cards if live fetch fails.
          }
        }
        setTimeout(() => setLoading(false), 800);
      } catch (error) {
        setLoading(false);
      }
    };

    initializeApp();
    registerForPushNotificationsAsync().then(token => { });

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('notificationTitle'), notification.request.content.body || t('notificationDefault'));
    });

    return () => Notifications.removeNotificationSubscription(notificationListener);
  }, []);

  if (isOffline) {
    return (
      <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
        <StatusBarExpo style="light" backgroundColor="#40E0D0" />
        <OfflineContent onRetry={retryConnection} isRetrying={isRetrying} t={t} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
      <StatusBarExpo style="light" backgroundColor="#003366" />
      <AppHeader
        leftAction={{ label: 'بیجز', icon: 'trophy-outline', onPress: () => router.push('/achievements') }}
        rightAction={{ label: 'کورسز', icon: 'grid-outline', onPress: () => router.push('/courses') }}
        titleMain="Urdu"
        titleAccent="Ai"
        subtitle="Pakistan's #1 Urdu AI platform"
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroWrap}>
            <View style={styles.heroGlowPrimary} />
            <View style={styles.heroGlowSecondary} />
            <View style={styles.heroGlowAccent} />

            <View style={styles.topPillRow}>
              <TouchableOpacity activeOpacity={0.88} onPress={() => router.push('/achievements')} style={styles.topPill}>
                <Ionicons name="flame" size={16} color="#FFD700" />
                <Text style={styles.topPillText}>{stats.currentStreak} دن</Text>
                <Text style={styles.topPillDivider}>|</Text>
                <Ionicons name="trophy" size={15} color="#FFD700" />
                <Text style={styles.topPillText}>{stats.earnedBadges}/{stats.totalBadges}</Text>
              </TouchableOpacity>
              <View style={[styles.topPill, styles.topPillMuted]}>
                <Ionicons name="people" size={16} color="#7CE7D8" />
                <Text style={[styles.topPillText, styles.topPillTextMuted]}>1M+ کمیونٹی</Text>
              </View>
            </View>

            <LinearGradient colors={['rgba(10,40,74,0.98)', 'rgba(12,60,96,0.94)', 'rgba(18,86,92,0.72)']} style={styles.heroCard}>
              <View style={styles.heroEyebrowRow}>
                <View style={styles.heroEyebrowBadge}>
                  <Text style={styles.heroEyebrowBadgeText}>#1 Urdu AI Platform</Text>
                </View>
                <Text style={styles.heroEyebrow}>اردو میں AI سیکھنے کی سب سے بڑی کمیونٹی</Text>
              </View>

              <Text style={styles.heroTitle}>Urdu <Text style={styles.heroTitleAccent}>Ai</Text>{'\n'}اردو دنیا کا AI ہیڈکوارٹر</Text>
              <Text style={styles.heroSubtitle}>
                روزانہ اپڈیٹس، قابلِ عمل پرامپٹس، Urdu Ai Master Class، ویڈیوز اور بلاگز۔ ایک ہی پریمیم اسکرین پر۔
              </Text>

              <View style={styles.authorityGrid}>
                <View style={styles.authorityCard}>
                  <Text style={styles.authorityValue}>1M+</Text>
                  <Text style={styles.authorityLabel}>کمیونٹی ممبرز</Text>
                </View>
                <View style={styles.authorityCard}>
                  <Text style={styles.authorityValue}>روزانہ</Text>
                  <Text style={styles.authorityLabel}>تازہ AI اپڈیٹس</Text>
                </View>
                <View style={styles.authorityCard}>
                  <Text style={styles.authorityValue}>50K+</Text>
                  <Text style={styles.authorityLabel}>ایپ انسٹالز</Text>
                </View>
              </View>

              <View style={styles.heroActionStack}>
                <GlowButton
                  label="ابھی سیکھنا شروع کریں"
                  icon="rocket-outline"
                  onPress={() => router.push('/courses')}
                  style={styles.heroPrimaryCta}
                />
                <View style={styles.heroSecondaryRow}>
                  <TouchableOpacity activeOpacity={0.9} style={styles.heroSecondaryCard} onPress={() => router.push({ pathname: '/article-reader', params: featuredBlog })}>
                    <Ionicons name="newspaper-outline" size={18} color="#FFD700" />
                    <Text style={styles.heroSecondaryCardText}>آج کا بلاگ پڑھیں</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.9} style={styles.heroSecondaryCard} onPress={() => handlePromptPreview(promptOfTheDay)}>
                    <Ionicons name="sparkles-outline" size={18} color="#7CE7D8" />
                    <Text style={styles.heroSecondaryCardText}>آج کا پرامپٹ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.commandDeck}>
              <TouchableOpacity style={styles.commandMiniCard} activeOpacity={0.9} onPress={() => router.push('/courses')}>
                <View style={[styles.commandMiniIcon, styles.commandMiniIconGold]}>
                  <Ionicons name="school-outline" size={18} color="#06376E" />
                </View>
                <Text style={styles.commandMiniTitle}>سیکھنے کا راستہ</Text>
                <Text style={styles.commandMiniBody}>Urdu Ai Master Class، کورسز، ویڈیوز</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.commandMiniCard} activeOpacity={0.9} onPress={() => router.push({ pathname: '/article-reader', params: featuredBlog })}>
                <View style={[styles.commandMiniIcon, styles.commandMiniIconTeal]}>
                  <Ionicons name="globe-outline" size={18} color="#042E61" />
                </View>
                <Text style={styles.commandMiniTitle}>تازہ بلاگ</Text>
                <Text style={styles.commandMiniBody}>آج کی سب سے اہم اپڈیٹ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.commandMiniCard} activeOpacity={0.9} onPress={() => handleQuickAction('youtube')}>
                <View style={[styles.commandMiniIcon, styles.commandMiniIconDark]}>
                  <Ionicons name="logo-youtube" size={18} color="#FFD700" />
                </View>
                <Text style={styles.commandMiniTitle}>ویڈیو کمانڈ سنٹر</Text>
                <Text style={styles.commandMiniBody}>@urduaiorg چینل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.commandMiniCard} activeOpacity={0.9} onPress={() => handleQuickAction('library')}>
                <View style={[styles.commandMiniIcon, styles.commandMiniIconTeal]}>
                  <Ionicons name="document-text-outline" size={18} color="#042E61" />
                </View>
                <Text style={styles.commandMiniTitle}>گائیڈ پیجز</Text>
                <Text style={styles.commandMiniBody}>PDF گائیڈز اور آف لائن ریڈنگ</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingShell}>
              <ActivityIndicator color="#FFD700" size="large" />
              <Text style={styles.loadingText}>پریمیم ہوم اسکرین لوڈ ہو رہی ہے...</Text>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>آج کا ایڈیٹوریل فیچر</Text>
              </View>

              <TouchableOpacity
                style={styles.editorialCard}
                activeOpacity={0.92}
                onPress={() => router.push({ pathname: '/article-reader', params: featuredBlog })}
              >
                <Image source={{ uri: featuredBlog.image }} style={styles.editorialImage} />
                <LinearGradient colors={['rgba(3,17,36,0.1)', 'rgba(3,17,36,0.92)']} style={styles.editorialOverlay}>
                  <View style={styles.editorialMetaRow}>
                    <View style={styles.editorialBadge}>
                      <Text style={styles.editorialBadgeText}>Featured Article</Text>
                    </View>
                    <Text style={styles.editorialDate}>
                      {new Intl.DateTimeFormat('ur-PK', { day: 'numeric', month: 'short' }).format(new Date(featuredBlog.date))}
                    </Text>
                  </View>
                  <Text style={styles.editorialTitle}>{featuredBlog.title}</Text>
                  <Text style={styles.editorialExcerpt} numberOfLines={3}>{featuredBlog.excerpt}</Text>
                  <View style={styles.editorialFooter}>
                    <Text style={styles.editorialRead}>مکمل بلاگ پڑھیں</Text>
                    <Ionicons name="arrow-back" size={16} color="#FFD700" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <LinearGradient colors={['rgba(11,38,72,0.95)', 'rgba(14,71,95,0.90)', 'rgba(255,215,0,0.09)']} style={styles.promptCommandCard}>
                <View style={styles.promptCommandTop}>
                  <Text style={styles.promptCommandEyebrow}>Prompt of the Day</Text>
                  <View style={styles.promptCommandBadge}>
                    <Text style={styles.promptCommandBadgeText}>{promptOfTheDay.tag}</Text>
                  </View>
                </View>
                <Text style={styles.promptCommandTitle}>{promptOfTheDay.title}</Text>
                <Text style={styles.promptCommandBody}>{promptOfTheDay.shortPrompt}</Text>
                <View style={styles.promptCommandChips}>
                  <View style={styles.promptCommandChip}>
                    <Ionicons name={promptOfTheDay.icon} size={16} color={promptOfTheDay.accent} />
                    <Text style={styles.promptCommandChipText}>فوری استعمال</Text>
                  </View>
                  <View style={styles.promptCommandChip}>
                    <Ionicons name="copy-outline" size={16} color="#FFD700" />
                    <Text style={styles.promptCommandChipText}>کاپی کے لیے تیار</Text>
                  </View>
                </View>
                <GlowButton
                  label="آج کا مکمل پرامپٹ کھولیں"
                  icon="sparkles-outline"
                  onPress={() => handlePromptPreview(promptOfTheDay)}
                  style={styles.promptCommandButton}
                />
              </LinearGradient>

              <LinearGradient colors={['rgba(255,215,0,0.18)', 'rgba(79,209,197,0.09)', 'rgba(255,255,255,0.03)']} style={styles.masterTrackCard}>
                <View style={styles.masterTrackHeader}>
                  <View style={styles.masterTrackPill}>
                    <Text style={styles.masterTrackPillText}>4 کورسز + Urdu Ai Master Class</Text>
                  </View>
                  <Text style={styles.masterTrackEyebrow}>Flagship Learning Track</Text>
                </View>
                <Text style={styles.masterTrackTitle}>Urdu Ai Master Class</Text>
                <Text style={styles.masterTrackBody}>
                  اگر کوئی ایک راستہ منتخب کرنا ہو تو یہی ہونا چاہیے: بنیادی AI، پرامپٹس، عملی استعمال، ویڈیوز اور سرٹیفیکیٹ۔
                </Text>
                <View style={styles.masterTrackStats}>
                  <View style={styles.masterTrackStat}>
                    <Text style={styles.masterTrackStatValue}>8</Text>
                    <Text style={styles.masterTrackStatLabel}>ویڈیوز</Text>
                  </View>
                  <View style={styles.masterTrackStat}>
                    <Text style={styles.masterTrackStatValue}>4</Text>
                    <Text style={styles.masterTrackStatLabel}>کورسز</Text>
                  </View>
                  <View style={styles.masterTrackStat}>
                    <Text style={styles.masterTrackStatValue}>1</Text>
                    <Text style={styles.masterTrackStatLabel}>سرٹیفیکیٹ</Text>
                  </View>
                </View>
                <GlowButton
                  label="Urdu Ai Master Class شروع کریں"
                  icon="ribbon-outline"
                  onPress={() => router.push('/courses')}
                  style={styles.masterTrackButton}
                />
              </LinearGradient>

              <LinearGradient colors={['rgba(8,35,68,0.96)', 'rgba(11,56,90,0.92)', 'rgba(124,231,216,0.12)']} style={styles.guidesFeatureCard}>
                <View style={styles.guidesFeatureTopRow}>
                  <View style={styles.guidesFeatureBadge}>
                    <Text style={styles.guidesFeatureBadgeText}>9 PDF Guides</Text>
                  </View>
                  <Ionicons name="library-outline" size={24} color="#FFD700" />
                </View>
                <Text style={styles.guidesFeatureTitle}>Guide Pages</Text>
                <Text style={styles.guidesFeatureBody}>
                  ChatGPT، Google AI Studio، image generation، WhatsApp AI اور مزید موضوعات پر مکمل PDF گائیڈز ایک جگہ۔ ڈاؤنلوڈ کریں، آف لائن پڑھیں، اور جب چاہیں دوبارہ کھولیں۔
                </Text>
                <View style={styles.guidesFeatureStats}>
                  <View style={styles.guidesFeatureStat}>
                    <Text style={styles.guidesFeatureStatValue}>9</Text>
                    <Text style={styles.guidesFeatureStatLabel}>PDF فائلز</Text>
                  </View>
                  <View style={styles.guidesFeatureStat}>
                    <Text style={styles.guidesFeatureStatValue}>3</Text>
                    <Text style={styles.guidesFeatureStatLabel}>لیولز</Text>
                  </View>
                  <View style={styles.guidesFeatureStat}>
                    <Text style={styles.guidesFeatureStatValue}>Offline</Text>
                    <Text style={styles.guidesFeatureStatLabel}>ریڈنگ</Text>
                  </View>
                </View>
                <GlowButton
                  label="گائیڈ پیجز کھولیں"
                  icon="document-text-outline"
                  onPress={() => handleQuickAction('library')}
                  style={styles.guidesFeatureButton}
                />
              </LinearGradient>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>پریمیم شارٹ کٹس</Text>
              </View>
              <View style={styles.premiumShortcutGrid}>
                <TouchableOpacity style={styles.premiumShortcutCard} activeOpacity={0.9} onPress={() => handleQuickAction('library')}>
                  <Ionicons name="document-text-outline" size={24} color="#FFD700" />
                  <Text style={styles.premiumShortcutTitle}>Guide Pages</Text>
                  <Text style={styles.premiumShortcutBody}>PDF گائیڈز اور آف لائن ریڈنگ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.premiumShortcutCard} activeOpacity={0.9} onPress={() => handleQuickAction('whatsapp')}>
                  <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                  <Text style={styles.premiumShortcutTitle}>واٹس ایپ چینل</Text>
                  <Text style={styles.premiumShortcutBody}>فوری اپڈیٹس اور لنکس</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.premiumShortcutCard} activeOpacity={0.9} onPress={() => handleQuickAction('youtube')}>
                  <Ionicons name="logo-youtube" size={24} color="#FFD700" />
                  <Text style={styles.premiumShortcutTitle}>ویڈیو لائبریری</Text>
                  <Text style={styles.premiumShortcutBody}>@urduaiorg چینل</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.premiumShortcutCard} activeOpacity={0.9} onPress={() => handleQuickAction('save-bookmark')}>
                  <Ionicons name="bookmark" size={24} color="#7CE7D8" />
                  <Text style={styles.premiumShortcutTitle}>بک مارک کریں</Text>
                  <Text style={styles.premiumShortcutBody}>ہوم کو محفوظ کریں</Text>
                </TouchableOpacity>
              </View>

              <LinearGradient colors={['rgba(37,211,102,0.22)', 'rgba(255,255,255,0.04)']} style={styles.whatsAppCard}>
                <View style={styles.whatsAppHeader}>
                  <View style={styles.whatsAppBadge}>
                    <Text style={styles.whatsAppBadgeText}>1M+ Urdu AI Network</Text>
                  </View>
                  <Ionicons name="logo-whatsapp" size={26} color="#25D366" />
                </View>
                <Text style={styles.whatsAppTitle}>ہمارا واٹس ایپ چینل جوائن کریں</Text>
                <Text style={styles.whatsAppBody}>
                  روزانہ AI اپڈیٹس، فوری بلاگ لنکس، نئے پرامپٹس اور وہ سب کچھ جو ایک سنجیدہ Urdu AI learner کو ہر روز چاہیے۔
                </Text>
                <GlowButton
                  label="واٹس ایپ چینل اوپن کریں"
                  icon="logo-whatsapp"
                  onPress={() => handleQuickAction('whatsapp')}
                  size="md"
                  style={styles.whatsAppButton}
                />
              </LinearGradient>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>بہترین پرامپٹس</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptScroll}>
                {promptHighlights.map((prompt) => (
                  <TouchableOpacity key={prompt.id} activeOpacity={0.9} style={styles.promptCard} onPress={() => handlePromptPreview(prompt)}>
                    <View style={[styles.promptIconWrap, { backgroundColor: `${prompt.accent}22` }]}>
                      <Ionicons name={prompt.icon} size={20} color={prompt.accent} />
                    </View>
                    <Text style={styles.promptCardTag}>{prompt.tag}</Text>
                    <Text style={styles.promptCardTitle}>{prompt.title}</Text>
                    <Text style={styles.promptCardBody} numberOfLines={4}>{prompt.shortPrompt}</Text>
                    <View style={styles.promptCardFooter}>
                      <Text style={styles.promptCardLink}>مکمل پرامپٹ</Text>
                      <Ionicons name="arrow-back" size={15} color="#FFD700" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>مزید مضامین</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.blogScroll}>
                {moreBlogs.map((blog) => (
                  <TouchableOpacity
                    key={blog.id}
                    style={styles.miniBlogCard}
                    activeOpacity={0.9}
                    onPress={() => router.push({
                      pathname: '/article-reader',
                      params: {
                        url: blog.url,
                        title: blog.title,
                        date: blog.date,
                        category: 'Blog',
                        excerpt: blog.excerpt,
                        image: blog.image,
                      },
                    })}
                  >
                    <Image source={{ uri: blog.image }} style={styles.miniBlogImage} />
                    <LinearGradient colors={['transparent', 'rgba(0,25,51,0.9)']} style={styles.miniBlogOverlay}>
                      <Text style={styles.miniBlogDate}>{blog.displayDate}</Text>
                      <Text style={styles.miniBlogTitle} numberOfLines={2}>{blog.title}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>ویڈیو اتھارٹی</Text>
              </View>
              <TouchableOpacity style={styles.videoCard} activeOpacity={0.92} onPress={() => handleQuickAction('youtube')}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800' }} style={styles.videoCardBgImage} />
                <View style={styles.videoOverlay}>
                  <View style={styles.videoTopRow}>
                    <View style={styles.videoChannelPill}>
                      <Text style={styles.videoChannelPillText}>@urduaiorg</Text>
                    </View>
                    <View style={styles.videoPlayIcon}>
                      <Ionicons name="logo-youtube" size={28} color="#000" />
                    </View>
                  </View>
                  <Text style={styles.videoOverlayTitle}>ویڈیو لائبریری، شارٹس، کورس بریک ڈاؤن اور اردو AI وضاحتیں</Text>
                  <Text style={styles.videoOverlayBody}>اگر صارف دیکھنا پسند کرتا ہے تو اس کے لیے یہی مرکزی دروازہ ہونا چاہیے۔</Text>
                  <GlowButton label="مزید ویڈیوز دیکھیں" icon="logo-youtube" onPress={() => handleQuickAction('youtube')} style={styles.videoButton} />
                </View>
              </TouchableOpacity>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>مزید آرٹیکلز لوڈ کریں</Text>
              </View>
              <View style={styles.articleLoadStack}>
                {moreBlogs.slice(0, 3).map((blog) => (
                  <TouchableOpacity
                    key={`vertical-${blog.id}`}
                    style={styles.articleLoadCard}
                    activeOpacity={0.92}
                    onPress={() => router.push({
                      pathname: '/article-reader',
                      params: {
                        url: blog.url,
                        title: blog.title,
                        date: blog.date,
                        category: 'Blog',
                        excerpt: blog.excerpt,
                        image: blog.image,
                      },
                    })}
                  >
                    <Image source={{ uri: blog.image }} style={styles.articleLoadImage} />
                    <View style={styles.articleLoadBody}>
                      <View>
                        <Text style={styles.articleLoadDate}>{blog.displayDate}</Text>
                        <Text style={styles.articleLoadTitle} numberOfLines={2}>{blog.title}</Text>
                        <Text style={styles.articleLoadExcerpt} numberOfLines={2}>{blog.excerpt}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <LinearGradient colors={['rgba(8,35,68,0.96)', 'rgba(10,58,95,0.92)', 'rgba(255,215,0,0.10)']} style={styles.closingCard}>
                <View style={styles.closingTopRow}>
                  <View style={styles.closingBadge}>
                    <Text style={styles.closingBadgeText}>Urdu Ai Network</Text>
                  </View>
                  <Ionicons name="sparkles-outline" size={22} color="#FFD700" />
                </View>
                <Text style={styles.closingTitle}>یہاں سے آگے کیا؟</Text>
                <Text style={styles.closingBody}>
                  اگر آپ روزانہ AI سیکھنا چاہتے ہیں تو اگلا قدم واضح ہونا چاہیے: تازہ مضامین پڑھیں، Guide Pages محفوظ کریں، یا واٹس ایپ چینل کے ساتھ جڑے رہیں۔
                </Text>
                <View style={styles.closingActions}>
                  <GlowButton
                    label="مکمل ویب سائٹ کھولیں"
                    icon="globe-outline"
                    onPress={() => handleQuickAction('website')}
                    size="md"
                    style={styles.closingPrimaryButton}
                  />
                  <View style={styles.closingSecondaryRow}>
                    <TouchableOpacity activeOpacity={0.9} style={styles.closingSecondaryButton} onPress={() => handleQuickAction('whatsapp')}>
                      <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                      <Text style={styles.closingSecondaryText}>واٹس ایپ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.9} style={styles.closingSecondaryButton} onPress={() => handleQuickAction('library')}>
                      <Ionicons name="document-text-outline" size={18} color="#FFD700" />
                      <Text style={styles.closingSecondaryText}>Guide Pages</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </>
          )}
          <View style={{ height: 92 }} />
        </ScrollView>
      </SafeAreaView>

      <View pointerEvents="box-none" style={styles.fabLayer}>
        {fabExpanded ? (
          <View style={styles.fabMenu}>
            <TouchableOpacity activeOpacity={0.9} style={styles.fabActionRow} onPress={() => handleQuickAction('close')}>
              <Text style={styles.fabActionLabel}>پینل بند کریں</Text>
              <View style={styles.fabActionIconWrap}>
                <Ionicons name="close" size={18} color="#06376E" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.9} style={styles.fabActionRow} onPress={() => handleQuickAction('whatsapp')}>
              <Text style={styles.fabActionLabel}>ہمارا واٹس ایپ چینل جوائن کریں</Text>
              <View style={styles.fabActionIconWrap}>
                <Ionicons name="logo-whatsapp" size={18} color="#06376E" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.9} style={styles.fabActionRow} onPress={() => handleQuickAction('website')}>
              <Text style={styles.fabActionLabel}>مکمل ویب سائٹ کھولیں</Text>
              <View style={styles.fabActionIconWrap}>
                <Ionicons name="globe-outline" size={18} color="#06376E" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.9} style={styles.fabActionRow} onPress={() => handleQuickAction('library')}>
              <Text style={styles.fabActionLabel}>گائیڈ پیجز</Text>
              <View style={styles.fabActionIconWrap}>
                <Ionicons name="document-text-outline" size={18} color="#06376E" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.9} style={styles.fabActionRow} onPress={() => handleQuickAction('bookmarks')}>
              <Text style={styles.fabActionLabel}>بک مارکس</Text>
              <View style={styles.fabActionIconWrap}>
                <Ionicons name="bookmark-outline" size={18} color="#06376E" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.9} style={styles.fabActionRow} onPress={() => handleQuickAction('save-bookmark')}>
              <Text style={styles.fabActionLabel}>بک مارک کریں</Text>
              <View style={styles.fabActionIconWrap}>
                <Ionicons name="bookmark" size={18} color="#06376E" />
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setFabExpanded((value) => !value)}
          style={styles.fabButtonOuter}
        >
          <LinearGradient colors={['#FFE168', '#FFD400', '#F9B800']} style={styles.fabButtonInner}>
            <View style={styles.fabDotsGrid}>
              {Array.from({ length: 9 }).map((_, index) => (
                <View key={index} style={styles.fabDot} />
              ))}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={Boolean(activePrompt)} animationType="fade" onRequestClose={() => setActivePrompt(null)}>
        <View style={styles.promptModalBackdrop}>
          <View style={styles.promptModalCard}>
            <View style={styles.promptModalTop}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => setActivePrompt(null)} style={styles.promptModalClose}>
                <Ionicons name="close" size={20} color="#073C73" />
              </TouchableOpacity>
              <View style={styles.promptModalBadge}>
                <Text style={styles.promptModalBadgeText}>{activePrompt?.tag || 'Prompt'}</Text>
              </View>
            </View>

            <Text style={styles.promptModalTitle}>{activePrompt?.title}</Text>
            <Text style={styles.promptModalHint}>متن کو ہولڈ کر کے آسانی سے سلیکٹ کریں</Text>

            <ScrollView style={styles.promptModalBodyWrap} showsVerticalScrollIndicator={false}>
              <Text style={styles.promptModalPrompt} selectable>
                {activePrompt?.fullPrompt || ''}
              </Text>
            </ScrollView>

            <View style={styles.promptModalActions}>
              <TouchableOpacity activeOpacity={0.9} style={styles.promptModalGhostButton} onPress={() => setActivePrompt(null)}>
                <Text style={styles.promptModalGhostText}>بند کریں</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.9} style={styles.promptModalGhostButton} onPress={() => {
                setActivePrompt(null);
                router.push({ pathname: '/article-reader', params: featuredBlog });
              }}>
                <Text style={styles.promptModalGhostText}>مزید بلاگز</Text>
              </TouchableOpacity>
              <GlowButton
                label="شیئر / کاپی"
                icon="share-social-outline"
                onPress={handlePromptShare}
                size="md"
                style={styles.promptModalPrimaryButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  heroWrap: {
    marginBottom: 24,
    position: 'relative',
  },
  heroGlowPrimary: {
    position: 'absolute',
    top: 18,
    right: 12,
    width: 250,
    height: 250,
    borderRadius: 140,
    backgroundColor: 'rgba(255,215,0,0.08)',
  },
  heroGlowSecondary: {
    position: 'absolute',
    top: 140,
    left: -10,
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: 'rgba(124,231,216,0.08)',
  },
  heroGlowAccent: {
    position: 'absolute',
    top: 70,
    right: 80,
    width: 120,
    height: 120,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  topPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 10,
  },
  topPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 45, 80, 0.82)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  topPillMuted: {
    backgroundColor: 'rgba(8, 40, 72, 0.58)',
  },
  topPillText: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
  },
  topPillTextMuted: {
    color: '#D8F7F0',
  },
  topPillDivider: {
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
  },
  heroCard: {
    borderRadius: 34,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.16)',
    shadowColor: '#02162e',
    shadowOpacity: 0.34,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
    overflow: 'hidden',
  },
  heroEyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroEyebrowBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroEyebrowBadgeText: {
    color: '#06376E',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    textAlign: 'right',
  },
  heroTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 34,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'right',
    lineHeight: 46,
  },
  heroTitleAccent: {
    color: '#FFD700',
  },
  heroSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    color: '#D7E5F1',
    textAlign: 'right',
    lineHeight: 27,
    marginBottom: 20,
  },
  authorityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  authorityCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  authorityValue: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    marginBottom: 5,
  },
  authorityLabel: {
    color: '#BFD0DE',
    fontFamily: 'Montserrat-Regular',
    fontSize: 11,
    textAlign: 'center',
  },
  heroActionStack: {
    gap: 12,
  },
  heroPrimaryCta: {
    marginTop: 2,
  },
  heroSecondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroSecondaryCard: {
    flex: 1,
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroSecondaryCardText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    textAlign: 'center',
  },
  commandDeck: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  commandMiniCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 126,
  },
  commandMiniIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  commandMiniIconGold: {
    backgroundColor: '#FFD700',
  },
  commandMiniIconTeal: {
    backgroundColor: '#7CE7D8',
  },
  commandMiniIconDark: {
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  commandMiniTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 6,
  },
  commandMiniBody: {
    color: '#AFC3D6',
    fontFamily: 'Montserrat-Regular',
    fontSize: 11,
    textAlign: 'right',
    lineHeight: 16,
  },
  loadingShell: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#D8E4EF',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    marginTop: 12,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 14,
    width: '100%',
  },
  sectionTitle: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    textAlign: 'right',
  },
  editorialCard: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
    marginBottom: 20,
    backgroundColor: 'rgba(11, 47, 84, 0.78)',
  },
  editorialImage: {
    width: '100%',
    height: 320,
  },
  editorialOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
  },
  editorialMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editorialBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  editorialBadgeText: {
    color: '#06376E',
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
  },
  editorialDate: {
    color: '#D1DFEA',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 11,
  },
  editorialTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 25,
    textAlign: 'right',
    lineHeight: 38,
    marginBottom: 10,
  },
  editorialExcerpt: {
    color: '#D3E0EB',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 24,
    marginBottom: 14,
  },
  editorialFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  editorialRead: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
  promptCommandCard: {
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
    marginBottom: 20,
  },
  promptCommandTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  promptCommandEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
  },
  promptCommandBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  promptCommandBadgeText: {
    color: '#042E61',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
  },
  promptCommandTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 25,
    textAlign: 'right',
    lineHeight: 36,
    marginBottom: 10,
  },
  promptCommandBody: {
    color: '#D2DFEA',
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    textAlign: 'right',
    lineHeight: 26,
    marginBottom: 16,
  },
  promptCommandChips: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  promptCommandChip: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  promptCommandChipText: {
    color: '#F2F7FB',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 11,
  },
  promptCommandButton: {
    marginTop: 2,
  },
  masterTrackCard: {
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.22)',
    marginBottom: 24,
    shadowColor: '#031a33',
    shadowOpacity: 0.34,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    overflow: 'hidden',
  },
  masterTrackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  masterTrackPill: {
    backgroundColor: '#FFD400',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  masterTrackPillText: {
    color: '#06376E',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
  },
  masterTrackEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
  },
  masterTrackTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 25,
    lineHeight: 36,
    marginBottom: 10,
    textAlign: 'right',
  },
  masterTrackBody: {
    color: '#D6E1ED',
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    lineHeight: 27,
    marginBottom: 18,
    textAlign: 'right',
  },
  masterTrackStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  masterTrackStat: {
    flex: 1,
    backgroundColor: 'rgba(10, 47, 85, 0.55)',
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  masterTrackStatValue: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    marginBottom: 6,
  },
  masterTrackStatLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  masterTrackButton: {
    marginTop: 2,
  },
  guidesFeatureCard: {
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.14)',
    marginBottom: 22,
    shadowColor: '#02162e',
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  guidesFeatureTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  guidesFeatureBadge: {
    backgroundColor: 'rgba(255,215,0,0.14)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  guidesFeatureBadgeText: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
  },
  guidesFeatureTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 30,
    marginBottom: 10,
    textAlign: 'right',
  },
  guidesFeatureBody: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    lineHeight: 26,
    marginBottom: 18,
    textAlign: 'right',
  },
  guidesFeatureStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  guidesFeatureStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  guidesFeatureStatValue: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    marginBottom: 6,
    textAlign: 'center',
  },
  guidesFeatureStatLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  guidesFeatureButton: {
    marginTop: 2,
  },
  premiumShortcutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  premiumShortcutCard: {
    width: '48%',
    minHeight: 132,
    borderRadius: 24,
    backgroundColor: 'rgba(13, 58, 102, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    justifyContent: 'space-between',
  },
  premiumShortcutTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
    textAlign: 'right',
    marginTop: 12,
    marginBottom: 6,
  },
  premiumShortcutBody: {
    color: '#AFC3D6',
    fontFamily: 'Montserrat-Regular',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
  },
  promptScroll: {
    paddingRight: 4,
    gap: 12,
    marginBottom: 10,
  },
  promptCard: {
    width: 230,
    minHeight: 220,
    backgroundColor: 'rgba(11, 48, 87, 0.88)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
  },
  promptIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  promptCardTag: {
    color: '#FFD700',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 8,
  },
  promptCardTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'right',
    marginBottom: 10,
  },
  promptCardBody: {
    color: '#B8CBDC',
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
    flex: 1,
  },
  promptCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 14,
  },
  promptCardLink: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
    marginLeft: 6,
  },
  whatsAppCard: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(37,211,102,0.25)',
    marginBottom: 22,
  },
  whatsAppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  whatsAppBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  whatsAppBadgeText: {
    color: '#EAF8EF',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
  },
  whatsAppTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 25,
    lineHeight: 34,
    marginBottom: 10,
    textAlign: 'right',
  },
  whatsAppBody: {
    color: '#D2DFEA',
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    lineHeight: 26,
    marginBottom: 16,
    textAlign: 'right',
  },
  whatsAppButton: {
    marginTop: 2,
  },
  blogScroll: {
    paddingRight: 4,
    gap: 12,
    marginBottom: 10,
  },
  miniBlogCard: {
    width: 220,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.12)',
  },
  miniBlogDate: {
    color: '#FFD700',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 11,
    textAlign: 'right',
    marginBottom: 4,
  },
  miniBlogTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 15,
    textAlign: 'right',
    lineHeight: 22,
  },
  miniBlogImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  miniBlogOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 14,
  },
  videoCard: {
    borderRadius: 30,
    overflow: 'hidden',
    height: 310,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.18)',
  },
  videoCardBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 25, 51, 0.64)',
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  videoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoChannelPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  videoChannelPillText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
  },
  videoPlayIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4, // center play icon visually
  },
  videoOverlayTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 26,
    textAlign: 'right',
    width: '100%',
    marginTop: 20,
    lineHeight: 38,
  },
  videoOverlayBody: {
    color: '#D5E2ED',
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    textAlign: 'right',
    lineHeight: 24,
    marginTop: 10,
    marginBottom: 8,
  },
  videoButton: {
    width: '100%',
    marginTop: 6,
  },
  articleLoadStack: {
    gap: 14,
    marginBottom: 18,
  },
  articleLoadCard: {
    flexDirection: 'row-reverse',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(11, 48, 87, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 120,
  },
  articleLoadImage: {
    width: 112,
    height: '100%',
  },
  articleLoadBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  articleLoadDate: {
    color: '#FFD700',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 11,
    textAlign: 'right',
    marginBottom: 6,
  },
  articleLoadTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 8,
  },
  articleLoadExcerpt: {
    color: '#BFD1DF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
  },
  closingCard: {
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.16)',
    marginBottom: 8,
    shadowColor: '#02162e',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  closingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  closingBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  closingBadgeText: {
    color: '#DCE7F2',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
  },
  closingTitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 26,
    textAlign: 'right',
    marginBottom: 10,
  },
  closingBody: {
    color: '#D2DFEA',
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    lineHeight: 25,
    textAlign: 'right',
    marginBottom: 18,
  },
  closingActions: {
    gap: 12,
  },
  closingPrimaryButton: {
    marginTop: 2,
  },
  closingSecondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  closingSecondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  closingSecondaryText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    textAlign: 'center',
  },
  promptModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(1, 14, 28, 0.72)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  promptModalCard: {
    borderRadius: 28,
    backgroundColor: '#F4F5F7',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.24)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
    maxHeight: '78%',
  },
  promptModalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  promptModalClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7,60,115,0.08)',
  },
  promptModalBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  promptModalBadgeText: {
    color: '#073C73',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
  },
  promptModalTitle: {
    color: '#101828',
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    lineHeight: 34,
    textAlign: 'right',
    marginBottom: 8,
  },
  promptModalHint: {
    color: '#4B5563',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 11,
    textAlign: 'right',
    marginBottom: 14,
  },
  promptModalBodyWrap: {
    maxHeight: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(7,60,115,0.08)',
  },
  promptModalPrompt: {
    color: '#1F2937',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'left',
  },
  promptModalActions: {
    marginTop: 16,
    gap: 10,
  },
  promptModalGhostButton: {
    minHeight: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7,60,115,0.06)',
  },
  promptModalGhostText: {
    color: '#073C73',
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
  promptModalPrimaryButton: {
    marginTop: 2,
  },
  fabLayer: {
    position: 'absolute',
    left: 20,
    bottom: 26,
    alignItems: 'flex-start',
    zIndex: 50,
    elevation: 50,
  },
  fabMenu: {
    marginBottom: 14,
    gap: 10,
    zIndex: 51,
    elevation: 51,
  },
  fabActionRow: {
    minWidth: 188,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,212,0,0.97)',
    borderRadius: 999,
    paddingLeft: 18,
    paddingRight: 10,
    minHeight: 54,
    shadowColor: '#FFD400',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  fabActionLabel: {
    color: '#06376E',
    fontFamily: 'Montserrat-Bold',
    fontSize: 15,
  },
  fabActionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  fabButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 5,
    backgroundColor: 'rgba(255,212,0,0.22)',
    shadowColor: '#FFD400',
    shadowOpacity: 0.4,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  fabButtonInner: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabDotsGrid: {
    width: 28,
    height: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  fabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#06376E',
    margin: 1.5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 51, 102, 0.9)',
  },
});
