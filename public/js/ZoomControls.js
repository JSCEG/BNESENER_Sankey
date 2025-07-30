/**
 * ZoomControls - UI component for zoom control buttons
 * Provides visual controls for zoom in/out/reset functionality
 */
class ZoomControls {
  constructor(container, zoomManager) {
    this.container = container;
    this.zoomManager = zoomManager;
    this.controlsElement = null;
    this.buttons = {};
    this.zoomIndicator = null;
    
    // Mobile detection
    this.isMobile = this.detectMobileDevice();
    this.isTouch = this.detectTouchSupport();
    
    // Configuration with mobile optimizations (Requirement 4.3, 4.4)
    this.options = {
      position: 'top-right', // top-right, top-left, bottom-right, bottom-left
      showZoomIndicator: true,
      showResetButton: true,
      buttonSize: this.isMobile ? 'large' : 'medium', // Larger buttons for mobile
      touchFriendly: this.isTouch, // Enable touch-friendly features
      adaptiveSpacing: this.isMobile // Increase spacing on mobile
    };
    
    this.initialize();
  }

  /**
   * Initialize the zoom controls
   */
  initialize() {
    this.render();
    this.setupEventListeners();
    this.updateButtonStates();
    this.applyMobileOptimizations();
    
    console.log(`ZoomControls initialized successfully (Mobile: ${this.isMobile}, Touch: ${this.isTouch})`);
  }

  /**
   * Detect if the device is mobile (Requirement 4.3)
   * @returns {boolean} True if mobile device detected
   */
  detectMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const screenWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return mobileRegex.test(userAgent) || screenWidth <= 768;
  }

  /**
   * Detect if the device supports touch (Requirement 4.3)
   * @returns {boolean} True if touch is supported
   */
  detectTouchSupport() {
    return 'ontouchstart' in window || 
           navigator.maxTouchPoints > 0 || 
           navigator.msMaxTouchPoints > 0;
  }

  /**
   * Apply mobile-specific optimizations (Requirement 4.3, 4.4, 4.5)
   */
  applyMobileOptimizations() {
    if (!this.controlsElement) return;

    // Add mobile-specific classes
    if (this.isMobile) {
      this.controlsElement.classList.add('zoom-controls-mobile');
    }
    
    if (this.isTouch) {
      this.controlsElement.classList.add('zoom-controls-touch');
    }

    // Adjust button sizes for touch interfaces (Requirement 4.3)
    if (this.options.touchFriendly) {
      Object.values(this.buttons).forEach(button => {
        if (button) {
          button.classList.add('zoom-btn-touch-optimized');
        }
      });
    }

    // Add adaptive spacing for mobile (Requirement 4.3)
    if (this.options.adaptiveSpacing) {
      this.controlsElement.classList.add('zoom-controls-adaptive-spacing');
    }

    // Handle orientation changes on mobile
    if (this.isMobile) {
      this.setupOrientationHandling();
    }
  }

  /**
   * Render the zoom controls HTML structure
   */
  render() {
    // Create main controls container
    this.controlsElement = document.createElement('div');
    this.controlsElement.className = 'zoom-controls';
    this.controlsElement.setAttribute('role', 'toolbar');
    this.controlsElement.setAttribute('aria-label', 'Controles de zoom');

    // Create zoom buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'zoom-buttons';

    // Create zoom in button
    this.buttons.zoomIn = this.createButton({
      id: 'zoom-in-btn',
      className: 'zoom-btn zoom-in-btn',
      innerHTML: '<span class="zoom-icon">+</span>',
      title: 'Aumentar zoom (25%)',
      ariaLabel: 'Aumentar zoom'
    });

    // Create zoom out button
    this.buttons.zoomOut = this.createButton({
      id: 'zoom-out-btn',
      className: 'zoom-btn zoom-out-btn',
      innerHTML: '<span class="zoom-icon">−</span>',
      title: 'Disminuir zoom (25%)',
      ariaLabel: 'Disminuir zoom'
    });

    // Create reset button
    if (this.options.showResetButton) {
      this.buttons.reset = this.createButton({
        id: 'zoom-reset-btn',
        className: 'zoom-btn zoom-reset-btn',
        innerHTML: '<span class="zoom-icon">⌂</span>',
        title: 'Restablecer zoom (100%)',
        ariaLabel: 'Restablecer zoom al 100%'
      });
    }

    // Add buttons to container
    buttonsContainer.appendChild(this.buttons.zoomIn);
    buttonsContainer.appendChild(this.buttons.zoomOut);
    if (this.buttons.reset) {
      buttonsContainer.appendChild(this.buttons.reset);
    }

    // Create zoom indicator
    if (this.options.showZoomIndicator) {
      this.zoomIndicator = document.createElement('div');
      this.zoomIndicator.className = 'zoom-indicator';
      this.zoomIndicator.setAttribute('aria-live', 'polite');
      this.zoomIndicator.setAttribute('aria-label', 'Nivel de zoom actual');
      this.updateZoomIndicator();
    }

    // Assemble the controls
    this.controlsElement.appendChild(buttonsContainer);
    if (this.zoomIndicator) {
      this.controlsElement.appendChild(this.zoomIndicator);
    }

    // Add to container
    this.container.appendChild(this.controlsElement);
  }

  /**
   * Create a button element with specified properties
   * @param {Object} config - Button configuration
   * @returns {HTMLButtonElement} The created button
   */
  createButton(config) {
    const button = document.createElement('button');
    button.id = config.id;
    button.className = config.className;
    button.innerHTML = config.innerHTML;
    button.title = config.title;
    button.setAttribute('aria-label', config.ariaLabel);
    button.type = 'button';
    
    return button;
  }

  /**
   * Set up event listeners for the zoom controls
   */
  setupEventListeners() {
    // Zoom in button (Requirement 2.2)
    this.buttons.zoomIn.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleZoomIn();
    });

    // Zoom out button (Requirement 2.3)
    this.buttons.zoomOut.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleZoomOut();
    });

    // Reset button (Requirement 2.4)
    if (this.buttons.reset) {
      this.buttons.reset.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleReset();
      });
    }

    // Listen for zoom changes from ZoomManager
    if (this.zoomManager && this.zoomManager.plotlyDiv) {
      this.zoomManager.plotlyDiv.addEventListener('zoomchange', (e) => {
        this.updateZoomLevel(e.detail.currentZoom);
      });
    }

    // Add keyboard support
    this.controlsElement.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });

    // Add mouse enter/leave for visual feedback
    Object.values(this.buttons).forEach(button => {
      if (button) {
        button.addEventListener('mouseenter', () => {
          if (!button.disabled) {
            this.addHoverFeedback(button);
          }
        });

        button.addEventListener('mouseleave', () => {
          this.removeHoverFeedback(button);
        });

        // Add enhanced touch feedback for mobile devices (Requirement 4.3, 4.4)
        button.addEventListener('touchstart', (e) => {
          if (!button.disabled) {
            this.addTouchFeedback(button);
            // Prevent double-tap zoom on mobile browsers
            e.preventDefault();
          }
        }, { passive: false });

        button.addEventListener('touchend', (e) => {
          this.removeTouchFeedback(button);
          // Ensure touch events don't trigger mouse events
          e.preventDefault();
        }, { passive: false });

        // Add touch cancel handling for better mobile experience
        button.addEventListener('touchcancel', () => {
          this.removeTouchFeedback(button);
        }, { passive: true });
      }
    });
  }

  /**
   * Handle zoom in button click (Requirement 2.2 - 25% increments)
   */
  handleZoomIn() {
    if (this.zoomManager && !this.buttons.zoomIn.disabled) {
      const currentZoom = this.zoomManager.getCurrentZoom();
      const newZoom = currentZoom + 0.25; // 25% increment
      
      // Check if we can zoom in
      if (newZoom <= this.zoomManager.maxZoom) {
        this.zoomManager.zoomIn(0.25);
        this.addButtonFeedback(this.buttons.zoomIn);
        
        // Announce to screen readers
        this.announceZoomChange(`Zoom aumentado a ${Math.round(newZoom * 100)}%`);
      }
    }
  }

  /**
   * Handle zoom out button click (Requirement 2.3 - 25% decrements)
   */
  handleZoomOut() {
    if (this.zoomManager && !this.buttons.zoomOut.disabled) {
      const currentZoom = this.zoomManager.getCurrentZoom();
      const newZoom = currentZoom - 0.25; // 25% decrement
      
      // Check if we can zoom out
      if (newZoom >= this.zoomManager.minZoom) {
        this.zoomManager.zoomOut(0.25);
        this.addButtonFeedback(this.buttons.zoomOut);
        
        // Announce to screen readers
        this.announceZoomChange(`Zoom reducido a ${Math.round(newZoom * 100)}%`);
      }
    }
  }

  /**
   * Handle reset button click (Requirement 2.4 - restore to 100%)
   */
  handleReset() {
    if (this.zoomManager && this.buttons.reset) {
      this.zoomManager.resetZoom();
      this.addButtonFeedback(this.buttons.reset);
      
      // Announce to screen readers
      this.announceZoomChange('Zoom restablecido al 100%');
    }
  }

  /**
   * Add visual feedback to button clicks
   * @param {HTMLButtonElement} button - The button that was clicked
   */
  addButtonFeedback(button) {
    button.classList.add('zoom-btn-active');
    setTimeout(() => {
      button.classList.remove('zoom-btn-active');
    }, 150);
  }

  /**
   * Add hover feedback to buttons
   * @param {HTMLButtonElement} button - The button being hovered
   */
  addHoverFeedback(button) {
    button.classList.add('zoom-btn-hover');
  }

  /**
   * Remove hover feedback from buttons
   * @param {HTMLButtonElement} button - The button no longer being hovered
   */
  removeHoverFeedback(button) {
    button.classList.remove('zoom-btn-hover');
  }

  /**
   * Add touch feedback for mobile devices
   * @param {HTMLButtonElement} button - The button being touched
   */
  addTouchFeedback(button) {
    button.classList.add('zoom-btn-touch');
  }

  /**
   * Remove touch feedback from buttons
   * @param {HTMLButtonElement} button - The button no longer being touched
   */
  removeTouchFeedback(button) {
    button.classList.remove('zoom-btn-touch');
  }

  /**
   * Announce zoom changes to screen readers
   * @param {string} message - The message to announce
   */
  announceZoomChange(message) {
    // Create a temporary element for screen reader announcements
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    document.body.appendChild(announcement);
    announcement.textContent = message;
    
    // Remove after announcement
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }

  /**
   * Handle keyboard navigation within zoom controls
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyboardNavigation(event) {
    const buttons = Array.from(this.controlsElement.querySelectorAll('.zoom-btn'));
    const currentIndex = buttons.indexOf(document.activeElement);

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % buttons.length;
        buttons[nextIndex].focus();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        buttons[prevIndex].focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (document.activeElement && document.activeElement.click) {
          document.activeElement.click();
        }
        break;
    }
  }

  /**
   * Update zoom level display and button states
   * @param {number} level - The current zoom level
   */
  updateZoomLevel(level) {
    this.updateZoomIndicator(level);
    this.updateButtonStates(level);
  }

  /**
   * Update the zoom indicator display
   * @param {number} level - The current zoom level
   */
  updateZoomIndicator(level = null) {
    if (!this.zoomIndicator) return;

    const currentLevel = level !== null ? level : (this.zoomManager ? this.zoomManager.getCurrentZoom() : 1.0);
    const percentage = Math.round(currentLevel * 100);
    
    this.zoomIndicator.textContent = `${percentage}%`;
    this.zoomIndicator.title = `Zoom actual: ${percentage}%`;
  }

  /**
   * Update button states based on zoom level
   * @param {number} level - The current zoom level
   */
  updateButtonStates(level = null) {
    if (!this.zoomManager) return;

    const currentLevel = level !== null ? level : this.zoomManager.getCurrentZoom();
    const minZoom = this.zoomManager.minZoom;
    const maxZoom = this.zoomManager.maxZoom;

    // Update zoom in button (Requirement 2.5 - disable at max zoom 400%)
    const canZoomIn = currentLevel < maxZoom;
    this.setButtonState(this.buttons.zoomIn, canZoomIn, {
      enabledTitle: 'Aumentar zoom (25%)',
      disabledTitle: `Zoom máximo alcanzado (${Math.round(maxZoom * 100)}%)`,
      enabledClass: 'zoom-btn-enabled',
      disabledClass: 'zoom-btn-disabled'
    });

    // Update zoom out button (Requirement 2.6 - disable at min zoom 25%)
    const canZoomOut = currentLevel > minZoom;
    this.setButtonState(this.buttons.zoomOut, canZoomOut, {
      enabledTitle: 'Disminuir zoom (25%)',
      disabledTitle: `Zoom mínimo alcanzado (${Math.round(minZoom * 100)}%)`,
      enabledClass: 'zoom-btn-enabled',
      disabledClass: 'zoom-btn-disabled'
    });

    // Update reset button visibility and prominence (Requirement 6.2, 6.3)
    if (this.buttons.reset) {
      const isZoomed = Math.abs(currentLevel - 1.0) > 0.01;
      
      if (isZoomed) {
        this.buttons.reset.style.display = 'flex';
        this.buttons.reset.classList.add('zoom-reset-prominent');
        this.buttons.reset.setAttribute('aria-hidden', 'false');
        this.buttons.reset.title = `Restablecer zoom (actualmente ${Math.round(currentLevel * 100)}%)`;
      } else {
        this.buttons.reset.style.display = 'none';
        this.buttons.reset.classList.remove('zoom-reset-prominent');
        this.buttons.reset.setAttribute('aria-hidden', 'true');
      }
    }

    // Update visual state classes for styling
    this.controlsElement.classList.toggle('zoom-controls-active', currentLevel !== 1.0);
    this.controlsElement.classList.toggle('zoom-controls-max', currentLevel >= maxZoom);
    this.controlsElement.classList.toggle('zoom-controls-min', currentLevel <= minZoom);
  }

  /**
   * Set button state with proper accessibility attributes
   * @param {HTMLButtonElement} button - The button to update
   * @param {boolean} enabled - Whether the button should be enabled
   * @param {Object} options - Configuration options
   */
  setButtonState(button, enabled, options) {
    if (!button) return;

    button.disabled = !enabled;
    button.setAttribute('aria-disabled', !enabled);
    button.title = enabled ? options.enabledTitle : options.disabledTitle;
    
    // Update visual classes
    button.classList.toggle(options.enabledClass, enabled);
    button.classList.toggle(options.disabledClass, !enabled);
    
    // Update tabindex for keyboard navigation
    button.tabIndex = enabled ? 0 : -1;
  }

  /**
   * Show the zoom controls
   */
  show() {
    if (this.controlsElement) {
      this.controlsElement.style.display = 'block';
      this.controlsElement.setAttribute('aria-hidden', 'false');
    }
  }

  /**
   * Hide the zoom controls
   */
  hide() {
    if (this.controlsElement) {
      this.controlsElement.style.display = 'none';
      this.controlsElement.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Update the position of zoom controls
   * @param {string} position - New position (top-right, top-left, bottom-right, bottom-left)
   */
  setPosition(position) {
    if (this.controlsElement) {
      // Remove old position classes
      this.controlsElement.classList.remove(
        'zoom-controls-top-right',
        'zoom-controls-top-left', 
        'zoom-controls-bottom-right',
        'zoom-controls-bottom-left'
      );
      
      // Add new position class
      this.controlsElement.classList.add(`zoom-controls-${position}`);
      this.options.position = position;
    }
  }

  /**
   * Get current zoom level as percentage string
   * @returns {string} Zoom level as percentage
   */
  getZoomPercentage() {
    if (!this.zoomManager) return '100%';
    return `${Math.round(this.zoomManager.getCurrentZoom() * 100)}%`;
  }

  /**
   * Check if zoom controls are currently visible
   * @returns {boolean} True if controls are visible
   */
  isVisible() {
    return this.controlsElement && 
           this.controlsElement.style.display !== 'none' &&
           this.controlsElement.getAttribute('aria-hidden') !== 'true';
  }

  /**
   * Clean up event listeners and DOM elements
   */
  destroy() {
    if (this.controlsElement) {
      // Remove event listeners
      Object.values(this.buttons).forEach(button => {
        if (button && button.parentNode) {
          button.removeEventListener('click', this.handleZoomIn);
          button.removeEventListener('click', this.handleZoomOut);
          button.removeEventListener('click', this.handleReset);
        }
      });

      this.controlsElement.removeEventListener('keydown', this.handleKeyboardNavigation);

      // Remove from DOM
      if (this.controlsElement.parentNode) {
        this.controlsElement.parentNode.removeChild(this.controlsElement);
      }
    }

    // Clear references
    this.controlsElement = null;
    this.buttons = {};
    this.zoomIndicator = null;
    
    console.log('ZoomControls destroyed');
  }
}