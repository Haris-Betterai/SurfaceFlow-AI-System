/**
 * SurfaceFlow AI - Buildertrend Page Detector
 * Detects the current page type and extracts context from Buildertrend
 */

const BuildertrendDetector = {
  // Host patterns to match
  hostPatterns: [
    /.*\.buildertrend\.com$/,
    /.*\.buildertrend\.net$/
  ],

  // Page type detection rules
  pageRules: [
    {
      type: 'job_page',
      urlPattern: /\/app\/JobPage\/(\d+)/,
      domValidator: () => document.querySelector('[data-testid="jobTabsActionBar"]') !== null ||
                          document.querySelector('.bds-header-action-bar') !== null
    },
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
    {
      type: 'todo_detail',
      urlPattern: /\/app\/ToDo\/ToDoItem\.aspx/,
      domValidator: () => true
    },
    {
      type: 'daily_log',
      urlPattern: /\/app\/DailyLog/,
      domValidator: () => true
    },
    {
      type: 'schedule',
      urlPattern: /\/app\/Schedule/,
      domValidator: () => true
    }
  ],

  /**
   * Detect if we're on Buildertrend and what page type
   */
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
          url: url,
          jobId: urlMatch[1] || null
        };
      }
    }

    return {
      application: 'buildertrend',
      pageType: 'unknown',
      url: url
    };
  },

  /**
   * Check if current page supports hotel booking automation
   */
  supportsHotelBooking(context) {
    return context && ['job_page', 'job_detail'].includes(context.pageType);
  }
};

// Export for use in other scripts
window.BuildertrendDetector = BuildertrendDetector;
