# Requirements Document

## Introduction

Este proyecto busca mejorar y expandir el diagrama de Sankey interactivo existente para el balance de energía en México. El objetivo es crear un sistema más robusto, escalable y profesional que permita agregar fácilmente nuevos nodos, mejorar la visualización, y proporcionar una mejor experiencia de usuario. El sistema actual ya tiene una base sólida con datos estructurados y funcionalidad básica, pero necesita mejoras en el diseño, la escalabilidad y la facilidad de mantenimiento.

## Requirements

### Requirement 1

**User Story:** Como desarrollador, quiero un lienzo más grande y un diseño más profesional y minimalista, para que el diagrama sea más legible y visualmente atractivo.

#### Acceptance Criteria

1. WHEN el usuario carga la página THEN el lienzo debe ocupar al menos 95% del ancho de la ventana y 85% de la altura
2. WHEN el usuario visualiza el diagrama THEN debe tener un diseño minimalista con colores profesionales y tipografía clara
3. WHEN el usuario interactúa con el diagrama THEN los elementos de la interfaz deben tener un estilo consistente y moderno
4. WHEN el diagrama se renderiza THEN debe haber suficiente espacio para mostrar todos los nodos sin solapamiento

### Requirement 2

**User Story:** Como desarrollador, quiero un sistema modular para agregar nodos fácilmente, para que pueda expandir el diagrama sin modificar código complejo.

#### Acceptance Criteria

1. WHEN necesito agregar un nuevo nodo THEN debe existir una función centralizada que permita definir el nodo con sus propiedades
2. WHEN defino un nuevo nodo THEN debe incluir automáticamente posición, color, filtros y conexiones
3. WHEN agrego un nodo hijo THEN debe heredar automáticamente las propiedades del nodo padre correspondiente
4. WHEN creo conexiones entre nodos THEN debe existir un sistema de mapeo que facilite la definición de flujos

### Requirement 3

**User Story:** Como desarrollador, quiero mejorar el sistema de posicionamiento de nodos, para que sea más fácil organizar visualmente el diagrama y evitar solapamientos.

#### Acceptance Criteria

1. WHEN se renderizan los nodos THEN deben estar posicionados de manera que optimice el flujo visual de izquierda a derecha
2. WHEN hay múltiples nodos en una columna THEN deben estar distribuidos verticalmente sin solapamiento
3. WHEN se agregan nuevos nodos THEN el sistema debe sugerir posiciones óptimas automáticamente
4. WHEN se modifica la posición de un nodo THEN debe mantener la coherencia visual del diagrama

### Requirement 4

**User Story:** Como desarrollador, quiero un sistema de colores mejorado y consistente, para que cada tipo de energético tenga una representación visual clara y diferenciada.

#### Acceptance Criteria

1. WHEN se asignan colores a los nodos THEN debe existir una paleta de colores predefinida y consistente
2. WHEN se crean enlaces THEN deben heredar el color del nodo de origen de manera consistente
3. WHEN se agregan nuevos energéticos THEN el sistema debe asignar automáticamente colores que no generen confusión
4. WHEN se visualizan los popups THEN deben mantener la coherencia de colores con sus nodos correspondientes

### Requirement 5

**User Story:** Como desarrollador, quiero funciones de construcción de nodos más robustas y documentadas, para que sea más fácil mantener y expandir el código.

#### Acceptance Criteria

1. WHEN reviso el código THEN todas las funciones deben estar documentadas con JSDoc
2. WHEN proceso nodos THEN debe existir una función genérica que maneje la creación de nodos y enlaces
3. WHEN manejo errores THEN el sistema debe proporcionar mensajes claros y recuperación elegante
4. WHEN agrego nuevos tipos de nodos THEN debe ser posible hacerlo siguiendo un patrón establecido

### Requirement 6

**User Story:** Como desarrollador, quiero un sistema de filtros mejorado, para que los usuarios puedan explorar diferentes aspectos del balance energético.

#### Acceptance Criteria

1. WHEN el usuario selecciona filtros THEN debe poder mostrar/ocultar tipos específicos de energía
2. WHEN se aplican filtros THEN el diagrama debe actualizarse dinámicamente manteniendo las proporciones
3. WHEN se combinan múltiples filtros THEN el sistema debe manejar las intersecciones correctamente
4. WHEN se resetean los filtros THEN el diagrama debe volver a su estado completo original

### Requirement 7

**User Story:** Como desarrollador, quiero popups más informativos y consistentes, para que los usuarios obtengan información detallada de cada nodo y enlace.

#### Acceptance Criteria

1. WHEN el usuario hace hover sobre un nodo THEN debe mostrar información detallada incluyendo descripción y valores
2. WHEN el usuario hace hover sobre un enlace THEN debe mostrar el flujo específico con unidades claras
3. WHEN se muestran valores en popups THEN deben estar formateados consistentemente con separadores de miles
4. WHEN se muestran múltiples valores THEN deben estar organizados de manera clara y legible

### Requirement 8

**User Story:** Como desarrollador, quiero una estructura de código más modular y mantenible, para que sea más fácil agregar funcionalidades y corregir errores.

#### Acceptance Criteria

1. WHEN reviso la estructura del código THEN debe estar organizado en módulos lógicos separados
2. WHEN necesito modificar funcionalidad THEN debe ser posible hacerlo sin afectar otros componentes
3. WHEN agrego nuevas características THEN debe seguir los patrones establecidos en el código existente
4. WHEN se ejecutan pruebas THEN el código debe ser testeable de manera unitaria

### Requirement 9

**User Story:** Como usuario, quiero poder exportar el diagrama como imagen PNG sin fondo o SVG, para que pueda incluirlo en reportes y presentaciones profesionales.

#### Acceptance Criteria

1. WHEN el usuario hace clic en el botón de exportar THEN debe poder descargar el diagrama como PNG con fondo transparente
2. WHEN el usuario selecciona exportar SVG THEN debe descargar un archivo vectorial escalable
3. WHEN se exporta la imagen THEN debe mantener la calidad y resolución adecuada para uso profesional
4. WHEN se genera la exportación THEN debe incluir todos los elementos visibles del diagrama sin recortes

### Requirement 10

**User Story:** Como usuario, quiero la opción de mostrar etiquetas de títulos de columnas en el diagrama, para que sea más fácil entender las diferentes etapas del balance energético cuando sea necesario.

#### Acceptance Criteria

1. WHEN se habilitan las etiquetas THEN debe mostrar títulos de columnas como "Oferta", "Transformación", "Consumo"
2. WHEN se posicionan las etiquetas THEN deben estar alineadas correctamente con sus respectivas columnas de nodos
3. WHEN se deshabilitan las etiquetas THEN el diagrama debe funcionar normalmente sin ellas
4. WHEN se exporta el diagrama THEN debe incluir las etiquetas solo si están habilitadas

### Requirement 11

**User Story:** Como desarrollador, quiero un sistema flexible de agrupación visual de nodos, para que pueda crear cuadros con bordes segmentados alrededor de grupos relacionados según sea necesario.

#### Acceptance Criteria

1. WHEN se configura un grupo de nodos THEN debe poder definir un cuadro con borde segmentado alrededor de ellos
2. WHEN se define un grupo THEN debe poder especificar el estilo del borde (color, tipo de línea, grosor)
3. WHEN se agregan o quitan nodos de un grupo THEN el cuadro debe ajustarse dinámicamente
4. WHEN se exporta el diagrama THEN los cuadros agrupadores configurados deben incluirse en la imagen
5. WHEN no se configuran grupos THEN el diagrama debe funcionar normalmente sin cuadros agrupadores