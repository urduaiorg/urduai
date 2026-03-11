const YOUTUBE_HANDLE_URL = 'https://www.youtube.com/@urduaiorg/videos';
const YOUTUBE_RSS_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=';

export type YouTubeFeedVideo = {
  id: string;
  title: string;
  publishedAt: string;
  url: string;
  thumbnail: string | null;
  author: string;
  isShort: boolean;
};

function decodeXml(text = '') {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTag(content: string, tagName: string) {
  const match = content.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : '';
}

function extractAttr(content: string, tagName: string, attribute: string) {
  const match = content.match(new RegExp(`<${tagName}[^>]*${attribute}="([^"]+)"`, 'i'));
  return match ? decodeXml(match[1].trim()) : '';
}

async function resolveChannelId() {
  const response = await fetch(`${YOUTUBE_HANDLE_URL}?_ts=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`Channel page failed: ${response.status}`);
  }

  const html = await response.text();
  const match = html.match(/"channelId":"(UC[\w-]+)"/) || html.match(/"externalId":"(UC[\w-]+)"/);

  if (!match?.[1]) {
    throw new Error('Unable to resolve YouTube channel id');
  }

  return match[1];
}

export async function fetchLatestYouTubeVideos(limit = 8): Promise<YouTubeFeedVideo[]> {
  const channelId = await resolveChannelId();
  const response = await fetch(`${YOUTUBE_RSS_URL}${channelId}&_ts=${Date.now()}`);

  if (!response.ok) {
    throw new Error(`YouTube feed failed: ${response.status}`);
  }

  const xml = await response.text();
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];

  return entries.slice(0, limit).map((entry) => {
    const videoId = extractTag(entry, 'yt:videoId');
    const title = extractTag(entry, 'title');
    const publishedAt = extractTag(entry, 'published');
    const author = extractTag(entry, 'name') || 'Urdu AI';
    const videoUrl = extractTag(entry, 'link') || `https://www.youtube.com/watch?v=${videoId}`;
    const thumbnail = extractAttr(entry, 'media:thumbnail', 'url') || null;
    const isShort = /#shorts|\bshorts\b/i.test(title);

    return {
      id: videoId,
      title,
      publishedAt,
      url: videoUrl,
      thumbnail,
      author,
      isShort,
    };
  });
}
