/**
 * SurfaceFlow AI - Buildertrend Data Extractor
 * Extracts job data from the Buildertrend page DOM
 */

const BuildertrendExtractor = {
  /**
   * Extract all job data from the current page
   */
  extractJobData() {
    const data = {
      jobId: this.extractJobId(),
      jobName: this.extractJobName(),
      jobNumber: this.extractJobNumber(),
      address: this.extractAddress(),
      schedule: this.extractSchedule(),
      crew: this.extractCrewInfo(),
      projectType: this.extractProjectType(),
      contractPrice: this.extractContractPrice(),
      status: this.extractStatus(),
      projectManager: this.extractProjectManager()
    };

    console.log('[SurfaceFlow] Extracted job data:', data);
    return data;
  },

  /**
   * Extract job ID from URL or page content
   */
  extractJobId() {
    // Try URL first
    const urlMatch = window.location.href.match(/\/JobPage\/(\d+)/);
    if (urlMatch) return urlMatch[1];
    
    // Try alternative URL patterns
    const altMatch = window.location.href.match(/JobID=(\d+)/i);
    if (altMatch) return altMatch[1];
    
    // Try to get from page data attributes or hidden fields
    const jobIdElement = document.querySelector('[data-job-id]');
    if (jobIdElement) return jobIdElement.dataset.jobId;
    
    // Generate a pseudo ID from job name if we have it
    const jobName = document.querySelector('[data-testid="jobInfo.jobName"]')?.value;
    if (jobName) {
      // Create a simple hash from job name for identification
      let hash = 0;
      for (let i = 0; i < jobName.length; i++) {
        hash = ((hash << 5) - hash) + jobName.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash).toString();
    }
    
    return 'unknown_' + Date.now();
  },

  /**
   * Extract job name/title
   */
  extractJobName() {
    // Try input field first
    const titleInput = document.querySelector('[data-testid="jobInfo.jobName"]');
    if (titleInput && titleInput.value?.trim()) return titleInput.value.trim();

    // Try modal header title
    const headerTitle = document.querySelector('.bds-header-info--title');
    if (headerTitle && headerTitle.textContent?.trim()) return headerTitle.textContent.trim();

    // Try page header
    const header = document.querySelector('.job-header-title, h1, h2.ant-typography');
    return header ? header.textContent?.trim() : null;
  },

  /**
   * Extract job number/prefix
   */
  extractJobNumber() {
    const prefixInput = document.querySelector('[data-testid="jobInfo.jobsitePrefix"]');
    return prefixInput ? prefixInput.value?.trim() : null;
  },

  /**
   * Extract address from form fields
   */
  extractAddress() {
    const street = document.querySelector('[data-testid="jobInfo.address.street"]')?.value?.trim();
    const city = document.querySelector('[data-testid="jobInfo.address.city"]')?.value?.trim();
    const state = document.querySelector('[data-testid="jobInfo.address.state"]')?.value?.trim();
    const zip = document.querySelector('[data-testid="jobInfo.address.zip"]')?.value?.trim();

    if (!street && !city) return null;

    return {
      street: street || '',
      city: city || '',
      state: state || '',
      zip: zip || '',
      formatted: `${street}, ${city}, ${state} ${zip}`.trim()
    };
  },

  /**
   * Extract schedule dates
   */
  extractSchedule() {
    const projectedStart = document.querySelector('[data-testid="jobInfo.projectedStartDate"]')?.value;
    const actualStart = document.querySelector('[data-testid="jobInfo.actualStartDate"]')?.value;
    const projectedEnd = document.querySelector('[data-testid="jobInfo.projectedCompletionDate"]')?.value;
    const actualEnd = document.querySelector('[data-testid="jobInfo.actualCompletionDate"]')?.value;

    return {
      projectedStart: projectedStart || null,
      actualStart: actualStart || null,
      projectedEnd: projectedEnd || null,
      actualEnd: actualEnd || null
    };
  },

  /**
   * Extract crew information
   * Note: In real implementation, this would parse crew tables/lists
   */
  extractCrewInfo() {
    // Try to find crew count from internal users tab or other sources
    // For now, return default - the modal will allow user to specify
    return {
      size: 4,
      members: []
    };
  },

  /**
   * Extract project type
   */
  extractProjectType() {
    const typeSelect = document.querySelector('[data-testid="jobInfo.groupedProjectType"]');
    if (typeSelect) {
      const selectedItem = typeSelect.querySelector('.ant-select-selection-item');
      return selectedItem ? selectedItem.textContent?.trim() : null;
    }
    return null;
  },

  /**
   * Extract contract price
   */
  extractContractPrice() {
    const priceInput = document.querySelector('[data-testid="jobInfo.contractPrice"]');
    if (priceInput) {
      const value = priceInput.value?.replace(/[^0-9.]/g, '');
      return value ? parseFloat(value) : null;
    }
    return null;
  },

  /**
   * Extract job status
   */
  extractStatus() {
    const statusSelect = document.querySelector('[data-testid="jobInfo.jobStatusPresaleDropdown"]');
    if (statusSelect) {
      const selectedItem = statusSelect.querySelector('.ant-select-selection-item');
      return selectedItem ? selectedItem.textContent?.trim() : null;
    }
    return null;
  },

  /**
   * Extract project manager info
   */
  extractProjectManager() {
    // From custom fields - Primary Project Manager
    const pmField = document.querySelector('[data-testid="customFields.402754"]');
    if (pmField) {
      const selectedItem = pmField.querySelector('.ant-select-selection-item .BTUser-Name-Display-details');
      if (selectedItem) {
        return selectedItem.textContent?.trim();
      }
    }
    return null;
  }
};

// Export for use in other scripts
window.BuildertrendExtractor = BuildertrendExtractor;
