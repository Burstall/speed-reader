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
- **Bookmarklet**: One-click article saving from any website

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

To read paywalled articles from services like Substack, FT, or The Spectator:

1. Expand **"Premium Access"** in the sidebar
2. Click **"Connect"** next to the service you subscribe to
3. Click **"Open [Service] Login"** and log in to your account in the new tab
4. **Desktop**: Drag the "Capture [Service]" bookmarklet to your bookmarks bar, then click it while logged in
5. **Mobile**: Use the manual cookie entry option (requires copying cookie from browser settings)
6. Once connected, articles from that service will automatically use your credentials

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
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication
│   │   ├── fetch/article/ # Article fetching
│   │   ├── parse/pdf/     # PDF parsing
│   │   └── save/          # Article saving
│   ├── auth/receive/      # Cookie capture handler
│   ├── login/             # Login page
│   └── share/             # PWA share target
├── components/
│   ├── reader/            # RSVP reader components
│   └── sidebar/           # Sidebar components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication helpers
│   ├── offlineStore.ts   # IndexedDB operations
│   └── orp.ts            # ORP algorithm
├── store/                 # Zustand stores
│   ├── authStore.ts      # Premium service credentials
│   ├── historyStore.ts   # Reading history
│   └── readerStore.ts    # Reader state
└── middleware.ts          # Auth middleware
```

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
