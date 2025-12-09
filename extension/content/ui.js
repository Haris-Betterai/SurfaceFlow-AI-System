/**
 * SurfaceFlow AI - UI Components
 * Injects UI elements into Buildertrend pages
 */

const SurfaceFlowUI = {
  injectedElements: new Set(),
  isSearching: false,

  // Mock OTA sources and results
  otaSources: [
    { id: 'internal', name: 'Internal Housing', icon: '🏠', color: '#10b981' },
    { id: 'airbnb', name: 'Airbnb', icon: '🏡', color: '#FF5A5F' },
    { id: 'expedia', name: 'Expedia', icon: '✈️', color: '#00355F' },
    { id: 'kayak', name: 'Kayak', icon: '🔍', color: '#FF690F' },
    { id: 'booking', name: 'Booking.com', icon: '🏨', color: '#003580' },
    { id: 'hotels', name: 'Hotels.com', icon: '⭐', color: '#D32F2F' }
  ],

  mockHotelResults: [
    {
      id: 'IH-001',
      name: 'Company Apartment A',
      source: 'internal',
      address: '456 Corporate Dr, Phoenix, AZ 85004',
      distance: 12.5,
      rating: 4.8,
      pricePerNight: 0,
      totalPrice: 0,
      amenities: ['WiFi', 'Parking', 'Kitchen', 'Laundry'],
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&h=200&fit=crop',
      cancellationPolicy: 'Flexible - Company property'
    },
    {
      id: 'AIR-67890',
      name: 'Downtown Panama City Loft',
      source: 'airbnb',
      address: '200 Harrison Ave, Panama City, FL 32401',
      distance: 3.8,
      rating: 4.5,
      pricePerNight: 175,
      totalPrice: 875,
      amenities: ['WiFi', 'Parking', 'Kitchen', 'Pool'],
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop',
      cancellationPolicy: 'Moderate - 50% refund up to 5 days before'
    },
    {
      id: 'EXP-12345',
      name: 'Hyatt Place Panama City',
      source: 'expedia',
      address: '123 Hotel Blvd, Panama City, FL 32405',
      distance: 5.2,
      rating: 4.2,
      pricePerNight: 145,
      totalPrice: 725,
      amenities: ['WiFi', 'Parking', 'Breakfast', 'Pool', 'Gym'],
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop',
      cancellationPolicy: 'Free cancellation until 24 hours before check-in'
    },
    {
      id: 'KAY-11111',
      name: 'Holiday Inn Express',
      source: 'kayak',
      address: '500 E Beach Dr, Panama City, FL 32408',
      distance: 7.1,
      rating: 3.8,
      pricePerNight: 119,
      totalPrice: 595,
      amenities: ['WiFi', 'Parking', 'Breakfast'],
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=300&h=200&fit=crop',
      cancellationPolicy: 'Non-refundable'
    },
    {
      id: 'BOK-22222',
      name: 'Courtyard by Marriott',
      source: 'booking',
      address: '301 Marina Dr, Panama City Beach, FL 32407',
      distance: 8.5,
      rating: 4.1,
      pricePerNight: 159,
      totalPrice: 795,
      amenities: ['WiFi', 'Parking', 'Pool', 'Restaurant'],
      image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=300&h=200&fit=crop',
      cancellationPolicy: 'Free cancellation until 48 hours before'
    },
    {
      id: 'HOT-33333',
      name: 'Hampton Inn Beach Resort',
      source: 'hotels',
      address: '450 Coastal Hwy, Panama City Beach, FL 32413',
      distance: 10.2,
      rating: 4.3,
      pricePerNight: 135,
      totalPrice: 675,
      amenities: ['WiFi', 'Parking', 'Breakfast', 'Beach Access'],
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=300&h=200&fit=crop',
      cancellationPolicy: 'Flexible - Full refund up to 24 hours before'
    }
  ],

  /**
   * Initialize UI injection
   */
  init(context, jobData) {
    console.log('[SurfaceFlow] Initializing UI for context:', context);
    this.context = context;
    this.jobData = jobData;
    
    // Always try to inject on job pages or if URL contains JobPage
    if (context.pageType === 'job_page' || context.pageType === 'job_detail' || 
        window.location.href.includes('/JobPage/') || window.location.href.includes('/Job/')) {
      this.injectHotelBookingButton();
    }
  },

  // Retry counter for button injection
  retryCount: 0,
  maxRetries: 15,

  /**
   * Inject the "Book Hotel with AI" button into the action bar
   */
  injectHotelBookingButton() {
    // Check if already injected
    if (document.getElementById('sf-hotel-booking-btn')) {
      console.log('[SurfaceFlow] Button already exists');
      return;
    }

    console.log('[SurfaceFlow] Looking for injection points...');

    // Strategy 1: Find the last tab element and insert button after it (inline with tabs)
    const tabElements = document.querySelectorAll('[role="tab"]');
    if (tabElements.length > 0) {
      const lastTab = tabElements[tabElements.length - 1];
      console.log('[SurfaceFlow] Found tabs, inserting after last tab');
      
      const container = this.createButtonElement();
      lastTab.parentNode.insertBefore(container, lastTab.nextSibling);
      this.attachButtonHandler();
      return;
    }

    // Strategy 2: Find tablist and append inside it
    const tabList = document.querySelector('[role="tablist"]');
    if (tabList) {
      console.log('[SurfaceFlow] Found tablist, appending inside');
      const container = this.createButtonElement();
      tabList.appendChild(container);
      this.attachButtonHandler();
      return;
    }

    // Strategy 3: Look for other common containers
    const fallbackSelectors = [
      '.ant-tabs-nav-list',
      '.bds-tabs',
      '.bds-tab-bar',
      '.bds-header-action-bar'
    ];

    for (const selector of fallbackSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('[SurfaceFlow] Found fallback:', selector);
        const container = this.createButtonElement();
        element.appendChild(container);
        this.attachButtonHandler();
        return;
      }
    }

    // Retry if nothing found
    this.retryCount++;
    if (this.retryCount < this.maxRetries) {
      console.log(`[SurfaceFlow] No target found, retrying... (${this.retryCount}/${this.maxRetries})`);
      setTimeout(() => this.injectHotelBookingButton(), 1000);
      return;
    } else {
      // Fallback: inject floating button
      console.log('[SurfaceFlow] Max retries reached, using floating button');
      this.injectFloatingButton();
      return;
    }
  },

  /**
   * Create the button element
   */
  createButtonElement() {
    const container = document.createElement('div');
    container.id = 'sf-button-container';
    container.className = 'sf-button-container sf-inline';
    container.innerHTML = `
      <button id="sf-hotel-booking-btn" class="sf-action-button" type="button">
        <span class="sf-button-icon">🏨</span>
        <span class="sf-button-text">Book Hotel with AI</span>
      </button>
    `;
    this.injectedElements.add(container);
    return container;
  },

  /**
   * Attach click handler to button
   */
  attachButtonHandler() {
    const btn = document.getElementById('sf-hotel-booking-btn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openHotelSearchModal();
      });
      console.log('[SurfaceFlow] Hotel booking button injected successfully!');
    }
  },

  /**
   * Inject a floating button as fallback
   */
  injectFloatingButton() {
    if (document.getElementById('sf-hotel-booking-btn')) return;

    const container = document.createElement('div');
    container.id = 'sf-button-container';
    container.className = 'sf-floating-container';
    container.innerHTML = `
      <button id="sf-hotel-booking-btn" class="sf-floating-button" type="button">
        <span class="sf-button-icon">🏨</span>
        <span class="sf-button-text">Book Hotel with AI</span>
      </button>
    `;

    document.body.appendChild(container);

    document.getElementById('sf-hotel-booking-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openHotelSearchModal();
    });

    this.injectedElements.add(container);
    console.log('[SurfaceFlow] Floating button injected');
  },

  /**
   * Open the hotel search modal
   */
  openHotelSearchModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('sf-modal-overlay');
    if (existingModal) existingModal.remove();

    // Get job data
    const jobData = this.jobData || window.BuildertrendExtractor.extractJobData();
    const address = jobData.address?.formatted || 'Panama City, FL';

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'sf-modal-overlay';
    modal.className = 'sf-modal-overlay';
    modal.innerHTML = this.getModalHTML(jobData, address);

    document.body.appendChild(modal);
    this.injectedElements.add(modal);

    // Add event listeners
    this.setupModalEventListeners(modal);

    // Start search animation after a brief delay
    setTimeout(() => this.startSearchAnimation(), 500);
  },

  /**
   * Get modal HTML
   */
  getModalHTML(jobData, address) {
    const checkIn = this.formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const checkOut = this.formatDate(new Date(Date.now() + 12 * 24 * 60 * 60 * 1000));

    return `
      <div class="sf-modal">
        <div class="sf-modal-header">
          <div class="sf-modal-header-left">
            <div class="sf-modal-logo">
              <span class="sf-logo-icon">🌊</span>
              <span class="sf-logo-text">SurfaceFlow AI</span>
            </div>
            <span class="sf-modal-divider">|</span>
            <span class="sf-modal-title">Hotel Booking Assistant</span>
          </div>
          <button class="sf-modal-close" id="sf-modal-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="sf-modal-content">
          <!-- Job Info Card -->
          <div class="sf-job-info-card">
            <div class="sf-job-header">
              <div class="sf-job-icon">📋</div>
              <div class="sf-job-details">
                <h3 class="sf-job-name">${jobData.jobName || 'Construction Project'}</h3>
                <p class="sf-job-address">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  ${address}
                </p>
              </div>
            </div>
            
            <div class="sf-booking-params">
              <div class="sf-param-group">
                <label>Check-in</label>
                <input type="date" id="sf-check-in" value="${checkIn}" class="sf-input">
              </div>
              <div class="sf-param-group">
                <label>Check-out</label>
                <input type="date" id="sf-check-out" value="${checkOut}" class="sf-input">
              </div>
              <div class="sf-param-group">
                <label>Crew Size</label>
                <select id="sf-crew-size" class="sf-input">
                  <option value="2">2 people</option>
                  <option value="4" selected>4 people</option>
                  <option value="6">6 people</option>
                  <option value="8">8 people</option>
                </select>
              </div>
              <div class="sf-param-group">
                <label>Max Price/Night</label>
                <select id="sf-max-price" class="sf-input">
                  <option value="100">$100</option>
                  <option value="150" selected>$150</option>
                  <option value="200">$200</option>
                  <option value="250">$250</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Search Status -->
          <div class="sf-search-section">
            <div class="sf-search-header">
              <h4>Searching Accommodation Sources</h4>
              <span class="sf-search-status" id="sf-search-status">Initializing...</span>
            </div>
            
            <div class="sf-source-grid" id="sf-source-grid">
              ${this.otaSources.map(source => `
                <div class="sf-source-card" id="sf-source-${source.id}" data-source="${source.id}">
                  <div class="sf-source-icon" style="color: ${source.color}">${source.icon}</div>
                  <div class="sf-source-name">${source.name}</div>
                  <div class="sf-source-status">
                    <span class="sf-status-waiting">Waiting</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Results Section -->
          <div class="sf-results-section" id="sf-results-section" style="display: none;">
            <div class="sf-results-header">
              <h4>🎉 Found <span id="sf-results-count">0</span> Options</h4>
              <div class="sf-sort-dropdown">
                <label>Sort by:</label>
                <select id="sf-sort-by" class="sf-input-sm">
                  <option value="recommended">Recommended</option>
                  <option value="price">Lowest Price</option>
                  <option value="distance">Closest</option>
                  <option value="rating">Best Rated</option>
                </select>
              </div>
            </div>
            
            <div class="sf-results-grid" id="sf-results-grid">
              <!-- Results will be inserted here -->
            </div>
          </div>
        </div>

        <div class="sf-modal-footer">
          <div class="sf-footer-info">
            <span class="sf-powered-by">Powered by SurfaceFlow AI • AM-002</span>
          </div>
          <div class="sf-footer-actions">
            <button class="sf-btn sf-btn-secondary" id="sf-cancel-btn">Cancel</button>
            <button class="sf-btn sf-btn-primary" id="sf-book-btn" disabled>
              <span class="sf-btn-icon">✓</span>
              Request Approval
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Setup modal event listeners
   */
  setupModalEventListeners(modal) {
    // Close button
    modal.querySelector('#sf-modal-close').addEventListener('click', () => {
      modal.remove();
    });

    // Cancel button
    modal.querySelector('#sf-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Book button
    modal.querySelector('#sf-book-btn').addEventListener('click', () => {
      this.handleBookingRequest();
    });

    // Sort dropdown
    modal.querySelector('#sf-sort-by').addEventListener('change', (e) => {
      this.sortResults(e.target.value);
    });
  },

  /**
   * Start the search animation - goes through each OTA source one by one
   * Now integrates with Django backend API
   */
  async startSearchAnimation() {
    this.isSearching = true;
    const statusEl = document.getElementById('sf-search-status');
    const resultsSection = document.getElementById('sf-results-section');
    const resultsGrid = document.getElementById('sf-results-grid');
    const resultsCount = document.getElementById('sf-results-count');
    const bookBtn = document.getElementById('sf-book-btn');

    // Initial status
    statusEl.textContent = 'Initializing search...';
    await this.delay(500);

    // Animate each source one by one with clear visual feedback
    for (let i = 0; i < this.otaSources.length; i++) {
      if (!this.isSearching) break;

      const source = this.otaSources[i];
      const sourceCard = document.getElementById(`sf-source-${source.id}`);
      
      // Highlight the current source being searched
      statusEl.textContent = `🔍 Searching ${source.name}...`;
      statusEl.style.color = source.color;
      
      // Set searching state with animation
      sourceCard.classList.add('searching');
      sourceCard.style.transform = 'scale(1.05)';
      sourceCard.style.boxShadow = `0 0 20px ${source.color}40`;
      sourceCard.querySelector('.sf-source-status').innerHTML = `
        <span class="sf-status-searching">
          <span class="sf-spinner"></span>
          Searching...
        </span>
      `;

      // Wait for "search" - longer delay so user can see each step
      await this.delay(1200 + Math.random() * 400);

      // Get results for this source (from mock data or API response)
      const sourceResults = this.mockHotelResults.filter(h => h.source === source.id);
      const hasResults = sourceResults.length > 0;

      // Update source card with results
      sourceCard.classList.remove('searching');
      sourceCard.style.transform = '';
      sourceCard.style.boxShadow = '';
      sourceCard.classList.add(hasResults ? 'found' : 'no-results');
      
      if (hasResults) {
        sourceCard.querySelector('.sf-source-status').innerHTML = 
          `<span class="sf-status-found">✓ ${sourceResults.length} found</span>`;
        
        // Show results section and add cards with animation
        resultsSection.style.display = 'block';
        for (const hotel of sourceResults) {
          const cardHTML = this.getHotelCardHTML(hotel);
          resultsGrid.insertAdjacentHTML('beforeend', cardHTML);
          // Brief delay between cards appearing
          await this.delay(150);
        }
        resultsCount.textContent = resultsGrid.querySelectorAll('.sf-hotel-card').length;
      } else {
        sourceCard.querySelector('.sf-source-status').innerHTML = 
          `<span class="sf-status-none">No results</span>`;
      }

      // Small pause before next source
      await this.delay(300);
    }

    // After animation, call the backend API to sync the data
    this.syncWithBackend();

    // Search complete
    statusEl.textContent = 'Search complete!';
    statusEl.classList.add('complete');
    bookBtn.disabled = false;

    // Add click handlers to hotel cards
    document.querySelectorAll('.sf-hotel-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.sf-hotel-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });

    // Auto-select the first (recommended) option
    const firstCard = document.querySelector('.sf-hotel-card');
    if (firstCard) firstCard.classList.add('selected');
  },

  /**
   * Sync job data and search results with backend API
   */
  async syncWithBackend() {
    const API_BASE = 'http://localhost:8000/api/v1';
    
    try {
      const jobData = this.jobData || window.BuildertrendExtractor?.extractJobData() || {};
      
      // Call the hotel search API
      const response = await fetch(`${API_BASE}/buildertrend/hotel-booking/search/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Extension-Id': 'surfaceflow-ai'
        },
        body: JSON.stringify({
          job_data: {
            jobId: jobData.jobId || 'unknown',
            jobName: jobData.jobName || 'Unknown Job',
            address: jobData.address || {},
            schedule: jobData.schedule || {}
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[SurfaceFlow] Backend sync successful:', data);
        this.backendBookingJobId = data.booking_job_id;
        
        // Store for later use when approving
        this.backendHotels = data.hotels;
      } else {
        console.warn('[SurfaceFlow] Backend sync failed:', response.status);
      }
    } catch (error) {
      console.warn('[SurfaceFlow] Could not connect to backend:', error.message);
      // Continue with mock data if backend is unavailable
    }
  },

  /**
   * Get HTML for a hotel card
   */
  getHotelCardHTML(hotel) {
    const sourceInfo = this.otaSources.find(s => s.id === hotel.source);
    const priceDisplay = hotel.pricePerNight === 0 ? 'FREE' : `$${hotel.pricePerNight}/night`;
    const totalDisplay = hotel.totalPrice === 0 ? 'Internal Housing' : `$${hotel.totalPrice} total`;

    return `
      <div class="sf-hotel-card" data-hotel-id="${hotel.id}">
        <div class="sf-hotel-image" style="background-image: url('${hotel.image}')">
          <div class="sf-hotel-source-badge" style="background-color: ${sourceInfo.color}">
            ${sourceInfo.icon} ${sourceInfo.name}
          </div>
          ${hotel.pricePerNight === 0 ? '<div class="sf-hotel-free-badge">🏠 INTERNAL</div>' : ''}
        </div>
        <div class="sf-hotel-info">
          <div class="sf-hotel-name-row">
            <h5 class="sf-hotel-name">${hotel.name}</h5>
            <div class="sf-hotel-rating">
              ⭐ ${hotel.rating}
            </div>
          </div>
          <p class="sf-hotel-address">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            ${hotel.address}
          </p>
          <p class="sf-hotel-distance">📍 ${hotel.distance} miles from jobsite</p>
          <div class="sf-hotel-amenities">
            ${hotel.amenities.slice(0, 4).map(a => `<span class="sf-amenity">${a}</span>`).join('')}
          </div>
          <div class="sf-hotel-footer">
            <div class="sf-hotel-price">
              <span class="sf-price-amount ${hotel.pricePerNight === 0 ? 'free' : ''}">${priceDisplay}</span>
              <span class="sf-price-total">${totalDisplay}</span>
            </div>
            <div class="sf-hotel-policy">
              ${hotel.cancellationPolicy.includes('Free') || hotel.cancellationPolicy.includes('Flexible') 
                ? '<span class="sf-policy-good">✓ ' + hotel.cancellationPolicy.split('-')[0] + '</span>' 
                : '<span class="sf-policy-warn">⚠ ' + hotel.cancellationPolicy + '</span>'}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Sort results
   */
  sortResults(sortBy) {
    const grid = document.getElementById('sf-results-grid');
    const cards = Array.from(grid.querySelectorAll('.sf-hotel-card'));

    cards.sort((a, b) => {
      const hotelA = this.mockHotelResults.find(h => h.id === a.dataset.hotelId);
      const hotelB = this.mockHotelResults.find(h => h.id === b.dataset.hotelId);

      switch (sortBy) {
        case 'price':
          return hotelA.pricePerNight - hotelB.pricePerNight;
        case 'distance':
          return hotelA.distance - hotelB.distance;
        case 'rating':
          return hotelB.rating - hotelA.rating;
        default: // recommended - internal first, then by score
          if (hotelA.source === 'internal') return -1;
          if (hotelB.source === 'internal') return 1;
          return (hotelB.rating * 10 - hotelB.distance - hotelB.pricePerNight / 10) - 
                 (hotelA.rating * 10 - hotelA.distance - hotelA.pricePerNight / 10);
      }
    });

    grid.innerHTML = '';
    cards.forEach(card => grid.appendChild(card));
  },

  /**
   * Handle booking request - now sends to backend API
   */
  async handleBookingRequest() {
    const selectedCard = document.querySelector('.sf-hotel-card.selected');
    if (!selectedCard) {
      alert('Please select a hotel first');
      return;
    }

    const hotelId = selectedCard.dataset.hotelId;
    const hotel = this.mockHotelResults.find(h => h.id === hotelId);

    // Try to approve through backend
    if (this.backendBookingJobId) {
      try {
        const response = await fetch('http://localhost:8000/api/v1/buildertrend/hotel-booking/approve/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Extension-Id': 'surfaceflow-ai'
          },
          body: JSON.stringify({
            booking_job_id: this.backendBookingJobId,
            hotel_id: hotelId
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[SurfaceFlow] Booking approved:', data);
        }
      } catch (error) {
        console.warn('[SurfaceFlow] Could not approve through backend:', error.message);
      }
    }

    // Show confirmation message
    const modal = document.getElementById('sf-modal-overlay');
    modal.querySelector('.sf-modal-content').innerHTML = `
      <div class="sf-confirmation">
        <div class="sf-confirmation-icon">📧</div>
        <h3>Approval Request Sent!</h3>
        <p>An SMS has been sent to the Project Manager for approval.</p>
        <div class="sf-confirmation-details">
          <div class="sf-confirmation-hotel">
            <strong>${hotel.name}</strong>
            <p>${hotel.address}</p>
            <p class="sf-confirmation-price">Total: ${hotel.totalPrice === 0 ? 'Free (Internal)' : '$' + hotel.totalPrice}</p>
          </div>
          <div class="sf-confirmation-status">
            <span class="sf-status-pending">⏳ Awaiting Approval</span>
          </div>
        </div>
        <p class="sf-confirmation-note">You'll receive a notification once the booking is approved or rejected.</p>
        <p class="sf-confirmation-sync">✓ Synced with SurfaceFlow Portal</p>
      </div>
    `;

    modal.querySelector('.sf-modal-footer').innerHTML = `
      <div class="sf-footer-actions">
        <button class="sf-btn sf-btn-secondary" id="sf-view-portal-btn">View in Portal</button>
        <button class="sf-btn sf-btn-primary" id="sf-done-btn">Done</button>
      </div>
    `;

    modal.querySelector('#sf-done-btn').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#sf-view-portal-btn').addEventListener('click', () => {
      window.open('http://localhost:3000/modules/hotel-booking', '_blank');
    });
  },

  /**
   * Utility: Format date for input
   */
  formatDate(date) {
    return date.toISOString().split('T')[0];
  },

  /**
   * Utility: Delay promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Export for use in other scripts
window.SurfaceFlowUI = SurfaceFlowUI;
