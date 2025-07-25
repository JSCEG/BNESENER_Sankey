/**
 * LayoutEngine - Módulo para posicionamiento inteligente de nodos en el diagrama de Sankey
 * 
 * Este módulo encapsula toda la lógica relacionada con el cálculo de posiciones,
 * organización en columnas y prevención de solapamientos en el diagrama.
 * 
 * Funcionalidades principales:
 * - Algoritmo de posicionamiento automático que evita solapamientos
 * - Sistema de columnas lógicas para organizar nodos
 * - Cálculo dinámico de espaciado vertical
 * - Optimización de flujo visual de izquierda a derecha
 * - Gestión de grupos y agrupaciones visuales
 * 
 * @author Kiro AI Assistant
 * @version 1.0.0
 */

class LayoutEngine {
    /**
     * Constructor del LayoutEngine
     * @param {Object} options - Opciones de configuración
     */
    constructor(options = {}) {
        this.canvasWidth = options.canvasWidth || 1.0;
        this.canvasHeight = options.canvasHeight || 1.0;
        this.minNodeSpacing = options.minNodeSpacing || 0.04; // Reduced spacing for better distribution
        this.columnSpacing = options.columnSpacing || 0.2;
        this.marginTop = options.marginTop || 0.03; // Reduced top margin
        this.marginBottom = options.marginBottom || 0.03; // Reduced bottom margin
        
        // Definiciones de columnas lógicas
        this.columnDefinitions = new Map();
        this.nodeGroups = new Map();
        this.nodePositions = new Map();
        
        // Configuración por defecto de columnas
        this.initializeDefaultColumns();
    }

    /**
     * Inicializa las columnas por defecto del diagrama de energía
     */
    initializeDefaultColumns() {
        // Definir columnas lógicas del flujo energético con mejor distribución horizontal
        // para aprovechar el canvas expandido al 95% del ancho
        this.defineColumn('fuentes', {
            x: 0.08,
            title: 'Fuentes',
            width: 0.15,
            nodes: ['Producción', 'Importación de energéticos primarios', 'Variación de inventarios de Energéticos primarios'],
            verticalDistribution: 'spread'
        });

        this.defineColumn('hub-primario', {
            x: 0.28,
            title: 'Hub Primario',
            width: 0.1,
            nodes: ['Oferta Total (Hub)'],
            verticalDistribution: 'center'
        });

        this.defineColumn('distribucion', {
            x: 0.45,
            title: 'Distribución',
            width: 0.15,
            nodes: ['Oferta Interna Bruta', 'Exportación', 'Energía No Aprovechada', 'Consumo Propio del Sector'],
            verticalDistribution: 'spread'
        });

        this.defineColumn('transformacion', {
            x: 0.65,
            title: 'Transformación',
            width: 0.15,
            nodes: ['Refinerías y Despuntadoras', 'Plantas de Gas y Fraccionadoras', 'Coquizadoras y Hornos'],
            verticalDistribution: 'spread'
        });

        this.defineColumn('generacion', {
            x: 0.82,
            title: 'Generación',
            width: 0.15,
            nodes: [
                'Carboeléctrica', 'Térmica Convencional', 'Combustión Interna', 
                'Turbogás', 'Ciclo Combinado', 'Nucleoeléctrica', 'Cogeneración',
                'Geotérmica', 'Eólica', 'Solar Fotovoltaica'
            ],
            verticalDistribution: 'compact'
        });

        this.defineColumn('centrales', {
            x: 0.95,
            title: 'Centrales',
            width: 0.05,
            nodes: ['Centrales Eléctricas'],
            verticalDistribution: 'center'
        });

        console.log('LayoutEngine inicializado con', this.columnDefinitions.size, 'columnas');
    }

    /**
     * Define una nueva columna lógica
     * @param {string} name - Nombre de la columna
     * @param {Object} config - Configuración de la columna
     */
    defineColumn(name, config) {
        this.columnDefinitions.set(name, {
            name: name,
            x: config.x || 0.5,
            title: config.title || name,
            width: config.width || 0.1,
            nodes: config.nodes || [],
            verticalDistribution: config.verticalDistribution || 'spread',
            minY: config.minY || this.marginTop,
            maxY: config.maxY || (1.0 - this.marginBottom)
        });
    }

    /**
     * Calcula las posiciones de todos los nodos
     * @param {Array} nodeNames - Lista de nombres de nodos
     * @param {Object} nodeData - Datos adicionales de los nodos
     * @returns {Map} Mapa con posiciones calculadas
     */
    calculatePositions(nodeNames, nodeData = {}) {
        this.nodePositions.clear();
        
        // Organizar nodos por columnas
        const nodesByColumn = this.organizeNodesByColumns(nodeNames);
        
        // Calcular posiciones para cada columna
        for (const [columnName, columnNodes] of nodesByColumn.entries()) {
            const columnConfig = this.columnDefinitions.get(columnName);
            if (!columnConfig) continue;
            
            const positions = this.calculateColumnPositions(columnNodes, columnConfig, nodeData);
            
            // Almacenar posiciones calculadas
            for (const [nodeName, position] of positions.entries()) {
                this.nodePositions.set(nodeName, position);
            }
        }
        
        // Manejar nodos no asignados a columnas
        this.handleUnassignedNodes(nodeNames);
        
        return new Map(this.nodePositions);
    }

    /**
     * Organiza los nodos por columnas según las definiciones
     * @param {Array} nodeNames - Lista de nombres de nodos
     * @returns {Map} Nodos organizados por columna
     */
    organizeNodesByColumns(nodeNames) {
        const nodesByColumn = new Map();
        const assignedNodes = new Set();
        
        // Asignar nodos a columnas definidas
        for (const [columnName, columnConfig] of this.columnDefinitions.entries()) {
            const columnNodes = [];
            
            for (const nodeName of nodeNames) {
                if (columnConfig.nodes.includes(nodeName)) {
                    columnNodes.push(nodeName);
                    assignedNodes.add(nodeName);
                }
            }
            
            if (columnNodes.length > 0) {
                nodesByColumn.set(columnName, columnNodes);
            }
        }
        
        // Crear columna para nodos no asignados
        const unassignedNodes = nodeNames.filter(name => !assignedNodes.has(name));
        if (unassignedNodes.length > 0) {
            nodesByColumn.set('unassigned', unassignedNodes);
        }
        
        return nodesByColumn;
    }

    /**
     * Calcula posiciones para nodos en una columna específica
     * @param {Array} nodes - Nodos de la columna
     * @param {Object} columnConfig - Configuración de la columna
     * @param {Object} nodeData - Datos adicionales de los nodos
     * @returns {Map} Posiciones calculadas
     */
    calculateColumnPositions(nodes, columnConfig, nodeData) {
        const positions = new Map();
        const nodeCount = nodes.length;
        
        if (nodeCount === 0) return positions;
        
        const availableHeight = columnConfig.maxY - columnConfig.minY;
        
        switch (columnConfig.verticalDistribution) {
            case 'center':
                // Centrar nodos verticalmente
                const centerY = columnConfig.minY + (availableHeight / 2);
                const centerSpacing = Math.min(this.minNodeSpacing, availableHeight / Math.max(nodeCount, 1));
                
                nodes.forEach((nodeName, index) => {
                    const offsetY = (index - (nodeCount - 1) / 2) * centerSpacing;
                    positions.set(nodeName, {
                        x: columnConfig.x,
                        y: Math.max(columnConfig.minY, Math.min(columnConfig.maxY, centerY + offsetY)),
                        column: columnConfig.name
                    });
                });
                break;
                
            case 'compact':
                // Distribución compacta desde arriba
                const compactSpacing = Math.min(this.minNodeSpacing, availableHeight / nodeCount);
                
                nodes.forEach((nodeName, index) => {
                    positions.set(nodeName, {
                        x: columnConfig.x,
                        y: columnConfig.minY + (index * compactSpacing),
                        column: columnConfig.name
                    });
                });
                break;
                
            case 'spread':
            default:
                // Distribución uniforme en toda la altura disponible
                if (nodeCount === 1) {
                    positions.set(nodes[0], {
                        x: columnConfig.x,
                        y: columnConfig.minY + (availableHeight / 2),
                        column: columnConfig.name
                    });
                } else {
                    const spreadSpacing = availableHeight / (nodeCount - 1);
                    
                    nodes.forEach((nodeName, index) => {
                        positions.set(nodeName, {
                            x: columnConfig.x,
                            y: columnConfig.minY + (index * spreadSpacing),
                            column: columnConfig.name
                        });
                    });
                }
                break;
        }
        
        return positions;
    }

    /**
     * Maneja nodos que no fueron asignados a ninguna columna
     * @param {Array} nodeNames - Lista completa de nodos
     */
    handleUnassignedNodes(nodeNames) {
        const assignedNodes = new Set(this.nodePositions.keys());
        const unassignedNodes = nodeNames.filter(name => !assignedNodes.has(name));
        
        if (unassignedNodes.length === 0) return;
        
        console.warn('Nodos no asignados a columnas:', unassignedNodes);
        
        // Crear posiciones por defecto para nodos no asignados
        const defaultX = 0.5; // Centro horizontal
        const availableHeight = 1.0 - this.marginTop - this.marginBottom;
        const spacing = availableHeight / Math.max(unassignedNodes.length, 1);
        
        unassignedNodes.forEach((nodeName, index) => {
            this.nodePositions.set(nodeName, {
                x: defaultX,
                y: this.marginTop + (index * spacing),
                column: 'default'
            });
        });
    }

    /**
     * Optimiza las posiciones para evitar solapamientos
     * @param {Map} positions - Posiciones actuales
     * @returns {Map} Posiciones optimizadas
     */
    optimizePositions(positions) {
        const optimizedPositions = new Map(positions);
        
        // Agrupar nodos por columna para optimización
        const nodesByColumn = new Map();
        
        for (const [nodeName, position] of positions.entries()) {
            const columnName = position.column || 'default';
            if (!nodesByColumn.has(columnName)) {
                nodesByColumn.set(columnName, []);
            }
            nodesByColumn.get(columnName).push({ name: nodeName, position: position });
        }
        
        // Optimizar cada columna por separado
        for (const [columnName, columnNodes] of nodesByColumn.entries()) {
            const optimizedColumnPositions = this.optimizeColumnPositions(columnNodes);
            
            for (const { name, position } of optimizedColumnPositions) {
                optimizedPositions.set(name, position);
            }
        }
        
        return optimizedPositions;
    }

    /**
     * Optimiza posiciones dentro de una columna específica
     * @param {Array} columnNodes - Nodos de la columna con sus posiciones
     * @returns {Array} Nodos con posiciones optimizadas
     */
    optimizeColumnPositions(columnNodes) {
        if (columnNodes.length <= 1) return columnNodes;
        
        // Ordenar nodos por posición Y
        columnNodes.sort((a, b) => a.position.y - b.position.y);
        
        // Detectar y resolver solapamientos
        for (let i = 1; i < columnNodes.length; i++) {
            const currentNode = columnNodes[i];
            const previousNode = columnNodes[i - 1];
            
            const minDistance = this.minNodeSpacing;
            const actualDistance = currentNode.position.y - previousNode.position.y;
            
            if (actualDistance < minDistance) {
                // Ajustar posición para evitar solapamiento
                const adjustment = minDistance - actualDistance;
                currentNode.position.y += adjustment;
                
                // Asegurar que no exceda los límites
                if (currentNode.position.y > (1.0 - this.marginBottom)) {
                    // Si excede el límite inferior, redistribuir todos los nodos
                    this.redistributeColumnNodes(columnNodes);
                    break;
                }
            }
        }
        
        return columnNodes;
    }

    /**
     * Redistribuye nodos en una columna cuando hay problemas de espacio
     * @param {Array} columnNodes - Nodos de la columna
     */
    redistributeColumnNodes(columnNodes) {
        const availableHeight = (1.0 - this.marginBottom) - this.marginTop;
        const totalSpacingNeeded = (columnNodes.length - 1) * this.minNodeSpacing;
        
        if (totalSpacingNeeded >= availableHeight) {
            // Espacio insuficiente, usar espaciado mínimo posible
            const actualSpacing = availableHeight / Math.max(columnNodes.length - 1, 1);
            
            columnNodes.forEach((node, index) => {
                node.position.y = this.marginTop + (index * actualSpacing);
            });
        } else {
            // Redistribuir uniformemente
            const spacing = availableHeight / Math.max(columnNodes.length - 1, 1);
            
            columnNodes.forEach((node, index) => {
                node.position.y = this.marginTop + (index * spacing);
            });
        }
    }

    /**
     * Obtiene la posición de un nodo específico
     * @param {string} nodeName - Nombre del nodo
     * @returns {Object|null} Posición del nodo o null si no existe
     */
    getNodePosition(nodeName) {
        return this.nodePositions.get(nodeName) || null;
    }

    /**
     * Obtiene todas las posiciones calculadas
     * @returns {Map} Todas las posiciones
     */
    getAllPositions() {
        return new Map(this.nodePositions);
    }

    /**
     * Obtiene información de una columna específica
     * @param {string} columnName - Nombre de la columna
     * @returns {Object|null} Configuración de la columna
     */
    getColumnInfo(columnName) {
        return this.columnDefinitions.get(columnName) || null;
    }

    /**
     * Obtiene todas las columnas definidas
     * @returns {Array} Lista de columnas con su información
     */
    getAllColumns() {
        return Array.from(this.columnDefinitions.entries()).map(([name, config]) => ({
            name: name,
            ...config
        }));
    }

    /**
     * Actualiza la configuración de una columna existente
     * @param {string} columnName - Nombre de la columna
     * @param {Object} updates - Actualizaciones a aplicar
     */
    updateColumn(columnName, updates) {
        const existingConfig = this.columnDefinitions.get(columnName);
        if (existingConfig) {
            this.columnDefinitions.set(columnName, { ...existingConfig, ...updates });
            console.log(`Columna "${columnName}" actualizada`);
        } else {
            console.warn(`Columna "${columnName}" no encontrada`);
        }
    }

    /**
     * Agrega un nodo a una columna específica
     * @param {string} columnName - Nombre de la columna
     * @param {string} nodeName - Nombre del nodo a agregar
     */
    addNodeToColumn(columnName, nodeName) {
        const columnConfig = this.columnDefinitions.get(columnName);
        if (columnConfig) {
            if (!columnConfig.nodes.includes(nodeName)) {
                columnConfig.nodes.push(nodeName);
                console.log(`Nodo "${nodeName}" agregado a columna "${columnName}"`);
            }
        } else {
            console.warn(`Columna "${columnName}" no encontrada`);
        }
    }

    /**
     * Remueve un nodo de una columna específica
     * @param {string} columnName - Nombre de la columna
     * @param {string} nodeName - Nombre del nodo a remover
     */
    removeNodeFromColumn(columnName, nodeName) {
        const columnConfig = this.columnDefinitions.get(columnName);
        if (columnConfig) {
            const index = columnConfig.nodes.indexOf(nodeName);
            if (index > -1) {
                columnConfig.nodes.splice(index, 1);
                console.log(`Nodo "${nodeName}" removido de columna "${columnName}"`);
            }
        } else {
            console.warn(`Columna "${columnName}" no encontrada`);
        }
    }

    /**
     * Calcula estadísticas del layout actual
     * @returns {Object} Estadísticas del layout
     */
    getLayoutStats() {
        const stats = {
            totalNodes: this.nodePositions.size,
            totalColumns: this.columnDefinitions.size,
            nodesByColumn: {},
            averageNodesPerColumn: 0,
            positionRange: {
                minX: 1.0,
                maxX: 0.0,
                minY: 1.0,
                maxY: 0.0
            }
        };

        // Calcular estadísticas por columna
        for (const [columnName, columnConfig] of this.columnDefinitions.entries()) {
            stats.nodesByColumn[columnName] = columnConfig.nodes.length;
        }

        stats.averageNodesPerColumn = stats.totalNodes / stats.totalColumns;

        // Calcular rango de posiciones
        for (const position of this.nodePositions.values()) {
            stats.positionRange.minX = Math.min(stats.positionRange.minX, position.x);
            stats.positionRange.maxX = Math.max(stats.positionRange.maxX, position.x);
            stats.positionRange.minY = Math.min(stats.positionRange.minY, position.y);
            stats.positionRange.maxY = Math.max(stats.positionRange.maxY, position.y);
        }

        return stats;
    }

    /**
     * Reinicia el LayoutEngine a su estado inicial
     */
    reset() {
        this.nodePositions.clear();
        this.nodeGroups.clear();
        this.columnDefinitions.clear();
        this.initializeDefaultColumns();
        console.log('LayoutEngine reiniciado');
    }
}

// Exportar la clase para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayoutEngine;
}