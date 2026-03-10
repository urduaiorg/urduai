import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalization } from '../hooks/useLocalization';
import * as Haptics from 'expo-haptics';
import performanceMonitor from '../utils/performance';

interface SocialPost {
  id: string;
  platform: 'tiktok' | 'youtube' | 'instagram' | 'facebook' | 'whatsapp';
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  engagementCount: number;
  timestamp: Date;
  type: 'video' | 'post' | 'story' | 'update';
}

interface CommunityStats {
  totalFollowers: number;
  activeToday: number;
  coursesCompleted: number;
  discussionTopics: number;
}

const CommunityHub: React.FC = () => {
  const { t } = useLocalization();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [stats, setStats] = useState<CommunityStats>({
    totalFollowers: 800000,
    activeToday: 12500,
    coursesCompleted: 25000,
    discussionTopics: 847,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  useEffect(() => {
    loadCommunityContent();
  }, []);

  const loadCommunityContent = async () => {
    performanceMonitor.startTimer('community_load');
    
    // Simulate loading content from various platforms
    const mockPosts: SocialPost[] = [
      {
        id: '1',
        platform: 'youtube',
        title: 'Machine Learning کی بنیادی باتیں',
        description: 'آج ہم سیکھیں گے کہ ML کیا ہے اور کیسے کام کرتا ہے',
        thumbnail: 'https://img.youtube.com/vi/example/mqdefault.jpg',
        url: 'https://youtube.com/watch?v=example',
        engagementCount: 15000,
        timestamp: new Date(Date.now() - 3600000),
        type: 'video',
      },
      {
        id: '2',
        platform: 'tiktok',
        title: 'AI Facts in 60 Seconds',
        description: '60 سیکنڈ میں AI کے حیرت انگیز حقائق',
        thumbnail: 'https://p16-sign-va.tiktokcdn.com/example.jpeg',
        url: 'https://tiktok.com/@urduai/video/example',
        engagementCount: 50000,
        timestamp: new Date(Date.now() - 7200000),
        type: 'video',
      },
      {
        id: '3',
        platform: 'instagram',
        title: 'Deep Learning Infographic',
        description: 'Deep Learning کی تصویری وضاحت',
        thumbnail: 'https://instagram.com/p/example/media',
        url: 'https://instagram.com/p/example',
        engagementCount: 8500,
        timestamp: new Date(Date.now() - 14400000),
        type: 'post',
      },
      {
        id: '4',
        platform: 'whatsapp',
        title: 'Weekly AI Newsletter',
        description: 'اس ہفتے کے اہم AI اپڈیٹس',
        thumbnail: '',
        url: 'https://updates.urduai.org/subscribe',
        engagementCount: 25000,
        timestamp: new Date(Date.now() - 86400000),
        type: 'update',
      },
      {
        id: '5',
        platform: 'facebook',
        title: 'Community Discussion: AI Jobs',
        description: 'پاکستان میں AI کے کیریر کے مواقع',
        thumbnail: '',
        url: 'https://facebook.com/groups/urduai/posts/example',
        engagementCount: 3200,
        timestamp: new Date(Date.now() - 21600000),
        type: 'post',
      },
    ];

    setPosts(mockPosts);
    performanceMonitor.endTimer('community_load');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunityContent();
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePostPress = async (post: SocialPost) => {
    performanceMonitor.trackUserInteraction('community_post_opened', post.platform);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await Linking.openURL(post.url);
    } catch (error) {
      Alert.alert(
        t('error'),
        'لنک کھولنے میں مسئلہ ہے'
      );
    }
  };

  const handlePlatformFilter = (platform: string) => {
    setSelectedPlatform(platform);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    performanceMonitor.trackUserInteraction('platform_filter', platform);
  };

  const getPlatformIcon = (platform: string): string => {
    switch (platform) {
      case 'youtube': return '📹';
      case 'tiktok': return '🎵';
      case 'instagram': return '📸';
      case 'facebook': return '👥';
      case 'whatsapp': return '💬';
      default: return '🌐';
    }
  };

  const getPlatformColor = (platform: string): string => {
    switch (platform) {
      case 'youtube': return '#FF0000';
      case 'tiktok': return '#000000';
      case 'instagram': return '#E4405F';
      case 'facebook': return '#1877F2';
      case 'whatsapp': return '#25D366';
      default: return '#FFD700';
    }
  };

  const formatEngagement = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  const formatTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      return 'ابھی ابھی';
    } else if (hours < 24) {
      return `${hours} گھنٹے پہلے`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} دن پہلے`;
    }
  };

  const filteredPosts = selectedPlatform === 'all' 
    ? posts 
    : posts.filter(post => post.platform === selectedPlatform);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Community Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>کمیونٹی کی حالت</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{formatEngagement(stats.totalFollowers)}</Text>
            <Text style={styles.statLabel}>کل فالوورز</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{formatEngagement(stats.activeToday)}</Text>
            <Text style={styles.statLabel}>آج فعال</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{formatEngagement(stats.coursesCompleted)}</Text>
            <Text style={styles.statLabel}>مکمل کورسز</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.discussionTopics}</Text>
            <Text style={styles.statLabel}>بحث کے موضوعات</Text>
          </View>
        </View>
      </View>

      {/* Platform Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.sectionTitle}>پلیٹ فارم</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterButton, selectedPlatform === 'all' && styles.filterButtonActive]}
            onPress={() => handlePlatformFilter('all')}
          >
            <Text style={styles.filterIcon}>🌐</Text>
            <Text style={styles.filterText}>تمام</Text>
          </TouchableOpacity>
          
          {['youtube', 'tiktok', 'instagram', 'facebook', 'whatsapp'].map((platform) => (
            <TouchableOpacity
              key={platform}
              style={[styles.filterButton, selectedPlatform === platform && styles.filterButtonActive]}
              onPress={() => handlePlatformFilter(platform)}
            >
              <Text style={styles.filterIcon}>{getPlatformIcon(platform)}</Text>
              <Text style={styles.filterText}>
                {platform === 'youtube' ? 'یوٹیوب' :
                 platform === 'tiktok' ? 'ٹک ٹاک' :
                 platform === 'instagram' ? 'انسٹاگرام' :
                 platform === 'facebook' ? 'فیس بک' :
                 'واٹس ایپ'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Social Posts */}
      <View style={styles.postsContainer}>
        <Text style={styles.sectionTitle}>تازہ اپڈیٹس</Text>
        {filteredPosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.postCard}
            onPress={() => handlePostPress(post)}
          >
            <View style={styles.postHeader}>
              <View style={styles.platformBadge}>
                <Text style={styles.platformIcon}>{getPlatformIcon(post.platform)}</Text>
                <View 
                  style={[styles.platformDot, { backgroundColor: getPlatformColor(post.platform) }]} 
                />
              </View>
              <View style={styles.postMeta}>
                <Text style={styles.postTime}>{formatTimeAgo(post.timestamp)}</Text>
                <Text style={styles.postEngagement}>
                  👁 {formatEngagement(post.engagementCount)}
                </Text>
              </View>
            </View>
            
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postDescription}>{post.description}</Text>
            
            <View style={styles.postFooter}>
              <Text style={styles.postType}>
                {post.type === 'video' ? '📹 ویڈیو' :
                 post.type === 'post' ? '📝 پوسٹ' :
                 post.type === 'story' ? '📖 سٹوری' :
                 '📢 اپڈیٹ'}
              </Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handlePostPress(post)}>
                  <Text style={styles.actionIcon}>👍</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => handlePostPress(post)}>
                  <Text style={styles.actionIcon}>💬</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => handlePostPress(post)}>
                  <Text style={styles.actionIcon}>📤</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Call to Action */}
      <View style={styles.ctaContainer}>
        <Text style={styles.ctaTitle}>کمیونٹی میں شامل ہوں</Text>
        <Text style={styles.ctaText}>
          8 لاکھ سے زیادہ طلباء کے ساتھ AI سیکھیں
        </Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Linking.openURL('https://urduai.org/community').catch(() => {
            Alert.alert(t('error'), 'Unable to open community page');
          });
        }}>
          <Text style={styles.ctaButtonText}>مکمل کمیونٹی دیکھیں</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginTop: 5,
  },
  filterContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 10,
    marginRight: 15,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    minWidth: 70,
  },
  filterButtonActive: {
    backgroundColor: '#FFD700',
  },
  filterIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  filterText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
  postsContainer: {
    padding: 20,
  },
  postCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  postMeta: {
    alignItems: 'flex-end',
  },
  postTime: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Montserrat-Regular',
  },
  postEngagement: {
    fontSize: 12,
    color: '#FFD700',
    fontFamily: 'Montserrat-Regular',
    marginTop: 2,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postType: {
    fontSize: 12,
    color: '#FFD700',
    fontFamily: 'Montserrat-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 10,
  },
  actionIcon: {
    fontSize: 16,
  },
  ctaContainer: {
    backgroundColor: '#2a2a2a',
    margin: 20,
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginBottom: 15,
  },
  ctaButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  ctaButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
});

export default CommunityHub; 