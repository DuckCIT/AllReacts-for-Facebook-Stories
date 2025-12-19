# Changelog

## v2.0.1
- Fixed Facebook Stories reaction after Facebook updated GraphQL.
- Updated request parameters and required headers/tokens for `useStoriesSendReplyMutation`.
- Improved reliability (prevents immediate 429 rate-limit when reacting via extension).
- Faster multi-react by reducing the minimum interval between reactions.

## v2.0.0 🎉 Major Release
### ✨ New Features
- **Emoji Categories**: Organized emojis into 9 categories (Recent, Smileys & People, Animals & Nature, Food & Drink, Activity, Travel & Places, Objects, Symbols, Flags)
- **Category Tabs**: Quick navigation with icon tabs at the bottom of the emoji picker
- **Search Functionality**: Search emojis by name with debounce optimization (300ms delay)
- **Recent Emojis**: Automatically saves up to 30 recently used emojis
- **Empty State UI**: Beautiful placeholder when no recent emojis exist
- **Update Badge**: Red notification badge on the react button when updates are available

### 🚀 Performance Improvements
- **Debounced Search**: Prevents lag while typing in search box
- **Limited Search Results**: Shows max 100 results to avoid performance issues
- **Lazy Loading**: Images load only when visible in viewport

### 🌍 Internationalization
- All UI text converted to English for global users
- Support for all Facebook domains (`*://*.facebook.com/*`)

### 🎨 UI/UX Improvements
- Smooth animations for category tab switching
- Fixed menu height (320px) during search
- Search icon in search bar
- Creator credit in popup footer
- Improved update notification system in popup

### 📦 Data Structure
- New JSON format with categories and emoji names
- Expanded emoji library (~1800+ emojis)
- Added `name` field for better search accuracy

### 🔧 Bug Fixes
- Fixed search icon not visible
- Fixed menu height changing during search
- Improved Recent emoji ordering (most recent first)

---

## v1.0.9
- Applied Facebook's native class styles to emoji list items for consistent UI.
- Added support for loading `emoji.json` and `facebook.json` from GitHub with local file fallback for easier updates.

## v1.0.8
- Fixed bug (Facebook changed class name)

## v1.0.7
- Optimized performance by removing hover-to-animate effect on emojis.
- Emojis are now static images consistent with Facebook's style.
- Faster UI loading.

## v1.0.6
- Support for Firefox.
- Improved method for adding button more accurately.
- Enhanced UI and interactions.
- Fixed CSP error.
- Improved performance.

## v1.0.5
- Improved emoji loading performance.
- Fixed bugs related to emoji reactions.
- Enhanced UI for better user experience.

## v1.0.4
- Update UI

## v1.0.3
- Added new emojis.

## v1.0.2
- Added new emojis.
- Removed invalid request emojis.

## v1.0.1
- Refreshed the user interface.
- Updated emojis to animated versions.
- Optimized the source code.
