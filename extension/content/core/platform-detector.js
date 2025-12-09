/**
 * SurfaceFlow AI - Core Platform Detector
 * Detects which platform (BuilderTrend, Salesforce, etc.) the user is on
 */

const PlatformDetector = {
  platforms: {
    buildertrend: {
      name: 'BuilderTrend',
      hostPatterns: [
        /.*\.buildertrend\.com$/,
        /.*\.buildertrend\.net$/
      ],
      color: '#2563eb'
    },
    salesforce: {
      name: 'Salesforce',
      hostPatterns: [
        /.*\.salesforce\.com$/,
        /.*\.force\.com$/,
        /.*\.lightning\.force\.com$/
      ],
      color: '#00a1e0'
    }
  },
  
  /**
   * Detect current platform based on hostname
   */
  detect() {
    const host = window.location.hostname;
    
    for (const [platformId, platform] of Object.entries(this.platforms)) {
      const isMatch = platform.hostPatterns.some(pattern => pattern.test(host));
      if (isMatch) {
        return {
          id: platformId,
          name: platform.name,
          color: platform.color,
          host: host,
          url: window.location.href
        };
      }
    }
    
    return null;
  },
  
  /**
   * Check if on a specific platform
   */
  isOnPlatform(platformId) {
    const detected = this.detect();
    return detected && detected.id === platformId;
  },
  
  /**
   * Get platform configuration
   */
  getPlatformConfig(platformId) {
    return this.platforms[platformId] || null;
  }
};

// Export for use in other scripts
window.PlatformDetector = PlatformDetector;
