// Main Application Logic and Feed Integration
// ES6 module orchestrating feed fetching, parsing, and display with comprehensive error handling
// Integrates feedParser and feedDisplay components for complete blog functionality

import { FEED_URLS, DISPLAY_SETTINGS } from './config.js';
import { parseMultipleFeeds, parseFeed } from './utils/feedParser.js';
import { renderPostCards, showLoadingState, showErrorState } from './components/feedDisplay.js';

/**
 * Main application state
 */
const appState = {
  feeds: [],
  lastUpdate: null,
  isLoading: false,
  errors: []
};

/**
 * Fetches personal feed data from local JSON file
 * @returns {Promise<Object>} Personal feed data
 */
async function fetchPersonalFeed() {
  console.log('[App] Fetching personal feed from kennys_feed.json');
  const startTime = performance.now();

  try {
    const response = await fetch('./kennys_feed.json');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Personal feed data is not an array');
    }

    // Normalize personal feed items to match feed parser format
    const normalizedItems = data.map(item => ({
      title: item.title || 'Untitled',
      link: item.link || '#',
      pubDate: new Date(item.pubDate || new Date()),
      description: item.description || item.content || 'No description available',
      author: 'Kenny',
      source: 'Personal',
      guid: item.link || item.title
    }));

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    console.log(`[App] Successfully loaded ${normalizedItems.length} personal posts in ${duration}ms`);

    return {
      success: true,
      feedMetadata: {
        title: 'Kenny\'s Personal Posts',
        description: 'Personal blog posts and thoughts',
        source: 'Personal',
        lastBuildDate: new Date().toISOString()
      },
      items: normalizedItems,
      itemCount: normalizedItems.length
    };

  } catch (error) {
    console.error('[App] Error fetching personal feed:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      error: {
        type: 'LOCAL_FETCH',
        message: `Failed to load personal feed: ${error.message}`,
        recoverable: true
      },
      feedMetadata: {
        title: 'Personal Posts',
        description: 'Feed unavailable',
        source: 'Personal'
      },
      items: [],
      itemCount: 0
    };
  }
}

/**
 * Fetches and parses all configured feeds concurrently
 * @returns {Promise<Array>} Array of parsed feed results
 */
async function fetchAllFeeds() {
  const startTime = performance.now();
  console.log('[App] Starting concurrent feed fetch operation');
  console.log('[App] Configured feeds:', Object.keys(FEED_URLS).join(', '));

  try {
    // Fetch personal feed and external feeds in parallel
    const [personalFeedResult, externalFeedsResults] = await Promise.all([
      fetchPersonalFeed(),
      parseMultipleFeeds(FEED_URLS)
    ]);

    // Combine all results
    const allResults = [personalFeedResult, ...externalFeedsResults];

    // Log performance metrics
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    const successCount = allResults.filter(r => r.success).length;
    const failureCount = allResults.filter(r => !r.success).length;
    const totalItems = allResults.reduce((sum, r) => sum + r.itemCount, 0);

    console.log(`[App] Feed fetch completed in ${duration}ms`, {
      totalFeeds: allResults.length,
      successful: successCount,
      failed: failureCount,
      totalItems: totalItems,
      timestamp: new Date().toISOString()
    });

    // Log individual feed results
    allResults.forEach(result => {
      if (result.success) {
        console.log(`[App] ✓ Feed loaded successfully: ${result.feedMetadata.source} (${result.itemCount} items)`);
      } else {
        console.warn(`[App] ✗ Feed failed: ${result.feedMetadata.source}`, result.error);
        appState.errors.push({
          source: result.feedMetadata.source,
          error: result.error,
          timestamp: new Date().toISOString()
        });
      }
    });

    return allResults;

  } catch (error) {
    console.error('[App] Critical error during feed fetch operation:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Return empty results with error information
    return [{
      success: false,
      error: {
        type: 'CRITICAL',
        message: `Critical application error: ${error.message}`,
        recoverable: false
      },
      feedMetadata: {
        title: 'Error',
        source: 'system'
      },
      items: [],
      itemCount: 0
    }];
  }
}

/**
 * Aggregates and sorts all feed items from multiple sources
 * @param {Array} feedResults - Array of feed parsing results
 * @returns {Array} Sorted array of all feed items
 */
function aggregateFeedItems(feedResults) {
  console.log('[App] Aggregating feed items from multiple sources');

  const allItems = [];

  feedResults.forEach(result => {
    if (result.success && result.items && result.items.length > 0) {
      // Limit items per feed based on settings
      const itemsToAdd = result.items.slice(0, DISPLAY_SETTINGS.postsPerFeed);
      allItems.push(...itemsToAdd);

      console.log(`[App] Added ${itemsToAdd.length} items from ${result.feedMetadata.source}`);
    } else if (result.success && result.items && result.items.length === 0) {
      console.log(`[App] No items found in ${result.feedMetadata.source}`);
    }
  });

  // Sort all items by publication date (newest first)
  allItems.sort((a, b) => {
    const dateA = new Date(a.pubDate);
    const dateB = new Date(b.pubDate);
    return dateB - dateA;
  });

  console.log(`[App] Aggregated total of ${allItems.length} items, sorted by date`);

  return allItems;
}

/**
 * Renders all feed items to the main content container
 * @param {Array} items - Array of feed items to render
 */
function renderFeeds(items) {
  console.log('[App] renderFeeds called with', items.length, 'items');

  const container = document.getElementById('blog-content');

  if (!container) {
    console.error('[App] CRITICAL: blog-content container not found in DOM!');
    console.error('[App] Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    return;
  }

  console.log(`[App] Container found: #${container.id} with classes: ${container.className}`);
  console.log(`[App] Rendering ${items.length} items to blog-content container`);

  if (items.length === 0) {
    console.warn('[App] No items to render, showing error state');
    showErrorState(
      container,
      'No feed items available to display',
      () => initializeApp(),
      { type: 'NO_CONTENT' }
    );
    return;
  }

  try {
    console.log('[App] Calling renderPostCards...');
    renderPostCards(container, items, true);
    console.log('[App] Successfully rendered all feed items');
    console.log('[App] Container now has', container.children.length, 'child elements');
  } catch (error) {
    console.error('[App] Error rendering feed items:', {
      error: error.message,
      stack: error.stack,
      itemCount: items.length
    });
    showErrorState(
      container,
      'Failed to render feed items',
      () => initializeApp(),
      { type: 'RENDER_ERROR', message: error.message }
    );
  }
}

/**
 * Handles feed refresh operation
 */
async function refreshFeeds() {
  console.log('[App] Manual feed refresh triggered');
  await initializeApp();
}

/**
 * Sets up automatic feed refresh based on configured interval
 */
function setupAutoRefresh() {
  const refreshInterval = DISPLAY_SETTINGS.refreshInterval;

  if (!refreshInterval || refreshInterval <= 0) {
    console.log('[App] Auto-refresh disabled');
    return;
  }

  console.log(`[App] Setting up auto-refresh every ${refreshInterval}ms (${refreshInterval / 60000} minutes)`);

  setInterval(async () => {
    console.log('[App] Auto-refresh triggered');
    await initializeApp();
  }, refreshInterval);
}

/**
 * Main initialization function
 * Orchestrates the entire feed loading and display process
 */
async function initializeApp() {
  const initStartTime = performance.now();
  console.log('[App] ========================================');
  console.log('[App] Application initialization started');
  console.log('[App] ========================================');

  // Prevent concurrent initializations
  if (appState.isLoading) {
    console.warn('[App] Initialization already in progress, skipping');
    return;
  }

  appState.isLoading = true;
  appState.errors = [];

  const container = document.getElementById('blog-content');

  if (!container) {
    console.error('[App] CRITICAL ERROR: blog-content container not found in DOM');
    console.error('[App] Document ready state:', document.readyState);
    console.error('[App] Body children:', document.body.children.length);
    console.error('[App] Available IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    appState.isLoading = false;
    return;
  }

  console.log('[App] Container verified: #blog-content found');

  // Show loading state
  console.log('[App] Showing loading state...');
  showLoadingState(container, 'Loading feeds...', true);

  try {
    // Fetch all feeds concurrently
    console.log('[App] Fetching all feeds...');
    const feedResults = await fetchAllFeeds();

    // Store feed results in app state
    appState.feeds = feedResults;
    appState.lastUpdate = new Date();
    console.log('[App] Feed results stored in app state');

    // Aggregate and sort all items
    console.log('[App] Aggregating feed items...');
    const allItems = aggregateFeedItems(feedResults);

    // Render items to the page
    console.log('[App] Calling renderFeeds with', allItems.length, 'items...');
    renderFeeds(allItems);

    const initEndTime = performance.now();
    const totalDuration = (initEndTime - initStartTime).toFixed(2);

    console.log('[App] ========================================');
    console.log(`[App] Application initialization completed in ${totalDuration}ms`, {
      feedCount: feedResults.length,
      itemCount: allItems.length,
      errorCount: appState.errors.length,
      timestamp: new Date().toISOString()
    });
    console.log('[App] ========================================');

  } catch (error) {
    console.error('[App] Critical error during initialization:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    showErrorState(
      container,
      'Failed to load blog content',
      () => initializeApp(),
      { type: 'INITIALIZATION_ERROR', message: error.message }
    );

  } finally {
    appState.isLoading = false;
  }
}

/**
 * Application entry point
 * Waits for DOM to be ready before initializing
 */
function main() {
  console.log('[App] ========================================');
  console.log('[App] Main function called');
  console.log('[App] Document ready state:', document.readyState);
  console.log('[App] ========================================');

  if (document.readyState === 'loading') {
    console.log('[App] DOM not ready, waiting for DOMContentLoaded event');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[App] DOMContentLoaded event fired, DOM is now ready');
      initializeApp();
      setupAutoRefresh();
    });
  } else {
    console.log('[App] DOM already ready, initializing immediately');
    initializeApp();
    setupAutoRefresh();
  }
}

// Start the application
main();

// Export functions for testing and external access
export {
  initializeApp,
  refreshFeeds,
  fetchAllFeeds,
  aggregateFeedItems,
  appState
};
