/**
 * NodeFactory - Módulo para creación estandarizada de nodos en el diagrama de Sankey
 * 
 * Este módulo implementa el patrón Factory para crear nodos con propiedades consistentes,
 * validación automática y configuraciones estandarizadas. Simplifica la adición de nuevos
 * nodos y garantiza la coherencia en todo el sistema.
 * 
 * Funcionalidades principales:
 * - Factory pattern para crear nodos con propiedades consistentes
 * - Registro y gestión de tipos de nodos
 * - Validación automática de configuraciones
 * - Sistema de herencia de propiedades
 * - Mapeo automático de conexiones entre nodos
 * 
 * @author Kiro AI Assistant
 * @version 1.0.0
 */

class NodeFactory {
    /**
     * Constructor del NodeFactory
     * @param {Object} options - Opciones de configuración
     */
    constructor(options = {}) {
        this.dataManager = options.dataManager || null;
        this.styleManager = options.styleManager || null;
        this.layoutEngine = options.layoutEngine || null;
        this.linkManager = options.linkManager || null;
        
        // Registro de tipos de nodos
        this.nodeTypes = new Map();
        this.nodeTemplates = new Map();
        this.nodeInstances = new Map();
        
        // Configuraciones por defecto
        this.defaultNodeConfig = {
            type: 'default',
            color: '#888888',
            opacity: 1.0,
            fontSize: 12,
            fontFamily: 'Arial, sans-serif',
            borderWidth: 1,
            borderColor: '#cccccc',
            hoverColor: null, // Se calcula automáticamente
            customData: {},
            validation: {
                required: ['name'],
                optional: ['description', 'category', 'unit']
            }
        };
        
        // Inicializar tipos de nodos por defecto
        this.initializeDefaultNodeTypes();
        
        console.log('NodeFactory inicializado');
    }

    /**
     * Inicializa los tipos de nodos por defecto del sistema energético
     */
    initializeDefaultNodeTypes() {
        // === NODOS DE FUENTES DE ENERGÍA ===
        this.registerNodeType('source', {
            category: 'fuente',
            defaultColor: '#2E8B57',
            fontSize: 11,
            properties: {
                canHaveChildren: true,
                isSource: true,
                isTarget: false,
                energyType: 'primary'
            },
            validation: {
                required: ['name', 'energyType'],
                optional: ['description', 'unit', 'capacity']
            },
            template: {
                hoverTemplate: '%{label}<br>Tipo: Fuente<br>Valor: %{value}<extra></extra>',
                customData: {
                    nodeType: 'source',
                    category: 'fuente'
                }
            }
        });

        // === NODOS DE TRANSFORMACIÓN ===
        this.registerNodeType('transformation', {
            category: 'transformacion',
            defaultColor: '#CD5C5C',
            fontSize: 10,
            properties: {
                canHaveChildren: true,
                isSource: true,
                isTarget: true,
                energyType: 'secondary',
                efficiency: 1.0
            },
            validation: {
                required: ['name', 'efficiency'],
                optional: ['description', 'technology', 'capacity']
            },
            template: {
                hoverTemplate: '%{label}<br>Tipo: Transformación<br>Eficiencia: %{customdata.efficiency}%<br>Valor: %{value}<extra></extra>',
                customData: {
                    nodeType: 'transformation',
                    category: 'transformacion'
                }
            }
        });

        // === NODOS DE GENERACIÓN ELÉCTRICA ===
        this.registerNodeType('generation', {
            category: 'generacion',
            defaultColor: '#DAA520',
            fontSize: 9,
            properties: {
                canHaveChildren: false,
                isSource: false,
                isTarget: true,
                energyType: 'electricity',
                technology: 'unknown'
            },
            validation: {
                required: ['name', 'technology'],
                optional: ['description', 'capacity', 'fuelType']
            },
            template: {
                hoverTemplate: '%{label}<br>Tipo: Generación<br>Tecnología: %{customdata.technology}<br>Valor: %{value}<extra></extra>',
                customData: {
                    nodeType: 'generation',
                    category: 'generacion'
                }
            }
        });

        // === NODOS HUB (CENTRALIZADORES) ===
        this.registerNodeType('hub', {
            category: 'hub',
            defaultColor: '#483D8B',
            fontSize: 12,
            properties: {
                canHaveChildren: true,
                isSource: true,
                isTarget: true,
                energyType: 'mixed',
                isHub: true
            },
            validation: {
                required: ['name'],
                optional: ['description', 'capacity']
            },
            template: {
                hoverTemplate: '%{label}<br>Tipo: Hub<br>Total: %{value}<extra></extra>',
                customData: {
                    nodeType: 'hub',
                    category: 'hub'
                }
            }
        });

        // === NODOS DE CONSUMO ===
        this.registerNodeType('consumption', {
            category: 'consumo',
            defaultColor: '#4682B4',
            fontSize: 10,
            properties: {
                canHaveChildren: false,
                isSource: false,
                isTarget: true,
                energyType: 'final',
                sector: 'unknown'
            },
            validation: {
                required: ['name', 'sector'],
                optional: ['description', 'efficiency']
            },
            template: {
                hoverTemplate: '%{label}<br>Tipo: Consumo<br>Sector: %{customdata.sector}<br>Valor: %{value}<extra></extra>',
                customData: {
                    nodeType: 'consumption',
                    category: 'consumo'
                }
            }
        });

        // === NODOS DE FLUJOS ESPECIALES ===
        this.registerNodeType('flow', {
            category: 'flujo',
            defaultColor: '#708090',
            fontSize: 10,
            properties: {
                canHaveChildren: true,
                isSource: true,
                isTarget: true,
                energyType: 'flow',
                flowType: 'unknown'
            },
            validation: {
                required: ['name', 'flowType'],
                optional: ['description', 'direction']
            },
            template: {
                hoverTemplate: '%{label}<br>Tipo: %{customdata.flowType}<br>Valor: %{value}<extra></extra>',
                customData: {
                    nodeType: 'flow',
                    category: 'flujo'
                }
            }
        });

        console.log(`Registrados ${this.nodeTypes.size} tipos de nodos por defecto`);
    }

    /**
     * Registra un nuevo tipo de nodo
     * @param {string} typeName - Nombre del tipo de nodo
     * @param {Object} config - Configuración del tipo de nodo
     */
    registerNodeType(typeName, config) {
        const nodeTypeConfig = {
            ...this.defaultNodeConfig,
            ...config,
            typeName: typeName,
            registeredAt: new Date().toISOString()
        };

        // Validar configuración
        if (!this.validateNodeTypeConfig(nodeTypeConfig)) {
            throw new Error(`Configuración inválida para tipo de nodo "${typeName}"`);
        }

        this.nodeTypes.set(typeName, nodeTypeConfig);
        console.log(`Tipo de nodo "${typeName}" registrado exitosamente`);
    }

    /**
     * Valida la configuración de un tipo de nodo
     * @param {Object} config - Configuración a validar
     * @returns {boolean} True si es válida, false en caso contrario
     */
    validateNodeTypeConfig(config) {
        // Validaciones básicas
        if (!config.typeName || typeof config.typeName !== 'string') {
            console.error('Tipo de nodo debe tener un nombre válido');
            return false;
        }

        if (!config.category || typeof config.category !== 'string') {
            console.error('Tipo de nodo debe tener una categoría válida');
            return false;
        }

        if (!config.defaultColor || typeof config.defaultColor !== 'string') {
            console.error('Tipo de nodo debe tener un color por defecto válido');
            return false;
        }

        // Validar propiedades
        if (config.properties && typeof config.properties !== 'object') {
            console.error('Propiedades del tipo de nodo deben ser un objeto');
            return false;
        }

        return true;
    }

    /**
     * Crea un nuevo nodo basado en un tipo registrado
     * @param {string} nodeType - Tipo de nodo a crear
     * @param {Object} nodeConfig - Configuración específica del nodo
     * @returns {Object} Nodo creado
     */
    createNode(nodeType, nodeConfig) {
        // Validar que el tipo existe
        if (!this.nodeTypes.has(nodeType)) {
            throw new Error(`Tipo de nodo "${nodeType}" no está registrado`);
        }

        const typeConfig = this.nodeTypes.get(nodeType);
        
        // Validar configuración del nodo
        if (!this.validateNodeConfig(nodeConfig, typeConfig)) {
            throw new Error(`Configuración inválida para nodo de tipo "${nodeType}"`);
        }

        // Crear nodo con herencia de propiedades
        const node = this.buildNodeFromTemplate(typeConfig, nodeConfig);
        
        // Registrar instancia
        this.nodeInstances.set(node.id, node);
        
        console.log(`Nodo "${node.name}" de tipo "${nodeType}" creado exitosamente`);
        return node;
    }

    /**
     * Valida la configuración de un nodo específico
     * @param {Object} nodeConfig - Configuración del nodo
     * @param {Object} typeConfig - Configuración del tipo
     * @returns {boolean} True si es válida, false en caso contrario
     */
    validateNodeConfig(nodeConfig, typeConfig) {
        // Verificar campos requeridos básicos
        if (!nodeConfig.name || typeof nodeConfig.name !== 'string') {
            console.error('El nodo debe tener un nombre válido');
            return false;
        }

        // Validar nombre único (solo advertencia, no error)
        if (nodeConfig.name) {
            const existingNode = Array.from(this.nodeInstances.values())
                .find(node => node.name === nodeConfig.name);
            if (existingNode) {
                console.warn(`Ya existe un nodo con el nombre "${nodeConfig.name}", se permitirá la creación`);
            }
        }

        return true;
    }

    /**
     * Construye un nodo a partir de un template y configuración
     * @param {Object} typeConfig - Configuración del tipo
     * @param {Object} nodeConfig - Configuración específica del nodo
     * @returns {Object} Nodo construido
     */
    buildNodeFromTemplate(typeConfig, nodeConfig) {
        // Generar ID único
        const nodeId = this.generateNodeId(nodeConfig.name || 'unnamed');
        
        // Proporcionar valores por defecto para campos requeridos
        const defaultValues = this.getDefaultValuesForType(typeConfig.typeName);
        
        // Combinar configuraciones con precedencia
        const node = {
            // Propiedades básicas
            id: nodeId,
            name: nodeConfig.name,
            type: typeConfig.typeName,
            category: typeConfig.category,
            
            // Propiedades visuales
            color: this.resolveNodeColor(nodeConfig, typeConfig),
            fontSize: nodeConfig.fontSize || typeConfig.fontSize,
            fontFamily: nodeConfig.fontFamily || typeConfig.fontFamily,
            opacity: nodeConfig.opacity || typeConfig.opacity,
            
            // Propiedades funcionales con valores por defecto
            properties: {
                ...typeConfig.properties,
                ...defaultValues,
                ...nodeConfig.properties
            },
            
            // Datos personalizados
            customData: {
                ...typeConfig.template?.customData,
                ...nodeConfig.customData,
                nodeId: nodeId,
                createdAt: new Date().toISOString()
            },
            
            // Template de hover
            hoverTemplate: nodeConfig.hoverTemplate || typeConfig.template?.hoverTemplate,
            
            // Metadatos
            metadata: {
                description: nodeConfig.description || '',
                unit: nodeConfig.unit || 'PJ',
                category: typeConfig.category,
                ...nodeConfig.metadata
            },
            
            // Datos de conexión
            connections: {
                inputs: [],
                outputs: [],
                ...nodeConfig.connections
            },
            
            // Posición (se calculará después)
            position: nodeConfig.position || null
        };

        // Aplicar transformaciones específicas del tipo
        this.applyTypeSpecificTransformations(node, typeConfig);
        
        return node;
    }

    /**
     * Obtiene valores por defecto para campos requeridos según el tipo de nodo
     * @param {string} nodeType - Tipo de nodo
     * @returns {Object} Valores por defecto
     */
    getDefaultValuesForType(nodeType) {
        const defaults = {
            'source': {
                energyType: 'primary'
            },
            'transformation': {
                efficiency: 1.0
            },
            'generation': {
                technology: 'unknown'
            },
            'consumption': {
                sector: 'unknown'
            },
            'flow': {
                flowType: 'distribution'
            },
            'hub': {}
        };

        return defaults[nodeType] || {};
    }

    /**
     * Resuelve el color final del nodo
     * @param {Object} nodeConfig - Configuración del nodo
     * @param {Object} typeConfig - Configuración del tipo
     * @returns {string} Color resuelto
     */
    resolveNodeColor(nodeConfig, typeConfig) {
        // Prioridad: color específico > color por energético > color por tipo
        if (nodeConfig.color) {
            return this.styleManager ? 
                this.styleManager.validateColor(nodeConfig.color) : 
                nodeConfig.color;
        }

        // Intentar obtener color por nombre de energético
        if (this.styleManager && nodeConfig.name) {
            const energyColor = this.styleManager.getEnergyColor(nodeConfig.name, typeConfig.category);
            if (energyColor !== this.styleManager.getNodeTypeColor('default')) {
                return energyColor;
            }
        }

        // Usar color por defecto del tipo
        return typeConfig.defaultColor;
    }

    /**
     * Implementa sistema de herencia de propiedades para nodos hijo
     * @param {Object} parentNode - Nodo padre
     * @param {Object} childConfig - Configuración del nodo hijo
     * @returns {Object} Configuración del hijo con propiedades heredadas
     */
    inheritPropertiesFromParent(parentNode, childConfig) {
        if (!parentNode) return childConfig;

        // Propiedades que se heredan automáticamente
        const inheritableProperties = [
            'fontFamily',
            'fontSize',
            'opacity',
            'borderWidth',
            'borderColor'
        ];

        // Propiedades de metadatos que se heredan
        const inheritableMetadata = [
            'unit',
            'category'
        ];

        // Crear configuración heredada
        const inheritedConfig = { ...childConfig };

        // Heredar propiedades visuales si no están definidas en el hijo
        for (const prop of inheritableProperties) {
            if (!inheritedConfig[prop] && parentNode[prop]) {
                inheritedConfig[prop] = parentNode[prop];
            }
        }

        // Heredar metadatos
        if (!inheritedConfig.metadata) {
            inheritedConfig.metadata = {};
        }

        for (const metaProp of inheritableMetadata) {
            if (!inheritedConfig.metadata[metaProp] && parentNode.metadata && parentNode.metadata[metaProp]) {
                inheritedConfig.metadata[metaProp] = parentNode.metadata[metaProp];
            }
        }

        // Heredar propiedades específicas del tipo
        if (!inheritedConfig.properties) {
            inheritedConfig.properties = {};
        }

        // Sistema de override: el hijo puede sobrescribir propiedades del padre
        if (parentNode.properties) {
            for (const [key, value] of Object.entries(parentNode.properties)) {
                // Solo heredar si el hijo no tiene la propiedad definida
                if (inheritedConfig.properties[key] === undefined) {
                    inheritedConfig.properties[key] = value;
                }
            }
        }

        // Establecer relación padre-hijo
        inheritedConfig.parentId = parentNode.id;
        inheritedConfig.parentName = parentNode.name;

        // Heredar configuración de color si no está especificada
        if (!inheritedConfig.color && parentNode.color) {
            // Crear una variación del color del padre para el hijo
            inheritedConfig.color = this.styleManager ? 
                this.styleManager.lightenColor(parentNode.color, 0.1) : 
                parentNode.color;
        }

        console.log(`Propiedades heredadas de "${parentNode.name}" a nodo hijo`);
        return inheritedConfig;
    }

    /**
     * Crea un nodo hijo con herencia automática de propiedades del padre
     * @param {string} parentId - ID del nodo padre
     * @param {string} childType - Tipo del nodo hijo
     * @param {Object} childConfig - Configuración específica del hijo
     * @returns {Object} Nodo hijo creado con propiedades heredadas
     */
    createChildNode(parentId, childType, childConfig) {
        const parentNode = this.getNode(parentId);
        if (!parentNode) {
            throw new Error(`Nodo padre con ID "${parentId}" no encontrado`);
        }

        // Aplicar herencia de propiedades
        const inheritedConfig = this.inheritPropertiesFromParent(parentNode, childConfig);

        // Crear el nodo hijo
        const childNode = this.createNode(childType, inheritedConfig);

        // Establecer relación bidireccional
        if (!parentNode.connections.outputs.includes(childNode.id)) {
            parentNode.connections.outputs.push(childNode.id);
        }
        
        if (!childNode.connections.inputs.includes(parentNode.id)) {
            childNode.connections.inputs.push(parentNode.id);
        }

        console.log(`Nodo hijo "${childNode.name}" creado con herencia de "${parentNode.name}"`);
        return childNode;
    }

    /**
     * Actualiza propiedades de un nodo padre y propaga cambios a hijos
     * @param {string} parentId - ID del nodo padre
     * @param {Object} updates - Actualizaciones a aplicar
     * @param {boolean} propagateToChildren - Si propagar cambios a hijos
     * @returns {Array} Array con nodos actualizados
     */
    updateParentAndPropagate(parentId, updates, propagateToChildren = true) {
        const parentNode = this.getNode(parentId);
        if (!parentNode) {
            throw new Error(`Nodo padre con ID "${parentId}" no encontrado`);
        }

        // Actualizar nodo padre
        this.updateNode(parentId, updates);
        const updatedNodes = [parentNode];

        if (propagateToChildren && parentNode.connections.outputs.length > 0) {
            // Propagar cambios relevantes a nodos hijo
            const propagatableUpdates = this.filterPropagatableUpdates(updates);
            
            if (Object.keys(propagatableUpdates).length > 0) {
                for (const childId of parentNode.connections.outputs) {
                    const childNode = this.getNode(childId);
                    if (childNode) {
                        // Solo actualizar propiedades que el hijo no ha sobrescrito
                        const childUpdates = this.filterChildUpdates(childNode, propagatableUpdates);
                        if (Object.keys(childUpdates).length > 0) {
                            this.updateNode(childId, childUpdates);
                            updatedNodes.push(childNode);
                        }
                    }
                }
            }
        }

        console.log(`Actualizados ${updatedNodes.length} nodos (padre + hijos)`);
        return updatedNodes;
    }

    /**
     * Filtra actualizaciones que pueden propagarse a nodos hijo
     * @param {Object} updates - Actualizaciones originales
     * @returns {Object} Actualizaciones propagables
     */
    filterPropagatableUpdates(updates) {
        const propagatableKeys = [
            'fontFamily',
            'fontSize',
            'opacity',
            'borderWidth',
            'borderColor'
        ];

        const propagatableUpdates = {};
        
        for (const key of propagatableKeys) {
            if (updates[key] !== undefined) {
                propagatableUpdates[key] = updates[key];
            }
        }

        // Propagar metadatos específicos
        if (updates.metadata) {
            propagatableUpdates.metadata = {};
            const propagatableMetadata = ['unit', 'category'];
            
            for (const metaKey of propagatableMetadata) {
                if (updates.metadata[metaKey] !== undefined) {
                    propagatableUpdates.metadata[metaKey] = updates.metadata[metaKey];
                }
            }
        }

        return propagatableUpdates;
    }

    /**
     * Filtra actualizaciones para un nodo hijo específico
     * @param {Object} childNode - Nodo hijo
     * @param {Object} propagatableUpdates - Actualizaciones propagables
     * @returns {Object} Actualizaciones filtradas para el hijo
     */
    filterChildUpdates(childNode, propagatableUpdates) {
        const childUpdates = {};

        // Solo aplicar actualizaciones que el hijo no ha personalizado
        for (const [key, value] of Object.entries(propagatableUpdates)) {
            if (key === 'metadata') {
                // Manejar metadatos por separado
                if (!childUpdates.metadata) childUpdates.metadata = {};
                
                for (const [metaKey, metaValue] of Object.entries(value)) {
                    // Solo actualizar si el hijo no tiene el metadato personalizado
                    if (!childNode.metadata || childNode.metadata[metaKey] === undefined) {
                        childUpdates.metadata[metaKey] = metaValue;
                    }
                }
            } else {
                // Solo actualizar si el hijo no tiene la propiedad personalizada
                if (childNode[key] === undefined || childNode.customData.inheritedFrom === childNode.parentId) {
                    childUpdates[key] = value;
                    // Marcar como heredado
                    if (!childUpdates.customData) childUpdates.customData = {};
                    childUpdates.customData.inheritedFrom = childNode.parentId;
                }
            }
        }

        return childUpdates;
    }

    /**
     * Obtiene la jerarquía completa de un nodo (padre e hijos)
     * @param {string} nodeId - ID del nodo
     * @returns {Object} Jerarquía del nodo
     */
    getNodeHierarchy(nodeId) {
        const node = this.getNode(nodeId);
        if (!node) return null;

        const hierarchy = {
            node: node,
            parent: null,
            children: [],
            siblings: [],
            depth: 0
        };

        // Obtener nodo padre
        if (node.parentId) {
            hierarchy.parent = this.getNode(node.parentId);
            hierarchy.depth = 1;
            
            // Obtener hermanos (otros hijos del mismo padre)
            if (hierarchy.parent) {
                hierarchy.siblings = hierarchy.parent.connections.outputs
                    .map(childId => this.getNode(childId))
                    .filter(child => child && child.id !== nodeId);
            }
        }

        // Obtener nodos hijo
        hierarchy.children = node.connections.outputs
            .map(childId => this.getNode(childId))
            .filter(child => child !== null);

        return hierarchy;
    }

    /**
     * Aplica transformaciones específicas según el tipo de nodo
     * @param {Object} node - Nodo a transformar
     * @param {Object} typeConfig - Configuración del tipo
     */
    applyTypeSpecificTransformations(node, typeConfig) {
        switch (typeConfig.typeName) {
            case 'generation':
                // Configuraciones específicas para nodos de generación
                if (node.metadata.technology) {
                    node.customData.technology = node.metadata.technology;
                }
                if (node.metadata.fuelType) {
                    node.customData.fuelType = node.metadata.fuelType;
                }
                break;
                
            case 'transformation':
                // Configuraciones específicas para nodos de transformación
                if (node.properties.efficiency) {
                    node.customData.efficiency = (node.properties.efficiency * 100).toFixed(1);
                }
                break;
                
            case 'consumption':
                // Configuraciones específicas para nodos de consumo
                if (node.properties.sector) {
                    node.customData.sector = node.properties.sector;
                }
                break;
                
            case 'flow':
                // Configuraciones específicas para nodos de flujo
                if (node.properties.flowType) {
                    node.customData.flowType = this.capitalizeFlowType(node.properties.flowType);
                }
                break;
        }
    }

    /**
     * Capitaliza el tipo de flujo para mostrar
     * @param {string} flowType - Tipo de flujo
     * @returns {string} Tipo capitalizado
     */
    capitalizeFlowType(flowType) {
        const flowTypeMap = {
            'import': 'Importación',
            'export': 'Exportación',
            'loss': 'Pérdida',
            'storage': 'Almacenamiento',
            'distribution': 'Distribución'
        };
        
        return flowTypeMap[flowType] || flowType.charAt(0).toUpperCase() + flowType.slice(1);
    }

    /**
     * Genera un ID único para un nodo
     * @param {string} baseName - Nombre base para el ID
     * @returns {string} ID único generado
     */
    generateNodeId(baseName) {
        const sanitizedName = baseName.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        
        return `${sanitizedName}_${timestamp}_${random}`;
    }

    /**
     * Crea múltiples nodos a partir de datos del DataManager
     * @param {Array} nodeNames - Nombres de nodos a crear
     * @param {Object} options - Opciones de creación
     * @returns {Array} Array de nodos creados
     */
    createNodesFromData(nodeNames, options = {}) {
        if (!this.dataManager) {
            throw new Error('DataManager no está disponible');
        }

        const createdNodes = [];
        const defaultType = options.defaultType || 'source';
        
        for (const nodeName of nodeNames) {
            try {
                // Obtener datos del nodo desde DataManager
                const nodeData = this.dataManager.getNodeData(nodeName);
                if (!nodeData) {
                    console.warn(`No se encontraron datos para el nodo "${nodeName}"`);
                    continue;
                }

                // Determinar tipo de nodo basado en el nombre y datos
                const nodeType = this.inferNodeType(nodeName, nodeData);
                
                // Crear configuración del nodo
                const nodeConfig = {
                    name: nodeName,
                    description: nodeData.descripcion || '',
                    color: nodeData.color,
                    properties: {
                        id_padre: nodeData.id_padre,
                        hasChildren: nodeData['Nodos Hijo'] && nodeData['Nodos Hijo'].length > 0
                    },
                    metadata: {
                        originalData: nodeData
                    }
                };

                // Crear el nodo
                const node = this.createNode(nodeType, nodeConfig);
                createdNodes.push(node);
                
            } catch (error) {
                console.error(`Error creando nodo "${nodeName}":`, error);
            }
        }

        console.log(`Creados ${createdNodes.length} nodos desde DataManager`);
        return createdNodes;
    }

    /**
     * Infiere el tipo de nodo basado en su nombre y datos
     * @param {string} nodeName - Nombre del nodo
     * @param {Object} nodeData - Datos del nodo
     * @returns {string} Tipo de nodo inferido
     */
    inferNodeType(nodeName) {
        // Mapeo de nombres a tipos de nodos
        const typeMapping = {
            // Fuentes
            'Producción': 'source',
            'Importación': 'flow',
            'Importación de energéticos primarios': 'flow',
            'Variación de inventarios': 'flow',
            'Variación de inventarios de Energéticos primarios': 'flow',
            
            // Hubs
            'Oferta Total': 'hub',
            'Oferta Total (Hub)': 'hub',
            'Oferta Interna Bruta': 'hub',
            
            // Flujos especiales
            'Exportación': 'flow',
            'Energía No Aprovechada': 'flow',
            'Consumo Propio del Sector': 'consumption',
            
            // Transformación
            'Refinerías y Despuntadoras': 'transformation',
            'Plantas de Gas y Fraccionadoras': 'transformation',
            'Coquizadoras y Hornos': 'transformation',
            
            // Generación eléctrica
            'Centrales Eléctricas': 'hub',
            'Carboeléctrica': 'generation',
            'Térmica Convencional': 'generation',
            'Combustión Interna': 'generation',
            'Turbogás': 'generation',
            'Ciclo Combinado': 'generation',
            'Nucleoeléctrica': 'generation',
            'Cogeneración': 'generation',
            'Geotérmica': 'generation',
            'Eólica': 'generation',
            'Solar Fotovoltaica': 'generation'
        };

        return typeMapping[nodeName] || 'source';
    }

    /**
     * Obtiene un nodo por su ID
     * @param {string} nodeId - ID del nodo
     * @returns {Object|null} Nodo encontrado o null
     */
    getNode(nodeId) {
        return this.nodeInstances.get(nodeId) || null;
    }

    /**
     * Obtiene un nodo por su nombre
     * @param {string} nodeName - Nombre del nodo
     * @returns {Object|null} Nodo encontrado o null
     */
    getNodeByName(nodeName) {
        for (const node of this.nodeInstances.values()) {
            if (node.name === nodeName) {
                return node;
            }
        }
        return null;
    }

    /**
     * Obtiene todos los nodos de un tipo específico
     * @param {string} nodeType - Tipo de nodo
     * @returns {Array} Array de nodos del tipo especificado
     */
    getNodesByType(nodeType) {
        return Array.from(this.nodeInstances.values())
            .filter(node => node.type === nodeType);
    }

    /**
     * Obtiene todos los nodos de una categoría específica
     * @param {string} category - Categoría de nodos
     * @returns {Array} Array de nodos de la categoría especificada
     */
    getNodesByCategory(category) {
        return Array.from(this.nodeInstances.values())
            .filter(node => node.category === category);
    }

    /**
     * Actualiza un nodo existente
     * @param {string} nodeId - ID del nodo a actualizar
     * @param {Object} updates - Actualizaciones a aplicar
     * @returns {Object|null} Nodo actualizado o null si no existe
     */
    updateNode(nodeId, updates) {
        const node = this.nodeInstances.get(nodeId);
        if (!node) {
            console.warn(`Nodo con ID "${nodeId}" no encontrado`);
            return null;
        }

        // Aplicar actualizaciones
        Object.assign(node, updates);
        
        // Actualizar timestamp
        node.customData.updatedAt = new Date().toISOString();
        
        console.log(`Nodo "${node.name}" actualizado`);
        return node;
    }

    /**
     * Elimina un nodo
     * @param {string} nodeId - ID del nodo a eliminar
     * @returns {boolean} True si se eliminó, false si no existía
     */
    deleteNode(nodeId) {
        const deleted = this.nodeInstances.delete(nodeId);
        if (deleted) {
            console.log(`Nodo con ID "${nodeId}" eliminado`);
        }
        return deleted;
    }

    /**
     * Obtiene estadísticas de los nodos creados
     * @returns {Object} Estadísticas de nodos
     */
    getNodeStats() {
        const stats = {
            totalNodes: this.nodeInstances.size,
            nodesByType: {},
            nodesByCategory: {},
            registeredTypes: this.nodeTypes.size
        };

        // Contar por tipo y categoría
        for (const node of this.nodeInstances.values()) {
            // Por tipo
            stats.nodesByType[node.type] = (stats.nodesByType[node.type] || 0) + 1;
            
            // Por categoría
            stats.nodesByCategory[node.category] = (stats.nodesByCategory[node.category] || 0) + 1;
        }

        return stats;
    }

    /**
     * Obtiene todos los tipos de nodos registrados
     * @returns {Array} Array con información de tipos registrados
     */
    getRegisteredTypes() {
        return Array.from(this.nodeTypes.entries()).map(([typeName, config]) => ({
            name: typeName,
            category: config.category,
            defaultColor: config.defaultColor,
            properties: config.properties,
            registeredAt: config.registeredAt
        }));
    }

    /**
     * Valida la integridad de todos los nodos
     * @returns {Object} Resultado de validación
     */
    validateAllNodes() {
        const validation = {
            valid: true,
            errors: [],
            warnings: [],
            stats: {
                totalNodes: this.nodeInstances.size,
                validNodes: 0,
                invalidNodes: 0
            }
        };

        for (const [nodeId, node] of this.nodeInstances.entries()) {
            try {
                // Validar estructura básica
                if (!node.name || !node.type || !node.category) {
                    validation.errors.push(`Nodo ${nodeId} tiene estructura incompleta`);
                    validation.stats.invalidNodes++;
                    continue;
                }

                // Validar que el tipo existe
                if (!this.nodeTypes.has(node.type)) {
                    validation.errors.push(`Nodo ${nodeId} tiene tipo no registrado: ${node.type}`);
                    validation.stats.invalidNodes++;
                    continue;
                }

                validation.stats.validNodes++;
                
            } catch (error) {
                validation.errors.push(`Error validando nodo ${nodeId}: ${error.message}`);
                validation.stats.invalidNodes++;
            }
        }

        if (validation.errors.length > 0) {
            validation.valid = false;
        }

        return validation;
    }

    /**
     * === SISTEMA DE MAPEO AUTOMÁTICO DE CONEXIONES ===
     */

    /**
     * Inicializa el sistema de mapeo automático de conexiones
     */
    initializeConnectionMappings() {
        console.warn('NodeFactory.initializeConnectionMappings está deprecado. Use LinkManager para mapeos de conexiones.');
        
        // Mantener mapeos básicos para compatibilidad hacia atrás
        this.fuelToTechMap = new Map();
        this.transformationMap = new Map();
        this.flowMap = new Map();
        
        console.log('Mapeos de conexiones básicos inicializados (modo compatibilidad)');
    }

    /**
     * Crea conexiones automáticas basadas en los mapeos definidos
     * @deprecated Esta funcionalidad ha sido migrada a LinkManager
     * @param {Array} nodeNames - Lista de nombres de nodos disponibles
     * @returns {Array} Array de conexiones creadas
     */
    createAutomaticConnections(nodeNames) {
        console.warn('NodeFactory.createAutomaticConnections está deprecado. Use LinkManager.getConnectionsForNodes()');
        
        // Si LinkManager está disponible, usarlo
        if (this.linkManager) {
            return this.linkManager.getConnectionsForNodes(nodeNames, {
                mapTypes: ['fuel-to-generation', 'generation-to-centrales']
            });
        }
        
        // Fallback básico para compatibilidad
        console.warn('LinkManager no disponible, retornando array vacío');
        return [];
    }

    /**
     * Registra una nueva regla de mapeo
     * @param {string} sourceNode - Nodo fuente
     * @param {Array} targetNodes - Nodos destino
     * @param {string} mappingType - Tipo de mapeo ('fuel-to-tech', 'transformation', 'flow')
     */
    registerConnectionMapping(sourceNode, targetNodes, mappingType = 'fuel-to-tech') {
        if (!this.fuelToTechMap) {
            this.initializeConnectionMappings();
        }

        let targetMap;
        switch (mappingType) {
            case 'fuel-to-tech':
                targetMap = this.fuelToTechMap;
                break;
            case 'transformation':
                targetMap = this.transformationMap;
                break;
            case 'flow':
                targetMap = this.flowMap;
                break;
            default:
                console.warn(`Tipo de mapeo desconocido: ${mappingType}`);
                return;
        }

        targetMap.set(sourceNode, targetNodes);
        console.log(`Mapeo registrado: ${sourceNode} -> [${targetNodes.join(', ')}]`);
    }

    /**
     * Obtiene las conexiones posibles para un nodo específico
     * @param {string} nodeName - Nombre del nodo
     * @returns {Object} Conexiones posibles (inputs y outputs)
     */
    getPossibleConnections(nodeName) {
        if (!this.fuelToTechMap) {
            this.initializeConnectionMappings();
        }

        const connections = {
            inputs: [],
            outputs: []
        };

        // Buscar como destino (inputs)
        for (const [source, targets] of this.fuelToTechMap.entries()) {
            if (targets.includes(nodeName)) {
                connections.inputs.push({
                    source: source,
                    type: 'fuel-to-generation'
                });
            }
        }

        for (const [source, targets] of this.transformationMap.entries()) {
            if (targets.includes(nodeName)) {
                connections.inputs.push({
                    source: source,
                    type: 'transformation'
                });
            }
        }

        for (const [source, targets] of this.flowMap.entries()) {
            if (targets.includes(nodeName)) {
                connections.inputs.push({
                    source: source,
                    type: 'distribution'
                });
            }
        }

        // Buscar como fuente (outputs)
        if (this.fuelToTechMap.has(nodeName)) {
            for (const target of this.fuelToTechMap.get(nodeName)) {
                connections.outputs.push({
                    target: target,
                    type: 'fuel-to-generation'
                });
            }
        }

        if (this.transformationMap.has(nodeName)) {
            for (const target of this.transformationMap.get(nodeName)) {
                connections.outputs.push({
                    target: target,
                    type: 'transformation'
                });
            }
        }

        if (this.flowMap.has(nodeName)) {
            for (const target of this.flowMap.get(nodeName)) {
                connections.outputs.push({
                    target: target,
                    type: 'distribution'
                });
            }
        }

        return connections;
    }

    /**
     * Valida si una conexión es válida según las reglas de mapeo
     * @param {string} sourceNode - Nodo fuente
     * @param {string} targetNode - Nodo destino
     * @returns {Object} Resultado de validación
     */
    validateConnection(sourceNode, targetNode) {
        if (!this.fuelToTechMap) {
            this.initializeConnectionMappings();
        }

        const validation = {
            valid: false,
            type: null,
            reason: null
        };

        // Verificar en mapeo fuel-to-tech
        if (this.fuelToTechMap.has(sourceNode) && this.fuelToTechMap.get(sourceNode).includes(targetNode)) {
            validation.valid = true;
            validation.type = 'fuel-to-generation';
            validation.reason = 'Conexión válida según mapeo combustible-tecnología';
            return validation;
        }

        // Verificar en mapeo de transformación
        if (this.transformationMap.has(sourceNode) && this.transformationMap.get(sourceNode).includes(targetNode)) {
            validation.valid = true;
            validation.type = 'transformation';
            validation.reason = 'Conexión válida según mapeo de transformación';
            return validation;
        }

        // Verificar en mapeo de flujo
        if (this.flowMap.has(sourceNode) && this.flowMap.get(sourceNode).includes(targetNode)) {
            validation.valid = true;
            validation.type = 'distribution';
            validation.reason = 'Conexión válida según mapeo de flujo';
            return validation;
        }

        validation.reason = 'No existe regla de mapeo para esta conexión';
        return validation;
    }

    /**
     * Sugiere conexiones para un nodo basado en patrones similares
     * @param {string} nodeName - Nombre del nodo
     * @returns {Array} Sugerencias de conexión
     */
    suggestConnections(nodeName) {
        if (!this.fuelToTechMap) {
            this.initializeConnectionMappings();
        }

        const suggestions = [];

        // Buscar patrones similares por nombre
        const nodeWords = nodeName.toLowerCase().split(/\s+/);

        for (const [source, targets] of this.fuelToTechMap.entries()) {
            const sourceWords = source.toLowerCase().split(/\s+/);
            const similarity = this.calculateNameSimilarity(nodeWords, sourceWords);

            if (similarity > 0.5) {
                for (const target of targets) {
                    suggestions.push({
                        source: nodeName,
                        target: target,
                        type: 'fuel-to-generation',
                        confidence: similarity,
                        reason: `Similitud con "${source}"`
                    });
                }
            }
        }

        // Buscar por categoría de nodo
        const nodeInstance = this.getNodeByName(nodeName);
        if (nodeInstance) {
            const categoryConnections = this.getConnectionsByCategory(nodeInstance.category);
            suggestions.push(...categoryConnections.map(conn => ({
                ...conn,
                confidence: 0.7,
                reason: `Conexión típica para categoría "${nodeInstance.category}"`
            })));
        }

        // Ordenar por confianza
        suggestions.sort((a, b) => b.confidence - a.confidence);
        return suggestions.slice(0, 5); // Top 5 sugerencias
    }

    /**
     * Calcula similitud entre nombres de nodos
     * @param {Array} words1 - Palabras del primer nombre
     * @param {Array} words2 - Palabras del segundo nombre
     * @returns {number} Índice de similitud (0-1)
     */
    calculateNameSimilarity(words1, words2) {
        const commonWords = words1.filter(word => words2.includes(word));
        const totalWords = new Set([...words1, ...words2]).size;
        return commonWords.length / totalWords;
    }

    /**
     * Obtiene conexiones típicas para una categoría de nodo
     * @param {string} category - Categoría del nodo
     * @returns {Array} Conexiones típicas
     */
    getConnectionsByCategory(category) {
        const categoryConnections = {
            'fuente': [
                { target: 'Oferta Total (Hub)', type: 'supply' }
            ],
            'transformacion': [
                { source: 'Oferta Interna Bruta', type: 'input' },
                { target: 'Centrales Eléctricas', type: 'output' }
            ],
            'generacion': [
                { target: 'Centrales Eléctricas', type: 'generation' }
            ],
            'hub': [
                { source: 'multiple', target: 'multiple', type: 'distribution' }
            ],
            'flujo': [
                { source: 'hub', target: 'destination', type: 'flow' }
            ]
        };

        return categoryConnections[category] || [];
    }

    /**
     * Actualiza el mapeo existente con nuevas conexiones observadas
     * @param {Array} observedConnections - Conexiones observadas en los datos
     */
    updateMappingsFromObservedConnections(observedConnections) {
        if (!this.fuelToTechMap) {
            this.initializeConnectionMappings();
        }

        const newMappings = {
            'fuel-to-tech': new Map(),
            'transformation': new Map(),
            'flow': new Map()
        };

        // Analizar conexiones observadas
        for (const connection of observedConnections) {
            const { source, target, type } = connection;
            
            if (!newMappings[type]) {
                newMappings[type] = new Map();
            }

            if (!newMappings[type].has(source)) {
                newMappings[type].set(source, []);
            }

            if (!newMappings[type].get(source).includes(target)) {
                newMappings[type].get(source).push(target);
            }
        }

        // Integrar nuevos mapeos
        let updatedCount = 0;
        for (const [type, mappings] of Object.entries(newMappings)) {
            let targetMap;
            switch (type) {
                case 'fuel-to-tech':
                    targetMap = this.fuelToTechMap;
                    break;
                case 'transformation':
                    targetMap = this.transformationMap;
                    break;
                case 'flow':
                    targetMap = this.flowMap;
                    break;
                default:
                    continue;
            }

            for (const [source, targets] of mappings.entries()) {
                if (targetMap.has(source)) {
                    // Agregar nuevos targets a mapeo existente
                    const existingTargets = targetMap.get(source);
                    const newTargets = targets.filter(t => !existingTargets.includes(t));
                    if (newTargets.length > 0) {
                        targetMap.set(source, [...existingTargets, ...newTargets]);
                        updatedCount++;
                    }
                } else {
                    // Crear nuevo mapeo
                    targetMap.set(source, targets);
                    updatedCount++;
                }
            }
        }

        console.log(`Mapeos actualizados: ${updatedCount} nuevas reglas agregadas`);
    }

    /**
     * Obtiene estadísticas del sistema de mapeo
     * @returns {Object} Estadísticas de mapeo
     */
    getMappingStats() {
        if (!this.fuelToTechMap) {
            this.initializeConnectionMappings();
        }

        const stats = {
            totalMappings: 0,
            mappingsByType: {
                'fuel-to-tech': this.fuelToTechMap.size,
                'transformation': this.transformationMap.size,
                'flow': this.flowMap.size
            },
            totalConnections: 0,
            connectionsByType: {
                'fuel-to-tech': 0,
                'transformation': 0,
                'flow': 0
            }
        };

        // Contar conexiones totales
        for (const targets of this.fuelToTechMap.values()) {
            stats.connectionsByType['fuel-to-tech'] += targets.length;
        }

        for (const targets of this.transformationMap.values()) {
            stats.connectionsByType['transformation'] += targets.length;
        }

        for (const targets of this.flowMap.values()) {
            stats.connectionsByType['flow'] += targets.length;
        }

        stats.totalMappings = Object.values(stats.mappingsByType).reduce((a, b) => a + b, 0);
        stats.totalConnections = Object.values(stats.connectionsByType).reduce((a, b) => a + b, 0);

        return stats;
    }

    /**
     * Reinicia el NodeFactory
     */
    reset() {
        this.nodeInstances.clear();
        this.nodeTemplates.clear();
        
        // Reiniciar mapeos
        if (this.fuelToTechMap) {
            this.fuelToTechMap.clear();
            this.transformationMap.clear();
            this.flowMap.clear();
        }
        
        console.log('NodeFactory reiniciado');
    }
}

// Exportar la clase para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NodeFactory;
}