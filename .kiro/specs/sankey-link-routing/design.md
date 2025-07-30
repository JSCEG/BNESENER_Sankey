# Design Document

## Overview

El sistema de enrutamiento inteligente de enlaces para diagramas Sankey implementará un algoritmo que calcula rutas optimizadas para los enlaces, evitando cruces innecesarios y creando un flujo visual ordenado similar a un circuito de tuberías. El diseño se integrará con la arquitectura existente de managers y aprovechará las capacidades de Plotly.js para renderizar rutas curvas personalizadas.

## Architecture

### Core Components

#### 1. LinkRoutingManager
Nuevo manager que se encargará del cálculo y optimización de rutas de enlaces.

```javascript
class LinkRoutingManager {
  constructor(options = {}) {
    this.layoutEngine = options.layoutEngine;
    this.styleManager = options.styleManager;
    this.config = {
      enableRouting: true,
      curvature: 0.3,
      linkSeparation: 0.02,
      avoidanceRadius: 0.05,
      routingAlgorithm: 'bezier-optimized'
    };
  }
}
```

#### 2. NodeHierarchyMapper
Componente para mapear relaciones padre-hijo y tipos de flujo.

```javascript
class NodeHierarchyMapper {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.hierarchyMap = new Map();
    this.flowTypes = new Map();
  }
}
```

#### 3. RouteCalculator
Algoritmo principal para calcular rutas optimizadas.

```javascript
class RouteCalculator {
  constructor(config) {
    this.config = config;
    this.nodePositions = new Map();
    this.existingRoutes = [];
  }
}
```

### Integration Points

El sistema se integrará con los managers existentes:

- **LinkManager**: Proporcionará datos de enlaces y recibirá rutas calculadas
- **LayoutEngine**: Proporcionará posiciones de nodos y dimensiones del diagrama
- **StyleManager**: Proporcionará colores y estilos para las rutas
- **DataManager**: Proporcionará información de jerarquía de nodos

## Components and Interfaces

### LinkRoutingManager Interface

```javascript
interface LinkRoutingManager {
  // Configuración
  updateConfig(newConfig: RoutingConfig): void;
  
  // Cálculo de rutas
  calculateRoutes(links: LinkData[], nodes: NodeData[]): RouteData[];
  
  // Optimización
  optimizeRoutes(routes: RouteData[]): RouteData[];
  
  // Utilidades
  detectCrossings(routes: RouteData[]): CrossingData[];
  resolveConflicts(crossings: CrossingData[]): RouteData[];
}
```

### Route Data Structure

```javascript
interface RouteData {
  id: string;
  sourceNode: string;
  targetNode: string;
  sourceIndex: number;
  targetIndex: number;
  value: number;
  color: string;
  customdata: string;
  
  // Datos de ruta calculada
  path: {
    type: 'bezier' | 'spline' | 'arc';
    controlPoints: Point[];
    curvature: number;
  };
  
  // Metadatos de enrutamiento
  routing: {
    priority: number;
    flowType: string;
    avoidanceZones: Rectangle[];
    conflicts: string[];
  };
}
```

### Node Hierarchy Structure

```javascript
interface NodeHierarchy {
  nodeId: string;
  nodeName: string;
  nodeType: 'source' | 'transformation' | 'distribution' | 'consumption';
  level: number;
  column: number;
  
  // Relaciones
  parents: string[];
  children: string[];
  
  // Flujos
  incomingFlows: FlowData[];
  outgoingFlows: FlowData[];
  
  // Posicionamiento
  position: Point;
  bounds: Rectangle;
}
```

## Data Models

### Routing Configuration

```javascript
interface RoutingConfig {
  // Habilitación del sistema
  enableRouting: boolean;
  
  // Parámetros de curvatura
  curvature: number; // 0.0 - 1.0
  minCurvature: number;
  maxCurvature: number;
  
  // Separación entre enlaces
  linkSeparation: number;
  groupSeparation: number;
  
  // Evitación de obstáculos
  avoidanceRadius: number;
  nodeAvoidance: boolean;
  
  // Algoritmo de enrutamiento
  routingAlgorithm: 'bezier-optimized' | 'spline-smooth' | 'arc-minimal';
  
  // Optimización
  maxIterations: number;
  convergenceThreshold: number;
  
  // Prioridades de flujo
  flowPriorities: {
    primary: number;
    secondary: number;
    transformation: number;
    distribution: number;
  };
}
```

### Collision Detection

```javascript
interface CollisionZone {
  id: string;
  type: 'node' | 'link' | 'crossing';
  bounds: Rectangle;
  priority: number;
  avoidanceStrategy: 'curve-around' | 'offset' | 'layer-above' | 'layer-below';
}
```

## Error Handling

### Routing Failures
- **Fallback Strategy**: Si el algoritmo de enrutamiento falla, el sistema volverá al comportamiento por defecto de Plotly
- **Performance Limits**: Si el cálculo toma más de 500ms, se aplicarán optimizaciones o se deshabilitará temporalmente
- **Memory Management**: Límites en el número de rutas calculadas simultáneamente

### Configuration Validation
- Validación de parámetros de configuración con valores por defecto seguros
- Detección de configuraciones que podrían causar loops infinitos
- Alertas para configuraciones que afecten significativamente el rendimiento

## Testing Strategy

### Unit Tests

1. **RouteCalculator Tests**
   - Cálculo de rutas básicas entre dos nodos
   - Detección de cruces entre múltiples rutas
   - Optimización de rutas con diferentes algoritmos

2. **NodeHierarchyMapper Tests**
   - Mapeo correcto de relaciones padre-hijo
   - Identificación de tipos de flujo
   - Manejo de nodos huérfanos o cíclicos

3. **LinkRoutingManager Tests**
   - Integración con managers existentes
   - Aplicación de configuraciones
   - Manejo de errores y fallbacks

### Integration Tests

1. **Plotly Integration**
   - Renderizado correcto de rutas curvas
   - Mantenimiento de interactividad (hover, click)
   - Compatibilidad con zoom y pan

2. **Performance Tests**
   - Tiempo de cálculo con diferentes tamaños de diagrama
   - Uso de memoria durante el cálculo de rutas
   - Impacto en el tiempo de renderizado inicial

3. **Visual Regression Tests**
   - Comparación de diagramas antes y después del enrutamiento
   - Verificación de que no se pierdan enlaces
   - Consistencia visual entre diferentes años de datos

### Algorithm Validation

1. **Crossing Minimization**
   - Medición del número de cruces antes y después
   - Verificación de que las rutas no se superpongan innecesariamente
   - Validación de que se respeten las prioridades de flujo

2. **Route Quality**
   - Suavidad de las curvas generadas
   - Distancia total de las rutas
   - Legibilidad visual del diagrama resultante

## Implementation Phases

### Phase 1: Core Infrastructure
- Implementar LinkRoutingManager básico
- Crear NodeHierarchyMapper
- Establecer interfaces y estructuras de datos

### Phase 2: Basic Routing Algorithm
- Implementar algoritmo de enrutamiento Bézier básico
- Integrar con LinkManager existente
- Añadir configuración básica

### Phase 3: Collision Detection & Avoidance
- Implementar detección de cruces
- Añadir estrategias de evitación
- Optimizar rutas para minimizar conflictos

### Phase 4: Advanced Features
- Múltiples algoritmos de enrutamiento
- Configuración avanzada
- Optimizaciones de rendimiento

### Phase 5: Polish & Integration
- Integración completa con sistema existente
- Testing exhaustivo
- Documentación y ejemplos