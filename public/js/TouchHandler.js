/**
 * TouchHandler - Handles touch gestures for mobile zoom functionality
 * Provides pinch-to-zoom detection and touch event management
 */
class TouchHandler {
  constructor(element, zoomManager) {
    this.element = element;
    this.zoomManager = zoomManager;
    this.touches = [];
    this.initialDistance = 0;
    this.initialZoom = 1;
    this.isActive = false;
    this.lastTouchTime = 0;
    
    // Touch state tracking
    this.touchState = {
      isPinching: false,
      isPanning: false,
      startDistance: 0,
      startZoom: 1,
      startCenter: { x: 0, y: 0 },
      lastCenter: { x: 0, y: 0 },
      panStart: { x: 0, y: 0 }
    };
    
    // Configuration
    this.config = {
      minPinchDistance: 10, // Minimum distance between fingers to register pinch
      pinchThreshold: 5,    // Minimum distance change to trigger zoom
      doubleTapDelay: 300,  // Maximum time between taps for double-tap
      doubleTapDistance: 30 // Maximum distance between taps for double-tap
    };
    
    this.initialize();
  }

  /**
   * Initialize touch event listeners
   */
  initialize() {
    if (!this.element) {
      throw new Error('TouchHandler: element is required');
    }

    this.setupTouchListeners();
    console.log('TouchHandler initialized successfully');
  }

  /**
   * Set up touch event listeners with passive options for better performance
   */
  setupTouchListeners() {
    // Use passive: false for touchstart and touchmove to allow preventDefault
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
    
    console.log('Touch event listeners set up');
  }

  /**
   * Handle touch start events
   * @param {TouchEvent} event - The touch start event
   */
  handleTouchStart(event) {
    try {
      // Store current touches
      this.touches = Array.from(event.touches);
      const touchCount = this.touches.length;
      
      console.log(`Touch start: ${touchCount} touch(es)`);
      
      if (touchCount === 1) {
        // Single touch - prepare for potential panning or double-tap
        this.handleSingleTouchStart(event);
      } else if (touchCount === 2) {
        // Two touches - start pinch gesture detection (Requirement 4.1)
        this.handlePinchStart(event);
      } else if (touchCount > 2) {
        // More than 2 touches - cancel current gestures
        this.cancelAllGestures();
      }
      
      this.isActive = true;
    } catch (error) {
      this.handleTouchError('touchstart', error);
    }
  }

  /**
   * Handle single touch start for panning and double-tap detection
   * @param {TouchEvent} event - The touch start event
   */
  handleSingleTouchStart(event) {
    const touch = this.touches[0];
    const currentTime = Date.now();
    
    // Store touch start position for panning
    this.touchState.panStart = {
      x: touch.clientX,
      y: touch.clientY
    };
    
    // Check for double-tap gesture
    if (this.lastTouchTime && (currentTime - this.lastTouchTime) < this.config.doubleTapDelay) {
      // Potential double-tap detected
      this.handleDoubleTap(touch);
    }
    
    this.lastTouchTime = currentTime;
  }

  /**
   * Handle pinch gesture start
   * @param {TouchEvent} event - The touch start event
   */
  handlePinchStart(event) {
    event.preventDefault(); // Prevent default zoom behavior
    
    const touch1 = this.touches[0];
    const touch2 = this.touches[1];
    
    // Calculate initial distance between touches (Requirement 4.2)
    this.initialDistance = this.calculateDistance(touch1, touch2);
    this.initialZoom = this.zoomManager.getCurrentZoom();
    
    // Calculate center point between touches
    const center = this.calculateCenter(touch1, touch2);
    
    // Update touch state
    this.touchState.isPinching = true;
    this.touchState.startDistance = this.initialDistance;
    this.touchState.startZoom = this.initialZoom;
    this.touchState.startCenter = center;
    this.touchState.lastCenter = center;
    
    console.log(`Pinch started: distance=${this.initialDistance.toFixed(2)}, zoom=${this.initialZoom.toFixed(2)}`);
  }

  /**
   * Handle touch move events
   * @param {TouchEvent} event - The touch move event
   */
  handleTouchMove(event) {
    try {
      if (!this.isActive) return;
      
      this.touches = Array.from(event.touches);
      const touchCount = this.touches.length;
      
      if (touchCount === 1 && !this.touchState.isPinching) {
        // Single finger panning (Requirement 4.5)
        this.handleSingleTouchMove(event);
      } else if (touchCount === 2 && this.touchState.isPinching) {
        // Pinch-to-zoom gesture (Requirement 4.2)
        this.handlePinchMove(event);
      }
    } catch (error) {
      this.handleTouchError('touchmove', error);
    }
  }

  /**
   * Handle single touch move for panning
   * @param {TouchEvent} event - The touch move event
   */
  handleSingleTouchMove(event) {
    // Only allow panning when zoomed in
    if (this.zoomManager.getCurrentZoom() <= 1.0) {
      return;
    }
    
    event.preventDefault();
    
    const touch = this.touches[0];
    const deltaX = touch.clientX - this.touchState.panStart.x;
    const deltaY = touch.clientY - this.touchState.panStart.y;
    
    // Only start panning if movement is significant enough
    if (!this.touchState.isPanning && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      this.touchState.isPanning = true;
    }
    
    if (this.touchState.isPanning) {
      // Apply pan offset through zoom manager
      this.zoomManager.handleTouchPan(deltaX, deltaY);
    }
  }

  /**
   * Handle pinch move for zoom
   * @param {TouchEvent} event - The touch move event
   */
  handlePinchMove(event) {
    event.preventDefault();
    
    const touch1 = this.touches[0];
    const touch2 = this.touches[1];
    
    // Calculate current distance and center
    const currentDistance = this.calculateDistance(touch1, touch2);
    const currentCenter = this.calculateCenter(touch1, touch2);
    
    // Only process if distance change is significant
    if (Math.abs(currentDistance - this.touchState.startDistance) < this.config.pinchThreshold) {
      return;
    }
    
    // Calculate zoom level from pinch distance changes (Requirement 4.2)
    const distanceRatio = currentDistance / this.initialDistance;
    const newZoomLevel = this.initialZoom * distanceRatio;
    
    // Convert center coordinates to relative coordinates (0-1)
    const rect = this.element.getBoundingClientRect();
    const centerX = (currentCenter.x - rect.left) / rect.width;
    const centerY = (currentCenter.y - rect.top) / rect.height;
    
    // Apply zoom through zoom manager
    this.zoomManager.zoomTo(newZoomLevel, centerX, centerY);
    
    // Update last center for potential panning during pinch
    this.touchState.lastCenter = currentCenter;
    
    console.log(`Pinch zoom: distance=${currentDistance.toFixed(2)}, zoom=${newZoomLevel.toFixed(2)}`);
  }

  /**
   * Handle touch end events
   * @param {TouchEvent} event - The touch end event
   */
  handleTouchEnd(event) {
    try {
      this.touches = Array.from(event.touches);
      const touchCount = this.touches.length;
      
      console.log(`Touch end: ${touchCount} remaining touch(es)`);
      
      if (touchCount === 0) {
        // All touches ended
        this.handleAllTouchesEnd();
      } else if (touchCount === 1 && this.touchState.isPinching) {
        // One finger lifted during pinch - end pinch gesture
        this.endPinchGesture();
      }
    } catch (error) {
      this.handleTouchError('touchend', error);
    }
  }

  /**
   * Handle when all touches have ended
   */
  handleAllTouchesEnd() {
    // Reset all gesture states
    this.touchState.isPinching = false;
    this.touchState.isPanning = false;
    this.isActive = false;
    
    // Reset initial values
    this.initialDistance = 0;
    this.initialZoom = 1;
    
    console.log('All touch gestures ended');
  }

  /**
   * End pinch gesture when one finger is lifted
   */
  endPinchGesture() {
    this.touchState.isPinching = false;
    
    // If one finger remains, prepare for potential panning
    if (this.touches.length === 1) {
      const remainingTouch = this.touches[0];
      this.touchState.panStart = {
        x: remainingTouch.clientX,
        y: remainingTouch.clientY
      };
    }
    
    console.log('Pinch gesture ended');
  }

  /**
   * Handle touch cancel events
   * @param {TouchEvent} event - The touch cancel event
   */
  handleTouchCancel(event) {
    console.log('Touch cancelled');
    this.cancelAllGestures();
  }

  /**
   * Handle double-tap gesture for zoom
   * @param {Touch} touch - The touch object
   */
  handleDoubleTap(touch) {
    // Convert touch coordinates to relative coordinates
    const rect = this.element.getBoundingClientRect();
    const centerX = (touch.clientX - rect.left) / rect.width;
    const centerY = (touch.clientY - rect.top) / rect.height;
    
    // Determine target zoom level based on current zoom
    const currentZoom = this.zoomManager.getCurrentZoom();
    let targetZoom;
    
    if (currentZoom < 1.5) {
      targetZoom = 2.0; // Zoom in to 2x
    } else if (currentZoom < 3.0) {
      targetZoom = 3.0; // Zoom in further to 3x
    } else {
      targetZoom = 1.0; // Reset to 100%
    }
    
    // Apply smooth zoom transition
    this.zoomManager.zoomToWithTransition(targetZoom, centerX, centerY);
    
    console.log(`Double-tap zoom: ${currentZoom.toFixed(2)} -> ${targetZoom.toFixed(2)}`);
  }

  /**
   * Calculate distance between two touch points
   * @param {Touch} touch1 - First touch point
   * @param {Touch} touch2 - Second touch point
   * @returns {number} Distance between touches
   */
  calculateDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate center point between two touches
   * @param {Touch} touch1 - First touch point
   * @param {Touch} touch2 - Second touch point
   * @returns {Object} Center point coordinates
   */
  calculateCenter(touch1, touch2) {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }

  /**
   * Cancel all active gestures
   */
  cancelAllGestures() {
    this.touchState.isPinching = false;
    this.touchState.isPanning = false;
    this.isActive = false;
    this.touches = [];
    this.initialDistance = 0;
    this.initialZoom = 1;
    
    console.log('All gestures cancelled');
  }

  /**
   * Handle touch-related errors
   * @param {string} eventType - The type of touch event that caused the error
   * @param {Error} error - The error object
   */
  handleTouchError(eventType, error) {
    console.error(`Touch gesture error in ${eventType}:`, error);
    
    // Reset touch state to prevent stuck gestures
    this.cancelAllGestures();
    
    // Provide fallback to mouse events if available
    this.enableMouseFallback();
  }

  /**
   * Enable mouse event fallback when touch events fail
   */
  enableMouseFallback() {
    console.warn('Touch gestures failed, falling back to mouse events');
    
    // The zoom manager should already have mouse event handlers
    // This method can be extended to provide additional fallback functionality
    if (this.zoomManager && typeof this.zoomManager.enableMouseFallback === 'function') {
      this.zoomManager.enableMouseFallback();
    }
  }

  /**
   * Check if touch gestures are currently active
   * @returns {boolean} True if any touch gesture is active
   */
  isGestureActive() {
    return this.touchState.isPinching || this.touchState.isPanning;
  }

  /**
   * Get current touch state information
   * @returns {Object} Current touch state
   */
  getTouchState() {
    return {
      ...this.touchState,
      touchCount: this.touches.length,
      isActive: this.isActive
    };
  }

  /**
   * Destroy the touch handler and clean up event listeners
   */
  destroy() {
    if (this.element) {
      this.element.removeEventListener('touchstart', this.handleTouchStart);
      this.element.removeEventListener('touchmove', this.handleTouchMove);
      this.element.removeEventListener('touchend', this.handleTouchEnd);
      this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    }
    
    this.cancelAllGestures();
    this.element = null;
    this.zoomManager = null;
    
    console.log('TouchHandler destroyed');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TouchHandler;
}