# Speed Reader

A personal RSVP (Rapid Serial Visual Presentation) speed reading web app using the ORP (Optimal Recognition Point) focal letter technique. Read at speeds from 150-1200 WPM with a highlighted focal letter for optimal word recognition.

## Features

### Core Reading
- **RSVP Display**: One word at a time with customizable speed (150-1200 WPM)
- **ORP Focal Letter**: Highlighted letter at the optimal recognition point for faster processing
- **Launch Mode**: 3-2-1 countdown followed by gradual speed ramp from 150 WPM to your target
- **Smart Pausing**: Automatic micro-pauses at punctuation for natural reading flow
- **Progress Tracking**: Resume reading from where you left off

### Content Import
- **Text Paste**: Direct text input
- **PDF Upload**: Drag-and-drop PDF support
- **URL Fetch**: Import articles from any website
- **Premium Services**: Authenticated access to Substack, Financial Times, The Spectator, The Economist, NY Times, and Wall Street Journal

### Offline & PWA
- **Offline Reading List**: Save articles to IndexedDB for offline access
- **PWA Installable**: Add to home screen on mobile devices
- **Share Target**: Share articles directly from your browser to Speed Reader
- **Cross-Device Sync**: QR code to transfer settings and credentials to mobile
- **Bookmarklet**: One-click article saving from any website
- **Chrome Extension**: Capture HttpOnly cookies for premium services

### User Experience
- **Keyboard Shortcuts**: Space (play/pause), Arrow keys (speed/skip), R (restart)
- **Touch Gestures**: Tap to play/pause, swipe to skip
- **Dark/Light/System Theme**: Automatic or manual theme switching
- **Focal Color Picker**: Customize the highlight color
- **Mobile Responsive**: Works on any device

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Burstall/speed-reader.git
cd speed-reader

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and set APP_PASSWORD

# Run development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
APP_PASSWORD=your-secure-password
```

### Deployment

The app is designed for Vercel deployment:

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Usage

### Basic Reading

1. **Login** with your configured password
2. **Add content** via one of three methods:
   - Paste text directly
   - Upload a PDF file
   - Enter an article URL
3. **Adjust speed** using the slider or arrow keys
4. **Press Space** or click Play to start reading
5. **Use Launch Mode** for a countdown and gradual speed ramp-up

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| Up Arrow | Increase speed |
| Down Arrow | Decrease speed |
| Left Arrow | Skip back 10 words |
| Right Arrow | Skip forward 10 words |
| R | Restart from beginning |

### Mobile Gestures

| Gesture | Action |
|---------|--------|
| Tap | Play / Pause |
| Swipe Left | Skip forward |
| Swipe Right | Skip back |

### Saving Articles for Offline Reading

#### Desktop (Bookmarklet)

1. Open Speed Reader and expand the **"Quick Save"** section in the sidebar
2. **Drag** the "Save to Speed Reader" button to your bookmarks bar
3. When on any article you want to save, **click the bookmarklet**
4. The article will be fetched, saved to your Reading List, and available offline

#### Mobile (Share Target)

1. **Install the PWA**: Visit Speed Reader in your mobile browser, tap the share/menu button, select "Add to Home Screen"
2. When reading an article in your browser, tap **Share**
3. Select **Speed Reader** from the share menu
4. The article will be saved to your Reading List

### Premium Service Access (Paywalled Content)

To read paywalled articles from services like Substack, FT, or The Spectator, you need to provide your session cookies. There are three methods:

#### Method 1: Chrome Extension (Recommended)

The extension can capture HttpOnly cookies that JavaScript bookmarklets cannot access.

1. **Install the extension** (see [Browser Extension Setup](#browser-extension-setup) below)
2. Go to the premium service site and **log in to your account**
3. Click the **Speed Reader extension icon** in your toolbar
4. Click **"Capture Cookies"**
5. Click **"Open Speed Reader"** - cookies are automatically imported

#### Method 2: Manual DevTools Entry

If you can't use the extension:

1. Go to the premium service site and **log in**
2. Open DevTools (`F12`) → **Application** tab → **Cookies**
3. Find the session cookie (e.g., `substack.sid` for Substack)
4. Copy the **Value** column
5. In Speed Reader, expand **Premium Access** → click **Connect** → paste the value

#### Method 3: Bookmarklet (Limited)

The bookmarklet only captures non-HttpOnly cookies. Most premium services use HttpOnly cookies for sessions, so this method may not work:

1. Expand **"Premium Access"** in the sidebar
2. Click **"Connect"** next to the service
3. Drag the bookmarklet to your bookmarks bar
4. Click it while logged in to the service

Once connected, articles from that service will automatically use your credentials.

### Cross-Device Sync

Transfer your settings and premium credentials from desktop to mobile:

1. On desktop, expand **"Sync to Mobile"** in the sidebar
2. **Scan the QR code** with your phone camera
3. On mobile, tap **"Import All Settings"**

This syncs your WPM, theme, focal color, and all premium service cookies.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand with persist middleware
- **Offline Storage**: IndexedDB
- **PDF Parsing**: pdf-parse
- **HTML Parsing**: Cheerio
- **Deployment**: Vercel

## Project Structure

```
├── extension/              # Chrome extension for cookie capture
│   ├── manifest.json      # Extension manifest (v3)
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Cookie capture logic
│   ├── generate-icons.html # Icon generator utility
│   └── icons/             # Extension icons (generated)
│
└── src/
    ├── app/                    # Next.js App Router pages
    │   ├── api/               # API routes
    │   │   ├── auth/          # Authentication
    │   │   ├── fetch/article/ # Article fetching
    │   │   ├── parse/pdf/     # PDF parsing
    │   │   └── save/          # Article saving
    │   ├── auth/receive/      # Cookie capture handler
    │   ├── login/             # Login page
    │   ├── share/             # PWA share target
    │   └── sync/              # Cross-device sync import
    ├── components/
    │   ├── reader/            # RSVP reader components
    │   └── sidebar/           # Sidebar components
    ├── hooks/                 # Custom React hooks
    ├── lib/                   # Utility libraries
    │   ├── auth.ts           # Authentication helpers
    │   ├── offlineStore.ts   # IndexedDB operations
    │   ├── orp.ts            # ORP algorithm
    │   └── sync.ts           # Cross-device sync encoding
    ├── store/                 # Zustand stores
    │   ├── authStore.ts      # Premium service credentials
    │   ├── historyStore.ts   # Reading history
    │   └── readerStore.ts    # Reader state
    └── middleware.ts          # Auth middleware
```

## Browser Extension Setup

The Chrome extension provides the most reliable way to capture premium service cookies, including HttpOnly cookies that bookmarklets cannot access.

### Installation

1. **Generate the icons:**
   ```bash
   # Open the icon generator in Chrome
   # File location: extension/generate-icons.html
   ```
   - Open `extension/generate-icons.html` in Chrome
   - Right-click each icon canvas → "Save image as..."
   - Save to `extension/icons/` as `icon16.png`, `icon48.png`, `icon128.png`

2. **Load the extension:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **"Developer mode"** (toggle in top-right corner)
   - Click **"Load unpacked"**
   - Select the `extension` folder from this repository

3. **Configure your app URL:**
   - Click the Speed Reader extension icon in your toolbar
   - Enter your deployed Speed Reader URL (e.g., `https://your-app.vercel.app`)
   - The URL is saved automatically for future use

### How It Works

The extension uses Chrome's `cookies` API to read all cookies for the current domain, including HttpOnly cookies that are inaccessible to JavaScript running on the page. When you click "Capture Cookies":

1. Extension reads all cookies for the current site
2. Formats them as a cookie header string
3. Opens your Speed Reader app with cookies in the URL
4. The `/auth/receive` page saves them to your local storage

### Supported Services

| Service | Domain | Session Cookie |
|---------|--------|----------------|
| Substack | *.substack.com | `substack.sid` |
| Financial Times | ft.com | `FTSession` |
| The Spectator | spectator.co.uk | `spectator_session` |
| The Economist | economist.com | `ec_session` |
| NY Times | nytimes.com | `NYT-S` |
| Wall Street Journal | wsj.com | `wsjregion` |

The extension also supports custom domains - if you're on a site not in this list, it will still capture cookies and let you use them.

### Privacy & Security

- Cookies are sent directly to YOUR Speed Reader instance via URL parameters
- No data is sent to any third-party servers
- Cookies are stored only in your browser's localStorage
- The extension only activates when you click it (no background tracking)

## Development

```bash
# Run development server
npm run dev

# Type check
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Security

- Password authentication with secure session tokens
- Credentials stored locally in browser (never sent to external servers)
- Premium service cookies stored in localStorage per-device
- All sensitive routes protected by middleware

## License

MIT

## Acknowledgments

- Inspired by [Selah](https://focus-reader-alpha.vercel.app/) and other RSVP readers
- ORP (Optimal Recognition Point) research for focal letter positioning
