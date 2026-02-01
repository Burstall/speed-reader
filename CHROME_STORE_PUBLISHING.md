# Publishing to the Chrome Web Store

## What you already have

- `manifest.json` with Manifest V3 (required)
- Icons at 16, 48, 128px (required)
- All extension code (`popup.html`, `popup.js`)

## What you still need to create

### 1. Screenshots (required, at least 1)
- Size: **1280x800** or **640x400** pixels
- Show the extension popup in action (the 3 states)
- Easiest method: open the extension popup on an article page, take a screenshot, crop/resize to 1280x800 in Paint or any image editor
- You can submit up to 5

### 2. A short promo tile (optional but recommended)
- Size: **440x280** pixels
- A simple branded graphic — your icon + "Speed Reader" text on a background

---

## Step-by-step

### Step 1: Create a developer account

1. Go to https://chrome.google.com/webstore/devconsole
2. Sign in with your Google account
3. Pay the one-time **$5 registration fee**
4. Accept the developer agreement

### Step 2: Create the ZIP file

Run the packaging script (excludes screenshots, promo images, and dev files):

```bash
node extension/package.js
```

This creates `speed-reader-extension.zip` in the repo root.

### Step 3: Upload to Chrome Web Store

1. In the Developer Dashboard, click **"New Item"**
2. Upload `speed-reader-extension.zip`
3. Fill in the store listing:

| Field | Value |
|-------|-------|
| **Name** | Speed Reader |
| **Summary** | Send articles to Speed Reader with one click. Captures premium site cookies for paywalled content. |
| **Category** | Productivity |
| **Language** | English |

For the **Description**:

> Speed Reader companion extension. Send any article to your Speed Reader app for RSVP (Rapid Serial Visual Presentation) reading at 150-1200 WPM.
>
> Features:
> - One-click to send any article to Speed Reader
> - Auto-detects premium sites (Financial Times, Substack, The Spectator, Economist, NY Times, WSJ)
> - Captures login cookies so you can read paywalled articles
> - First-time setup: just visit your Speed Reader app and click the extension
>
> Requires a running Speed Reader instance.

4. Upload your **screenshot(s)** (1280x800)
5. Upload the **128px icon** (it should auto-pull from the ZIP, but the dashboard may ask again)

### Step 4: Privacy & permissions justification

The dashboard will ask you to justify each permission:

| Permission | Justification |
|------------|--------------|
| **cookies** | Captures login cookies from premium news sites so users can read paywalled articles in Speed Reader |
| **activeTab** | Reads the current tab URL to send the article to Speed Reader |
| **tabs** | Accesses the current tab's URL and title to detect if the user is on their Speed Reader app |
| **storage** | Saves the user's Speed Reader app URL as a persistent setting |
| **scripting** | Uses chrome.scripting.executeScript to extract article text from the current page's DOM so it can be sent to Speed Reader for RSVP display. The script runs only when the user clicks the extension button, reads the page's article content (title and body text), and returns it to the extension popup. No page content is modified. |
| **host_permissions** | Reads cookies from supported premium sites (FT, Substack, Spectator, Economist, NYT, WSJ) and extracts article text from any page to enable paywalled article access and one-click reading |

For **"Does your extension use remote code?"**, select **No**. All JavaScript is bundled in the extension package. The `chrome.scripting.executeScript` call uses an inline function, not a remotely-hosted script.

For the **Privacy Policy URL**, enter:
```
https://github.com/Burstall/speed-reader/blob/main/PRIVACY_POLICY.md
```

### Step 5: Distribution

- Choose **"Public"** if you want anyone to find and install it
- Choose **"Unlisted"** if you want a direct link only (not searchable) — good for friends/family

### Step 6: Submit for review

Click **"Submit for Review"**. Google reviews typically take **1-3 business days** for simple extensions. Since this has no background scripts, no content scripts, and no remote code loading, it should pass without issues.

---

## After approval

Users install with one click from the store page. The URL will be something like:
`https://chrome.google.com/webstore/detail/speed-reader/<extension-id>`

Share that link directly.

## Updating later

When you change the extension code:

1. Bump `version` in `manifest.json` (e.g., `"1.1.1"`)
2. Create a new ZIP
3. Go to the developer dashboard, click your extension, upload the new ZIP
4. Submit for review again (updates are usually reviewed faster)
