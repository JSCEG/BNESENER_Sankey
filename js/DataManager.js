/**
 * DataManager - Módulo para manejo centralizado de datos del diagrama de Sankey
 * 
 * Este módulo encapsula toda la lógica relacionada con la carga, procesamiento
 * y validación de datos energéticos, proporcionando una interfaz limpia para
 * acceder a la información de nodos y sus propiedades.
 * 
 * Funcionalidades principales:
 * - Validación robusta de datos JSON
 * - Cache inteligente para optimización de rendimiento
 * - Búsqueda y filtrado avanzado de nodos
 * - Estadísticas detalladas del conjunto de datos
 * - Manejo de errores con recuperación elegante
 * 
 * @author Kiro AI Assistant
 * @version 2.0.0
 */

class DataManager {
    /**
     * Constructor del DataManager
     * @param {Object} jsonData - Datos JSON cargados desde el archivo de datos
     */
    constructor(jsonData = null) {
        this.rawData = jsonData;
        this.processedData = new Map();
        this.nodeDefinitions = new Map();
        this.yearCache = new Map();
        this.isInitialized = false;

        if (jsonData) {
            this.initialize(jsonData);
        }
    }

    /**
     * Inicializa el DataManager con los datos JSON
     * @param {Object} jsonData - Datos JSON del balance energético
     * @throws {Error} Si los datos no son válidos
     */
    initialize(jsonData) {
        try {
            this.rawData = jsonData;
            this.validateData();
            this.processData();
            this.isInitialized = true;
            console.log('DataManager inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar DataManager:', error);
            throw new Error(`Fallo en inicialización: ${error.message}`);
        }
    }

    /**
     * Valida la estructura básica de los datos JSON
     * @throws {Error} Si la estructura de datos es inválida
     */
    validateData() {
        if (!this.rawData) {
            throw new Error('No se proporcionaron datos');
        }

        if (!this.rawData.Datos || !Array.isArray(this.rawData.Datos)) {
            throw new Error('Estructura de datos inválida: falta array "Datos"');
        }

        // Validar que cada nodo padre tenga la estructura esperada
        for (const nodeData of this.rawData.Datos) {
            if (!nodeData['Nodo Padre']) {
                throw new Error('Nodo padre sin nombre encontrado');
            }

            if (!nodeData['Nodos Hijo'] || !Array.isArray(nodeData['Nodos Hijo'])) {
                throw new Error(`Nodo padre "${nodeData['Nodo Padre']}" sin nodos hijo válidos`);
            }

            // Validar estructura de nodos hijo
            for (const childNode of nodeData['Nodos Hijo']) {
                if (!childNode['Nodo Hijo']) {
                    throw new Error(`Nodo hijo sin nombre en padre "${nodeData['Nodo Padre']}"`);
                }
            }
        }

        console.log('Validación de datos completada exitosamente');
    }

    /**
     * Procesa los datos raw y los organiza para acceso eficiente
     */
    processData() {
        // Limpiar datos procesados anteriores
        this.processedData.clear();
        this.nodeDefinitions.clear();

        // Procesar cada nodo padre
        for (const nodeData of this.rawData.Datos) {
            const nodeName = nodeData['Nodo Padre'];

            // Almacenar definición completa del nodo
            this.nodeDefinitions.set(nodeName, {
                name: nodeName,
                description: nodeData.descripcion || '',
                id_padre: nodeData.id_padre,
                color: nodeData.color || '#888888',
                children: this.processChildNodes(nodeData['Nodos Hijo'])
            });

            // Almacenar referencia rápida a los datos raw
            this.processedData.set(nodeName, nodeData);
        }

        console.log(`Procesados ${this.processedData.size} nodos padre`);
    }

    /**
     * Procesa los nodos hijo de un nodo padre
     * @param {Array} childrenData - Array de nodos hijo
     * @returns {Map} Mapa de nodos hijo procesados
     */
    processChildNodes(childrenData) {
        const childrenMap = new Map();

        for (const child of childrenData) {
            const childName = child['Nodo Hijo'];
            childrenMap.set(childName, {
                name: childName,
                type: child.tipo || 'Unknown',
                description: child.descripcion || '',
                id_hijo: child.id_hijo,
                color: child.color || '#888888',
                yearData: this.extractYearData(child)
            });
        }

        return childrenMap;
    }

    /**
     * Extrae datos de años de un nodo hijo
     * @param {Object} childData - Datos del nodo hijo
     * @returns {Map} Mapa con datos por año
     */
    extractYearData(childData) {
        const yearData = new Map();

        for (const [key, value] of Object.entries(childData)) {
            // Verificar si la clave es un año (4 dígitos numéricos)
            if (/^\d{4}$/.test(key) && key !== '2025') {
                yearData.set(key, parseFloat(value) || 0);
            }
        }

        return yearData;
    }

    /**
     * Obtiene los datos de un nodo padre específico
     * @param {string} nodeName - Nombre del nodo padre
     * @returns {Object|null} Datos del nodo o null si no existe
     */
    getNodeData(nodeName) {
        if (!this.isInitialized) {
            console.warn('DataManager no está inicializado');
            return null;
        }

        return this.processedData.get(nodeName) || null;
    }

    /**
     * Obtiene la definición procesada de un nodo
     * @param {string} nodeName - Nombre del nodo padre
     * @returns {Object|null} Definición del nodo o null si no existe
     */
    getNodeDefinition(nodeName) {
        if (!this.isInitialized) {
            console.warn('DataManager no está inicializado');
            return null;
        }

        return this.nodeDefinitions.get(nodeName) || null;
    }

    /**
     * Obtiene todos los años disponibles en los datos
     * @returns {Array} Array de años ordenados de mayor a menor
     */
    getAvailableYears() {
        if (!this.isInitialized) {
            console.warn('DataManager no está inicializado');
            return [];
        }

        const years = new Set();

        for (const nodeData of this.rawData.Datos) {
            for (const child of nodeData['Nodos Hijo']) {
                for (const key of Object.keys(child)) {
                    if (/^\d{4}$/.test(key) && key !== '2025') {
                        years.add(key);
                    }
                }
            }
        }

        return Array.from(years).sort((a, b) => b - a);
    }

    /**
     * Obtiene datos específicos de un año para todos los nodos
     * @param {string} year - Año a consultar
     * @returns {Map} Mapa con datos del año por nodo
     */
    getYearData(year) {
        if (!this.isInitialized) {
            console.warn('DataManager no está inicializado');
            return new Map();
        }

        // Usar cache si ya se procesó este año
        if (this.yearCache.has(year)) {
            return this.yearCache.get(year);
        }

        const yearData = new Map();

        for (const [nodeName, nodeDefinition] of this.nodeDefinitions.entries()) {
            const nodeYearData = new Map();

            for (const [childName, childDefinition] of nodeDefinition.children.entries()) {
                const value = childDefinition.yearData.get(year);
                if (value !== undefined) {
                    nodeYearData.set(childName, value);
                }
            }

            yearData.set(nodeName, nodeYearData);
        }

        // Guardar en cache
        this.yearCache.set(year, yearData);
        return yearData;
    }

    /**
     * Obtiene todos los nombres de nodos padre
     * @returns {Array} Array con nombres de nodos padre
     */
    getParentNodeNames() {
        if (!this.isInitialized) {
            return [];
        }

        return Array.from(this.nodeDefinitions.keys());
    }

    /**
     * Obtiene todos los nodos hijo de un tipo específico
     * @param {string} type - Tipo de energía ('Energía Primaria' o 'Energía Secundaria')
     * @returns {Array} Array con nodos hijo del tipo especificado
     */
    getChildNodesByType(type) {
        if (!this.isInitialized) {
            return [];
        }

        const childNodes = [];

        for (const nodeDefinition of this.nodeDefinitions.values()) {
            for (const childDefinition of nodeDefinition.children.values()) {
                if (childDefinition.type === type) {
                    childNodes.push(childDefinition);
                }
            }
        }

        return childNodes;
    }

    /**
     * Verifica si un nodo padre existe
     * @param {string} nodeName - Nombre del nodo padre
     * @returns {boolean} True si existe, false en caso contrario
     */
    hasNode(nodeName) {
        return this.isInitialized && this.processedData.has(nodeName);
    }

    /**
     * Obtiene estadísticas básicas de los datos
     * @returns {Object} Objeto con estadísticas
     */
    getDataStats() {
        if (!this.isInitialized) {
            return null;
        }

        const stats = {
            totalParentNodes: this.nodeDefinitions.size,
            totalChildNodes: 0,
            primaryEnergyNodes: 0,
            secondaryEnergyNodes: 0,
            availableYears: this.getAvailableYears().length,
            yearRange: {
                min: null,
                max: null
            }
        };

        // Contar nodos hijo por tipo
        for (const nodeDefinition of this.nodeDefinitions.values()) {
            stats.totalChildNodes += nodeDefinition.children.size;

            for (const childDefinition of nodeDefinition.children.values()) {
                if (childDefinition.type === 'Energía Primaria') {
                    stats.primaryEnergyNodes++;
                } else if (childDefinition.type === 'Energía Secundaria') {
                    stats.secondaryEnergyNodes++;
                }
            }
        }

        // Calcular rango de años
        const years = this.getAvailableYears();
        if (years.length > 0) {
            stats.yearRange.min = Math.min(...years.map(y => parseInt(y)));
            stats.yearRange.max = Math.max(...years.map(y => parseInt(y)));
        }

        return stats;
    }

    /**
     * Limpia el cache interno
     */
    clearCache() {
        this.yearCache.clear();
        console.log('Cache del DataManager limpiado');
    }

    /**
     * Busca nodos por nombre (búsqueda parcial, case-insensitive)
     * @param {string} searchTerm - Término de búsqueda
     * @param {string} nodeType - Tipo de nodo ('parent' | 'child' | 'all')
     * @returns {Array} Array con resultados de búsqueda
     */
    searchNodes(searchTerm, nodeType = 'all') {
        if (!this.isInitialized || !searchTerm) {
            return [];
        }

        const results = [];
        const term = searchTerm.toLowerCase();

        // Buscar en nodos padre
        if (nodeType === 'parent' || nodeType === 'all') {
            for (const [nodeName, nodeDefinition] of this.nodeDefinitions.entries()) {
                if (nodeName.toLowerCase().includes(term)) {
                    results.push({
                        type: 'parent',
                        name: nodeName,
                        definition: nodeDefinition,
                        match: 'name'
                    });
                }

                // Buscar también en descripción
                if (nodeDefinition.description.toLowerCase().includes(term)) {
                    results.push({
                        type: 'parent',
                        name: nodeName,
                        definition: nodeDefinition,
                        match: 'description'
                    });
                }
            }
        }

        // Buscar en nodos hijo
        if (nodeType === 'child' || nodeType === 'all') {
            for (const [parentName, nodeDefinition] of this.nodeDefinitions.entries()) {
                for (const [childName, childDefinition] of nodeDefinition.children.entries()) {
                    if (childName.toLowerCase().includes(term)) {
                        results.push({
                            type: 'child',
                            name: childName,
                            parent: parentName,
                            definition: childDefinition,
                            match: 'name'
                        });
                    }

                    if (childDefinition.description.toLowerCase().includes(term)) {
                        results.push({
                            type: 'child',
                            name: childName,
                            parent: parentName,
                            definition: childDefinition,
                            match: 'description'
                        });
                    }
                }
            }
        }

        return results;
    }

    /**
     * Filtra nodos por criterios específicos
     * @param {Object} filters - Objeto con criterios de filtrado
     * @param {Array} filters.energyTypes - Tipos de energía a incluir
     * @param {Array} filters.parentNodes - Nodos padre a incluir
     * @param {number} filters.minValue - Valor mínimo para un año específico
     * @param {number} filters.maxValue - Valor máximo para un año específico
     * @param {string} filters.year - Año para aplicar filtros de valor
     * @returns {Object} Objeto con nodos filtrados
     */
    filterNodes(filters = {}) {
        if (!this.isInitialized) {
            return { parentNodes: [], childNodes: [] };
        }

        const filteredParents = [];
        const filteredChildren = [];

        for (const [parentName, nodeDefinition] of this.nodeDefinitions.entries()) {
            // Filtrar por nodos padre específicos
            if (filters.parentNodes && !filters.parentNodes.includes(parentName)) {
                continue;
            }

            let includeParent = false;
            const parentChildren = [];

            for (const [childName, childDefinition] of nodeDefinition.children.entries()) {
                let includeChild = true;

                // Filtrar por tipo de energía
                if (filters.energyTypes && !filters.energyTypes.includes(childDefinition.type)) {
                    includeChild = false;
                }

                // Filtrar por valor mínimo/máximo
                if (filters.year && (filters.minValue !== undefined || filters.maxValue !== undefined)) {
                    const value = childDefinition.yearData.get(filters.year);
                    if (value !== undefined) {
                        if (filters.minValue !== undefined && Math.abs(value) < filters.minValue) {
                            includeChild = false;
                        }
                        if (filters.maxValue !== undefined && Math.abs(value) > filters.maxValue) {
                            includeChild = false;
                        }
                    } else {
                        includeChild = false;
                    }
                }

                if (includeChild) {
                    parentChildren.push({
                        name: childName,
                        definition: childDefinition,
                        parent: parentName
                    });
                    includeParent = true;
                }
            }

            if (includeParent) {
                filteredParents.push({
                    name: parentName,
                    definition: nodeDefinition,
                    children: parentChildren
                });
                filteredChildren.push(...parentChildren);
            }
        }

        return {
            parentNodes: filteredParents,
            childNodes: filteredChildren,
            totalFiltered: filteredParents.length,
            totalChildren: filteredChildren.length
        };
    }

    /**
     * Obtiene estadísticas detalladas para un año específico
     * @param {string} year - Año para calcular estadísticas
     * @returns {Object} Estadísticas detalladas del año
     */
    getYearStats(year) {
        if (!this.isInitialized) {
            return null;
        }

        const stats = {
            year: year,
            totalNodes: 0,
            primaryEnergy: {
                count: 0,
                totalValue: 0,
                positiveValue: 0,
                negativeValue: 0,
                nodes: []
            },
            secondaryEnergy: {
                count: 0,
                totalValue: 0,
                positiveValue: 0,
                negativeValue: 0,
                nodes: []
            },
            topNodes: {
                highest: [],
                lowest: []
            }
        };

        const allValues = [];

        for (const [parentName, nodeDefinition] of this.nodeDefinitions.entries()) {
            for (const [childName, childDefinition] of nodeDefinition.children.entries()) {
                const value = childDefinition.yearData.get(year);
                if (value !== undefined && value !== 0) {
                    stats.totalNodes++;

                    const nodeInfo = {
                        name: childName,
                        parent: parentName,
                        value: value,
                        absValue: Math.abs(value),
                        type: childDefinition.type
                    };

                    allValues.push(nodeInfo);

                    if (childDefinition.type === 'Energía Primaria') {
                        stats.primaryEnergy.count++;
                        stats.primaryEnergy.totalValue += value;
                        if (value > 0) stats.primaryEnergy.positiveValue += value;
                        if (value < 0) stats.primaryEnergy.negativeValue += value;
                        stats.primaryEnergy.nodes.push(nodeInfo);
                    } else if (childDefinition.type === 'Energía Secundaria') {
                        stats.secondaryEnergy.count++;
                        stats.secondaryEnergy.totalValue += value;
                        if (value > 0) stats.secondaryEnergy.positiveValue += value;
                        if (value < 0) stats.secondaryEnergy.negativeValue += value;
                        stats.secondaryEnergy.nodes.push(nodeInfo);
                    }
                }
            }
        }

        // Calcular top nodos
        allValues.sort((a, b) => b.absValue - a.absValue);
        stats.topNodes.highest = allValues.slice(0, 10);
        stats.topNodes.lowest = allValues.slice(-10).reverse();

        return stats;
    }

    /**
     * Valida la integridad de los datos para un año específico
     * @param {string} year - Año a validar
     * @returns {Object} Resultado de validación
     */
    validateYearData(year) {
        if (!this.isInitialized) {
            return { valid: false, errors: ['DataManager no inicializado'] };
        }

        const validation = {
            valid: true,
            errors: [],
            warnings: [],
            stats: {
                totalNodes: 0,
                nodesWithData: 0,
                nodesWithoutData: 0,
                negativeValues: 0,
                zeroValues: 0
            }
        };

        for (const [parentName, nodeDefinition] of this.nodeDefinitions.entries()) {
            for (const [childName, childDefinition] of nodeDefinition.children.entries()) {
                validation.stats.totalNodes++;

                const value = childDefinition.yearData.get(year);
                if (value === undefined) {
                    validation.stats.nodesWithoutData++;
                    validation.warnings.push(`Nodo "${childName}" en "${parentName}" no tiene datos para ${year}`);
                } else {
                    validation.stats.nodesWithData++;

                    if (value === 0) {
                        validation.stats.zeroValues++;
                    } else if (value < 0) {
                        validation.stats.negativeValues++;
                    }
                }
            }
        }

        // Verificar si hay demasiados nodos sin datos
        const missingDataPercentage = (validation.stats.nodesWithoutData / validation.stats.totalNodes) * 100;
        if (missingDataPercentage > 50) {
            validation.errors.push(`Más del 50% de los nodos no tienen datos para ${year}`);
            validation.valid = false;
        }

        return validation;
    }

    /**
     * Obtiene sugerencias de nodos relacionados basado en patrones de datos
     * @param {string} nodeName - Nombre del nodo de referencia
     * @param {string} year - Año para análisis
     * @returns {Array} Array con nodos relacionados sugeridos
     */
    getRelatedNodes(nodeName, year) {
        if (!this.isInitialized) {
            return [];
        }

        const suggestions = [];
        const referenceNode = this.findChildNode(nodeName);

        if (!referenceNode) {
            return suggestions;
        }

        const referenceValue = referenceNode.definition.yearData.get(year);
        if (referenceValue === undefined) {
            return suggestions;
        }

        // Buscar nodos con valores similares
        for (const [parentName, nodeDefinition] of this.nodeDefinitions.entries()) {
            for (const [childName, childDefinition] of nodeDefinition.children.entries()) {
                if (childName === nodeName) continue;

                const value = childDefinition.yearData.get(year);
                if (value !== undefined) {
                    const similarity = this.calculateSimilarity(referenceValue, value);

                    if (similarity > 0.7) { // 70% de similitud
                        suggestions.push({
                            name: childName,
                            parent: parentName,
                            value: value,
                            similarity: similarity,
                            type: childDefinition.type,
                            reason: 'Valor similar'
                        });
                    }
                }
            }
        }

        // Ordenar por similitud
        suggestions.sort((a, b) => b.similarity - a.similarity);
        return suggestions.slice(0, 5); // Top 5 sugerencias
    }

    /**
     * Busca un nodo hijo específico en todos los nodos padre
     * @param {string} childName - Nombre del nodo hijo
     * @returns {Object|null} Información del nodo hijo encontrado
     */
    findChildNode(childName) {
        for (const [parentName, nodeDefinition] of this.nodeDefinitions.entries()) {
            if (nodeDefinition.children.has(childName)) {
                return {
                    name: childName,
                    parent: parentName,
                    definition: nodeDefinition.children.get(childName)
                };
            }
        }
        return null;
    }

    /**
     * Calcula la similitud entre dos valores
     * @param {number} value1 - Primer valor
     * @param {number} value2 - Segundo valor
     * @returns {number} Índice de similitud (0-1)
     */
    calculateSimilarity(value1, value2) {
        const abs1 = Math.abs(value1);
        const abs2 = Math.abs(value2);
        const max = Math.max(abs1, abs2);
        const min = Math.min(abs1, abs2);

        if (max === 0) return 1;
        return min / max;
    }

    /**
     * Reinicia el DataManager
     */
    reset() {
        this.rawData = null;
        this.processedData.clear();
        this.nodeDefinitions.clear();
        this.yearCache.clear();
        this.isInitialized = false;
        console.log('DataManager reiniciado');
    }
}

// Exportar la clase para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}