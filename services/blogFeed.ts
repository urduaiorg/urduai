export type BlogPost = {
  id: string;
  url: string;
  title: string;
  date: string;
  excerpt: string;
  image: string | null;
  category: string;
};

const BLOG_API_URL =
  'https://urduai.org/wp-json/wp/v2/posts?per_page=6&_embed=wp:featuredmedia&orderby=date&order=desc';
const BLOG_HOME_URL = 'https://urduai.org/';

function decodeHtml(text = '') {
  return text
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, '...')
    .replace(/&#8211;/g, '-')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBestImage(article = '') {
  const lazyMatch =
    article.match(/data-lazy-src="([^"]+)"/i) ||
    article.match(/data-src="([^"]+)"/i) ||
    article.match(/srcset="([^"]+)"/i) ||
    article.match(/<img[^>]+src="([^"]+)"/i);

  if (!lazyMatch?.[1]) {
    return null;
  }

  if (lazyMatch[0].toLowerCase().includes('srcset')) {
    const firstCandidate = lazyMatch[1]
      .split(',')
      .map((entry) => entry.trim().split(' ')[0])
      .filter(Boolean)
      .pop();
    return firstCandidate || null;
  }

  return lazyMatch[1];
}

function isValidBlogUrl(url = '') {
  return (
    /^https:\/\/urduai\.org\//i.test(url) &&
    !/\/registration-message\/?$/i.test(url)
  );
}

function normalizePost(input: Partial<BlogPost> & { url: string; title: string }) {
  return {
    id: input.id || input.url,
    url: input.url,
    title: decodeHtml(input.title),
    date: input.date || new Date().toISOString(),
    excerpt: decodeHtml(input.excerpt || ''),
    image: input.image || null,
    category: input.category || 'Blog',
  };
}

async function fetchFromWordPressApi(): Promise<BlogPost[]> {
  const response = await fetch(BLOG_API_URL);
  if (!response.ok) {
    throw new Error(`WordPress API failed: ${response.status}`);
  }

  const posts = await response.json();
  if (!Array.isArray(posts)) {
    throw new Error('WordPress API returned invalid payload');
  }

  return posts
    .map((post: any) =>
      normalizePost({
        id: `${post.id || post.link}`,
        url: post.link,
        title: post?.title?.rendered || '',
        date: post.date,
        excerpt: post?.excerpt?.rendered || '',
        image: post?._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
      })
    )
    .filter((post) => isValidBlogUrl(post.url) && post.title);
}

async function fetchFromHomePage(): Promise<BlogPost[]> {
  const response = await fetch(BLOG_HOME_URL);
  if (!response.ok) {
    throw new Error(`Blog homepage failed: ${response.status}`);
  }

  const html = await response.text();
  const articleMatches = html.match(/<article[\s\S]*?<\/article>/gi) || [];

  const posts = articleMatches
    .map((article, index) => {
      const urlMatch = article.match(/<a[^>]+href="(https:\/\/urduai\.org\/[^"]+)"/i);
      const titleMatch =
        article.match(/<h2[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
        article.match(/<h3[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
      const excerptMatch = article.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const dateMatch = article.match(/datetime="([^"]+)"/i);

      if (!urlMatch?.[1] || !titleMatch?.[1]) {
        return null;
      }

      return normalizePost({
        id: `homepage-${index}-${urlMatch[1]}`,
        url: urlMatch[1],
        title: titleMatch[1],
        date: dateMatch?.[1],
        excerpt: excerptMatch?.[1] || '',
        image: extractBestImage(article),
      });
    })
    .filter((post): post is BlogPost => !!post && isValidBlogUrl(post.url));

  if (!posts.length) {
    throw new Error('No posts parsed from homepage');
  }

  return posts;
}

export async function fetchLatestBlogPosts(limit = 4): Promise<BlogPost[]> {
  const sources = [fetchFromWordPressApi, fetchFromHomePage];

  for (const source of sources) {
    try {
      const posts = await source();
      if (posts.length) {
        return posts.slice(0, limit);
      }
    } catch {
      // Try the next source.
    }
  }

  throw new Error('Unable to fetch latest blog posts');
}
