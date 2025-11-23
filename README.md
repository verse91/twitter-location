<!-- <div align="center" >
  <img src="https://github.com/user-attachments/assets/f9d8f931-28c9-4d29-8e3e-4960bf4ffa71" width="50%">
</div> -->


<div align="center">
  <h1>Twitter Location Extension</h1>
</div>

<div align="center" >
  <b>A browser extension that displays country flags and location information next to Twitter's username when you hover over them.</b>
</div>

<br>

<div align="center">

  [![Twitter](https://img.shields.io/badge/JustTheVerse-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/justtheverse)
  [![Chrome](https://img.shields.io/badge/Google%20Chrome-4285F4?style=for-the-badge&logo=GoogleChrome&logoColor=white)](https://developer.chrome.com/docs/extensions)
  [![Firefox](https://img.shields.io/badge/Firefox-FF7139?style=for-the-badge&logo=Firefox-Browser&logoColor=white)](https://addons.mozilla.org/en-US/developers/)

</div>

<div align="center">

  [![License: 0BSD](https://img.shields.io/badge/License-0BSD-blue?style=for-the-badge&logo=github&logoColor=white)](./LICENSE.md)
  [![Status](https://img.shields.io/badge/status-beta-yellow?style=for-the-badge&logo=github&logoColor=white)]()
  [![Documentation](https://img.shields.io/badge/docs-available-brightgreen?style=for-the-badge&logo=github&logoColor=white)]()
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge&logo=github&logoColor=white)](./CONTRIBUTING.md)

</div>
<div align="center">
  <table>
	  <td width="50%"><img height="1024" alt="image" src="https://github.com/user-attachments/assets/b8a79b57-e835-45d6-9af8-67368692885d"/></td>
    <td width="50%"><img height="449" alt="image" src="https://github.com/user-attachments/assets/8c40e6d5-48a0-48f2-ad47-b58bd6f88e27" /></td>
  </table>
  <br>
  <i>You can hover profile picture or display name to show</i>
</div>

---

> [!WARNING]
> Please do not test on many profiles, you can cause rate limiting  
> READ CAREFULLY BEFORE USING

> [!IMPORTANT]
> On first run or reload, please hover on the display name or avatar first  
> Then hover on the username on the hover card to let the extension to work
> I still can't solve this problem

<img width="1280" height="640" alt="image" src="https://github.com/user-attachments/assets/1a7e4600-b9f0-4208-9d75-5583bbe865a4" />

<div align="center" >
  <i>Built with <a href="https://wxt.dev/">WXT</a> framework and <a href="https://react.dev/">React</a>.</i>
</div>


---

## Features

- **Country Flags**: Automatically displays country flags next to usernames in hover cards
- **Location Display**: Shows the full country/region name alongside the flag (e.g., "🇺🇸 United States")
- **Smart Caching**: Caches location data for 30 days to minimize API calls
- **Hover Detection**: Works on both username links and avatars
- **Real-time Updates**: Automatically updates when new tweets load
- **Settings**: Toggle extension on/off and view cached locations

## How It Works

### Architecture Overview

The extension consists of several key components:

1. **Content Script** (`entrypoints/content.ts`): Main orchestrator that manages DOM interactions and coordinates other modules
2. **Page Script** (`public/page.js`): Injected into the page context to intercept Twitter API requests and capture authentication headers
3. **Popup UI** (`entrypoints/popup/`): React-based popup interface for settings and cache management
4. **Utility Modules** (`utils/`): Modular code for cache, API requests, DOM utilities, flag insertion, and event handling

### Workflow

1. **Header Capture**: The page script intercepts Twitter's GraphQL API requests to capture authentication headers (authorization tokens, CSRF tokens, etc.)

2. **Hover Detection**: When you hover over a username or avatar:
   - The content script detects the hover event
   - It extracts the username from the DOM element
   - Checks if location data exists in cache

3. **Location Fetching**:
   - If cached: Displays flag immediately
   - If not cached: Makes a GraphQL API request to Twitter's internal API (`UserByScreenName` query)
   - Extracts location from `account_based_in` field
   - Caches the result for 30 days

4. **Flag Display**:
   - Waits for Twitter's hover card popup to appear
   - Finds the username span within the popup
   - Inserts the flag and country name next to the username
   - Uses MutationObserver to re-insert flag if Twitter re-renders the popup

5. **Rate Limiting**: Implements a request queue with:
   - Minimum 2-second interval between requests
   - Maximum 2 concurrent requests
   - Automatic rate limit detection and handling

### Key Components

- **`utils/cache.ts`**: Manages persistent storage of location data using `browser.storage.local`
- **`utils/api.ts`**: Handles API request queue, rate limiting, and communication with page script
- **`utils/dom-utils.ts`**: DOM manipulation utilities (username extraction, popup finding)
- **`utils/flag-insertion.ts`**: Logic for inserting flags into hover cards
- **`utils/hover-handlers.ts`**: Event handlers for hover events on usernames and avatars
- **`utils/event-listeners.ts`**: Sets up event listeners on Twitter's dynamic DOM
- **`utils/country.ts`**: Maps country/region names to flag emojis

## Installation

### Prerequisites

- Node.js 18+ (or Bun)
- npm, yarn, pnpm, or bun package manager

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/verse91/twitter-location.git
   cd twitter-location
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

3. **Run in development mode**:
   ```bash
   bun run dev
   # or for Firefox
   bun run dev-f
   ```

   This will:
   - Build the extension in watch mode
   - Output to `.output/chrome-mv3` (or `.output/firefox-mv2`)
   - Automatically rebuild on file changes

4. **Load the extension**:
   - **Chrome/Edge**: Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", select the `.output/chrome-mv3` folder
   - **Firefox**: Go to `about:debugging`, click "This Firefox", click "Load Temporary Add-on", select the `.output/firefox-mv2/manifest.json` file

## Building

### Production Build

Build the extension for production:

```bash
bun run build
# or for Firefox
bun run build:firefox
```

The built extension will be in `.output/chrome-mv3` or `.output/firefox-mv2`.

### Create Distribution Package

Create a ZIP file for distribution:

```bash
bun run zip
# or for Firefox
bun run zip:firefox
```

The ZIP file will be created in the `.output` directory.

### Type Checking

Check TypeScript types without building:

```bash
bun run compile
```

## Project Structure

```
twitter-location/
├── entrypoints/
│   ├── background.ts          # Background script (if needed)
│   ├── content.ts             # Main content script orchestrator
│   ├── popup/                 # Popup UI
│   │   ├── App.tsx            # React popup component
│   │   ├── main.tsx           # Popup entry point
│   │   └── style.css          # Popup styles
│   └── options/               # Options page (if needed)
├── utils/                     # Utility modules
│   ├── cache.ts               # Cache management
│   ├── api.ts                 # API request handling
│   ├── dom-utils.ts           # DOM utilities
│   ├── flag-insertion.ts      # Flag insertion logic
│   ├── hover-handlers.ts      # Hover event handlers
│   ├── event-listeners.ts     # Event listener setup
│   └── country.ts             # Country/flag mapping
├── public/
│   └── page.js                # Page script (injected into page context)
├── wxt.config.ts              # WXT configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## How It Works (Technical Details)

### Page Script Injection

The page script (`public/page.js`) is injected into the page context (not content script context) to bypass the Same-Origin Policy. This allows it to:

- Intercept `fetch` and `XMLHttpRequest` calls
- Capture Twitter API headers from authenticated requests
- Make GraphQL API calls using captured credentials

### Cross-Context Communication

Communication between content script and page script uses `window.postMessage`:

- Content script sends: `{ type: '__fetchLocation', screenName, requestId }`
- Page script responds: `{ type: '__locationResponse', screenName, location, requestId }`

### DOM Detection

The extension uses MutationObserver to detect:

- New tweets being added to the timeline
- Hover card popups appearing
- Dynamic content updates

### Flag Insertion Strategy

1. Wait for hover card popup to appear
2. Find the username span (`@username`) within the popup
3. Insert flag element after the username span
4. Use MutationObserver to re-insert if Twitter re-renders content
5. Only insert into hover cards (not profile pages) by checking for `hoverCardParent`

## Configuration

### Cache Settings

- Cache expiry: 30 days (configurable in `utils/cache.ts`)
- Cache key: `twitter_location_cache`

### Rate Limiting

- Minimum request interval: 2 seconds
- Max concurrent requests: 2
- Configurable in `utils/api.ts`

## Troubleshooting

### Flag Not Appearing

1. Check browser console for errors
2. Verify extension is enabled in popup
3. Clear cache and try again
4. Check if user has location set in their Twitter profile

### Rate Limiting

If you see rate limit errors:
- The extension automatically handles rate limits
- Wait for the reset time indicated
- Cached locations will still work

### Build Issues

- Ensure Node.js 18+ is installed
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Run `npm run compile` to check for TypeScript errors

## Browser Compatibility

- Chromium based browsers (Manifest V3)
- Firefox based browsers (Manifest V2)

## License

This project is freely licensed under the [0BSD License](LICENSE). You may copy it or modify it or anything else you want.

## Contributing

Please follow our [Contributing](.github/CONTRIBUTING.md) when you make a pull request.
