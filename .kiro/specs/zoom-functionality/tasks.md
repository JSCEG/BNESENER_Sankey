# Implementation Plan

- [x] 1. Set up ZoomManager core structure and basic zoom functionality







  - Create ZoomManager.js file with class structure and basic methods
  - Implement zoom level validation and state management
  - Add basic zoom in/out functionality with wheel events
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 2. Implement zoom controls UI component





  - [x] 2.1 Create ZoomControls class and HTML structure


    - Write ZoomControls class with render method
    - Create HTML template for zoom control buttons (+, -, reset)
    - Add CSS styles for zoom controls positioning and appearance
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Implement zoom control button functionality


    - Add click event handlers for zoom in/out/reset buttons
    - Implement button state management (enable/disable based on zoom level)
    - Add visual feedback for button interactions
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 3. Add advanced zoom interactions





  - [x] 3.1 Implement double-click zoom functionality


    - Add double-click event handler to zoom to specific area
    - Calculate zoom center point from click coordinates
    - Implement smooth zoom transition to target area
    - _Requirements: 1.3, 1.5_

  - [x] 3.2 Add Ctrl+wheel precision zoom


    - Detect Ctrl key modifier with wheel events
    - Implement more precise zoom increments for Ctrl+wheel
    - Add visual indicator when precision zoom is active
    - _Requirements: 1.2, 1.5_

- [x] 4. Implement panning and navigation functionality





  - [x] 4.1 Add drag-to-pan capability


    - Implement mouse down/move/up event handlers for panning
    - Calculate pan offsets and update diagram position
    - Add visual cursor changes during panning mode
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 4.2 Create zoom level indicator and reset functionality


    - Add zoom percentage display in UI
    - Implement prominent reset zoom button when zoomed
    - Add Escape key handler to reset zoom
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 5. Integrate zoom with Plotly.js Sankey diagram





  - [x] 5.1 Implement Plotly-specific zoom application


    - Research Plotly Sankey zoom capabilities and limitations
    - Implement custom zoom method that works with Sankey diagrams
    - Handle Plotly layout updates for zoom changes
    - _Requirements: 1.5, 5.1, 5.2_

  - [x] 5.2 Preserve existing diagram functionality during zoom


    - Ensure tooltips work correctly with zoomed diagrams
    - Maintain hover effects and popup positioning
    - Test and fix any interaction issues with zoomed content
    - _Requirements: 5.1, 5.2, 5.3_

- [-] 6. Add mobile and touch support



  - [x] 6.1 Create TouchHandler class for mobile gestures


    - Implement TouchHandler class with pinch-to-zoom detection
    - Add touch event listeners for pinch gestures
    - Calculate zoom level from pinch distance changes
    - _Requirements: 4.1, 4.2_

  - [ ] 6.2 Implement mobile-optimized zoom controls


    - Adapt zoom control button sizes for touch interfaces
    - Add touch-friendly spacing and hit targets
    - Implement single-finger pan navigation for mobile
    - _Requirements: 4.3, 4.4, 4.5_

- [ ] 7. Add export integration and advanced features
  - [ ] 7.1 Integrate zoom with export functionality
    - Modify ExportManager to handle zoomed diagram exports
    - Add option to export current view vs full diagram
    - Ensure exported images maintain zoom quality
    - _Requirements: 5.4_

  - [ ] 7.2 Implement zoom state persistence
    - Maintain zoom level when switching between years
    - Store zoom preferences in browser localStorage
    - Restore zoom state on page reload when appropriate
    - _Requirements: 5.5_

- [ ] 8. Add accessibility and keyboard support
  - [ ] 8.1 Implement keyboard zoom controls
    - Add keyboard shortcuts for zoom in/out (+ and - keys)
    - Implement arrow key navigation when zoomed
    - Add focus management for zoom controls
    - _Requirements: 6.4_

  - [ ] 8.2 Add accessibility features
    - Implement ARIA labels for zoom controls
    - Add screen reader announcements for zoom level changes
    - Ensure high contrast mode compatibility
    - _Requirements: 6.1, 6.5_

- [ ] 9. Performance optimization and error handling
  - [ ] 9.1 Implement performance optimizations
    - Add throttling for zoom and pan events
    - Implement debouncing for expensive zoom operations
    - Optimize rendering performance during zoom transitions
    - _Requirements: 1.5_

  - [ ] 9.2 Add comprehensive error handling
    - Implement fallback mechanisms for browser compatibility issues
    - Add error recovery for failed zoom operations
    - Create user-friendly error messages for zoom failures
    - _Requirements: 1.5, 4.1, 4.2_

- [ ] 10. Testing and cross-browser compatibility
  - [ ] 10.1 Create comprehensive test suite
    - Write unit tests for ZoomManager core functionality
    - Add integration tests for Plotly.js interaction
    - Create automated tests for touch gesture handling
    - _Requirements: All requirements_

  - [ ] 10.2 Cross-browser and device testing
    - Test zoom functionality across major browsers
    - Verify mobile device compatibility and performance
    - Test with different screen sizes and resolutions
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 11. Integration and final polish
  - [ ] 11.1 Integrate ZoomManager with main application
    - Add ZoomManager initialization to main.js
    - Update HTML structure to include zoom controls
    - Ensure proper cleanup and memory management
    - _Requirements: All requirements_

  - [ ] 11.2 Final styling and user experience polish
    - Refine zoom control animations and transitions
    - Add subtle visual feedback for zoom state changes
    - Optimize control placement and visual hierarchy
    - _Requirements: 6.1, 6.2, 6.5_