/**
 * SurfaceFlow AI - Salesforce Data Extractor
 * Extracts lead/contact data from Salesforce pages
 */

const SalesforceExtractor = {
  /**
   * Extract lead data from the current page
   */
  extractLeadData() {
    const data = {
      id: this.extractRecordId(),
      name: this.extractName(),
      company: this.extractCompany(),
      email: this.extractEmail(),
      phone: this.extractPhone(),
      title: this.extractTitle(),
      status: this.extractStatus(),
      source: this.extractSource()
    };
    
    console.log('[SurfaceFlow] Extracted Salesforce lead data:', data);
    return data;
  },
  
  /**
   * Extract record ID from URL
   */
  extractRecordId() {
    const match = window.location.href.match(/\/lightning\/r\/(?:Lead|Contact)\/([a-zA-Z0-9]+)\/view/);
    return match ? match[1] : null;
  },
  
  /**
   * Extract name from page
   */
  extractName() {
    // Try Salesforce Lightning header
    const headerTitle = document.querySelector('.slds-page-header__title, [data-field="Name"] lightning-formatted-name');
    if (headerTitle) return headerTitle.textContent?.trim();
    
    // Try record name field
    const nameField = document.querySelector('[data-target-selection-name="sfdc:RecordField.Lead.Name"]');
    if (nameField) return nameField.textContent?.trim();
    
    return null;
  },
  
  /**
   * Extract company from page
   */
  extractCompany() {
    const companyField = document.querySelector('[data-target-selection-name="sfdc:RecordField.Lead.Company"]');
    if (companyField) return companyField.textContent?.trim();
    
    const companyInput = document.querySelector('[data-field="Company"] input');
    if (companyInput) return companyInput.value?.trim();
    
    return null;
  },
  
  /**
   * Extract email from page
   */
  extractEmail() {
    const emailField = document.querySelector('[data-target-selection-name="sfdc:RecordField.Lead.Email"] a');
    if (emailField) return emailField.textContent?.trim();
    
    const emailLink = document.querySelector('a[href^="mailto:"]');
    if (emailLink) return emailLink.textContent?.trim();
    
    return null;
  },
  
  /**
   * Extract phone from page
   */
  extractPhone() {
    const phoneField = document.querySelector('[data-target-selection-name="sfdc:RecordField.Lead.Phone"] a');
    if (phoneField) return phoneField.textContent?.trim();
    
    const phoneLink = document.querySelector('a[href^="tel:"]');
    if (phoneLink) return phoneLink.textContent?.trim();
    
    return null;
  },
  
  /**
   * Extract title from page
   */
  extractTitle() {
    const titleField = document.querySelector('[data-target-selection-name="sfdc:RecordField.Lead.Title"]');
    if (titleField) return titleField.textContent?.trim();
    
    return null;
  },
  
  /**
   * Extract status from page
   */
  extractStatus() {
    const statusField = document.querySelector('[data-target-selection-name="sfdc:RecordField.Lead.Status"]');
    if (statusField) return statusField.textContent?.trim();
    
    return null;
  },
  
  /**
   * Extract source from page
   */
  extractSource() {
    const sourceField = document.querySelector('[data-target-selection-name="sfdc:RecordField.Lead.LeadSource"]');
    if (sourceField) return sourceField.textContent?.trim();
    
    return null;
  },
  
  /**
   * Extract data from a list row (when on list view)
   */
  extractFromListRow(row) {
    if (!row) return null;
    
    const cells = row.querySelectorAll('td');
    if (cells.length < 2) return null;
    
    return {
      id: row.dataset.rowKeyValue || null,
      name: cells[0]?.textContent?.trim() || null,
      company: cells[1]?.textContent?.trim() || null,
      email: cells[2]?.textContent?.trim() || null,
      phone: cells[3]?.textContent?.trim() || null
    };
  }
};

// Export for use in other scripts
window.SalesforceExtractor = SalesforceExtractor;
