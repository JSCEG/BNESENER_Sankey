/**
 * ColumnLabelsManager - Módulo para gestión de etiquetas de columnas configurables
 * 
 * Este módulo maneja la creación, posicionamiento y renderizado de etiquetas
 * de columnas opcionales en el diagrama de Sankey. Permite habilitar/deshabilitar
 * las etiquetas y posicionarlas automáticamente alineadas con las columnas de nodos.
 * 
 * Funcionalidades principales:
 * - Sistema configurable de etiquetas de columnas
 * - Posicionamiento automático alineado con columnas de nodos
 * - Títulos personalizables como "Oferta", "Transformación", "Consumo"
 * - Integración con sistema de exportación
 * - Estilos consistentes con el tema del diagrama
 * 
 * @author Javier Sasso Celaya
 * @version 1.0.0
 */

class ColumnLabelsManager {
    /**
     * Constructor del ColumnLabelsManager
     * @param {Object} options - Opciones de configuración
     */
    constructor(options = {}) {
        this.enabled = options.enabled || false;
        this.layoutEngine = options.layoutEngine || null;
        this.styleManager = options.styleManager || null;
        
        // Configuración de etiquetas
        this.labelConfig = {
            fontSize: options.fontSize || 14,
            fontFamily: options.fontFamily || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            fontWeight: options.fontWeight || '600',
            color: options.color || '#2c3e50',
            backgroundColor: options.backgroundColor || 'rgba(255, 255, 255, 0.9)',
            borderRadius: options.borderRadius || 6,
            padding: options.padding || { x: 12, y: 6 },
            marginTop: options.marginTop || 0.02,
            opacity: options.opacity || 0.95
        };

        // Definiciones de etiquetas por defecto
        this.columnLabels = new Map();
        this.initializeDefaultLabels();

        // Referencias a elementos DOM
        this.labelElements = [];
        this.containerElement = null;

        console.log('ColumnLabelsManager inicializado');
    }

    /**
     * Inicializa las etiquetas por defecto (vacío para configuración manual)
     */
    initializeDefaultLabels() {
        // Inicializar vacío - las etiquetas se crearán manualmente
        console.log('ColumnLabelsManager inicializado sin etiquetas por defecto - configuración manual');
    }

    /**
     * Crea una etiqueta manual con posición personalizada
     * @param {string} labelId - ID único de la etiqueta
     * @param {Object} labelInfo - Información de la etiqueta
     * @param {string} labelInfo.title - Título de la etiqueta
     * @param {string} labelInfo.description - Descripción opcional
     * @param {number} labelInfo.x - Posición X (0-1 relativo al contenedor)
     * @param {number} labelInfo.y - Posición Y (0-1 relativo al contenedor)
     * @param {boolean} labelInfo.visible - Visibilidad de la etiqueta
     * @param {Object} labelInfo.customStyle - Estilos personalizados
     */
    addLabel(labelId, labelInfo) {
        if (labelInfo.x === undefined || labelInfo.y === undefined) {
            console.error(`Etiqueta "${labelId}" requiere posición x e y (valores entre 0 y 1)`);
            return;
        }

        this.columnLabels.set(labelId, {
            title: labelInfo.title || labelId,
            description: labelInfo.description || '',
            x: Math.max(0, Math.min(1, labelInfo.x)), // Asegurar que esté entre 0 y 1
            y: Math.max(0, Math.min(1, labelInfo.y)), // Asegurar que esté entre 0 y 1
            visible: labelInfo.visible !== false,
            customStyle: labelInfo.customStyle || {}
        });

        console.log(`Etiqueta "${labelId}" agregada en posición (${labelInfo.x}, ${labelInfo.y})`);

        // Re-renderizar si está habilitado
        if (this.enabled) {
            this.renderLabels();
        }
    }

    /**
     * Actualiza una etiqueta existente
     * @param {string} labelId - ID de la etiqueta
     * @param {Object} updates - Actualizaciones a aplicar
     */
    updateLabel(labelId, updates) {
        const existingLabel = this.columnLabels.get(labelId);
        if (!existingLabel) {
            console.warn(`Etiqueta "${labelId}" no encontrada`);
            return;
        }

        // Aplicar actualizaciones
        Object.assign(existingLabel, updates);

        // Validar posiciones si se actualizaron
        if (updates.x !== undefined) {
            existingLabel.x = Math.max(0, Math.min(1, updates.x));
        }
        if (updates.y !== undefined) {
            existingLabel.y = Math.max(0, Math.min(1, updates.y));
        }

        console.log(`Etiqueta "${labelId}" actualizada`);

        // Re-renderizar si está habilitado
        if (this.enabled) {
            this.renderLabels();
        }
    }

    /**
     * Remueve una etiqueta específica
     * @param {string} labelId - ID de la etiqueta a remover
     */
    removeLabel(labelId) {
        if (this.columnLabels.delete(labelId)) {
            console.log(`Etiqueta "${labelId}" removida`);
            
            // Re-renderizar si está habilitado
            if (this.enabled) {
                this.renderLabels();
            }
        } else {
            console.warn(`Etiqueta "${labelId}" no encontrada`);
        }
    }

    /**
     * Habilita o deshabilita el sistema de etiquetas
     * @param {boolean} enabled - Estado de habilitación
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (this.enabled) {
            this.renderLabels();
        } else {
            this.removeLabels();
        }

        console.log(`Etiquetas de columnas ${enabled ? 'habilitadas' : 'deshabilitadas'}`);
    }

    /**
     * Verifica si las etiquetas están habilitadas
     * @returns {boolean} Estado de habilitación
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Renderiza las etiquetas de columnas en el diagrama
     * @param {HTMLElement} container - Contenedor del diagrama (opcional)
     */
    renderLabels(container = null) {
        if (!this.enabled) {
            return;
        }

        // Usar contenedor proporcionado o buscar el contenedor del diagrama
        this.containerElement = container || document.getElementById('sankey-diagram');
        
        if (!this.containerElement) {
            console.warn('No se encontró contenedor para las etiquetas');
            return;
        }

        // Remover etiquetas existentes
        this.removeLabels();

        // Crear etiquetas manualmente definidas
        for (const [labelId, labelInfo] of this.columnLabels.entries()) {
            if (labelInfo && labelInfo.visible) {
                this.createManualLabel(labelId, labelInfo);
            }
        }

        console.log(`Renderizadas ${this.labelElements.length} etiquetas de columnas`);
    }

    /**
     * Crea una etiqueta manual con posición personalizada
     * @param {string} labelId - ID de la etiqueta
     * @param {Object} labelInfo - Información de la etiqueta
     */
    createManualLabel(labelId, labelInfo) {
        // Crear elemento de etiqueta
        const labelElement = document.createElement('div');
        labelElement.className = 'column-label';
        labelElement.setAttribute('data-label-id', labelId);

        // Aplicar estilos
        this.applyLabelStyles(labelElement, labelInfo);

        // Establecer contenido
        labelElement.innerHTML = `
            <div class="column-label-title">${labelInfo.title}</div>
            ${labelInfo.description ? `<div class="column-label-description">${labelInfo.description}</div>` : ''}
        `;

        // Calcular posición basada en las coordenadas manuales
        const position = this.calculateManualPosition(labelInfo);
        this.positionManualLabel(labelElement, position);

        // Agregar al contenedor
        this.containerElement.appendChild(labelElement);
        this.labelElements.push(labelElement);
    }

    /**
     * Calcula la posición manual de una etiqueta
     * @param {Object} labelInfo - Información de la etiqueta con posición x, y
     * @returns {Object} Posición calculada
     */
    calculateManualPosition(labelInfo) {
        if (!this.containerElement) {
            return { x: 0, y: 0 };
        }

        // Obtener dimensiones del contenedor
        const containerRect = this.containerElement.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        // Calcular posición absoluta basada en las coordenadas relativas (0-1)
        const xPosition = labelInfo.x * containerWidth;
        const yPosition = labelInfo.y * containerHeight;

        return {
            x: xPosition,
            y: yPosition,
            containerWidth: containerWidth,
            containerHeight: containerHeight
        };
    }

    /**
     * Posiciona una etiqueta manual en el contenedor
     * @param {HTMLElement} element - Elemento de la etiqueta
     * @param {Object} position - Información de posición
     */
    positionManualLabel(element, position) {
        // Posicionar directamente en las coordenadas calculadas
        element.style.left = `${position.x}px`;
        element.style.top = `${position.y}px`;

        // Ajustar para centrar la etiqueta en la posición especificada
        requestAnimationFrame(() => {
            const labelRect = element.getBoundingClientRect();
            const labelWidth = labelRect.width;
            const labelHeight = labelRect.height;

            // Centrar horizontalmente y verticalmente en la posición especificada
            const centeredX = position.x - (labelWidth / 2);
            const centeredY = position.y - (labelHeight / 2);

            // Asegurar que la etiqueta no se salga del contenedor
            const minX = 5;
            const maxX = position.containerWidth - labelWidth - 5;
            const minY = 5;
            const maxY = position.containerHeight - labelHeight - 5;

            const finalX = Math.max(minX, Math.min(maxX, centeredX));
            const finalY = Math.max(minY, Math.min(maxY, centeredY));

            element.style.left = `${finalX}px`;
            element.style.top = `${finalY}px`;
        });
    }

    /**
     * Aplica estilos CSS a una etiqueta
     * @param {HTMLElement} element - Elemento de la etiqueta
     * @param {Object} labelInfo - Información de la etiqueta
     */
    applyLabelStyles(element, labelInfo) {
        const config = this.labelConfig;
        const customStyle = labelInfo.customStyle || {};

        // Estilos base
        Object.assign(element.style, {
            position: 'absolute',
            fontSize: `${customStyle.fontSize || config.fontSize}px`,
            fontFamily: customStyle.fontFamily || config.fontFamily,
            fontWeight: customStyle.fontWeight || config.fontWeight,
            color: customStyle.color || config.color,
            backgroundColor: customStyle.backgroundColor || config.backgroundColor,
            borderRadius: `${customStyle.borderRadius || config.borderRadius}px`,
            padding: `${config.padding.y}px ${config.padding.x}px`,
            opacity: customStyle.opacity || config.opacity,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            zIndex: '1000',
            pointerEvents: 'none', // No interferir con interacciones del diagrama
            transition: 'all 0.3s ease'
        });

        // Estilos para el título
        const titleElement = element.querySelector('.column-label-title');
        if (titleElement) {
            Object.assign(titleElement.style, {
                margin: '0',
                lineHeight: '1.2'
            });
        }

        // Estilos para la descripción
        const descElement = element.querySelector('.column-label-description');
        if (descElement) {
            Object.assign(descElement.style, {
                margin: '2px 0 0 0',
                fontSize: `${(customStyle.fontSize || config.fontSize) * 0.8}px`,
                opacity: '0.7',
                lineHeight: '1.1'
            });
        }
    }

    /**
     * Calcula la posición de una etiqueta basada en la información de la columna
     * @param {Object} column - Información de la columna
     * @returns {Object} Posición calculada
     */
    calculateLabelPosition(column) {
        if (!this.containerElement) {
            return { x: 0, y: 0 };
        }

        // Obtener dimensiones del contenedor
        const containerRect = this.containerElement.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        // Calcular posición X basada en la posición de la columna
        const xPosition = column.x * containerWidth;

        // Posición Y fija en la parte superior con margen
        const yPosition = this.labelConfig.marginTop * containerHeight;

        return {
            x: xPosition,
            y: yPosition,
            containerWidth: containerWidth,
            containerHeight: containerHeight
        };
    }

    /**
     * Posiciona una etiqueta en el contenedor
     * @param {HTMLElement} element - Elemento de la etiqueta
     * @param {Object} position - Información de posición
     */
    positionLabel(element, position) {
        // Posicionar temporalmente para medir dimensiones
        element.style.left = `${position.x}px`;
        element.style.top = `${position.y}px`;

        // Esperar a que el elemento se renderice para obtener dimensiones reales
        requestAnimationFrame(() => {
            const labelRect = element.getBoundingClientRect();
            const labelWidth = labelRect.width;

            // Centrar horizontalmente en la posición de la columna
            const centeredX = position.x - (labelWidth / 2);

            // Asegurar que la etiqueta no se salga del contenedor
            const minX = 5; // Margen mínimo del borde izquierdo
            const maxX = position.containerWidth - labelWidth - 5; // Margen mínimo del borde derecho
            const finalX = Math.max(minX, Math.min(maxX, centeredX));

            element.style.left = `${finalX}px`;
        });
    }

    /**
     * Remueve todas las etiquetas del DOM
     */
    removeLabels() {
        for (const element of this.labelElements) {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
        this.labelElements = [];
    }

    /**
     * Actualiza las posiciones de las etiquetas (útil cuando cambia el tamaño del contenedor)
     */
    updatePositions() {
        if (!this.enabled || this.labelElements.length === 0) {
            return;
        }

        // Re-calcular posiciones para todas las etiquetas manuales
        for (const element of this.labelElements) {
            const labelId = element.getAttribute('data-label-id');
            const labelInfo = this.columnLabels.get(labelId);

            if (labelInfo) {
                const position = this.calculateManualPosition(labelInfo);
                this.positionManualLabel(element, position);
            }
        }
    }

    /**
     * Limpia todas las etiquetas existentes
     */
    clearAllLabels() {
        this.columnLabels.clear();
        this.removeLabels();
        console.log('Todas las etiquetas han sido removidas');
    }

    /**
     * Agrega múltiples etiquetas de una vez
     * @param {Array} labelsArray - Array de objetos con información de etiquetas
     */
    addMultipleLabels(labelsArray) {
        for (const labelData of labelsArray) {
            if (labelData.id) {
                this.addLabel(labelData.id, labelData);
            } else {
                console.warn('Etiqueta sin ID ignorada:', labelData);
            }
        }
    }

    /**
     * Obtiene una etiqueta específica por ID
     * @param {string} labelId - ID de la etiqueta
     * @returns {Object|null} Información de la etiqueta
     */
    getLabel(labelId) {
        return this.columnLabels.get(labelId) || null;
    }

    /**
     * Obtiene la configuración actual de etiquetas
     * @returns {Object} Configuración de etiquetas
     */
    getConfiguration() {
        return {
            enabled: this.enabled,
            labelConfig: { ...this.labelConfig },
            columnLabels: Object.fromEntries(this.columnLabels.entries())
        };
    }

    /**
     * Actualiza la configuración de etiquetas
     * @param {Object} newConfig - Nueva configuración
     */
    updateConfiguration(newConfig) {
        if (newConfig.enabled !== undefined) {
            this.setEnabled(newConfig.enabled);
        }

        if (newConfig.labelConfig) {
            Object.assign(this.labelConfig, newConfig.labelConfig);
        }

        if (newConfig.columnLabels) {
            for (const [labelId, labelInfo] of Object.entries(newConfig.columnLabels)) {
                this.addLabel(labelId, labelInfo);
            }
        }

        // Re-renderizar si está habilitado
        if (this.enabled) {
            this.renderLabels();
        }

        console.log('Configuración de etiquetas actualizada');
    }

    /**
     * Obtiene información de una etiqueta específica
     * @param {string} columnName - Nombre de la columna
     * @returns {Object|null} Información de la etiqueta
     */
    getColumnLabel(columnName) {
        return this.columnLabels.get(columnName) || null;
    }

    /**
     * Obtiene todas las etiquetas definidas
     * @returns {Array} Array con información de todas las etiquetas
     */
    getAllLabels() {
        return Array.from(this.columnLabels.entries()).map(([columnName, labelInfo]) => ({
            columnName,
            ...labelInfo
        }));
    }

    /**
     * Muestra u oculta una etiqueta específica
     * @param {string} columnName - Nombre de la columna
     * @param {boolean} visible - Visibilidad de la etiqueta
     */
    setLabelVisibility(columnName, visible) {
        const labelInfo = this.columnLabels.get(columnName);
        if (labelInfo) {
            labelInfo.visible = visible;
            
            // Re-renderizar si está habilitado
            if (this.enabled) {
                this.renderLabels();
            }
        }
    }

    /**
     * Aplica un tema de colores a las etiquetas
     * @param {Object} theme - Tema de colores
     */
    applyTheme(theme) {
        if (theme.text) {
            this.labelConfig.color = theme.text;
        }
        
        if (theme.background) {
            this.labelConfig.backgroundColor = theme.background;
        }

        // Re-renderizar si está habilitado
        if (this.enabled) {
            this.renderLabels();
        }
    }

    /**
     * Maneja el redimensionamiento del contenedor
     */
    handleResize() {
        if (this.enabled) {
            // Usar debounce para evitar demasiadas actualizaciones
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.updatePositions();
            }, 150);
        }
    }

    /**
     * Obtiene las etiquetas como elementos SVG para exportación
     * @returns {Array} Array de elementos SVG
     */
    getLabelsForExport() {
        if (!this.enabled || this.labelElements.length === 0) {
            return [];
        }

        const svgElements = [];

        for (const element of this.labelElements) {
            const rect = element.getBoundingClientRect();
            const containerRect = this.containerElement.getBoundingClientRect();
            
            // Calcular posición relativa al contenedor
            const relativeX = rect.left - containerRect.left;
            const relativeY = rect.top - containerRect.top;

            // Crear elemento SVG text
            const titleElement = element.querySelector('.column-label-title');
            const descElement = element.querySelector('.column-label-description');

            if (titleElement) {
                svgElements.push({
                    type: 'text',
                    x: relativeX + rect.width / 2,
                    y: relativeY + 16,
                    text: titleElement.textContent,
                    style: {
                        fontSize: this.labelConfig.fontSize,
                        fontFamily: this.labelConfig.fontFamily,
                        fontWeight: this.labelConfig.fontWeight,
                        fill: this.labelConfig.color,
                        textAnchor: 'middle'
                    }
                });
            }

            if (descElement) {
                svgElements.push({
                    type: 'text',
                    x: relativeX + rect.width / 2,
                    y: relativeY + 32,
                    text: descElement.textContent,
                    style: {
                        fontSize: this.labelConfig.fontSize * 0.8,
                        fontFamily: this.labelConfig.fontFamily,
                        fill: this.labelConfig.color,
                        textAnchor: 'middle',
                        opacity: 0.7
                    }
                });
            }

            // Crear fondo de la etiqueta
            svgElements.unshift({
                type: 'rect',
                x: relativeX,
                y: relativeY,
                width: rect.width,
                height: rect.height,
                style: {
                    fill: this.labelConfig.backgroundColor,
                    stroke: 'rgba(0, 0, 0, 0.1)',
                    strokeWidth: 1,
                    rx: this.labelConfig.borderRadius
                }
            });
        }

        return svgElements;
    }

    /**
     * Obtiene estadísticas del sistema de etiquetas
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            enabled: this.enabled,
            totalLabels: this.columnLabels.size,
            visibleLabels: Array.from(this.columnLabels.values()).filter(label => label.visible).length,
            renderedLabels: this.labelElements.length,
            hasLayoutEngine: !!this.layoutEngine,
            hasStyleManager: !!this.styleManager
        };
    }

    /**
     * Reinicia el ColumnLabelsManager
     */
    reset() {
        this.removeLabels();
        this.columnLabels.clear();
        this.enabled = false;
        this.initializeDefaultLabels();
        console.log('ColumnLabelsManager reiniciado');
    }

    /**
     * Destructor - limpia recursos
     */
    destroy() {
        this.removeLabels();
        clearTimeout(this.resizeTimeout);
        this.containerElement = null;
        this.layoutEngine = null;
        this.styleManager = null;
        console.log('ColumnLabelsManager destruido');
    }
}

// Exportar la clase para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColumnLabelsManager;
}