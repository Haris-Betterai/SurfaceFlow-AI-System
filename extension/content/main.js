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
      // If we're on any job-related page, show the button
      const url = window.location.href;
      if (url.includes('/JobPage/') || url.includes('/Job/') || 
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
   * Setup mutation observer to detect SPA navigation
   */
  function setupMutationObserver(context) {
    let lastUrl = window.location.href;

    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log('[SurfaceFlow] URL changed, reinitializing...');
        
        // Wait for new content to load
        setTimeout(() => {
          const newContext = window.BuildertrendDetector.detect();
          if (newContext) {
            const jobData = window.BuildertrendExtractor.extractJobData();
            window.SurfaceFlowUI.init(newContext, jobData);
          }
        }, 1000);
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
