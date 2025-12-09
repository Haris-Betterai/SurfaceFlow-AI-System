/**
 * SurfaceFlow AI - Salesforce Page Detector
 * Detects page types within Salesforce
 */

const SalesforceDetector = {
  pageRules: [
    {
      type: 'lead_detail',
      urlPattern: /\/lightning\/r\/Lead\/([a-zA-Z0-9]+)\/view/,
      domValidator: () => document.querySelector('[data-component-id*="Lead"]') !== null ||
                          document.querySelector('.slds-page-header') !== null
    },
    {
      type: 'contact_detail',
      urlPattern: /\/lightning\/r\/Contact\/([a-zA-Z0-9]+)\/view/,
      domValidator: () => document.querySelector('[data-component-id*="Contact"]') !== null
    },
    {
      type: 'account_detail',
      urlPattern: /\/lightning\/r\/Account\/([a-zA-Z0-9]+)\/view/,
      domValidator: () => document.querySelector('[data-component-id*="Account"]') !== null
    },
    {
      type: 'lead_list',
      urlPattern: /\/lightning\/o\/Lead\/list/,
      domValidator: () => true
    },
    {
      type: 'contact_list',
      urlPattern: /\/lightning\/o\/Contact\/list/,
      domValidator: () => true
    }
  ],
  
  /**
   * Detect current page type
   */
  detect() {
    const url = window.location.href;
    
    for (const rule of this.pageRules) {
      const urlMatch = url.match(rule.urlPattern);
      if (urlMatch && rule.domValidator()) {
        return {
          platform: 'salesforce',
          pageType: rule.type,
          urlMatches: urlMatch,
          recordId: urlMatch[1] || null,
          url: url
        };
      }
    }
    
    return {
      platform: 'salesforce',
      pageType: 'unknown',
      url: url
    };
  },
  
  /**
   * Check if current page supports lead enrichment
   */
  supportsEnrichment(context) {
    return context && ['lead_detail', 'contact_detail', 'lead_list', 'contact_list'].includes(context.pageType);
  }
};

// Export for use in other scripts
window.SalesforceDetector = SalesforceDetector;
