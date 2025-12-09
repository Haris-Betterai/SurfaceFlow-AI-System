/**
 * SurfaceFlow AI - Core API Module
 * Shared API communication layer for all platform integrations
 */

const SurfaceFlowAPI = {
  BASE_URL: 'http://127.0.0.1:8000/api/v1',
  
  /**
   * Make an API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.BASE_URL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-Id': 'surfaceflow-ai'
      }
    };
    
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    console.log(`[SurfaceFlow API] ${options.method || 'GET'} ${endpoint}`);
    
    try {
      const response = await fetch(url, mergedOptions);
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`[SurfaceFlow API] Error:`, data);
        return { success: false, error: data.error || 'Request failed' };
      }
      
      console.log(`[SurfaceFlow API] Success:`, data);
      return data;
    } catch (error) {
      console.error(`[SurfaceFlow API] Network error:`, error);
      return { success: false, error: 'Network error - backend not reachable' };
    }
  },
  
  /**
   * POST request helper
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  /**
   * GET request helper
   */
  async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET'
    });
  },
  
  // ===== BUILDERTREND ENDPOINTS =====
  
  buildertrend: {
    async searchHotels(jobData) {
      return SurfaceFlowAPI.post('/buildertrend/hotel-booking/search/', {
        job_data: jobData,
        source: 'chrome_extension'
      });
    },
    
    async approveBooking(bookingJobId, hotelId) {
      return SurfaceFlowAPI.post('/buildertrend/hotel-booking/approve/', {
        booking_job_id: bookingJobId,
        hotel_id: hotelId
      });
    },
    
    async getSearchHistory() {
      return SurfaceFlowAPI.get('/buildertrend/hotel-booking/searches/');
    },
    
    async getApprovalHistory() {
      return SurfaceFlowAPI.get('/buildertrend/hotel-booking/approvals/');
    }
  },
  
  // ===== SALESFORCE ENDPOINTS =====
  
  salesforce: {
    async enrichLead(leadData) {
      return SurfaceFlowAPI.post('/salesforce/lead-enrichment/enrich/', {
        lead_data: leadData,
        source: 'chrome_extension'
      });
    },
    
    async getEnrichmentHistory() {
      return SurfaceFlowAPI.get('/salesforce/lead-enrichment/history/');
    },
    
    async getEnrichmentStatus(enrichmentId) {
      return SurfaceFlowAPI.get(`/salesforce/lead-enrichment/status/${enrichmentId}/`);
    },
    
    async getMockLeads() {
      return SurfaceFlowAPI.get('/salesforce/lead-enrichment/mock-leads/');
    }
  }
};

// Export for use in other scripts
window.SurfaceFlowAPI = SurfaceFlowAPI;
