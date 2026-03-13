// Configuration file for Personal Blog with Feed Integration
// ES6 module exports for feed URLs, blog metadata, display settings, and social links

export const FEED_URLS = {
  openai: 'https://openai.com/blog/rss.xml',
  anthropic: 'https://www.anthropic.com/news/rss.xml',
  deepmind: 'https://deepmind.google/blog/rss.xml',
  arxiv_ai: 'http://export.arxiv.org/rss/cs.AI',
  huggingface: 'https://huggingface.co/blog/feed.xml'
};

export const BLOG_METADATA = {
  title: 'Personal Blog - AI & LLM Insights',
  description: 'A curated collection of thoughts on AI, Large Language Models, and cutting-edge research',
  author: 'Kenny',
  tagline: 'Exploring the frontier of artificial intelligence'
};

export const DISPLAY_SETTINGS = {
  postsPerFeed: 5,
  refreshInterval: 300000,
  dateFormat: 'MMMM DD, YYYY',
  maxDescriptionLength: 250,
  enableAnimations: true,
  defaultView: 'grid'
};

export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/',
  github: 'https://github.com/',
  linkedin: 'https://linkedin.com/in/',
  email: 'mailto:contact@example.com'
};
