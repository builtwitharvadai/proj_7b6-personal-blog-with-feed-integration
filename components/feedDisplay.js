// Feed Display Components
// ES6 module for rendering feed content with post cards, loading states, error messages
// Provides DOM manipulation utilities for dynamic content insertion with responsive layouts

import { DISPLAY_SETTINGS } from '../config.js';

/**
 * Truncates text to a maximum length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Formats a date object to a readable string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Creates a post card element from feed item data
 * @param {Object} item - Normalized feed item
 * @param {string} item.title - Post title
 * @param {string} item.description - Post description
 * @param {string} item.link - Post URL
 * @param {Date} item.pubDate - Publication date
 * @param {string} item.author - Author name
 * @param {string} item.source - Feed source identifier
 * @returns {HTMLElement} Post card element
 */
export function createPostCard(item) {
  if (!item || typeof item !== 'object') {
    console.error('[FeedDisplay] createPostCard called with invalid item:', item);
    return createErrorCard('Invalid post data');
  }

  const card = document.createElement('article');
  card.className = 'feed-item';
  card.setAttribute('data-source', item.source || 'unknown');
  card.setAttribute('data-guid', item.guid || '');

  // Create title element
  const title = document.createElement('h3');
  title.textContent = item.title || 'Untitled Post';
  card.appendChild(title);

  // Create metadata section
  const meta = document.createElement('div');
  meta.className = 'feed-item-meta';

  const author = document.createElement('span');
  author.className = 'feed-item-author';
  author.textContent = `By ${item.author || 'Unknown'}`;
  meta.appendChild(author);

  const date = document.createElement('span');
  date.className = 'feed-item-date';
  date.textContent = formatDate(item.pubDate);
  meta.appendChild(date);

  const source = document.createElement('span');
  source.className = 'feed-item-source';
  source.textContent = item.source || 'External';
  meta.appendChild(source);

  card.appendChild(meta);

  // Create content section
  const content = document.createElement('div');
  content.className = 'feed-item-content';

  const maxDescLength = DISPLAY_SETTINGS.maxDescriptionLength || 250;
  const description = truncateText(item.description, maxDescLength);
  content.textContent = description;

  card.appendChild(content);

  // Create link button
  if (item.link && item.link !== '#') {
    const linkButton = document.createElement('a');
    linkButton.href = item.link;
    linkButton.className = 'feed-item-link';
    linkButton.textContent = 'Read More';
    linkButton.target = '_blank';
    linkButton.rel = 'noopener noreferrer';
    linkButton.setAttribute('aria-label', `Read more about ${item.title || 'this post'}`);
    card.appendChild(linkButton);
  }

  // Apply animations if enabled
  if (DISPLAY_SETTINGS.enableAnimations) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    // Trigger animation after a short delay
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 50);
  }

  return card;
}

/**
 * Creates a loading skeleton screen element
 * @param {number} count - Number of skeleton cards to create
 * @returns {DocumentFragment} Fragment containing skeleton cards
 */
export function createLoadingSkeleton(count = 3) {
  if (typeof count !== 'number' || count < 1) {
    console.warn('[FeedDisplay] createLoadingSkeleton called with invalid count:', count);
    count = 3;
  }

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'feed-item skeleton';
    skeleton.setAttribute('aria-busy', 'true');
    skeleton.setAttribute('aria-label', 'Loading content');

    const skeletonTitle = document.createElement('div');
    skeletonTitle.style.height = '24px';
    skeletonTitle.style.backgroundColor = 'var(--color-border)';
    skeletonTitle.style.borderRadius = 'var(--border-radius-sm)';
    skeletonTitle.style.marginBottom = 'var(--spacing-md)';
    skeletonTitle.style.width = '70%';
    skeleton.appendChild(skeletonTitle);

    const skeletonMeta = document.createElement('div');
    skeletonMeta.style.height = '16px';
    skeletonMeta.style.backgroundColor = 'var(--color-border)';
    skeletonMeta.style.borderRadius = 'var(--border-radius-sm)';
    skeletonMeta.style.marginBottom = 'var(--spacing-md)';
    skeletonMeta.style.width = '50%';
    skeleton.appendChild(skeletonMeta);

    const skeletonContent = document.createElement('div');
    skeletonContent.style.height = '60px';
    skeletonContent.style.backgroundColor = 'var(--color-border)';
    skeletonContent.style.borderRadius = 'var(--border-radius-sm)';
    skeletonContent.style.marginBottom = 'var(--spacing-md)';
    skeleton.appendChild(skeletonContent);

    const skeletonButton = document.createElement('div');
    skeletonButton.style.height = '36px';
    skeletonButton.style.backgroundColor = 'var(--color-border)';
    skeletonButton.style.borderRadius = 'var(--border-radius-md)';
    skeletonButton.style.width = '120px';
    skeleton.appendChild(skeletonButton);

    fragment.appendChild(skeleton);
  }

  return fragment;
}

/**
 * Creates a loading spinner with message
 * @param {string} message - Loading message to display
 * @returns {HTMLElement} Loading container element
 */
export function createLoadingSpinner(message = 'Loading feeds...') {
  const container = document.createElement('div');
  container.className = 'loading';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');

  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.setAttribute('aria-hidden', 'true');
  container.appendChild(spinner);

  const text = document.createElement('p');
  text.className = 'loading-text';
  text.textContent = message;
  container.appendChild(text);

  return container;
}

/**
 * Creates an error message element with optional retry functionality
 * @param {string} message - Error message to display
 * @param {Function} retryCallback - Optional callback function for retry button
 * @param {Object} errorDetails - Additional error context
 * @returns {HTMLElement} Error message element
 */
export function createErrorMessage(message, retryCallback = null, errorDetails = {}) {
  if (!message || typeof message !== 'string') {
    console.error('[FeedDisplay] createErrorMessage called with invalid message:', message);
    message = 'An unknown error occurred';
  }

  const errorContainer = document.createElement('div');
  errorContainer.className = 'error';
  errorContainer.setAttribute('role', 'alert');
  errorContainer.setAttribute('aria-live', 'assertive');

  const errorTitle = document.createElement('div');
  errorTitle.className = 'error-title';
  errorTitle.textContent = 'Error Loading Feed';
  errorContainer.appendChild(errorTitle);

  const errorMessage = document.createElement('p');
  errorMessage.className = 'error-message';
  errorMessage.textContent = message;
  errorContainer.appendChild(errorMessage);

  // Add error details if provided
  if (errorDetails && Object.keys(errorDetails).length > 0) {
    console.error('[FeedDisplay] Error details:', errorDetails);

    if (errorDetails.type) {
      const errorType = document.createElement('p');
      errorType.className = 'error-message';
      errorType.style.fontSize = 'var(--font-size-sm)';
      errorType.style.marginTop = 'var(--spacing-sm)';
      errorType.textContent = `Error type: ${errorDetails.type}`;
      errorContainer.appendChild(errorType);
    }
  }

  // Add retry button if callback provided
  if (typeof retryCallback === 'function') {
    const retryButton = document.createElement('button');
    retryButton.className = 'error-retry';
    retryButton.textContent = 'Retry';
    retryButton.setAttribute('aria-label', 'Retry loading feed');

    retryButton.addEventListener('click', () => {
      console.log('[FeedDisplay] Retry button clicked');
      try {
        retryCallback();
      } catch (error) {
        console.error('[FeedDisplay] Error in retry callback:', error);
      }
    });

    errorContainer.appendChild(retryButton);
  }

  return errorContainer;
}

/**
 * Creates an error card for individual post errors
 * @param {string} message - Error message
 * @returns {HTMLElement} Error card element
 */
function createErrorCard(message) {
  const card = document.createElement('article');
  card.className = 'feed-item error';
  card.style.backgroundColor = '#fef2f2';
  card.style.borderColor = '#fecaca';

  const errorText = document.createElement('p');
  errorText.textContent = message;
  errorText.style.color = 'var(--color-error)';
  errorText.style.textAlign = 'center';
  errorText.style.margin = '0';
  card.appendChild(errorText);

  return card;
}

/**
 * Creates an empty state message
 * @param {string} title - Empty state title
 * @param {string} message - Empty state message
 * @returns {HTMLElement} Empty state element
 */
export function createEmptyState(title = 'No Posts Available', message = 'There are no posts to display at this time.') {
  const container = document.createElement('div');
  container.className = 'empty-state';
  container.setAttribute('role', 'status');

  const icon = document.createElement('div');
  icon.className = 'empty-state-icon';
  icon.textContent = '📭';
  icon.setAttribute('aria-hidden', 'true');
  container.appendChild(icon);

  const titleElement = document.createElement('h3');
  titleElement.className = 'empty-state-title';
  titleElement.textContent = title;
  container.appendChild(titleElement);

  const messageElement = document.createElement('p');
  messageElement.className = 'empty-state-text';
  messageElement.textContent = message;
  container.appendChild(messageElement);

  return container;
}

/**
 * Renders multiple post cards to a container
 * @param {HTMLElement} container - Target container element
 * @param {Array} items - Array of feed items to render
 * @param {boolean} clearFirst - Whether to clear container before rendering
 */
export function renderPostCards(container, items, clearFirst = true) {
  if (!container || !(container instanceof HTMLElement)) {
    console.error('[FeedDisplay] renderPostCards called with invalid container:', container);
    return;
  }

  if (!Array.isArray(items)) {
    console.error('[FeedDisplay] renderPostCards called with invalid items:', items);
    return;
  }

  console.log(`[FeedDisplay] Rendering ${items.length} post cards to container`);

  if (clearFirst) {
    clearContainer(container);
  }

  if (items.length === 0) {
    container.appendChild(createEmptyState());
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((item, index) => {
    try {
      const card = createPostCard(item);

      // Stagger animations if enabled
      if (DISPLAY_SETTINGS.enableAnimations && card.style.transition) {
        card.style.transitionDelay = `${index * 50}ms`;
      }

      fragment.appendChild(card);
    } catch (error) {
      console.error('[FeedDisplay] Error creating post card:', error, item);
      fragment.appendChild(createErrorCard('Failed to render post'));
    }
  });

  container.appendChild(fragment);
  console.log(`[FeedDisplay] Successfully rendered ${items.length} post cards`);
}

/**
 * Shows a loading state in the container
 * @param {HTMLElement} container - Target container element
 * @param {string} message - Loading message
 * @param {boolean} useSkeleton - Whether to use skeleton screen instead of spinner
 */
export function showLoadingState(container, message = 'Loading feeds...', useSkeleton = true) {
  if (!container || !(container instanceof HTMLElement)) {
    console.error('[FeedDisplay] showLoadingState called with invalid container:', container);
    return;
  }

  clearContainer(container);

  if (useSkeleton) {
    const skeleton = createLoadingSkeleton(6);
    container.appendChild(skeleton);
  } else {
    const spinner = createLoadingSpinner(message);
    container.appendChild(spinner);
  }

  console.log(`[FeedDisplay] Loading state displayed: ${message}`);
}

/**
 * Shows an error state in the container
 * @param {HTMLElement} container - Target container element
 * @param {string} message - Error message
 * @param {Function} retryCallback - Optional retry callback
 * @param {Object} errorDetails - Additional error details
 */
export function showErrorState(container, message, retryCallback = null, errorDetails = {}) {
  if (!container || !(container instanceof HTMLElement)) {
    console.error('[FeedDisplay] showErrorState called with invalid container:', container);
    return;
  }

  clearContainer(container);

  const errorElement = createErrorMessage(message, retryCallback, errorDetails);
  container.appendChild(errorElement);

  console.log(`[FeedDisplay] Error state displayed: ${message}`);
}

/**
 * Clears all content from a container
 * @param {HTMLElement} container - Container to clear
 */
export function clearContainer(container) {
  if (!container || !(container instanceof HTMLElement)) {
    console.error('[FeedDisplay] clearContainer called with invalid container:', container);
    return;
  }

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

/**
 * Appends new post cards to an existing container without clearing
 * @param {HTMLElement} container - Target container element
 * @param {Array} items - Array of feed items to append
 */
export function appendPostCards(container, items) {
  renderPostCards(container, items, false);
}

/**
 * Creates a feed section with header and container
 * @param {string} feedName - Name of the feed
 * @param {string} feedTitle - Display title for the feed
 * @returns {Object} Object containing section element and content container
 */
export function createFeedSection(feedName, feedTitle) {
  if (!feedName || typeof feedName !== 'string') {
    console.error('[FeedDisplay] createFeedSection called with invalid feedName:', feedName);
    feedName = 'unknown';
  }

  const section = document.createElement('section');
  section.className = 'feed-section';
  section.setAttribute('data-feed', feedName);

  const header = document.createElement('h2');
  header.textContent = feedTitle || feedName;
  header.style.marginBottom = 'var(--spacing-lg)';
  section.appendChild(header);

  const container = document.createElement('div');
  container.className = 'content-grid';
  container.setAttribute('data-feed-container', feedName);
  section.appendChild(container);

  console.log(`[FeedDisplay] Created feed section for: ${feedName}`);

  return {
    section: section,
    container: container
  };
}

/**
 * Updates the content of an existing feed section
 * @param {string} feedName - Name of the feed to update
 * @param {Array} items - New items to display
 * @param {HTMLElement} parentElement - Parent element containing feed sections
 */
export function updateFeedSection(feedName, items, parentElement) {
  if (!parentElement || !(parentElement instanceof HTMLElement)) {
    console.error('[FeedDisplay] updateFeedSection called with invalid parentElement:', parentElement);
    return;
  }

  const container = parentElement.querySelector(`[data-feed-container="${feedName}"]`);

  if (!container) {
    console.warn(`[FeedDisplay] Feed container not found for: ${feedName}`);
    return;
  }

  renderPostCards(container, items, true);
  console.log(`[FeedDisplay] Updated feed section: ${feedName} with ${items.length} items`);
}
