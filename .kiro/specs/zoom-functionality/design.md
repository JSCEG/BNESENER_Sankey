# Design Document

## Overview

La funcionalidad de zoom para el diagrama Sankey se implementará como un módulo independiente (`ZoomManager`) que se integrará con el sistema existente de Plotly.js. El diseño aprovecha las capacidades nativas de zoom de Plotly mientras añade controles personalizados y funcionalidades adicionales para mejorar la experiencia del usuario.

## Architecture

### Core Components

1. **ZoomManager**: Clase principal que gestiona toda la funcionalidad de zoom
2. **ZoomControls**: Componente UI para los controles visuales de zoom
3. **MiniMap**: Componente opcional para navegación en vistas ampliadas
4. **TouchHandler**: Manejador específico para gestos táctiles en dispositivos móviles

### Integration Points

- Se integra con el diagrama Plotly existente a través de eventos y configuración
- Interactúa con ExportManager para manejar exportación de vistas ampliadas
- Coordina con PopupManager para mantener tooltips funcionando correctamente
- Se comunica con StyleManager para mantener consistencia visual

## Components and Interfaces

### ZoomManager Class

```javascript
class ZoomManager {
  constructor(plotlyDiv, options = {}) {
    this.plotlyDiv = plotlyDiv;
    this.currentZoom = 1.0;
    this.minZoom = 0.25;
    this.maxZoom = 4.0;
    this.zoomStep = 0.25;
    this.isDragging = false;
    this.lastPanPosition = { x: 0, y: 0 };
    
    // Configuration
    this.options = {
      showControls: true,
      showMiniMap: false,
      enableTouchGestures: true,
      smoothTransitions: true,
      ...options
    };
  }

  // Public Methods
  zoomIn(factor = this.zoomStep) { }
  zoomOut(factor = this.zoomStep) { }
  zoomTo(level, centerX, centerY) { }
  resetZoom() { }
  enablePanning() { }
  disablePanning() { }
  getCurrentZoom() { }
  
  // Event Handlers
  handleWheelZoom(event) { }
  handleDoubleClick(event) { }
  handleTouchGestures(event) { }
  handleKeyboardShortcuts(event) { }
}
```

### ZoomControls Component

```javascript
class ZoomControls {
  constructor(container, zoomManager) {
    this.container = container;
    this.zoomManager = zoomManager;
    this.controlsElement = null;
  }

  render() { }
  updateZoomLevel(level) { }
  show() { }
  hide() { }
}
```

### TouchHandler Class

```javascript
class TouchHandler {
  constructor(element, zoomManager) {
    this.element = element;
    this.zoomManager = zoomManager;
    this.touches = [];
    this.initialDistance = 0;
    this.initialZoom = 1;
  }

  handleTouchStart(event) { }
  handleTouchMove(event) { }
  handleTouchEnd(event) { }
  calculateDistance(touch1, touch2) { }
}
```

## Data Models

### Zoom State

```javascript
const zoomState = {
  level: 1.0,           // Current zoom level (0.25 - 4.0)
  centerX: 0.5,         // Center X position (0-1, relative)
  centerY: 0.5,         // Center Y position (0-1, relative)
  panX: 0,              // Pan offset X in pixels
  panY: 0,              // Pan offset Y in pixels
  isActive: false,      // Whether zoom is currently active
  isDragging: false,    // Whether user is currently dragging
  lastUpdate: Date.now() // Timestamp of last zoom change
};
```

### Configuration Options

```javascript
const zoomConfig = {
  // Zoom limits
  minZoom: 0.25,
  maxZoom: 4.0,
  zoomStep: 0.25,
  
  // UI Options
  showControls: true,
  showMiniMap: false,
  showZoomIndicator: true,
  
  // Behavior
  enableWheelZoom: true,
  enableDoubleClickZoom: true,
  enableTouchGestures: true,
  enableKeyboardShortcuts: true,
  smoothTransitions: true,
  
  // Performance
  throttleDelay: 16, // ~60fps
  debounceDelay: 100
};
```

## Error Handling

### Zoom Boundary Validation

```javascript
function validateZoomLevel(level) {
  if (level < this.minZoom) {
    console.warn(`Zoom level ${level} below minimum, clamping to ${this.minZoom}`);
    return this.minZoom;
  }
  if (level > this.maxZoom) {
    console.warn(`Zoom level ${level} above maximum, clamping to ${this.maxZoom}`);
    return this.maxZoom;
  }
  return level;
}
```

### Touch Gesture Error Handling

```javascript
function handleTouchError(error) {
  console.error('Touch gesture error:', error);
  // Reset touch state
  this.touches = [];
  this.initialDistance = 0;
  // Provide fallback to mouse events
  this.enableMouseFallback();
}
```

### Plotly Integration Error Handling

```javascript
function handlePlotlyError(error) {
  console.error('Plotly zoom integration error:', error);
  // Fallback to CSS transforms if Plotly zoom fails
  this.useCSSTransformFallback = true;
  // Notify user of degraded functionality
  this.showWarningMessage('Zoom functionality limited due to technical issues');
}
```

## Testing Strategy

### Unit Tests

1. **ZoomManager Core Functions**
   - Test zoom level calculations and boundaries
   - Test coordinate transformations
   - Test state management

2. **Event Handling**
   - Test wheel zoom with different browsers
   - Test touch gesture recognition
   - Test keyboard shortcuts

3. **Integration Points**
   - Test Plotly.js integration
   - Test export functionality with zoom
   - Test tooltip positioning with zoom

### Integration Tests

1. **Cross-browser Compatibility**
   - Test on Chrome, Firefox, Safari, Edge
   - Test on different operating systems
   - Test with different screen resolutions

2. **Device Testing**
   - Test on tablets (iPad, Android tablets)
   - Test on smartphones (iOS, Android)
   - Test with different touch screen sensitivities

3. **Performance Testing**
   - Test with large datasets
   - Test smooth transitions under load
   - Test memory usage during extended zoom sessions

### User Acceptance Testing

1. **Usability Testing**
   - Test with users unfamiliar with the interface
   - Measure time to complete zoom tasks
   - Gather feedback on control placement and behavior

2. **Accessibility Testing**
   - Test with screen readers
   - Test keyboard-only navigation
   - Test with high contrast modes

## Implementation Approach

### Phase 1: Core Zoom Functionality
- Implement basic ZoomManager class
- Add wheel zoom and double-click zoom
- Integrate with existing Plotly diagram
- Add basic zoom controls UI

### Phase 2: Enhanced Navigation
- Implement panning functionality
- Add keyboard shortcuts
- Improve zoom controls styling
- Add zoom level indicator

### Phase 3: Mobile Support
- Implement TouchHandler class
- Add pinch-to-zoom gestures
- Optimize controls for mobile screens
- Test across different devices

### Phase 4: Advanced Features
- Add optional MiniMap component
- Implement smooth transitions
- Add export integration
- Performance optimizations

### Phase 5: Polish and Testing
- Comprehensive cross-browser testing
- Performance optimization
- Accessibility improvements
- User feedback integration

## Technical Considerations

### Plotly.js Integration

Plotly.js provides built-in zoom functionality through its `layout.xaxis.range` and `layout.yaxis.range` properties. However, for Sankey diagrams, we need to use a different approach:

```javascript
// Custom zoom implementation for Sankey
function applySankeyZoom(plotlyDiv, zoomLevel, centerX, centerY) {
  const update = {
    'node.pad': Math.max(15, 15 / zoomLevel), // Adjust node padding
    'link.value': adjustLinkValues(zoomLevel), // Scale link visibility
  };
  
  Plotly.restyle(plotlyDiv, update);
}
```

### Performance Optimization

1. **Throttling**: Limit zoom updates to 60fps
2. **Debouncing**: Delay expensive operations until zoom settles
3. **Lazy Loading**: Only render detailed elements when zoomed in
4. **Memory Management**: Clean up event listeners and temporary objects

### Browser Compatibility

- **Modern Browsers**: Full functionality with native touch events
- **Legacy Browsers**: Graceful degradation with mouse-only support
- **Mobile Browsers**: Optimized touch handling with passive event listeners

### Accessibility Considerations

- **Keyboard Navigation**: Full zoom control via keyboard
- **Screen Readers**: Announce zoom level changes
- **High Contrast**: Ensure zoom controls are visible in all themes
- **Focus Management**: Maintain logical tab order with zoom controls