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

    console.log(`[App] Successfully loaded ${normalizedItems.length} personal posts`);

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
    console.error('[App] Error fetching personal feed:', error);

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

    // Log individual feed failures
    if (failureCount > 0) {
      allResults.forEach(result => {
        if (!result.success) {
          console.warn(`[App] Feed failed: ${result.feedMetadata.source}`, result.error);
          appState.errors.push({
            source: result.feedMetadata.source,
            error: result.error,
            timestamp: new Date().toISOString()
          });
        }
      });
    }

    return allResults;

  } catch (error) {
    console.error('[App] Critical error during feed fetch operation:', error);

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
    }
  });

  // Sort all items by publication date (newest first)
  allItems.sort((a, b) => {
    const dateA = new Date(a.pubDate);
    const dateB = new Date(b.pubDate);
    return dateB - dateA;
  });

  console.log(`[App] Aggregated total of ${allItems.length} items`);

  return allItems;
}

/**
 * Renders all feed items to the main content container
 * @param {Array} items - Array of feed items to render
 */
function renderFeeds(items) {
  const container = document.getElementById('blog-content');

  if (!container) {
    console.error('[App] Blog content container not found');
    return;
  }

  console.log(`[App] Rendering ${items.length} items to blog-content container`);

  if (items.length === 0) {
    showErrorState(
      container,
      'No feed items available to display',
      () => initializeApp(),
      { type: 'NO_CONTENT' }
    );
    return;
  }

  try {
    renderPostCards(container, items, true);
    console.log('[App] Successfully rendered all feed items');
  } catch (error) {
    console.error('[App] Error rendering feed items:', error);
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
  console.log('[App] Application initialization started');

  // Prevent concurrent initializations
  if (appState.isLoading) {
    console.warn('[App] Initialization already in progress, skipping');
    return;
  }

  appState.isLoading = true;
  appState.errors = [];

  const container = document.getElementById('blog-content');

  if (!container) {
    console.error('[App] Critical error: blog-content container not found in DOM');
    appState.isLoading = false;
    return;
  }

  // Show loading state
  showLoadingState(container, 'Loading feeds...', true);

  try {
    // Fetch all feeds concurrently
    const feedResults = await fetchAllFeeds();

    // Store feed results in app state
    appState.feeds = feedResults;
    appState.lastUpdate = new Date();

    // Aggregate and sort all items
    const allItems = aggregateFeedItems(feedResults);

    // Render items to the page
    renderFeeds(allItems);

    const initEndTime = performance.now();
    const totalDuration = (initEndTime - initStartTime).toFixed(2);

    console.log(`[App] Application initialization completed in ${totalDuration}ms`, {
      feedCount: feedResults.length,
      itemCount: allItems.length,
      errorCount: appState.errors.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[App] Critical error during initialization:', error);

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
  console.log('[App] Main function called');

  if (document.readyState === 'loading') {
    console.log('[App] DOM not ready, waiting for DOMContentLoaded event');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[App] DOMContentLoaded event fired');
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
