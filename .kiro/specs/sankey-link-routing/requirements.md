# Requirements Document

## Introduction

El sistema actual de diagramas Sankey presenta enlaces que se cruzan y crean una visualización desordenada. Se necesita implementar un sistema de enrutamiento inteligente de enlaces que organice los flujos como un circuito de tuberías ordenado, donde cada enlace siga una ruta optimizada desde su nodo origen hasta su nodo destino sin cruzarse innecesariamente con otros enlaces.

## Requirements

### Requirement 1

**User Story:** Como usuario del diagrama Sankey, quiero que los enlaces sigan rutas ordenadas y no se crucen innecesariamente, para que pueda seguir visualmente el flujo de energía de manera clara.

#### Acceptance Criteria

1. WHEN el diagrama se renderiza THEN los enlaces SHALL seguir rutas calculadas que minimicen los cruces
2. WHEN múltiples enlaces salen del mismo nodo THEN el sistema SHALL ordenarlos por destino y valor para evitar solapamientos
3. WHEN un enlace conecta nodos en diferentes columnas THEN SHALL seguir una ruta curva suave que evite pasar por el centro de otros nodos

### Requirement 2

**User Story:** Como desarrollador del sistema, quiero un algoritmo de mapeo de nodos padre-hijo, para que el sistema pueda entender la jerarquía y calcular rutas inteligentes.

#### Acceptance Criteria

1. WHEN se inicializa el diagrama THEN el sistema SHALL crear un mapa de relaciones padre-hijo de todos los nodos
2. WHEN se detectan conexiones THEN el sistema SHALL identificar el tipo de flujo (primario, secundario, transformación)
3. IF un nodo tiene múltiples conexiones THEN el sistema SHALL agruparlas por tipo y prioridad

### Requirement 3

**User Story:** Como usuario, quiero que los enlaces mantengan su información de hover y click, para que no se pierda funcionalidad al mejorar el enrutamiento.

#### Acceptance Criteria

1. WHEN se implementa el nuevo enrutamiento THEN los enlaces SHALL mantener toda la funcionalidad de popup existente
2. WHEN un usuario hace hover sobre un enlace THEN SHALL mostrar la información correcta del flujo
3. WHEN se aplica el focus highlighting THEN SHALL funcionar correctamente con las nuevas rutas

### Requirement 4

**User Story:** Como usuario, quiero que el sistema de enrutamiento sea configurable, para que pueda ajustar el comportamiento según mis necesidades.

#### Acceptance Criteria

1. WHEN se inicializa el sistema THEN SHALL permitir configurar parámetros de enrutamiento como curvatura y separación
2. IF el usuario prefiere el comportamiento anterior THEN SHALL poder desactivar el enrutamiento inteligente
3. WHEN se cambia la configuración THEN el diagrama SHALL actualizarse automáticamente

### Requirement 5

**User Story:** Como usuario, quiero que el rendimiento del diagrama se mantenga óptimo, para que la mejora visual no afecte la velocidad de carga.

#### Acceptance Criteria

1. WHEN se calculan las rutas THEN el algoritmo SHALL completarse en menos de 500ms para diagramas típicos
2. WHEN se redimensiona la ventana THEN las rutas SHALL recalcularse eficientemente
3. IF el diagrama tiene más de 100 enlaces THEN el sistema SHALL usar optimizaciones para mantener el rendimiento