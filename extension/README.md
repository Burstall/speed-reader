# Speed Reader Cookie Capture Extension

Chrome extension to easily capture premium service cookies for the Speed Reader app.

## Setup

### 1. Generate Icons

1. Open `generate-icons.html` in Chrome
2. Right-click each canvas and "Save image as..."
3. Save them to the `icons/` folder as:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

### 2. Install Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this `extension` folder

### 3. Configure

1. Click the extension icon in Chrome toolbar
2. Enter your Speed Reader URL (e.g., `https://your-app.vercel.app`)
3. The URL is saved automatically

## Usage

1. Go to a premium service site (Substack, FT, etc.)
2. **Log in to your account**
3. Click the Speed Reader extension icon
4. Click "Capture Cookies"
5. Click "Open Speed Reader"

The extension will open Speed Reader with your cookies automatically imported.

## Supported Services

- Substack (*.substack.com)
- Financial Times (ft.com)
- The Spectator (spectator.co.uk)
- The Economist (economist.com)
- NY Times (nytimes.com)
- Wall Street Journal (wsj.com)

## Privacy

- Cookies are sent directly to YOUR Speed Reader instance
- No data is sent to any third-party servers
- Cookies are stored only in your browser's local storage
