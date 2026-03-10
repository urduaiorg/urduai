import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const REVIEW_STATE_KEY = '@urai_review_prompt_state';
const REVIEW_OPEN_COUNT_KEY = '@urai_review_open_count';
const REVIEW_COOLDOWN_DAYS = 21;
const MAX_REVIEW_REQUESTS = 3;

type ReviewTrigger =
  | 'open'
  | 'blog'
  | 'video'
  | 'streak'
  | 'badge'
  | 'course_completion'
  | 'certificate';

type ReviewPromptState = {
  promptCount: number;
  lastPromptAt: string | null;
};

type ReviewMetrics = {
  openCount?: number;
  blogsRead?: number;
  uniqueBlogsRead?: number;
  videosOpened?: number;
  uniqueVideosOpened?: number;
  currentStreak?: number;
  badgeId?: string;
  badgeCount?: number;
  courseCompleted?: boolean;
  certificateEarned?: boolean;
};

const DEFAULT_STATE: ReviewPromptState = {
  promptCount: 0,
  lastPromptAt: null,
};

async function readPromptState(): Promise<ReviewPromptState> {
  try {
    const stored = await AsyncStorage.getItem(REVIEW_STATE_KEY);
    return stored ? { ...DEFAULT_STATE, ...JSON.parse(stored) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

async function writePromptState(state: ReviewPromptState) {
  await AsyncStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(state));
}

function isCooldownComplete(lastPromptAt: string | null) {
  if (!lastPromptAt) return true;
  const elapsed = Date.now() - new Date(lastPromptAt).getTime();
  return elapsed >= REVIEW_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
}

function qualifiesForPrompt(trigger: ReviewTrigger, metrics: ReviewMetrics) {
  switch (trigger) {
    case 'open':
      return (metrics.openCount || 0) >= 8;
    case 'blog':
      return (metrics.blogsRead || 0) >= 4 && (metrics.uniqueBlogsRead || 0) >= 3;
    case 'video':
      return (metrics.videosOpened || 0) >= 3 && (metrics.uniqueVideosOpened || 0) >= 2;
    case 'streak':
      return (metrics.currentStreak || 0) >= 7;
    case 'badge':
      return metrics.badgeId === 'graduate' || (metrics.badgeCount || 0) >= 2;
    case 'course_completion':
      return Boolean(metrics.courseCompleted);
    case 'certificate':
      return Boolean(metrics.certificateEarned);
    default:
      return false;
  }
}

export async function incrementReviewOpenCount() {
  const openCountRaw = await AsyncStorage.getItem(REVIEW_OPEN_COUNT_KEY);
  const openCount = openCountRaw ? parseInt(openCountRaw, 10) + 1 : 1;
  await AsyncStorage.setItem(REVIEW_OPEN_COUNT_KEY, String(openCount));
  return openCount;
}

export async function maybeRequestReview(trigger: ReviewTrigger, metrics: ReviewMetrics = {}) {
  try {
    const canRequest = await StoreReview.hasAction();
    if (!canRequest) return false;

    const state = await readPromptState();
    if (state.promptCount >= MAX_REVIEW_REQUESTS) return false;
    if (!isCooldownComplete(state.lastPromptAt)) return false;
    if (!qualifiesForPrompt(trigger, metrics)) return false;

    await StoreReview.requestReview();
    await writePromptState({
      promptCount: state.promptCount + 1,
      lastPromptAt: new Date().toISOString(),
    });
    return true;
  } catch {
    return false;
  }
}
