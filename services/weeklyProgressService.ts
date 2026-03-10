import AsyncStorage from '@react-native-async-storage/async-storage';

const WEEKLY_PROGRESS_KEY = '@urai_weekly_progress_log';
const WEEKLY_CARD_SHOWN_KEY = '@urai_weekly_card_last_shown';
const MAX_EVENTS = 400;

type WeeklyEventType = 'blog' | 'video' | 'course';

type WeeklyEvent = {
  type: WeeklyEventType;
  id: string;
  at: string;
};

function getStartOfWeek(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getWeekKey(date = new Date()) {
  const start = getStartOfWeek(date);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
}

async function readEvents(): Promise<WeeklyEvent[]> {
  try {
    const stored = await AsyncStorage.getItem(WEEKLY_PROGRESS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function writeEvents(events: WeeklyEvent[]) {
  await AsyncStorage.setItem(WEEKLY_PROGRESS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

export async function recordWeeklyProgressEvent(type: WeeklyEventType, id?: string) {
  if (!id) return;
  const events = await readEvents();
  const nextEvent: WeeklyEvent = { type, id, at: new Date().toISOString() };
  await writeEvents([...events, nextEvent]);
}

export async function getWeeklyProgressSummary() {
  const events = await readEvents();
  const startOfWeek = getStartOfWeek();

  const weeklyEvents = events.filter((event) => new Date(event.at) >= startOfWeek);
  const blogs = weeklyEvents.filter((event) => event.type === 'blog');
  const videos = weeklyEvents.filter((event) => event.type === 'video');
  const courses = weeklyEvents.filter((event) => event.type === 'course');

  return {
    weekKey: getWeekKey(),
    blogsRead: blogs.length,
    videosWatched: videos.length,
    courseActions: courses.length,
    uniqueBlogsRead: new Set(blogs.map((event) => event.id)).size,
    uniqueVideosWatched: new Set(videos.map((event) => event.id)).size,
    uniqueCourseActions: new Set(courses.map((event) => event.id)).size,
    totalActivity: weeklyEvents.length,
  };
}

export async function shouldShowWeeklyCard(minimumActivity = 3) {
  const summary = await getWeeklyProgressSummary();
  const lastShownWeek = await AsyncStorage.getItem(WEEKLY_CARD_SHOWN_KEY);
  return summary.totalActivity >= minimumActivity && lastShownWeek !== summary.weekKey;
}

export async function markWeeklyCardShown(weekKey?: string) {
  await AsyncStorage.setItem(WEEKLY_CARD_SHOWN_KEY, weekKey || getWeekKey());
}
