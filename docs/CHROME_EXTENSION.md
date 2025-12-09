# SurfaceFlow AI System – Chrome Extension Documentation

**Version:** 1.0  
**Date:** December 9, 2025  
**Status:** Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [Supported Browsers](#2-supported-browsers)
3. [Extension Architecture](#3-extension-architecture)
4. [Manifest V3 Configuration](#4-manifest-v3-configuration)
5. [Component Structure](#5-component-structure)
6. [Context Detection](#6-context-detection)
7. [UI Injection](#7-ui-injection)
8. [Authentication Flow](#8-authentication-flow)
9. [API Communication](#9-api-communication)
10. [Data Capture Patterns](#10-data-capture-patterns)
11. [User Feedback & Notifications](#11-user-feedback--notifications)
12. [Security Considerations](#12-security-considerations)
13. [Development & Debugging](#13-development--debugging)
14. [Deployment & Distribution](#14-deployment--distribution)

---

## 1. Overview

The SurfaceFlow AI Chrome Extension is the **trigger layer** of the automation system. It runs inside the user's browser, detects context from supported web applications (starting with Buildertrend), and allows users to trigger automations with a single click.

### Key Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Context Detection** | Identify which web application and page type the user is on |
| **Data Capture** | Extract relevant data from the page (job ID, address, dates, etc.) |
| **UI Injection** | Add automation buttons and panels to supported pages |
| **Authentication** | Manage user login and JWT tokens |
| **API Communication** | Send automation requests to FastAPI backend |
| **User Feedback** | Display progress, success, and error notifications |

---

## 2. Supported Browsers

| Browser | Version | Status |
|---------|---------|--------|
| Google Chrome | Latest 2 major versions | ✅ Primary |
| Microsoft Edge | Latest 2 major versions (Chromium) | ✅ Supported |
| Firefox | — | ❌ Not supported (future consideration) |

---

## 3. Extension Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CHROME EXTENSION                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    BACKGROUND SERVICE WORKER                    │    │
│  │  - Authentication state management                              │    │
│  │  - API communication layer                                      │    │
│  │  - Token refresh logic                                          │    │
│  │  - Cross-tab state synchronization                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              ▲                                          │
│                              │ chrome.runtime.sendMessage               │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      CONTENT SCRIPTS                            │    │
│  │  - Page context detection                                       │    │
│  │  - DOM data extraction                                          │    │
│  │  - UI injection (buttons, panels)                               │    │
│  │  - User interaction handling                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              ▲                                          │
│                              │ User clicks extension icon               │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         POPUP UI                                │    │
│  │  - Login/logout interface                                       │    │
│  │  - Quick status overview                                        │    │
│  │  - Settings access                                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      CHROME STORAGE                             │    │
│  │  - JWT tokens (encrypted)                                       │    │
│  │  - User preferences                                             │    │
│  │  - Cached module registry                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
                    ┌─────────────────┐
                    │  FastAPI Backend │
                    └─────────────────┘
```

---

## 4. Manifest V3 Configuration

### 4.1 manifest.json

```json
{
  "manifest_version": 3,
  "name": "SurfaceFlow AI",
  "description": "Trigger automations directly from Buildertrend and other web apps",
  "version": "1.0.0",
  
  "permissions": [
    "storage",
    "activeTab",
    "notifications"
  ],
  
  "host_permissions": [
    "https://*.buildertrend.com/*",
    "https://api.surfaceflow.ai/*"
  ],
  
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  
  "content_scripts": [
    {
      "matches": ["https://*.buildertrend.com/*"],
      "js": [
        "content/detector.js",
        "content/extractor.js",
        "content/injector.js"
      ],
      "css": ["content/styles.css"],
      "run_at": "document_idle"
    }
  ],
  
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "assets/icons/icon-16.png",
      "48": "assets/icons/icon-48.png",
      "128": "assets/icons/icon-128.png"
    }
  },
  
  "icons": {
    "16": "assets/icons/icon-16.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  },
  
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 4.2 Permissions Explanation

| Permission | Reason |
|------------|--------|
| `storage` | Store JWT tokens and user preferences |
| `activeTab` | Access current tab for context detection |
| `notifications` | Show automation status notifications |
| `host_permissions` | Access Buildertrend pages and API backend |

---

## 5. Component Structure

### 5.1 Folder Structure

```
extension/
├── manifest.json
├── background/
│   ├── service-worker.js      # Main background script
│   ├── api-client.js          # API communication
│   ├── auth-manager.js        # Token management
│   └── state-manager.js       # Cross-tab state
├── content/
│   ├── detector.js            # Page type detection
│   ├── extractor.js           # Data extraction from DOM
│   ├── injector.js            # UI injection
│   ├── styles.css             # Injected UI styles
│   └── modules/
│       └── buildertrend/
│           ├── detector.js    # BT-specific detection
│           ├── extractor.js   # BT-specific extraction
│           └── ui.js          # BT-specific UI
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── shared/
│   ├── constants.js           # Shared constants
│   ├── utils.js               # Utility functions
│   └── schemas.js             # Data validation schemas
└── assets/
    ├── icons/
    │   ├── icon-16.png
    │   ├── icon-48.png
    │   └── icon-128.png
    └── images/
```

### 5.2 Component Responsibilities

| Component | File(s) | Responsibility |
|-----------|---------|----------------|
| **Service Worker** | `background/service-worker.js` | Central coordinator, handles messages |
| **API Client** | `background/api-client.js` | All HTTP requests to backend |
| **Auth Manager** | `background/auth-manager.js` | Login, logout, token refresh |
| **Detector** | `content/detector.js` | Detect page type and application |
| **Extractor** | `content/extractor.js` | Extract data from DOM |
| **Injector** | `content/injector.js` | Inject UI elements into page |
| **Popup** | `popup/*` | Extension popup interface |

---

## 6. Context Detection

### 6.1 Detection Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Page Loads     │────▶│  Detector       │────▶│  Context Object │
│  (Buildertrend) │     │  Analyzes URL   │     │  Created        │
└─────────────────┘     │  + DOM          │     └────────┬────────┘
                        └─────────────────┘              │
                                                         ▼
                                              ┌─────────────────┐
                                              │  UI Injection   │
                                              │  Based on Page  │
                                              └─────────────────┘
```

### 6.2 Supported Page Types (Buildertrend)

| Page Type | URL Pattern | Available Data |
|-----------|-------------|----------------|
| `job_detail` | `/app/Job/JobInfo.aspx?JobID=*` | Job ID, Name, Address, Crew |
| `job_list` | `/app/Job/JobList.aspx` | List of jobs |
| `todo_list` | `/app/ToDo/ToDoList.aspx` | To-Do items |
| `todo_detail` | `/app/ToDo/ToDoItem.aspx?*` | To-Do details |
| `daily_log` | `/app/DailyLog/*` | Daily log entries |
| `schedule` | `/app/Schedule/*` | Schedule data |

### 6.3 Context Object Schema

```javascript
const PageContext = {
  // Application info
  application: "buildertrend",  // Detected application
  pageType: "job_detail",       // Current page type
  url: "https://...",           // Current URL
  
  // Extracted data (varies by page type)
  data: {
    jobId: "12345",
    jobName: "Smith Residence Remodel",
    jobNumber: "2025-001",
    address: {
      street: "123 Main St",
      city: "Phoenix",
      state: "AZ",
      zip: "85001"
    },
    crew: {
      size: 4,
      members: ["John Doe", "Jane Smith"]
    },
    dates: {
      startDate: "2025-01-10",
      endDate: "2025-01-15"
    }
  },
  
  // Detection metadata
  meta: {
    detectedAt: "2025-12-09T10:30:00Z",
    confidence: 0.95,
    extractionMethod: "dom"  // "dom" or "api"
  }
};
```

### 6.4 Detection Implementation

```javascript
// content/modules/buildertrend/detector.js

const BuildertrendDetector = {
  // Host patterns to match
  hostPatterns: [
    /.*\.buildertrend\.com$/,
    /.*\.buildertrend\.net$/
  ],
  
  // Page type detection rules
  pageRules: [
    {
      type: 'job_detail',
      urlPattern: /\/app\/Job\/JobInfo\.aspx\?JobID=(\d+)/,
      domValidator: () => document.querySelector('#jobInfoContainer') !== null
    },
    {
      type: 'todo_list',
      urlPattern: /\/app\/ToDo\/ToDoList\.aspx/,
      domValidator: () => document.querySelector('.todo-list-container') !== null
    },
    // ... more rules
  ],
  
  detect() {
    const url = window.location.href;
    const host = window.location.hostname;
    
    // Check if on Buildertrend
    const isBuildertrend = this.hostPatterns.some(p => p.test(host));
    if (!isBuildertrend) return null;
    
    // Detect page type
    for (const rule of this.pageRules) {
      const urlMatch = url.match(rule.urlPattern);
      if (urlMatch && rule.domValidator()) {
        return {
          application: 'buildertrend',
          pageType: rule.type,
          urlMatches: urlMatch,
          url: url
        };
      }
    }
    
    return {
      application: 'buildertrend',
      pageType: 'unknown',
      url: url
    };
  }
};
```

---

## 7. UI Injection

### 7.1 Injection Strategy

The extension injects UI elements without breaking native Buildertrend functionality:

1. **Idempotent Injection**: Check if elements already exist before adding
2. **Shadow DOM Isolation**: Use Shadow DOM to prevent style conflicts
3. **Mutation Observer**: Re-inject if page content changes (SPA navigation)
4. **Minimal Footprint**: Small, unobtrusive UI elements

### 7.2 Injected UI Elements

| Element | Location | Purpose |
|---------|----------|---------|
| **Automation Toolbar** | Top of page (fixed) | Main entry point for automations |
| **Action Buttons** | Contextual (near job details) | Quick triggers like "Book Hotel" |
| **Status Panel** | Slide-in from right | Shows automation progress |
| **Notification Toast** | Bottom-right corner | Success/error messages |

### 7.3 Toolbar Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [SurfaceFlow Logo] ▼ Automations                    [User] [Settings]  │
└─────────────────────────────────────────────────────────────────────────┘
                      │
                      ▼ (dropdown when clicked)
              ┌───────────────────────┐
              │ 🏨 Book Hotel with AI │
              │ 📄 Generate Documents │
              │ 📋 Submit Permit      │
              │ ─────────────────────│
              │ ⚙️ Settings           │
              └───────────────────────┘
```

### 7.4 Injection Implementation

```javascript
// content/injector.js

class UIInjector {
  constructor() {
    this.injectedElements = new Set();
  }
  
  injectToolbar() {
    // Check if already injected
    if (document.getElementById('sf-toolbar')) return;
    
    // Create container with Shadow DOM
    const container = document.createElement('div');
    container.id = 'sf-toolbar';
    const shadow = container.attachShadow({ mode: 'closed' });
    
    // Add styles (isolated in shadow DOM)
    const styles = document.createElement('style');
    styles.textContent = `
      .sf-toolbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 40px;
        background: #1a1a2e;
        z-index: 999999;
        display: flex;
        align-items: center;
        padding: 0 16px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
      /* ... more styles */
    `;
    shadow.appendChild(styles);
    
    // Add toolbar HTML
    const toolbar = document.createElement('div');
    toolbar.className = 'sf-toolbar';
    toolbar.innerHTML = `
      <img src="${chrome.runtime.getURL('assets/icons/icon-16.png')}" alt="SF" />
      <button class="sf-automations-btn">▼ Automations</button>
      <!-- ... more elements -->
    `;
    shadow.appendChild(toolbar);
    
    // Insert into page
    document.body.insertBefore(container, document.body.firstChild);
    
    // Adjust page content to account for toolbar
    document.body.style.marginTop = '40px';
    
    this.injectedElements.add(container);
  }
  
  injectContextualButton(context) {
    // Inject "Book Hotel" button near job details
    if (context.pageType !== 'job_detail') return;
    
    const targetContainer = document.querySelector('.job-actions-container');
    if (!targetContainer) return;
    if (targetContainer.querySelector('.sf-action-btn')) return;
    
    const button = document.createElement('button');
    button.className = 'sf-action-btn sf-book-hotel';
    button.textContent = '🏨 Book Hotel with AI';
    button.addEventListener('click', () => this.handleBookHotelClick(context));
    
    targetContainer.appendChild(button);
  }
  
  handleBookHotelClick(context) {
    // Open automation panel with pre-filled data
    this.openAutomationPanel('hotel-booking', context.data);
  }
}
```

---

## 8. Authentication Flow

### 8.1 Login Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    Popup     │         │   Service    │         │   Backend    │
│    (User)    │         │   Worker     │         │   (FastAPI)  │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │  User clicks Login     │                        │
       │───────────────────────▶│                        │
       │                        │                        │
       │  Show login form       │                        │
       │◀───────────────────────│                        │
       │                        │                        │
       │  Submit credentials    │                        │
       │───────────────────────▶│                        │
       │                        │                        │
       │                        │  POST /api/v1/auth/login
       │                        │───────────────────────▶│
       │                        │                        │
       │                        │  {access_token,        │
       │                        │   refresh_token}       │
       │                        │◀───────────────────────│
       │                        │                        │
       │                        │  Store in chrome.storage
       │                        │  (encrypted)           │
       │                        │                        │
       │  Login successful      │                        │
       │◀───────────────────────│                        │
       │                        │                        │
       │  Notify content scripts│                        │
       │  (inject UI)           │                        │
       │◀───────────────────────│                        │
```

### 8.2 Token Storage

```javascript
// background/auth-manager.js

class AuthManager {
  static STORAGE_KEY = 'sf_auth';
  
  async storeTokens(accessToken, refreshToken) {
    // Store tokens securely
    await chrome.storage.local.set({
      [AuthManager.STORAGE_KEY]: {
        accessToken,
        refreshToken,
        storedAt: Date.now()
      }
    });
  }
  
  async getAccessToken() {
    const data = await chrome.storage.local.get(AuthManager.STORAGE_KEY);
    const auth = data[AuthManager.STORAGE_KEY];
    
    if (!auth) return null;
    
    // Check if access token is expired (15 min)
    const tokenAge = Date.now() - auth.storedAt;
    if (tokenAge > 14 * 60 * 1000) {
      // Token expiring soon, refresh it
      return this.refreshAccessToken(auth.refreshToken);
    }
    
    return auth.accessToken;
  }
  
  async refreshAccessToken(refreshToken) {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      if (!response.ok) {
        await this.logout();
        throw new Error('Session expired');
      }
      
      const { access_token, refresh_token } = await response.json();
      await this.storeTokens(access_token, refresh_token);
      return access_token;
      
    } catch (error) {
      await this.logout();
      throw error;
    }
  }
  
  async logout() {
    await chrome.storage.local.remove(AuthManager.STORAGE_KEY);
    // Notify all tabs to remove UI
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'LOGOUT' });
      });
    });
  }
}
```

---

## 9. API Communication

### 9.1 API Client

```javascript
// background/api-client.js

const API_BASE = 'https://api.surfaceflow.ai/api/v1';

class ApiClient {
  constructor(authManager) {
    this.authManager = authManager;
  }
  
  async request(endpoint, options = {}) {
    const token = await this.authManager.getAccessToken();
    
    if (!token && !options.skipAuth) {
      throw new Error('Not authenticated');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(response.status, error.message || 'Request failed');
    }
    
    return response.json();
  }
  
  // Convenience methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }
  
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  // Automation-specific methods
  async triggerAutomation(moduleId, data) {
    return this.post('/automations/trigger', {
      module_id: moduleId,
      trigger_source: 'extension',
      context_data: data
    });
  }
  
  async getAutomationStatus(jobId) {
    return this.get(`/automations/${jobId}`);
  }
  
  async getEnabledModules() {
    return this.get('/modules/');
  }
}
```

### 9.2 Message Passing (Content ↔ Background)

```javascript
// Content script sending message to background
chrome.runtime.sendMessage({
  type: 'TRIGGER_AUTOMATION',
  payload: {
    moduleId: 'AM-002',
    data: contextData
  }
}, (response) => {
  if (response.success) {
    showNotification('Automation started!', 'success');
  } else {
    showNotification(response.error, 'error');
  }
});

// Background service worker handling messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRIGGER_AUTOMATION') {
    handleAutomationTrigger(message.payload)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});
```

---

## 10. Data Capture Patterns

### 10.1 Extraction Strategy

| Priority | Method | Use Case |
|----------|--------|----------|
| 1 | **API** | If Buildertrend exposes data via frontend API calls |
| 2 | **Data Attributes** | `data-*` attributes on DOM elements |
| 3 | **DOM Selectors** | CSS selectors for visible text/values |
| 4 | **URL Parameters** | IDs from query strings |

### 10.2 Resilient Selector Mapping

```javascript
// content/modules/buildertrend/extractor.js

const BuildertrendExtractor = {
  // Centralized selector definitions (easy to update if BT changes)
  selectors: {
    jobDetail: {
      jobId: [
        '[data-job-id]',
        '#hdnJobID',
        'input[name="JobID"]'
      ],
      jobName: [
        '.job-header h1',
        '#lblJobName',
        '[data-testid="job-name"]'
      ],
      address: {
        street: ['.job-address .street', '#lblStreet'],
        city: ['.job-address .city', '#lblCity'],
        state: ['.job-address .state', '#lblState'],
        zip: ['.job-address .zip', '#lblZip']
      },
      crewSize: [
        '[data-crew-count]',
        '.crew-info .count'
      ]
    }
  },
  
  // Try multiple selectors until one works
  extractValue(selectorList) {
    for (const selector of selectorList) {
      const element = document.querySelector(selector);
      if (element) {
        // Handle different element types
        if (element.tagName === 'INPUT') return element.value;
        if (element.dataset && Object.keys(element.dataset).length) {
          return element.dataset[Object.keys(element.dataset)[0]];
        }
        return element.textContent.trim();
      }
    }
    return null;
  },
  
  extractJobDetails() {
    const s = this.selectors.jobDetail;
    return {
      jobId: this.extractValue(s.jobId),
      jobName: this.extractValue(s.jobName),
      address: {
        street: this.extractValue(s.address.street),
        city: this.extractValue(s.address.city),
        state: this.extractValue(s.address.state),
        zip: this.extractValue(s.address.zip)
      },
      crewSize: parseInt(this.extractValue(s.crewSize)) || null
    };
  }
};
```

### 10.3 Client-Side Validation

```javascript
// shared/schemas.js

const HotelBookingSchema = {
  required: ['jobId', 'address', 'checkInDate', 'checkOutDate', 'crewSize'],
  
  validate(data) {
    const errors = [];
    
    // Required fields
    for (const field of this.required) {
      if (!this.getValue(data, field)) {
        errors.push({ field, message: `${field} is required` });
      }
    }
    
    // Address validation
    if (data.address) {
      if (!data.address.city || !data.address.state) {
        errors.push({ field: 'address', message: 'City and state are required' });
      }
    }
    
    // Date validation
    if (data.checkInDate && data.checkOutDate) {
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);
      if (checkOut <= checkIn) {
        errors.push({ field: 'dates', message: 'Check-out must be after check-in' });
      }
    }
    
    // Crew size
    if (data.crewSize && (data.crewSize < 1 || data.crewSize > 50)) {
      errors.push({ field: 'crewSize', message: 'Crew size must be between 1 and 50' });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  getValue(obj, path) {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }
};
```

---

## 11. User Feedback & Notifications

### 11.1 Notification Types

| Type | Style | Duration | Use Case |
|------|-------|----------|----------|
| **Loading** | Spinner + text | Until complete | Automation in progress |
| **Success** | Green check + text | 5 seconds | Automation completed |
| **Error** | Red alert + text | Until dismissed | Action required |
| **Info** | Blue info + text | 5 seconds | General information |

### 11.2 Progress States

```javascript
// UI states for automation progress
const AutomationStates = {
  VALIDATING: {
    message: 'Validating data...',
    icon: 'spinner'
  },
  CHECKING_HOUSING: {
    message: 'Checking internal housing...',
    icon: 'home'
  },
  SEARCHING_HOTELS: {
    message: 'Searching hotels...',
    icon: 'search'
  },
  AWAITING_APPROVAL: {
    message: 'Waiting for approval...',
    icon: 'clock'
  },
  BOOKING: {
    message: 'Completing booking...',
    icon: 'spinner'
  },
  COMPLETED: {
    message: 'Hotel booked successfully!',
    icon: 'check'
  },
  FAILED: {
    message: 'Booking failed',
    icon: 'error'
  }
};
```

### 11.3 Toast Notification Implementation

```javascript
// content/injector.js

class NotificationManager {
  show(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `sf-toast sf-toast-${type}`;
    toast.innerHTML = `
      <span class="sf-toast-icon">${this.getIcon(type)}</span>
      <span class="sf-toast-message">${message}</span>
      <button class="sf-toast-close">×</button>
    `;
    
    toast.querySelector('.sf-toast-close').addEventListener('click', () => {
      this.dismiss(toast);
    });
    
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => toast.classList.add('sf-toast-visible'));
    
    // Auto dismiss (except errors)
    if (type !== 'error' && duration) {
      setTimeout(() => this.dismiss(toast), duration);
    }
  }
  
  dismiss(toast) {
    toast.classList.remove('sf-toast-visible');
    setTimeout(() => toast.remove(), 300);
  }
  
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      loading: '⟳'
    };
    return icons[type] || icons.info;
  }
}
```

---

## 12. Security Considerations

### 12.1 Manifest V3 Security

| Feature | Implementation |
|---------|----------------|
| **Service Worker** | No persistent background page, reduced attack surface |
| **CSP** | No inline scripts, no eval() |
| **Host Permissions** | Explicitly declared, minimal scope |
| **No Remote Code** | All code bundled in extension |

### 12.2 Token Security

- Tokens stored in `chrome.storage.local` (not accessible to web pages)
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens cleared on logout and extension uninstall

### 12.3 Content Script Isolation

- Use Shadow DOM for injected UI (style isolation)
- No access to page's JavaScript context
- Message passing only through chrome.runtime API

### 12.4 Input Validation

- All extracted data validated before sending to backend
- Sanitize any user-provided inputs
- Never execute code from page context

---

## 13. Development & Debugging

### 13.1 Local Development Setup

```bash
# Clone repository
git clone https://github.com/surfaceflow/extension.git
cd extension

# Install dependencies (if using bundler)
npm install

# Build for development
npm run dev

# Load in Chrome:
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the extension folder
```

### 13.2 Debugging Tips

| Component | How to Debug |
|-----------|--------------|
| **Service Worker** | chrome://extensions → Inspect service worker |
| **Content Scripts** | DevTools → Sources → Content scripts |
| **Popup** | Right-click popup → Inspect |
| **Storage** | DevTools → Application → Local Storage |

### 13.3 Logging

```javascript
// shared/utils.js

const Logger = {
  prefix: '[SurfaceFlow]',
  
  debug(...args) {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.prefix, '[DEBUG]', ...args);
    }
  },
  
  info(...args) {
    console.log(this.prefix, '[INFO]', ...args);
  },
  
  error(...args) {
    console.error(this.prefix, '[ERROR]', ...args);
  }
};
```

---

## 14. Deployment & Distribution

### 14.1 Build Process

```bash
# Production build
npm run build

# Output structure
dist/
├── manifest.json
├── background/
├── content/
├── popup/
├── shared/
└── assets/
```

### 14.2 Chrome Web Store Submission

1. Create developer account ($5 one-time fee)
2. Prepare store listing:
   - Screenshots (1280x800 or 640x400)
   - Icon (128x128 PNG)
   - Description and promotional text
3. Submit for review (typically 1-3 days)

### 14.3 Staged Rollout

| Phase | Users | Purpose |
|-------|-------|---------|
| **Alpha** | Internal team | Core functionality testing |
| **Beta** | Select users | Real-world validation |
| **Production** | All users | Full rollout |

### 14.4 Update Mechanism

- Chrome auto-updates extensions
- Version bump in manifest.json triggers update
- Critical fixes can request expedited review

---

**End of Chrome Extension Documentation**
