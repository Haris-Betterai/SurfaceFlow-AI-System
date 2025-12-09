/**
 * SurfaceFlow AI - Main Content Script
 * Entry point for the Buildertrend page integration
 */

(function() {
  'use strict';

  console.log('[SurfaceFlow] Extension loaded on:', window.location.href);

  // Wait for page to be ready
  function init() {
    console.log('[SurfaceFlow] Initializing...');
    
    // Check if we're on a Buildertrend domain
    const host = window.location.hostname;
    const isBuildertrend = host.includes('buildertrend.com') || host.includes('buildertrend.net');
    
    if (!isBuildertrend) {
      console.log('[SurfaceFlow] Not on Buildertrend domain, skipping');
      return;
    }

    // Detect page context
    const context = window.BuildertrendDetector ? window.BuildertrendDetector.detect() : null;
    
    console.log('[SurfaceFlow] Detected context:', context);

    // Extract job data if on a job page
    let jobData = null;
    if (window.BuildertrendExtractor) {
      jobData = window.BuildertrendExtractor.extractJobData();
      console.log('[SurfaceFlow] Extracted job data:', jobData);
    }

    // Initialize UI components - be aggressive about showing the button
    if (window.SurfaceFlowUI) {
      // Check for job modals or pages
      const url = window.location.href;
      const hasJobModal = document.querySelector('[data-testid="modalLayout"]') !== null;
      const hasJobHeader = document.querySelector('[data-testid="jobPresentationalHeader"]') !== null;
      const hasJobTabs = document.querySelector('[data-testid="jobTabsActionBar"]') !== null;
      
      if (url.includes('/JobPage/') || url.includes('/Job/') || 
          hasJobModal || hasJobHeader || hasJobTabs ||
          (context && (context.pageType === 'job_page' || context.pageType === 'job_detail'))) {
        window.SurfaceFlowUI.init(context || { pageType: 'job_page', url: url }, jobData);
      }
    } else {
      console.error('[SurfaceFlow] SurfaceFlowUI not loaded!');
    }

    // Set up mutation observer to re-inject UI if page changes (SPA navigation)
    setupMutationObserver(context);
  }

  /**
   * Setup mutation observer to detect SPA navigation and modal opens
   */
  function setupMutationObserver(context) {
    let lastUrl = window.location.href;
    let lastModalState = document.querySelector('[data-testid="modalLayout"]') !== null;

    const observer = new MutationObserver((mutations) => {
      const urlChanged = window.location.href !== lastUrl;
      const hasModal = document.querySelector('[data-testid="modalLayout"]') !== null;
      const hasJobTabs = document.querySelector('[data-testid="jobTabsActionBar"]') !== null;
      const modalOpened = hasModal && !lastModalState;
      const buttonExists = document.getElementById('sf-hotel-booking-btn') !== null;
      
      // Re-inject if URL changed, modal opened, or we have job content without button
      if (urlChanged || modalOpened || ((hasModal || hasJobTabs) && !buttonExists)) {
        if (urlChanged) {
          lastUrl = window.location.href;
          console.log('[SurfaceFlow] URL changed, reinitializing...');
        }
        if (modalOpened) {
          console.log('[SurfaceFlow] Modal opened, injecting button...');
        }
        if ((hasModal || hasJobTabs) && !buttonExists) {
          console.log('[SurfaceFlow] Job content detected without button, injecting...');
        }
        
        lastModalState = hasModal;
        
        // Wait for new content to load
        setTimeout(() => {
          const newContext = window.BuildertrendDetector ? window.BuildertrendDetector.detect() : null;
          const jobData = window.BuildertrendExtractor ? window.BuildertrendExtractor.extractJobData() : null;
          if (window.SurfaceFlowUI) {
            window.SurfaceFlowUI.init(newContext || { pageType: 'job_page', url: window.location.href }, jobData);
          }
        }, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(init, 500);
    });
  } else {
    setTimeout(init, 500);
  }

  // Also listen for page show event (for back/forward navigation)
  window.addEventListener('pageshow', () => {
    setTimeout(init, 500);
  });

})();
