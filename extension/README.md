# SurfaceFlow AI Chrome Extension

The SurfaceFlow AI Chrome Extension is the trigger layer for the automation system. It runs inside the user's browser, detects context from Buildertrend, and allows users to trigger automations with a single click.

## Features

- **🏨 Hotel Booking Automation (AM-002)**: Book hotels for crew directly from Buildertrend job pages
- **Context Detection**: Automatically detects when you're on a Buildertrend job page
- **Data Extraction**: Extracts job details (address, dates, crew info) from the page
- **Multi-Source Search**: Searches across multiple OTAs (Airbnb, Expedia, Kayak, Booking.com, Hotels.com)
- **Internal Housing Priority**: Checks company internal housing first

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `extension` folder from this project

### Generate Icons (Required for Production)

The extension needs PNG icons. You can generate them from the SVG files:

```bash
# Using ImageMagick
convert assets/icons/icon-16.svg assets/icons/icon-16.png
convert assets/icons/icon-48.svg assets/icons/icon-48.png
convert assets/icons/icon-128.svg assets/icons/icon-128.png

# Or use any SVG to PNG converter
```

For development, you can also use `.svg` files by updating the manifest.

## Usage

1. Navigate to a Buildertrend job page (e.g., `https://buildertrend.net/app/JobPage/12345/1`)
2. You'll see a **"Book Hotel with AI"** button appear below the page header
3. Click the button to open the hotel search modal
4. The extension will automatically extract job details (address, dates)
5. Adjust search parameters if needed (check-in/out dates, crew size, max price)
6. Watch as it searches multiple sources (Internal Housing, Airbnb, Expedia, Kayak, etc.)
7. Select your preferred hotel option
8. Click "Request Approval" to send an SMS approval request to the Project Manager

## File Structure

```
extension/
├── manifest.json              # Extension configuration
├── background/
│   └── service-worker.js      # Background service worker
├── content/
│   ├── detector.js            # Page type detection
│   ├── extractor.js           # DOM data extraction
│   ├── ui.js                  # UI components & hotel search
│   ├── main.js                # Main entry point
│   └── styles.css             # Injected styles
├── popup/
│   ├── popup.html             # Extension popup
│   ├── popup.js               # Popup logic
│   └── popup.css              # Popup styles
└── assets/
    └── icons/                 # Extension icons
```

## Supported Pages

| Page Type | URL Pattern | Features |
|-----------|-------------|----------|
| Job Page | `/app/JobPage/{id}/*` | Hotel Booking button |
| Job Detail | `/app/Job/JobInfo.aspx?JobID=*` | Hotel Booking button |

## Mock Data

The extension currently uses mock data to demonstrate the hotel search functionality:

**OTA Sources Searched:**
- 🏠 Internal Housing (Company properties)
- 🏡 Airbnb
- ✈️ Expedia
- 🔍 Kayak
- 🏨 Booking.com
- ⭐ Hotels.com

**Mock Hotel Results:**
- Company Apartment A (Internal - FREE)
- Downtown Panama City Loft (Airbnb - $175/night)
- Hyatt Place Panama City (Expedia - $145/night)
- Holiday Inn Express (Kayak - $119/night)
- Courtyard by Marriott (Booking.com - $159/night)
- Hampton Inn Beach Resort (Hotels.com - $135/night)

## Development

### Testing on Buildertrend

1. Log in to your Buildertrend account
2. Navigate to any job page
3. The extension button should appear automatically

### Debugging

- Open Chrome DevTools on the Buildertrend page
- Check the Console for `[SurfaceFlow]` log messages
- For popup debugging, right-click the extension icon and select "Inspect popup"
- For service worker debugging, go to `chrome://extensions/`, find SurfaceFlow, and click "Service worker"

## Integration with Portal

The extension communicates with the SurfaceFlow Portal backend:
- **API Endpoint**: `http://localhost:8000/api/v1/`
- **Authentication**: JWT tokens stored in `chrome.storage.local`
- **Automation Trigger**: `POST /automations/AM-002/trigger`

## Coming Soon

- 📄 Document Generation (AM-003)
- 📋 Permit Submission (AM-004)
- More OTA integrations
- Real-time booking confirmation
