/**
 * SurfaceFlow AI - Core UI Utilities
 * Shared UI components and utilities for all platforms
 */

const SurfaceFlowUICore = {
  /**
   * Create a styled button element
   */
  createButton(options = {}) {
    const {
      id = '',
      text = 'SurfaceFlow',
      icon = '🌊',
      onClick = () => {},
      variant = 'primary', // primary, secondary, success
      size = 'medium' // small, medium, large
    } = options;
    
    const colors = {
      primary: { bg: '#1e293b', hover: '#334155', text: '#ffffff' },
      secondary: { bg: '#f1f5f9', hover: '#e2e8f0', text: '#1e293b' },
      success: { bg: '#10b981', hover: '#059669', text: '#ffffff' }
    };
    
    const sizes = {
      small: { padding: '6px 12px', fontSize: '12px' },
      medium: { padding: '10px 20px', fontSize: '14px' },
      large: { padding: '14px 28px', fontSize: '16px' }
    };
    
    const color = colors[variant] || colors.primary;
    const sizeStyle = sizes[size] || sizes.medium;
    
    const button = document.createElement('button');
    button.id = id;
    button.className = 'sf-button';
    button.innerHTML = `
      <span class="sf-button-icon">${icon}</span>
      <span class="sf-button-text">${text}</span>
    `;
    
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: ${sizeStyle.padding};
      font-size: ${sizeStyle.fontSize};
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${color.bg};
      color: ${color.text};
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.background = color.hover;
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = color.bg;
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
    
    button.addEventListener('click', onClick);
    
    return button;
  },
  
  /**
   * Create a modal overlay
   */
  createModal(options = {}) {
    const {
      id = 'sf-modal',
      title = 'SurfaceFlow AI',
      content = '',
      onClose = () => {}
    } = options;
    
    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'sf-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      animation: sfFadeIn 0.2s ease;
    `;
    
    overlay.innerHTML = `
      <style>
        @keyframes sfFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sfSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      </style>
      <div class="sf-modal" style="
        background: white;
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        animation: sfSlideIn 0.3s ease;
      ">
        <div class="sf-modal-header" style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">🌊</span>
            <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #1e293b;">${title}</h2>
          </div>
          <button class="sf-modal-close" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #64748b;
            padding: 4px;
            line-height: 1;
          ">×</button>
        </div>
        <div class="sf-modal-content" style="padding: 24px; overflow-y: auto; max-height: 60vh;">
          ${content}
        </div>
      </div>
    `;
    
    // Close handlers
    overlay.querySelector('.sf-modal-close').addEventListener('click', () => {
      overlay.remove();
      onClose();
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        onClose();
      }
    });
    
    return overlay;
  },
  
  /**
   * Show a toast notification
   */
  showToast(message, type = 'info', duration = 3000) {
    const colors = {
      info: { bg: '#3b82f6', icon: 'ℹ️' },
      success: { bg: '#10b981', icon: '✅' },
      warning: { bg: '#f59e0b', icon: '⚠️' },
      error: { bg: '#ef4444', icon: '❌' }
    };
    
    const color = colors[type] || colors.info;
    
    const toast = document.createElement('div');
    toast.className = 'sf-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: ${color.bg};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 9999999;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: sfSlideUp 0.3s ease;
    `;
    
    toast.innerHTML = `
      <style>
        @keyframes sfSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
      <span>${color.icon}</span>
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'sfSlideUp 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  
  /**
   * Create a loading spinner
   */
  createSpinner(size = 24) {
    const spinner = document.createElement('div');
    spinner.className = 'sf-spinner';
    spinner.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: sfSpin 0.8s linear infinite;
    `;
    spinner.innerHTML = `
      <style>
        @keyframes sfSpin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    return spinner;
  },
  
  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Export for use in other scripts
window.SurfaceFlowUICore = SurfaceFlowUICore;
