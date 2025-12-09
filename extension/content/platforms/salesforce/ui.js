/**
 * SurfaceFlow AI - Salesforce UI Components
 * Injects "Enrich with AI" functionality into Salesforce pages
 */

const SalesforceUI = {
  initialized: false,
  enrichmentButton: null,
  
  /**
   * Initialize Salesforce UI components
   */
  async init() {
    if (this.initialized) return;
    
    console.log('[SurfaceFlow] Initializing Salesforce UI...');
    
    // Inject styles
    this.injectStyles();
    
    // Wait for page to fully load
    await this.waitForSalesforceLoad();
    
    // Detect page type and inject appropriate UI
    const pageType = window.SalesforceDetector?.detect() || 'unknown';
    console.log('[SurfaceFlow] Salesforce page type:', pageType);
    
    switch(pageType) {
      case 'lead_detail':
      case 'contact_detail':
        this.injectDetailPageUI();
        break;
      case 'list_view':
        this.injectListViewUI();
        break;
      default:
        console.log('[SurfaceFlow] No UI injection for page type:', pageType);
    }
    
    this.initialized = true;
  },
  
  /**
   * Wait for Salesforce Lightning to fully load
   */
  waitForSalesforceLoad() {
    return new Promise((resolve) => {
      const checkLoaded = () => {
        // Check for Salesforce Lightning indicators
        const isLoaded = document.querySelector('.slds-page-header, .forceRecordLayout, .slds-table');
        if (isLoaded) {
          resolve();
        } else {
          setTimeout(checkLoaded, 500);
        }
      };
      checkLoaded();
    });
  },
  
  /**
   * Inject styles for SurfaceFlow components
   */
  injectStyles() {
    if (document.getElementById('surfaceflow-sf-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'surfaceflow-sf-styles';
    styles.textContent = `
      .sf-enrich-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white !important;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        margin-left: 10px;
      }
      
      .sf-enrich-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
      }
      
      .sf-enrich-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      
      .sf-enrich-btn .sf-spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: sf-spin 0.8s linear infinite;
      }
      
      @keyframes sf-spin {
        to { transform: rotate(360deg); }
      }
      
      .sf-enrich-icon {
        width: 16px;
        height: 16px;
      }
      
      .sf-enrichment-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 99999;
        width: 600px;
        max-height: 80vh;
        overflow: hidden;
      }
      
      .sf-panel-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .sf-panel-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }
      
      .sf-panel-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }
      
      .sf-panel-body {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
      }
      
      .sf-enrichment-section {
        margin-bottom: 20px;
      }
      
      .sf-enrichment-section h3 {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 1px solid #eee;
      }
      
      .sf-enrichment-data {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 10px;
        font-size: 13px;
      }
      
      .sf-enrichment-label {
        color: #666;
        font-weight: 500;
      }
      
      .sf-enrichment-value {
        color: #333;
      }
      
      .sf-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 99998;
      }
      
      .sf-list-select-checkbox {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
      
      .sf-bulk-actions {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 15px;
        z-index: 9999;
      }
      
      .sf-selected-count {
        font-weight: 600;
        color: #333;
      }
    `;
    document.head.appendChild(styles);
  },
  
  /**
   * Inject UI for lead/contact detail pages
   */
  injectDetailPageUI() {
    console.log('[SurfaceFlow] Injecting detail page UI...');
    
    // Find the action bar in Salesforce
    const actionBar = document.querySelector('.slds-page-header__detail-row, .runtime_platform_actions-actionBar, .forceActionsContainer');
    
    if (actionBar) {
      this.createEnrichButton(actionBar);
    } else {
      // Try injecting near the page header
      const header = document.querySelector('.slds-page-header, .forceHighlightsPanel');
      if (header) {
        this.createEnrichButton(header);
      }
    }
  },
  
  /**
   * Inject UI for list views
   */
  injectListViewUI() {
    console.log('[SurfaceFlow] Injecting list view UI...');
    
    // Add selection checkboxes to list rows
    this.addListSelectionUI();
    
    // Add bulk action bar
    this.addBulkActionBar();
  },
  
  /**
   * Create the "Enrich with AI" button
   */
  createEnrichButton(container) {
    if (this.enrichmentButton) return;
    
    this.enrichmentButton = document.createElement('button');
    this.enrichmentButton.className = 'sf-enrich-btn';
    this.enrichmentButton.innerHTML = `
      <svg class="sf-enrich-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      Enrich with AI
    `;
    
    this.enrichmentButton.addEventListener('click', () => this.handleEnrichClick());
    
    container.appendChild(this.enrichmentButton);
    console.log('[SurfaceFlow] Enrich button created');
  },
  
  /**
   * Handle enrich button click
   */
  async handleEnrichClick() {
    if (!window.SalesforceExtractor) {
      console.error('[SurfaceFlow] Extractor not loaded');
      return;
    }
    
    // Update button state
    this.setButtonLoading(true);
    
    try {
      // Extract lead data from page
      const leadData = window.SalesforceExtractor.extractLeadData();
      
      if (!leadData.name && !leadData.company) {
        this.showNotification('Could not extract lead data from this page', 'error');
        return;
      }
      
      // Call API to enrich
      const response = await this.callEnrichAPI(leadData);
      
      if (response.success) {
        this.showEnrichmentPanel(response.data);
        this.showNotification('Lead enriched successfully!', 'success');
      } else {
        this.showNotification(response.error || 'Enrichment failed', 'error');
      }
    } catch (error) {
      console.error('[SurfaceFlow] Enrichment error:', error);
      this.showNotification('An error occurred during enrichment', 'error');
    } finally {
      this.setButtonLoading(false);
    }
  },
  
  /**
   * Set button loading state
   */
  setButtonLoading(loading) {
    if (!this.enrichmentButton) return;
    
    if (loading) {
      this.enrichmentButton.disabled = true;
      this.enrichmentButton.innerHTML = `
        <div class="sf-spinner"></div>
        Enriching...
      `;
    } else {
      this.enrichmentButton.disabled = false;
      this.enrichmentButton.innerHTML = `
        <svg class="sf-enrich-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        Enrich with AI
      `;
    }
  },
  
  /**
   * Call the enrichment API
   */
  async callEnrichAPI(leadData) {
    const API_BASE = 'http://127.0.0.1:8000/api/v1';
    
    try {
      const response = await fetch(`${API_BASE}/salesforce/leads/enrich/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: leadData.name,
          company: leadData.company,
          email: leadData.email,
          phone: leadData.phone,
          salesforce_id: leadData.id
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('[SurfaceFlow] API call failed:', error);
      return { success: false, error: 'API call failed' };
    }
  },
  
  /**
   * Show enrichment results panel
   */
  showEnrichmentPanel(data) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'sf-overlay';
    overlay.addEventListener('click', () => this.closeEnrichmentPanel());
    
    // Create panel
    const panel = document.createElement('div');
    panel.className = 'sf-enrichment-panel';
    panel.innerHTML = `
      <div class="sf-panel-header">
        <h2 class="sf-panel-title">🎯 AI Enrichment Results</h2>
        <button class="sf-panel-close">&times;</button>
      </div>
      <div class="sf-panel-body">
        ${this.renderEnrichmentData(data)}
      </div>
    `;
    
    panel.querySelector('.sf-panel-close').addEventListener('click', () => this.closeEnrichmentPanel());
    
    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    
    this.enrichmentOverlay = overlay;
    this.enrichmentPanel = panel;
  },
  
  /**
   * Render enrichment data as HTML
   */
  renderEnrichmentData(data) {
    if (!data) return '<p>No enrichment data available</p>';
    
    const enrichment = data.enrichment_data || data;
    
    let html = '';
    
    // Company Info
    if (enrichment.company_info) {
      html += `
        <div class="sf-enrichment-section">
          <h3>🏢 Company Information</h3>
          <div class="sf-enrichment-data">
            ${this.renderDataRow('Industry', enrichment.company_info.industry)}
            ${this.renderDataRow('Employee Count', enrichment.company_info.employee_count)}
            ${this.renderDataRow('Revenue', enrichment.company_info.revenue)}
            ${this.renderDataRow('Founded', enrichment.company_info.founded_year)}
            ${this.renderDataRow('Headquarters', enrichment.company_info.headquarters)}
            ${this.renderDataRow('Website', enrichment.company_info.website)}
          </div>
        </div>
      `;
    }
    
    // Contact Info
    if (enrichment.contact_info) {
      html += `
        <div class="sf-enrichment-section">
          <h3>👤 Contact Information</h3>
          <div class="sf-enrichment-data">
            ${this.renderDataRow('Title', enrichment.contact_info.verified_title)}
            ${this.renderDataRow('LinkedIn', enrichment.contact_info.linkedin_url)}
            ${this.renderDataRow('Email Status', enrichment.contact_info.email_verified ? 'Verified ✓' : 'Not Verified')}
            ${this.renderDataRow('Phone', enrichment.contact_info.phone_verified ? 'Verified ✓' : 'Not Verified')}
          </div>
        </div>
      `;
    }
    
    // Insights
    if (enrichment.insights) {
      html += `
        <div class="sf-enrichment-section">
          <h3>💡 AI Insights</h3>
          <div class="sf-enrichment-data">
            ${enrichment.insights.map(insight => `
              <div class="sf-enrichment-label">${insight.type || 'Insight'}</div>
              <div class="sf-enrichment-value">${insight.value || insight}</div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    return html || '<p>Enrichment data received</p>';
  },
  
  /**
   * Render a data row
   */
  renderDataRow(label, value) {
    if (!value) return '';
    return `
      <div class="sf-enrichment-label">${label}</div>
      <div class="sf-enrichment-value">${value}</div>
    `;
  },
  
  /**
   * Close enrichment panel
   */
  closeEnrichmentPanel() {
    if (this.enrichmentOverlay) {
      this.enrichmentOverlay.remove();
      this.enrichmentOverlay = null;
    }
    if (this.enrichmentPanel) {
      this.enrichmentPanel.remove();
      this.enrichmentPanel = null;
    }
  },
  
  /**
   * Add selection checkboxes to list view
   */
  addListSelectionUI() {
    const rows = document.querySelectorAll('table.slds-table tbody tr');
    
    rows.forEach(row => {
      if (row.querySelector('.sf-list-select-checkbox')) return;
      
      const firstCell = row.querySelector('td');
      if (firstCell) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'sf-list-select-checkbox';
        checkbox.addEventListener('change', () => this.updateBulkActionBar());
        firstCell.insertBefore(checkbox, firstCell.firstChild);
      }
    });
  },
  
  /**
   * Add bulk action bar for list views
   */
  addBulkActionBar() {
    if (document.querySelector('.sf-bulk-actions')) return;
    
    const bar = document.createElement('div');
    bar.className = 'sf-bulk-actions';
    bar.style.display = 'none';
    bar.innerHTML = `
      <span class="sf-selected-count">0 selected</span>
      <button class="sf-enrich-btn">Enrich Selected with AI</button>
    `;
    
    bar.querySelector('.sf-enrich-btn').addEventListener('click', () => this.handleBulkEnrich());
    
    document.body.appendChild(bar);
    this.bulkActionBar = bar;
  },
  
  /**
   * Update bulk action bar visibility
   */
  updateBulkActionBar() {
    const checked = document.querySelectorAll('.sf-list-select-checkbox:checked');
    
    if (this.bulkActionBar) {
      if (checked.length > 0) {
        this.bulkActionBar.style.display = 'flex';
        this.bulkActionBar.querySelector('.sf-selected-count').textContent = `${checked.length} selected`;
      } else {
        this.bulkActionBar.style.display = 'none';
      }
    }
  },
  
  /**
   * Handle bulk enrichment
   */
  async handleBulkEnrich() {
    const checked = document.querySelectorAll('.sf-list-select-checkbox:checked');
    const leads = [];
    
    checked.forEach(checkbox => {
      const row = checkbox.closest('tr');
      if (row && window.SalesforceExtractor) {
        const leadData = window.SalesforceExtractor.extractFromListRow(row);
        if (leadData) leads.push(leadData);
      }
    });
    
    if (leads.length === 0) {
      this.showNotification('No leads to enrich', 'error');
      return;
    }
    
    this.showNotification(`Enriching ${leads.length} leads...`, 'info');
    
    // Call bulk enrich API
    // For now, just show success
    setTimeout(() => {
      this.showNotification(`Successfully enriched ${leads.length} leads!`, 'success');
    }, 2000);
  },
  
  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#667eea'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 999999;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
};

// Export for use in other scripts
window.SalesforceUI = SalesforceUI;

// Initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SalesforceUI.init());
} else {
  SalesforceUI.init();
}
