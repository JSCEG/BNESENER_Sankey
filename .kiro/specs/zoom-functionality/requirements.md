# Requirements Document

## Introduction

Esta especificación define la funcionalidad de zoom y navegación para el diagrama Sankey del Balance Nacional de Energía de México. El objetivo es mejorar la experiencia del usuario permitiendo hacer zoom en áreas específicas del diagrama que pueden ser difíciles de leer debido a la densidad de información, especialmente en dispositivos con pantallas pequeñas o cuando hay muchos flujos de energía superpuestos.

## Requirements

### Requirement 1

**User Story:** Como usuario del diagrama Sankey, quiero poder hacer zoom en áreas específicas del diagrama, para poder leer mejor los detalles de los flujos energéticos que se ven muy pequeños.

#### Acceptance Criteria

1. WHEN el usuario hace scroll con la rueda del mouse sobre el diagrama THEN el sistema SHALL aumentar o disminuir el zoom del diagrama
2. WHEN el usuario presiona Ctrl + rueda del mouse THEN el sistema SHALL hacer zoom más preciso y controlado
3. WHEN el usuario hace doble clic en un área del diagrama THEN el sistema SHALL hacer zoom a esa área específica
4. WHEN el diagrama está con zoom aplicado THEN el sistema SHALL mostrar controles de navegación para moverse por el diagrama
5. WHEN el usuario hace zoom THEN el sistema SHALL mantener la calidad visual del diagrama sin pixelación

### Requirement 2

**User Story:** Como usuario, quiero tener controles visuales de zoom, para poder controlar el nivel de zoom de manera intuitiva sin depender solo del mouse.

#### Acceptance Criteria

1. WHEN el diagrama se carga THEN el sistema SHALL mostrar controles de zoom (+, -, reset) en una esquina del diagrama
2. WHEN el usuario hace clic en el botón "+" THEN el sistema SHALL aumentar el zoom en incrementos del 25%
3. WHEN el usuario hace clic en el botón "-" THEN el sistema SHALL disminuir el zoom en incrementos del 25%
4. WHEN el usuario hace clic en el botón "reset" THEN el sistema SHALL restaurar el zoom al 100% y centrar el diagrama
5. WHEN el zoom está al máximo (400%) THEN el sistema SHALL deshabilitar el botón "+"
6. WHEN el zoom está al mínimo (25%) THEN el sistema SHALL deshabilitar el botón "-"

### Requirement 3

**User Story:** Como usuario, quiero poder navegar por el diagrama cuando está ampliado, para poder explorar diferentes áreas sin perder el nivel de zoom.

#### Acceptance Criteria

1. WHEN el diagrama tiene zoom aplicado (>100%) THEN el sistema SHALL permitir arrastrar el diagrama para navegar
2. WHEN el usuario arrastra el diagrama THEN el sistema SHALL mover la vista suavemente siguiendo el cursor
3. WHEN el usuario suelta el arrastre THEN el sistema SHALL detener el movimiento inmediatamente
4. WHEN el diagrama está ampliado THEN el sistema SHALL mostrar un minimapa opcional para orientación
5. WHEN el usuario hace clic en el minimapa THEN el sistema SHALL centrar la vista en esa área

### Requirement 4

**User Story:** Como usuario, quiero que el zoom sea responsive y funcione bien en dispositivos móviles, para poder usar la funcionalidad en tablets y smartphones.

#### Acceptance Criteria

1. WHEN el usuario está en un dispositivo táctil THEN el sistema SHALL soportar gestos de pinch-to-zoom
2. WHEN el usuario hace pinch con dos dedos THEN el sistema SHALL hacer zoom in/out según el gesto
3. WHEN el usuario está en móvil THEN el sistema SHALL mostrar controles de zoom adaptados al tamaño de pantalla
4. WHEN el usuario rota el dispositivo THEN el sistema SHALL mantener el nivel de zoom y reajustar la vista
5. WHEN el diagrama está ampliado en móvil THEN el sistema SHALL permitir navegación por arrastre con un dedo

### Requirement 5

**User Story:** Como usuario, quiero que el zoom preserve la funcionalidad existente del diagrama, para que los tooltips y la interactividad sigan funcionando correctamente.

#### Acceptance Criteria

1. WHEN el diagrama tiene zoom aplicado THEN el sistema SHALL mantener todos los tooltips funcionando correctamente
2. WHEN el usuario hace hover sobre elementos ampliados THEN el sistema SHALL mostrar la información detallada como antes
3. WHEN el diagrama está ampliado THEN el sistema SHALL mantener la funcionalidad de exportación
4. WHEN se exporta un diagrama con zoom THEN el sistema SHALL exportar la vista actual o permitir elegir entre vista actual y vista completa
5. WHEN se cambia de año con zoom aplicado THEN el sistema SHALL mantener el nivel de zoom y posición si es posible

### Requirement 6

**User Story:** Como usuario, quiero indicadores visuales del estado del zoom, para saber en qué nivel de ampliación me encuentro y cómo volver al estado original.

#### Acceptance Criteria

1. WHEN el diagrama tiene zoom aplicado THEN el sistema SHALL mostrar el porcentaje de zoom actual
2. WHEN el zoom cambia THEN el sistema SHALL actualizar el indicador de porcentaje suavemente
3. WHEN el zoom es diferente al 100% THEN el sistema SHALL mostrar un botón prominente de "Reset Zoom"
4. WHEN el usuario presiona Escape con zoom aplicado THEN el sistema SHALL resetear el zoom al 100%
5. WHEN el diagrama está ampliado THEN el sistema SHALL mostrar sutilmente los límites del área visible