/**
 * SurfaceFlow AI - Popup Script
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('[SurfaceFlow] Popup loaded');
  
  // Initialize
  checkAuthState();
  setupEventListeners();
});

/**
 * Check authentication state
 */
async function checkAuthState() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' });
    
    if (response.isAuthenticated && response.user) {
      document.getElementById('user-name').textContent = response.user.name || 'Demo User';
      document.getElementById('user-email').textContent = response.user.email || 'demo@surfaceflow.ai';
    }
  } catch (error) {
    console.error('[SurfaceFlow] Error checking auth state:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Logout button
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'LOGOUT' });
    window.close();
  });

  // Open portal link
  document.getElementById('open-portal').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });

  // Settings link
  document.getElementById('settings').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard/settings' });
  });

  // Module card clicks
  document.querySelectorAll('.module-card:not(.coming-soon)').forEach(card => {
    card.addEventListener('click', () => {
      // Could open the current tab on Buildertrend if not already there
      console.log('[SurfaceFlow] Module clicked');
    });
  });
}
