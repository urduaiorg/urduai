import AsyncStorage from '@react-native-async-storage/async-storage';
import { maybeRequestReview } from './reviewPromptService';

const ENGAGEMENT_KEY = '@urai_engagement_stats';
const MAX_UNIQUE_ITEMS = 200;

export type EngagementStats = {
  blogsRead: number;
  videosOpened: number;
  uniqueBlogUrls: string[];
  uniqueVideoUrls: string[];
};

const DEFAULT_STATS: EngagementStats = {
  blogsRead: 0,
  videosOpened: 0,
  uniqueBlogUrls: [],
  uniqueVideoUrls: [],
};

async function readStats(): Promise<EngagementStats> {
  try {
    const stored = await AsyncStorage.getItem(ENGAGEMENT_KEY);
    if (!stored) return DEFAULT_STATS;
    return {
      ...DEFAULT_STATS,
      ...JSON.parse(stored),
    };
  } catch {
    return DEFAULT_STATS;
  }
}

async function writeStats(stats: EngagementStats) {
  await AsyncStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(stats));
}

export async function recordBlogRead(url?: string) {
  if (!url) return;
  const stats = await readStats();
  const uniqueBlogUrls = stats.uniqueBlogUrls.includes(url)
    ? stats.uniqueBlogUrls
    : [url, ...stats.uniqueBlogUrls].slice(0, MAX_UNIQUE_ITEMS);

  const nextStats = {
    ...stats,
    blogsRead: stats.blogsRead + 1,
    uniqueBlogUrls,
  };

  await writeStats(nextStats);
  await maybeRequestReview('blog', {
    blogsRead: nextStats.blogsRead,
    uniqueBlogsRead: nextStats.uniqueBlogUrls.length,
  });
}

export async function recordVideoOpen(url?: string) {
  if (!url) return;
  const stats = await readStats();
  const uniqueVideoUrls = stats.uniqueVideoUrls.includes(url)
    ? stats.uniqueVideoUrls
    : [url, ...stats.uniqueVideoUrls].slice(0, MAX_UNIQUE_ITEMS);

  const nextStats = {
    ...stats,
    videosOpened: stats.videosOpened + 1,
    uniqueVideoUrls,
  };

  await writeStats(nextStats);
  await maybeRequestReview('video', {
    videosOpened: nextStats.videosOpened,
    uniqueVideosOpened: nextStats.uniqueVideoUrls.length,
  });
}

export async function getEngagementStats() {
  const stats = await readStats();
  return {
    blogsRead: stats.blogsRead,
    videosOpened: stats.videosOpened,
    uniqueBlogsRead: stats.uniqueBlogUrls.length,
    uniqueVideosOpened: stats.uniqueVideoUrls.length,
  };
}
