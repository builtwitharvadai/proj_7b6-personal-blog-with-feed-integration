// RSS/Atom Feed Parser Utility
// Handles parsing of RSS and Atom feeds with comprehensive error handling,
// CORS management, and data normalization for consistent rendering

import Parser from 'rss-parser';

/**
 * Creates and configures an RSS parser instance
 * @returns {Parser} Configured RSS parser
 */
function createParser() {
  return new Parser({
    customFields: {
      item: [
        ['media:content', 'media:content'],
        ['media:thumbnail', 'media:thumbnail'],
        ['dc:creator', 'creator'],
        ['content:encoded', 'contentEncoded']
      ]
    },
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PersonalBlogReader/1.0)'
    }
  });
}

/**
 * Normalizes a feed item to a consistent format
 * @param {Object} item - Raw feed item from parser
 * @param {string} feedSource - Source identifier for the feed
 * @returns {Object} Normalized feed item
 */
function normalizeItem(item, feedSource) {
  const title = item.title || 'Untitled';
  const link = item.link || item.guid || '#';
  const pubDate = item.pubDate || item.isoDate || new Date().toISOString();
  const description = item.contentSnippet || item.description || item.content || 'No description available';
  const author = item.creator || item['dc:creator'] || item.author || 'Unknown Author';

  // Extract image from various possible locations
  let image = null;
  if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
    image = item.enclosure.url;
  } else if (item['media:thumbnail'] && item['media:thumbnail'].url) {
    image = item['media:thumbnail'].url;
  } else if (item['media:content'] && item['media:content'].url) {
    image = item['media:content'].url;
  }

  return {
    title: sanitizeText(title),
    link: link,
    pubDate: new Date(pubDate),
    description: sanitizeText(description),
    author: sanitizeText(author),
    source: feedSource,
    image: image,
    guid: item.guid || link
  };
}

/**
 * Sanitizes text content by removing HTML tags and trimming whitespace
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Determines the type of error and provides appropriate error context
 * @param {Error} error - The error object
 * @param {string} feedUrl - URL of the feed that failed
 * @returns {Object} Structured error information
 */
function categorizeError(error, feedUrl) {
  const errorMessage = error.message || '';
  const errorString = error.toString().toLowerCase();

  // CORS errors
  if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin') ||
      errorString.includes('cors') || errorString.includes('cross-origin')) {
    return {
      type: 'CORS',
      message: `CORS policy blocked access to ${feedUrl}. Consider using a CORS proxy or server-side fetching.`,
      recoverable: true,
      feedUrl: feedUrl
    };
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') ||
      errorString.includes('network') || errorString.includes('fetch') ||
      errorMessage.includes('Failed to fetch')) {
    return {
      type: 'NETWORK',
      message: `Network error accessing ${feedUrl}. Check your internet connection or feed availability.`,
      recoverable: true,
      feedUrl: feedUrl
    };
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorString.includes('timeout')) {
    return {
      type: 'TIMEOUT',
      message: `Request timed out for ${feedUrl}. The server may be slow or unresponsive.`,
      recoverable: true,
      feedUrl: feedUrl
    };
  }

  // Parse errors
  if (errorMessage.includes('parse') || errorMessage.includes('XML') ||
      errorString.includes('parse') || errorString.includes('xml')) {
    return {
      type: 'PARSE',
      message: `Failed to parse feed content from ${feedUrl}. The feed may be malformed or in an unsupported format.`,
      recoverable: false,
      feedUrl: feedUrl
    };
  }

  // Generic error
  return {
    type: 'UNKNOWN',
    message: `Failed to fetch feed from ${feedUrl}: ${errorMessage}`,
    recoverable: false,
    feedUrl: feedUrl
  };
}

/**
 * Parses an RSS or Atom feed from a given URL
 * @param {string} feedUrl - URL of the feed to parse
 * @param {string} feedSource - Identifier for the feed source
 * @returns {Promise<Object>} Parsed and normalized feed data
 */
export async function parseFeed(feedUrl, feedSource = 'unknown') {
  const parser = createParser();

  console.log(`[FeedParser] Attempting to fetch feed from ${feedSource}: ${feedUrl}`);

  try {
    const feed = await parser.parseURL(feedUrl);

    console.log(`[FeedParser] Successfully parsed feed from ${feedSource}. Items: ${feed.items ? feed.items.length : 0}`);

    const normalizedItems = (feed.items || []).map(item => normalizeItem(item, feedSource));

    return {
      success: true,
      feedMetadata: {
        title: feed.title || feedSource,
        description: feed.description || '',
        link: feed.link || feedUrl,
        source: feedSource,
        lastBuildDate: feed.lastBuildDate || new Date().toISOString()
      },
      items: normalizedItems,
      itemCount: normalizedItems.length
    };

  } catch (error) {
    const errorInfo = categorizeError(error, feedUrl);

    console.error(`[FeedParser] Error fetching ${feedSource}:`, {
      type: errorInfo.type,
      message: errorInfo.message,
      feedUrl: feedUrl,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      error: errorInfo,
      feedMetadata: {
        title: feedSource,
        description: 'Feed unavailable',
        link: feedUrl,
        source: feedSource
      },
      items: [],
      itemCount: 0
    };
  }
}

/**
 * Parses multiple feeds concurrently
 * @param {Object} feedUrlsMap - Object mapping source names to feed URLs
 * @returns {Promise<Array>} Array of parsed feed results
 */
export async function parseMultipleFeeds(feedUrlsMap) {
  console.log(`[FeedParser] Parsing ${Object.keys(feedUrlsMap).length} feeds concurrently`);

  const feedPromises = Object.entries(feedUrlsMap).map(([source, url]) =>
    parseFeed(url, source)
  );

  const results = await Promise.allSettled(feedPromises);

  return results.map((result, index) => {
    const source = Object.keys(feedUrlsMap)[index];

    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`[FeedParser] Promise rejected for ${source}:`, result.reason);
      return {
        success: false,
        error: {
          type: 'PROMISE_REJECTION',
          message: `Promise rejected: ${result.reason}`,
          recoverable: false,
          feedUrl: feedUrlsMap[source]
        },
        feedMetadata: {
          title: source,
          description: 'Feed unavailable',
          link: feedUrlsMap[source],
          source: source
        },
        items: [],
        itemCount: 0
      };
    }
  });
}

/**
 * Test function to validate feed parsing functionality
 * @param {string} testFeedUrl - URL of a test feed
 * @returns {Promise<boolean>} True if test passes, false otherwise
 */
export async function testFeedParser(testFeedUrl = 'https://www.nasa.gov/rss/dyn/breaking_news.rss') {
  console.log('[FeedParser] Running test with feed:', testFeedUrl);

  try {
    const result = await parseFeed(testFeedUrl, 'test-feed');

    if (!result.success) {
      console.warn('[FeedParser] Test completed but feed parsing failed:', result.error);
      return false;
    }

    const hasItems = result.items && result.items.length > 0;
    const hasMetadata = result.feedMetadata && result.feedMetadata.title;

    console.log('[FeedParser] Test results:', {
      success: result.success,
      itemCount: result.itemCount,
      hasItems: hasItems,
      hasMetadata: hasMetadata
    });

    return hasItems && hasMetadata;

  } catch (error) {
    console.error('[FeedParser] Test failed with exception:', error);
    return false;
  }
}

/**
 * Filters feed items by date range
 * @param {Array} items - Array of normalized feed items
 * @param {Date} startDate - Start date for filtering
 * @param {Date} endDate - End date for filtering
 * @returns {Array} Filtered items
 */
export function filterByDateRange(items, startDate, endDate) {
  if (!items || !Array.isArray(items)) {
    console.warn('[FeedParser] filterByDateRange called with invalid items array');
    return [];
  }

  return items.filter(item => {
    const itemDate = new Date(item.pubDate);
    return itemDate >= startDate && itemDate <= endDate;
  });
}

/**
 * Sorts feed items by publication date
 * @param {Array} items - Array of normalized feed items
 * @param {string} order - Sort order: 'desc' (newest first) or 'asc' (oldest first)
 * @returns {Array} Sorted items
 */
export function sortByDate(items, order = 'desc') {
  if (!items || !Array.isArray(items)) {
    console.warn('[FeedParser] sortByDate called with invalid items array');
    return [];
  }

  return [...items].sort((a, b) => {
    const dateA = new Date(a.pubDate);
    const dateB = new Date(b.pubDate);

    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}
