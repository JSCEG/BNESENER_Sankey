```

```

# Implementation Plan

- [X] 1. Refactorizar código existente en módulos

  - Crear estructura modular separando responsabilidades del código existente
  - Extraer lógica de manejo de datos del HTML principal
  - _Requirements: 8.1, 8.2, 8.3_
- [X] 1.1 Crear módulo DataManager para manejo centralizado de datos

  - Implementar clase DataManager que encapsule la carga y procesamiento de datos JSON
  - Crear métodos para validación de datos y acceso a información de nodos
  - Migrar lógica existente de `getNodeData()` al nuevo módulo
  - _Requirements: 2.1, 5.2, 8.1_
- [X] 1.2 Implementar módulo StyleManager para gestión de colores y estilos

  - Crear clase StyleManager que centralice la paleta de colores
  - Implementar sistema de temas y colores consistentes
  - Migrar colores hardcodeados del código existente al nuevo sistema
  - _Requirements: 4.1, 4.2, 4.3_
- [X] 1.3 Crear módulo LayoutEngine para posicionamiento mejorado de nodos

  - Implementar algoritmo de posicionamiento automático que evite solapamientos
  - Crear sistema de columnas lógicas para organizar nodos
  - Migrar posiciones hardcodeadas del código existente al nuevo sistema
  - _Requirements: 3.1, 3.2, 3.3_
- [X] 2. Mejorar diseño visual y layout

  - Actualizar CSS para crear diseño más profesional y minimalista
  - Expandir tamaño del lienzo para acomodar más nodos
  - _Requirements: 1.1, 1.2, 1.3_
- [X] 2.1 Actualizar estilos CSS para diseño profesional y minimalista

  - Rediseñar la hoja de estilos con paleta de colores profesional
  - Implementar tipografía clara y consistente
  - Crear diseño responsive que se adapte a diferentes tamaños de pantalla
  - _Requirements: 1.2, 1.3_
- [X] 2.2 Expandir dimensiones del lienzo del diagrama

  - Modificar CSS para que el lienzo ocupe 95% del ancho y 85% de la altura
  - Ajustar configuración de Plotly para aprovechar el espacio adicional
  - Verificar que todos los nodos existentes se muestren sin solapamiento
  - _Requirements: 1.1, 1.4_
- [X] 3. Implementar sistema de creación de nodos

  - Crear NodeFactory para simplificar la adición de nuevos nodos
  - Implementar sistema de mapeo automático de propiedades
  - _Requirements: 2.1, 2.2, 2.3_
- [X] 3.1 Crear clase NodeFactory para creación estandarizada de nodos

  - Implementar factory pattern para crear nodos con propiedades consistentes
  - Crear métodos para registrar nuevos tipos de nodos
  - Implementar validación automática de configuraciones de nodos
  - _Requirements: 2.1, 2.2, 5.2_
- [X] 3.2 Implementar sistema de herencia de propiedades para nodos hijo

  - Crear lógica para que nodos hijo hereden automáticamente propiedades del padre
  - Implementar sistema de override para propiedades específicas
  - Migrar lógica existente de procesamiento de nodos hijo al nuevo sistema
  - _Requirements: 2.3, 5.4_
- [x] 3.3 Crear sistema de mapeo automático para conexiones entre nodos









  - Implementar LinkManager para gestionar conexiones de manera centralizada
  - Crear configuración declarativa para definir flujos entre nodos
  - Migrar mapeo existente `fuelToTechMap` al nuevo sistema
  - _Requirements: 2.4, 5.2_
- [ ] 4. Mejorar popups informativos

  - Estandarizar formato de popups para nodos y enlaces
  - Implementar información más detallada y consistente
  - _Requirements: 7.1, 7.2, 7.3, 7.4_
- [x] 4.1 Estandarizar formato de popups para nodos










  - Crear template consistente para mostrar información de nodos
  - Implementar formato estándar para valores numéricos con separadores de miles
  - Agregar descripciones detalladas y unidades claras en todos los popups
  - _Requirements: 7.1, 7.3, 7.4_
- [x] 4.2 Mejorar popups de enlaces con información detallada del flujo






  - Crear formato consistente para mostrar información de flujos energéticos
  - Implementar visualización clara del tipo de energético y su valor
  - Mantener coherencia de colores entre enlaces y sus popups correspondientes
  - _Requirements: 7.2, 7.3, 4.4_
- [x] 5. Implementar funcionalidades de exportación






  - Agregar botones de exportación PNG y SVG
  - Implementar ExportManager para manejo de exportaciones
  - _Requirements: 9.1, 9.2, 9.3, 9.4_
- [x] 5.1 Crear interfaz de usuario para exportación






  - Agregar botones de exportación PNG y SVG en la interfaz
  - Implementar opciones de configuración para resolución y formato
  - Crear feedback visual durante el proceso de exportación
  - _Requirements: 9.1, 9.2_
- [x] 5.2 Implementar ExportManager para generar imágenes






  - Crear clase ExportManager que utilice las capacidades de Plotly para exportación
  - Implementar exportación PNG con fondo transparente y alta resolución
  - Implementar exportación SVG vectorial escalable
  - Asegurar que todos los elementos visibles se incluyan sin recortes
  - _Requirements: 9.3, 9.4_
- [x] 6. Implementar sistema de etiquetas de columnas



  - Crear sistema opcional de títulos de columnas
  - Implementar posicionamiento automático de etiquetas
  - _Requirements: 10.1, 10.2, 10.3, 10.4_
- [x] 6.1 Crear sistema de etiquetas de columnas configurables








  - Implementar opción para habilitar/deshabilitar etiquetas de columnas
  - Crear posicionamiento automático que se alinee con columnas de nodos
  - Implementar títulos como "Oferta", "Transformación", "Consumo"
  - _Requirements: 10.1, 10.2, 10.3_
- [x] 6.2 Integrar etiquetas con sistema de exportación


  - Asegurar que las etiquetas se incluyan en las exportaciones cuando estén habilitadas
  - Mantener posicionamiento correcto de etiquetas en imágenes exportadas
  - Verificar que las etiquetas permanezcan visibles al cambiar de año
  - _Requirements: 10.4_
- [ ] 7. Implementar sistema de agrupación visual de nodos

  - Crear sistema flexible para agrupar nodos con cuadros
  - Implementar diferentes estilos de bordes y agrupaciones
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
- [ ] 7.1 Crear sistema base de agrupación de nodos











  - Implementar clase GroupManager para gestionar agrupaciones visuales
  - Crear configuración declarativa para definir grupos de nodos
  - Implementar renderizado de cuadros con bordes segmentados alrededor de grupos
  - _Requirements: 11.1, 11.2_
- [ ] 7.2 Implementar estilos configurables para grupos

  - Crear sistema de estilos para personalizar apariencia de cuadros agrupadores
  - Implementar opciones de color, tipo de línea y grosor de borde
  - Crear ajuste dinámico de cuadros cuando se agregan o quitan nodos
  - _Requirements: 11.2, 11.3_
- [ ] 7.3 Integrar sistema de agrupación con exportación

  - Asegurar que cuadros agrupadores se incluyan en imágenes exportadas
  - Verificar que el sistema funcione correctamente sin grupos configurados
  - Implementar validación para evitar conflictos entre grupos
  - _Requirements: 11.4, 11.5_
- [ ] 8. Implementar sistema de filtros dinámicos

  - Crear filtros dinámicos para tipos de energía
  - Implementar actualización en tiempo real del diagrama
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
- [ ] 8.1 Crear interfaz de filtros para tipos de energía

  - Implementar controles de filtro para mostrar/ocultar tipos específicos de energía
  - Crear interfaz intuitiva con checkboxes o toggles para cada tipo
  - Implementar filtros para energías primarias y secundarias por separado
  - _Requirements: 6.1_
- [ ] 8.2 Implementar lógica de filtrado dinámico

  - Crear sistema que actualice el diagrama en tiempo real al aplicar filtros
  - Implementar mantenimiento de proporciones al ocultar elementos
  - Crear lógica para manejar intersecciones de múltiples filtros
  - Implementar función de reset para volver al estado completo
  - _Requirements: 6.2, 6.3, 6.4_
- [ ] 9. Finalizar documentación y optimización

  - Agregar documentación JSDoc completa
  - Implementar manejo robusto de errores
  - Optimizar rendimiento del sistema
  - _Requirements: 5.1, 5.3_
- [ ] 9.1 Agregar documentación JSDoc completa al código

  - Documentar todas las clases, métodos y funciones con JSDoc
  - Crear ejemplos de uso para funciones principales
  - Documentar parámetros, tipos de retorno y excepciones
  - _Requirements: 5.1_
- [ ] 9.2 Implementar manejo robusto de errores y validaciones

  - Crear sistema de manejo de errores con mensajes claros
  - Implementar validación de datos de entrada y configuraciones
  - Crear recuperación elegante ante errores de datos o renderizado
  - Implementar logging para facilitar debugging
  - _Requirements: 5.3_
- [ ] 9.3 Optimizar rendimiento y realizar testing final

  - Implementar optimizaciones de rendimiento para grandes conjuntos de datos
  - Crear tests unitarios para componentes principales
  - Realizar testing de integración del sistema completo
  - Verificar compatibilidad con diferentes navegadores
  - _Requirements: 8.4_
