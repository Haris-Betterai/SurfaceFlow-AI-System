/**
 * SurfaceFlow AI - Background Service Worker
 * Handles authentication, API communication, and cross-tab state
 */

// Constants
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
const STORAGE_KEYS = {
  AUTH_TOKEN: 'sf_auth_token',
  REFRESH_TOKEN: 'sf_refresh_token',
  USER: 'sf_user',
  SETTINGS: 'sf_settings'
};

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('[SurfaceFlow] Extension installed');
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[SurfaceFlow] Message received:', request.type);

  switch (request.type) {
    case 'GET_AUTH_STATE':
      getAuthState().then(sendResponse);
      return true;

    case 'LOGIN':
      login(request.email, request.password).then(sendResponse);
      return true;

    case 'LOGOUT':
      logout().then(sendResponse);
      return true;

    case 'TRIGGER_AUTOMATION':
      triggerAutomation(request.moduleId, request.data).then(sendResponse);
      return true;

    case 'GET_MODULES':
      getAvailableModules().then(sendResponse);
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

/**
 * Get current authentication state
 */
async function getAuthState() {
  try {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER
    ]);

    return {
      isAuthenticated: !!result[STORAGE_KEYS.AUTH_TOKEN],
      user: result[STORAGE_KEYS.USER] || null
    };
  } catch (error) {
    console.error('[SurfaceFlow] Error getting auth state:', error);
    return { isAuthenticated: false, user: null };
  }
}

/**
 * Login with email and password
 */
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();

    // Store tokens
    await chrome.storage.local.set({
      [STORAGE_KEYS.AUTH_TOKEN]: data.access_token,
      [STORAGE_KEYS.REFRESH_TOKEN]: data.refresh_token,
      [STORAGE_KEYS.USER]: data.user
    });

    return { success: true, user: data.user };
  } catch (error) {
    console.error('[SurfaceFlow] Login error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Logout and clear stored data
 */
async function logout() {
  try {
    await chrome.storage.local.remove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER
    ]);

    return { success: true };
  } catch (error) {
    console.error('[SurfaceFlow] Logout error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get available automation modules
 */
async function getAvailableModules() {
  try {
    const auth = await getAuthState();
    if (!auth.isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    const { [STORAGE_KEYS.AUTH_TOKEN]: token } = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);

    const response = await fetch(`${API_BASE_URL}/modules`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch modules');
    }

    const modules = await response.json();
    return { success: true, modules };
  } catch (error) {
    console.error('[SurfaceFlow] Get modules error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Trigger an automation
 */
async function triggerAutomation(moduleId, data) {
  try {
    const auth = await getAuthState();
    if (!auth.isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    const { [STORAGE_KEYS.AUTH_TOKEN]: token } = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);

    const response = await fetch(`${API_BASE_URL}/automations/${moduleId}/trigger`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to trigger automation');
    }

    const result = await response.json();

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icons/icon-128.png',
      title: 'Automation Triggered',
      message: `${moduleId} automation has been started`
    });

    return { success: true, result };
  } catch (error) {
    console.error('[SurfaceFlow] Trigger automation error:', error);
    return { success: false, error: error.message };
  }
}
