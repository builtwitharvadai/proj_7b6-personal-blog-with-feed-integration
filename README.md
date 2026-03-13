# Personal Blog with Feed Integration

A static personal blog website that aggregates and displays curated content from external RSS feeds alongside personal posts. Built with vanilla JavaScript and designed for simplicity and performance.

## Features

- **RSS Feed Aggregation**: Automatically fetches and displays posts from multiple RSS feeds
- **Personal Content**: Display your own blog posts from a local JSON file
- **Client-Side Processing**: No backend required - runs entirely in the browser
- **Responsive Design**: Mobile-friendly grid layout with CSS animations
- **Auto-Refresh**: Configurable automatic feed updates
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Loading States**: Skeleton loaders and loading indicators for better UX
- **CORS Proxy Support**: Built-in handling for CORS-restricted feeds
- **Customizable Display**: Configure posts per feed, refresh intervals, and more

## Technology Stack

- **HTML5**: Semantic markup with meta tags for SEO and social sharing
- **CSS3**: Modern responsive design with grid layout and animations
- **JavaScript (ES6+)**: Modular code using ES6 modules, async/await, and Promises
- **RSS Parser**: Client-side RSS/Atom feed parsing
- **http-server**: Development server with CORS support

## Project Structure

```
personal-blog-with-feed-integration/
├── index.html              # Main HTML entry point
├── app.js                  # Application orchestration and initialization
├── config.js               # Configuration for feeds, metadata, and settings
├── styles.css              # Responsive CSS styling
├── kennys_feed.json        # Personal blog posts (JSON format)
├── package.json            # Project dependencies and scripts
├── components/
│   └── feedDisplay.js      # UI components for rendering feed items
└── utils/
    └── feedParser.js       # RSS feed parsing utilities
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd personal-blog-with-feed-integration
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:8080
```

## Feed Configuration

### Adding RSS Feeds

Edit `config.js` to add or modify RSS feeds:

```javascript
export const FEED_URLS = {
  openai: 'https://openai.com/blog/rss.xml',
  anthropic: 'https://www.anthropic.com/news/rss.xml',
  deepmind: 'https://deepmind.google/blog/rss.xml',
  arxiv_ai: 'http://export.arxiv.org/rss/cs.AI',
  huggingface: 'https://huggingface.co/blog/feed.xml'
};
```

**Important Notes:**
- Each feed must have a unique key (e.g., `openai`, `anthropic`)
- URLs should point to valid RSS or Atom feeds
- Some feeds may require CORS proxy configuration (see Troubleshooting)

### Configuring Personal Posts

Edit `kennys_feed.json` to add your personal blog posts:

```json
[
  {
    "title": "My First Post",
    "link": "https://yourblog.com/my-first-post",
    "pubDate": "2026-03-13T12:00:00Z",
    "description": "This is my first blog post about...",
    "content": "Full post content here..."
  }
]
```

**Required Fields:**
- `title`: Post title (string)
- `link`: URL to the full post (string)
- `pubDate`: Publication date in ISO 8601 format (string)
- `description`: Short description or excerpt (string)

**Optional Fields:**
- `content`: Full post content (string)
- `author`: Author name (defaults to "Kenny")

### Display Settings

Customize the display behavior in `config.js`:

```javascript
export const DISPLAY_SETTINGS = {
  postsPerFeed: 5,              // Number of posts to show per feed
  refreshInterval: 300000,       // Auto-refresh interval in ms (5 minutes)
  dateFormat: 'MMMM DD, YYYY',  // Date display format
  maxDescriptionLength: 250,     // Maximum characters in description
  enableAnimations: true,        // Enable/disable CSS animations
  defaultView: 'grid'            // Layout mode: 'grid' or 'list'
};
```

### Blog Metadata

Update your blog information in `config.js`:

```javascript
export const BLOG_METADATA = {
  title: 'Personal Blog - AI & LLM Insights',
  description: 'A curated collection of thoughts on AI, Large Language Models, and cutting-edge research',
  author: 'Kenny',
  tagline: 'Exploring the frontier of artificial intelligence'
};
```

### Social Links

Configure social media links in `config.js`:

```javascript
export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/',
  github: 'https://github.com/',
  linkedin: 'https://linkedin.com/in/',
  email: 'mailto:contact@example.com'
};
```

## Local Development Workflow

### Development Server

The project uses `http-server` for local development:

```bash
npm start
```

This starts a server on `http://localhost:8080` with the following features:
- Automatic CORS headers for local development
- Hot reload (refresh browser to see changes)
- Serves static files from the project root

### Making Changes

1. **HTML Changes**: Edit `index.html` and refresh the browser
2. **CSS Changes**: Edit `styles.css` and refresh the browser
3. **JavaScript Changes**: Edit `.js` files and refresh the browser (hard refresh may be needed: Ctrl+Shift+R or Cmd+Shift+R)
4. **Configuration**: Edit `config.js` for feed URLs and settings
5. **Personal Posts**: Edit `kennys_feed.json` to add/modify personal content

### Testing Feed Changes

After modifying feed URLs in `config.js`:

1. Save the file
2. Refresh the browser (hard refresh recommended)
3. Open browser console (F12) to see feed loading logs
4. Check for any CORS errors or failed requests

### Browser Console Logging

The application provides detailed console logging:

- `[App]`: Application-level events and initialization
- `[FeedParser]`: Feed parsing operations and errors
- `[FeedDisplay]`: UI rendering and component creation

Enable verbose logging by opening the browser console (F12).

## GitHub Pages Deployment

### Quick Deploy

1. Ensure all files are committed:
```bash
git add .
git commit -m "Update blog content"
```

2. Push to GitHub:
```bash
git push origin main
```

3. Enable GitHub Pages:
   - Go to repository Settings > Pages
   - Select "Deploy from a branch"
   - Choose `main` branch and `/ (root)` folder
   - Click Save

4. Your site will be available at:
```
https://<username>.github.io/<repository-name>/
```

### Deployment Notes

**CORS Considerations:**
- GitHub Pages serves static content over HTTPS
- Some RSS feeds may not work due to CORS restrictions
- Consider using a CORS proxy service for restricted feeds (see Troubleshooting)

**Custom Domain:**
To use a custom domain:
1. Add a `CNAME` file with your domain name
2. Configure DNS records at your domain registrar
3. Enable HTTPS in GitHub Pages settings

**Build Process:**
- No build step required - deploy source files directly
- All processing happens client-side in the browser
- Ensure `package.json` dependencies are for development only

**Cache Considerations:**
- Browsers may cache JavaScript modules
- Users may need to hard refresh (Ctrl+Shift+R) after updates
- Consider adding cache-busting query parameters for production

## Troubleshooting

### CORS Issues

**Problem:** "CORS policy: No 'Access-Control-Allow-Origin' header" errors

**Solutions:**

1. **Development (http-server):**
   - The included `http-server` adds CORS headers automatically
   - Ensure you're accessing via `http://localhost:8080` (not `file://`)

2. **Production (GitHub Pages):**
   - Use CORS-enabled feeds (check feed documentation)
   - Use a CORS proxy service:
     ```javascript
     // In config.js
     const CORS_PROXY = 'https://corsproxy.io/?';

     export const FEED_URLS = {
       openai: CORS_PROXY + 'https://openai.com/blog/rss.xml',
       // ...
     };
     ```

3. **Alternative Feeds:**
   - Some sites offer CORS-enabled endpoints
   - Check the site's API documentation for alternatives

### Feeds Not Loading

**Problem:** Feeds fail to load or display "No feed items available"

**Diagnosis:**
1. Open browser console (F12)
2. Look for error messages with `[FeedParser]` prefix
3. Check Network tab for failed requests

**Solutions:**

1. **Invalid Feed URL:**
   - Verify the URL in a browser
   - Ensure it returns valid RSS/Atom XML

2. **Network Issues:**
   - Check internet connection
   - Try accessing the feed URL directly

3. **Feed Format:**
   - Ensure feed is valid RSS 2.0 or Atom format
   - Some feeds may have custom formats not supported by rss-parser

4. **Rate Limiting:**
   - Some feeds limit requests per IP
   - Reduce `refreshInterval` in `config.js`

### Personal Feed Not Showing

**Problem:** Posts from `kennys_feed.json` don't appear

**Solutions:**

1. **JSON Syntax Error:**
   - Validate JSON at https://jsonlint.com
   - Common errors: missing commas, trailing commas, unescaped quotes

2. **Invalid Date Format:**
   - Use ISO 8601 format: `2026-03-13T12:00:00Z`
   - Or JavaScript Date-parseable strings

3. **File Path:**
   - Ensure `kennys_feed.json` is in the project root
   - Check file name spelling (case-sensitive on some systems)

### Styling Issues

**Problem:** Layout broken or CSS not loading

**Solutions:**

1. **Cache Issues:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear browser cache

2. **File Path:**
   - Ensure `styles.css` is in project root
   - Check `<link>` tag in `index.html`

3. **CSS Syntax:**
   - Validate CSS for syntax errors
   - Check browser console for CSS loading errors

### Module Loading Errors

**Problem:** "Failed to resolve module specifier" or similar errors

**Solutions:**

1. **File Extensions:**
   - Ensure all imports include `.js` extension
   - Example: `import { parseFeed } from './utils/feedParser.js'`

2. **Relative Paths:**
   - Use correct relative paths (`./` for same directory, `../` for parent)
   - Check capitalization (case-sensitive)

3. **Server Setup:**
   - Must serve via HTTP server (not `file://` protocol)
   - Use `npm start` for local development

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow existing code style** and conventions
3. **Test thoroughly** before submitting
4. **Document changes** in code comments and README if needed
5. **Keep commits focused** - one feature/fix per commit
6. **Write clear commit messages** describing the change

### Code Style Guidelines

- Use ES6+ features (const/let, arrow functions, async/await)
- Follow existing naming conventions (camelCase for functions/variables)
- Add JSDoc comments for functions
- Include error handling for all async operations
- Log important operations with descriptive messages

### Submitting Changes

1. Create a pull request with a clear description
2. Reference any related issues
3. Ensure all existing functionality still works
4. Test on multiple browsers if changing UI/CSS

## License

ISC

## Author

Kenny

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the Troubleshooting section above
- Review browser console logs for detailed error information
