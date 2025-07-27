/**
 * LinkManager - Módulo para gestión centralizada de conexiones entre nodos en el diagrama de Sankey
 * 
 * Este módulo encapsula toda la lógica relacionada con las conexiones entre nodos,
 * proporcionando un sistema declarativo y flexible para definir flujos energéticos.
 * 
 * Funcionalidades principales:
 * - Configuración declarativa de conexiones entre nodos
 * - Validación automática de conexiones válidas
 * - Mapeo inteligente de combustibles a tecnologías
 * - Sistema de sugerencias para nuevas conexiones
 * - Análisis de patrones de flujo energético
 * 
 * @author Kiro AI Assistant
 * @version 1.0.0
 */

class LinkManager {
    /**
     * Constructor del LinkManager
     * @param {Object} options - Opciones de configuración
     */
    constructor(options = {}) {
        this.dataManager = options.dataManager || null;
        this.styleManager = options.styleManager || null;
        this.nodeFactory = options.nodeFactory || null;
        this.popupManager = options.popupManager || null;

        // Mapas de conexiones por tipo
        this.connectionMaps = new Map();
        this.connectionRules = new Map();
        this.connectionHistory = new Map();

        // Configuración de conexiones
        this.connectionConfig = {
            allowMultipleTargets: true,
            allowCyclicConnections: false,
            validateEnergyTypes: true,
            autoSuggestConnections: true
        };

        // Inicializar mapeos por defecto
        this.initializeDefaultMappings();

        // Los colores se obtendrán del StyleManager, no hardcodeados

        console.log('LinkManager inicializado');
    }

    /**
     * Inicializa los mapeos de conexiones por defecto del sistema energético
     */
    initializeDefaultMappings() {
        // === MAPEO COMBUSTIBLES -> TECNOLOGÍAS DE GENERACIÓN ===
        this.registerConnectionMap('fuel-to-generation', new Map([
            // Combustibles sólidos - Carbón mineral va desde Oferta Interna Bruta
            // ['Carbón mineral', ['Carboeléctrica']], // Manejado por distribution-to-transformation
            ['Coque de carbón', ['Carboeléctrica']],

            // Combustibles líquidos
            ['Petróleo crudo', ['Térmica Convencional']],
            ['Diesel', ['Térmica Convencional', 'Combustión Interna']],
            ['Combustóleo', ['Térmica Convencional']],
            ['Gasolinas y naftas', ['Combustión Interna']],

            // Combustibles gaseosos
            ['Gas natural', ['Térmica Convencional', 'Turbogás', 'Cogeneración']],
            ['Gas natural seco', ['Térmica Convencional', 'Turbogás', 'Ciclo Combinado', 'Cogeneración']],
            ['Gas licuado de petróleo', ['Turbogás']],
            ['Biogás', ['Cogeneración']],

            // Energías renovables - estas van desde Oferta Interna Bruta, no directamente
            // ['Energía Nuclear', ['Nucleoeléctrica']], // Manejado por distribution-to-transformation
            // ['Energia Hidraúlica', ['Cogeneración']], // Manejado por distribution-to-transformation
            // ['Energía Hidráulica', ['Cogeneración']], // Manejado por distribution-to-transformation
            // ['Geoenergía', ['Geotérmica']], // Manejado por distribution-to-transformation
            // ['Energía solar', ['Solar Fotovoltaica']], // Manejado por distribution-to-transformation
            // ['Energía eólica', ['Eólica']], // Manejado por distribution-to-transformation

            // Biomasa
            ['Bagazo de caña', ['Cogeneración']],
            ['Leña', ['Cogeneración']]
        ]));

        // === MAPEO FUENTES -> HUB PRIMARIO ===
        this.registerConnectionMap('sources-to-hub', new Map([
            ['Producción', ['Oferta Total']],
            ['Importación de energéticos primarios', ['Oferta Total']],
            ['Variación de inventarios de Energéticos primarios', ['Oferta Total']]
        ]));

        // === MAPEO HUB -> DISTRIBUCIÓN ===
        this.registerConnectionMap('hub-to-distribution', new Map([
            ['Oferta Total', [
                'Oferta Interna Bruta',
                'Exportación',
                'Energía No Aprovechada'
            ]]
        ]));

        // === MAPEO DISTRIBUCIÓN -> TRANSFORMACIÓN ===
        this.registerConnectionMap('distribution-to-transformation', new Map([
            ['Oferta Interna Bruta', [
                'Consumo Propio del Sector',
                'Refinerías y Despuntadoras',
                'Plantas de Gas y Fraccionadoras',
                'Coquizadoras y Hornos',
                'Combustión Interna',
                'Carboeléctrica',
                'Térmica Convencional',
                'Turbogás',
                'Ciclo Combinado',
                'Nucleoeléctrica',
                // Agregamos otras tecnologías gradualmente
            ]]
        ]));

        // === MAPEO CENTROS DE TRANSFORMACIÓN -> TECNOLOGÍAS DE GENERACIÓN ===
        this.registerConnectionMap('transformation-to-generation', new Map([
            ['Refinerías y Despuntadoras', [
                { target: 'Térmica Convencional', energetics: ['Combustóleo', 'Coque de petróleo'] },
                { target: 'Combustión Interna', energetics: ['Diesel', 'Combustóleo'] },
                { target: 'Turbogás', energetics: ['Diesel'] }
            ]],
            ['Plantas de Gas y Fraccionadoras', [
                { target: 'Térmica Convencional', energetics: ['Gas natural seco'] },
                { target: 'Combustión Interna', energetics: ['Gas natural seco'] },
                { target: 'Turbogás', energetics: ['Gas natural seco'] },
                { target: 'Ciclo Combinado', energetics: ['Gas natural seco'] }
            ]]
        ]));

        // === MAPEO GENERACIÓN -> CENTRALES ===
        this.registerConnectionMap('generation-to-centrales', new Map([
            ['Carboeléctrica', ['Centrales Eléctricas']],
            ['Térmica Convencional', ['Centrales Eléctricas']],
            ['Combustión Interna', ['Centrales Eléctricas']],
            ['Turbogás', ['Centrales Eléctricas']],
            ['Ciclo Combinado', ['Centrales Eléctricas']],
            ['Nucleoeléctrica', ['Centrales Eléctricas']],
            ['Cogeneración', ['Centrales Eléctricas']],
            ['Geotérmica', ['Centrales Eléctricas']],
            ['Eólica', ['Centrales Eléctricas']],
            ['Solar Fotovoltaica', ['Centrales Eléctricas']]
        ]));

        console.log(`Inicializados ${this.connectionMaps.size} mapeos de conexiones`);
    }

    /**
     * Genera enlaces de datos basados en los mapeos de conexiones y datos de nodos
     * @param {Map} nodeMap - Mapa de nombres de nodos a índices
     * @param {Array} nodeColors - Array de colores de nodos
     * @param {Object} nodeData - Datos de nodos con información de flujos
     * @param {string} year - Año para el cual generar los enlaces
     * @param {Object} options - Opciones de generación
     * @returns {Object} Objeto con arrays de source, target, value, linkColors y linkCustomdata
     */
    generateDataLinks(nodeMap, nodeColors, nodeData, year, options = {}) {
        const links = {
            source: [],
            target: [],
            value: [],
            linkColors: [],
            linkCustomdata: []
        };

        const mapTypes = options.mapTypes || ['fuel-to-generation'];
        const excludeEnergyTypes = options.excludeEnergyTypes || ['Energía eléctrica'];

        for (const mapType of mapTypes) {
            if (mapType === 'fuel-to-generation') {
                this.generateFuelToGenerationLinks(links, nodeMap, nodeColors, nodeData, year, excludeEnergyTypes);
            } else if (mapType === 'generation-to-centrales') {
                this.generateGenerationToCentralesLinks(links, nodeMap, nodeColors, nodeData, year);
            } else if (mapType === 'distribution-to-transformation') {
                this.generateDistributionToTransformationLinks(links, nodeMap, nodeColors, nodeData, year);
            } else if (mapType === 'transformation-to-generation') {
                this.generateTransformationToGenerationLinks(links, nodeMap, nodeColors, nodeData, year);
            }
        }

        return links;
    }

    /**
     * Genera enlaces específicos de combustibles a tecnologías de generación
     * @param {Object} links - Objeto de enlaces a llenar
     * @param {Map} nodeMap - Mapa de nombres de nodos a índices
     * @param {Array} nodeColors - Array de colores de nodos
     * @param {Object} nodeData - Datos de nodos
     * @param {string} year - Año para los datos
     * @param {Array} excludeEnergyTypes - Tipos de energía a excluir
     */
    generateFuelToGenerationLinks(links, nodeMap, nodeColors, nodeData, year, excludeEnergyTypes) {
        const fuelToGenMap = this.connectionMaps.get('fuel-to-generation');
        if (!fuelToGenMap) return;

        // Procesar cada nodo de tecnología de generación
        const generationNodes = [
            'carboelectrica', 'termicaConvencional', 'combustionInterna',
            'turbogas', 'cicloCombinado', 'nucleoelectrica', 'cogeneracion',
            'geotermica', 'eolica', 'solarFotovoltaica'
        ];

        for (const genNodeKey of generationNodes) {
            const genNodeData = nodeData[genNodeKey];
            if (!genNodeData || !genNodeData['Nodos Hijo']) continue;

            const genNodeName = this.getGenerationNodeName(genNodeKey);
            const genNodeIndex = nodeMap.get(genNodeName);
            if (genNodeIndex === undefined) continue;

            // Procesar cada energético hijo
            genNodeData['Nodos Hijo'].forEach(child => {
                const flowValue = child[year];
                if (flowValue === undefined || flowValue === 0) return;

                const energyName = child['Nodo Hijo'];

                // Excluir tipos de energía especificados
                if (excludeEnergyTypes.includes(energyName)) return;

                // Verificar si existe mapeo para este energético
                if (fuelToGenMap.has(energyName)) {
                    const possibleTargets = fuelToGenMap.get(energyName);

                    // Verificar si la tecnología actual está en los destinos posibles
                    if (possibleTargets.includes(genNodeName)) {
                        const energyIndex = nodeMap.get(energyName);
                        if (energyIndex !== undefined) {
                            const energyColor = nodeColors[energyIndex];

                            links.source.push(energyIndex);
                            links.target.push(genNodeIndex);
                            links.value.push(Math.log10(Math.abs(flowValue) + 1));
                            links.linkColors.push(
                                this.styleManager ?
                                    this.styleManager.validateColor(energyColor) :
                                    (typeof energyColor === 'string' ? energyColor : '#888')
                            );
                            // Usar PopupManager para generar popup de enlace mejorado si está disponible
                            if (this.popupManager) {
                                const linkPopup = this.popupManager.generateLinkPopup(
                                    energyName,
                                    flowValue,
                                    energyName,
                                    genNodeName,
                                    energyColor,
                                    year,
                                    { flowType: 'fuel_to_generation' }
                                );
                                links.linkCustomdata.push(linkPopup);
                            } else {
                                // Fallback al formato anterior
                                links.linkCustomdata.push(`${energyName}: ${Math.abs(flowValue).toLocaleString()} PJ`);
                            }
                        }
                    }
                }
            });
        }
    }

    /**
     * Genera enlaces de tecnologías de generación a centrales eléctricas
     * @param {Object} links - Objeto de enlaces a llenar
     * @param {Map} nodeMap - Mapa de nombres de nodos a índices
     * @param {Array} nodeColors - Array de colores de nodos
     * @param {Object} nodeData - Datos de nodos
     * @param {string} year - Año para los datos
     */
    generateGenerationToCentralesLinks(links, nodeMap, nodeColors, nodeData, year) {
        const genToCentralesMap = this.connectionMaps.get('generation-to-centrales');
        if (!genToCentralesMap) {
            console.warn('No se encontró el mapa generation-to-centrales');
            return;
        }

        const centralesIndex = nodeMap.get('Centrales Eléctricas');
        if (centralesIndex === undefined) {
            console.warn('No se encontró el índice de Centrales Eléctricas');
            return;
        }

        console.log('Iniciando generación de enlaces generation-to-centrales');

        // Procesar cada tecnología de generación
        for (const [genTech, targets] of genToCentralesMap.entries()) {
            if (!targets.includes('Centrales Eléctricas')) continue;

            const genIndex = nodeMap.get(genTech);
            if (genIndex === undefined) continue;

            // Buscar datos de la tecnología
            const genNodeKey = this.getGenerationNodeKey(genTech);
            const genNodeData = nodeData[genNodeKey];
            if (!genNodeData) {
                console.warn(`No se encontraron datos para ${genTech} (clave: ${genNodeKey})`);
                continue;
            }

            // Calcular total de energía eléctrica generada
            let totalElectricGeneration = 0;
            if (genNodeData['Nodos Hijo']) {
                genNodeData['Nodos Hijo'].forEach(child => {
                    if (child['Nodo Hijo'] === 'Energía eléctrica') {
                        const flowValue = child[year];
                        if (flowValue !== undefined && flowValue !== 0) {
                            totalElectricGeneration += Math.abs(flowValue);
                        }
                    }
                });
            }

            if (totalElectricGeneration > 0) {
                // Aquí se transforma el energético primario en energía eléctrica
                // Por lo tanto, el enlace debe tener el color de "Energía eléctrica"
                const electricityColor = this.styleManager ?
                    this.styleManager.getEnergyColor('Energía eléctrica') :
                    '#FFD700'; // Fallback al dorado

                links.source.push(genIndex);
                links.target.push(centralesIndex);
                links.value.push(Math.log10(totalElectricGeneration + 1));
                links.linkColors.push(
                    this.styleManager ?
                        this.styleManager.validateColor(electricityColor) :
                        (typeof electricityColor === 'string' ? electricityColor : '#888')
                );
                // Usar PopupManager para generar popup de enlace mejorado si está disponible
                if (this.popupManager) {
                    const linkPopup = this.popupManager.generateLinkPopup(
                        'Energía eléctrica',
                        totalElectricGeneration,
                        genTech,
                        'Centrales Eléctricas',
                        electricityColor,
                        year,
                        { flowType: 'generation_to_grid' }
                    );
                    links.linkCustomdata.push(linkPopup);
                } else {
                    // Fallback al formato anterior
                    links.linkCustomdata.push(`${genTech}: ${totalElectricGeneration.toLocaleString()} PJ`);
                }
            }
        }
    }

    /**
     * Obtiene el color del energético primario asociado a una tecnología de generación
     * @param {string} techName - Nombre de la tecnología de generación
     * @returns {string} Color del energético primario asociado
     */
    getPrimaryEnergyColorForTech(techName) {
        // Mapeo de tecnologías a sus energéticos primarios
        const techToEnergyMap = {
            'Carboeléctrica': 'Carbón mineral',
            'Térmica Convencional': 'Combustóleo', // Principal combustible en 2024
            'Nucleoeléctrica': 'Energía Nuclear',
            'Solar Fotovoltaica': 'Energía solar',
            'Geotérmica': 'Geoenergía',
            'Eólica': 'Energía eólica'
        };

        const primaryEnergy = techToEnergyMap[techName];
        let color = null;

        if (primaryEnergy && this.styleManager) {
            // Obtener el color del StyleManager
            color = this.styleManager.getEnergyColor(primaryEnergy);
        }

        // Log para debugging (solo Carboeléctrica por ahora)
        if (techName === 'Carboeléctrica') {
            console.log(`Color para ${techName}: ${color} (energético: ${primaryEnergy})`);
        }

        return color;
    }

    /**
     * Genera enlaces de distribución a transformación (ej: Oferta Interna Bruta -> Combustión Interna)
     * @param {Object} links - Objeto de enlaces a llenar
     * @param {Map} nodeMap - Mapa de nombres de nodos a índices
     * @param {Array} nodeColors - Array de colores de nodos
     * @param {Object} nodeData - Datos de nodos
     * @param {string} year - Año para los datos
     */
    generateDistributionToTransformationLinks(links, nodeMap, nodeColors, nodeData, year) {
        const distToTransMap = this.connectionMaps.get('distribution-to-transformation');
        if (!distToTransMap) return;

        for (const [sourceNode, targets] of distToTransMap.entries()) {
            const sourceIndex = nodeMap.get(sourceNode);
            if (sourceIndex === undefined) continue;

            for (const targetNode of targets) {
                const targetIndex = nodeMap.get(targetNode);
                if (targetIndex === undefined) continue;

                // Manejar diferentes tipos de tecnologías de generación
                if (sourceNode === 'Oferta Interna Bruta') {
                    let totalInput = 0;
                    let energyType = '';

                    // Manejar tecnologías que reciben energéticos desde Oferta Interna Bruta
                    if (targetNode === 'Carboeléctrica' || targetNode === 'Térmica Convencional' || targetNode === 'Combustión Interna' || targetNode === 'Turbogás' || targetNode === 'Ciclo Combinado' || targetNode === 'Nucleoeléctrica') {
                        const techNodeKey = this.getGenerationNodeKey(targetNode);
                        const techNodeData = nodeData[techNodeKey];

                        if (!techNodeData || !techNodeData['Nodos Hijo']) continue;

                        // Crear enlaces separados para cada energético que entra
                        techNodeData['Nodos Hijo'].forEach(child => {
                            const flowValue = child[year];

                            // Determinar qué tipos de energéticos procesar según la tecnología
                            let shouldProcessEnergetic = false;

                            if (targetNode === 'Carboeléctrica' || targetNode === 'Térmica Convencional' || targetNode === 'Nucleoeléctrica') {
                                // Estas tecnologías consumen energéticos PRIMARIOS desde Oferta Interna Bruta
                                shouldProcessEnergetic = (flowValue !== undefined && flowValue < 0 &&
                                    child['Nodo Hijo'] !== 'Energía eléctrica' &&
                                    child.tipo === 'Energía Primaria');
                            } else if (targetNode === 'Combustión Interna' || targetNode === 'Turbogás') {
                                // Estas tecnologías consumen energéticos PRIMARIOS desde Oferta Interna Bruta
                                // Los energéticos SECUNDARIOS les llegan desde centros de transformación
                                shouldProcessEnergetic = (flowValue !== undefined && flowValue < 0 &&
                                    child['Nodo Hijo'] !== 'Energía eléctrica' &&
                                    child.tipo === 'Energía Primaria');
                            }

                            if (shouldProcessEnergetic) {
                                const energeticValue = Math.abs(flowValue);
                                const energeticName = child['Nodo Hijo'];
                                const energeticType = child.tipo;

                                console.log(`${targetNode} consume energético ${energeticType} ${energeticName}: ${flowValue} PJ`);

                                // Obtener el color específico del energético
                                const energeticColor = this.styleManager ?
                                    this.styleManager.getEnergyColor(energeticName) :
                                    nodeColors[sourceIndex];

                                links.source.push(sourceIndex);
                                links.target.push(targetIndex);
                                links.value.push(Math.log10(energeticValue + 1));
                                links.linkColors.push(
                                    this.styleManager ?
                                        this.styleManager.validateColor(energeticColor) :
                                        (typeof energeticColor === 'string' ? energeticColor : '#888')
                                );

                                // Usar PopupManager para generar popup de enlace mejorado si está disponible
                                if (this.popupManager) {
                                    const linkPopup = this.popupManager.generateLinkPopup(
                                        energeticName,
                                        energeticValue,
                                        sourceNode,
                                        targetNode,
                                        energeticColor,
                                        year,
                                        { flowType: 'distribution_to_generation' }
                                    );
                                    links.linkCustomdata.push(linkPopup);
                                } else {
                                    // Fallback al formato anterior
                                    links.linkCustomdata.push(`${energeticName}: ${energeticValue.toLocaleString()} PJ`);
                                }
                            }
                        });
                    }
                }
            }
        }
    }

    /**
     * Genera enlaces desde centros de transformación hacia tecnologías de generación
     * @param {Object} links - Objeto de enlaces a llenar
     * @param {Map} nodeMap - Mapa de nombres de nodos a índices
     * @param {Array} nodeColors - Array de colores de nodos
     * @param {Object} nodeData - Datos de nodos
     * @param {string} year - Año para los datos
     */
    generateTransformationToGenerationLinks(links, nodeMap, nodeColors, nodeData, year) {
        const transToGenMap = this.connectionMaps.get('transformation-to-generation');
        if (!transToGenMap) return;

        for (const [sourceNode, targetConfigs] of transToGenMap.entries()) {
            const sourceIndex = nodeMap.get(sourceNode);
            if (sourceIndex === undefined) continue;

            for (const config of targetConfigs) {
                const targetIndex = nodeMap.get(config.target);
                if (targetIndex === undefined) continue;

                // Buscar datos de la tecnología de generación
                const techNodeKey = this.getGenerationNodeKey(config.target);
                const techNodeData = nodeData[techNodeKey];
                if (!techNodeData || !techNodeData['Nodos Hijo']) continue;

                // Para cada energético que debe venir de este centro de transformación
                for (const energeticName of config.energetics) {
                    let energeticValue = 0;

                    // Buscar el valor del energético en la tecnología
                    techNodeData['Nodos Hijo'].forEach(child => {
                        if (child['Nodo Hijo'] === energeticName) {
                            const flowValue = child[year];
                            if (flowValue !== undefined && flowValue < 0) {
                                energeticValue = Math.abs(flowValue);
                            }
                        }
                    });

                    if (energeticValue > 0) {
                        // Obtener el color del energético específico del StyleManager
                        const energeticColor = this.styleManager ?
                            this.styleManager.getEnergyColor(energeticName) :
                            '#888';

                        links.source.push(sourceIndex);
                        links.target.push(targetIndex);
                        links.value.push(Math.log10(energeticValue + 1));
                        links.linkColors.push(
                            this.styleManager ?
                                this.styleManager.validateColor(energeticColor) :
                                (typeof energeticColor === 'string' ? energeticColor : '#888')
                        );

                        // Generar popup del enlace
                        if (this.popupManager) {
                            const linkPopup = this.popupManager.generateLinkPopup(
                                energeticName,
                                energeticValue,
                                sourceNode,
                                config.target,
                                energeticColor,
                                year,
                                { flowType: 'transformation_to_generation' }
                            );
                            links.linkCustomdata.push(linkPopup);
                        } else {
                            links.linkCustomdata.push(`${sourceNode} → ${config.target}: ${energeticValue.toLocaleString()} PJ`);
                        }
                    }
                }
            }
        }
    }

    /**
     * Convierte clave de nodo de generación a nombre completo
     * @param {string} nodeKey - Clave del nodo (ej: 'carboelectrica')
     * @returns {string} Nombre completo del nodo
     */
    getGenerationNodeName(nodeKey) {
        const nameMap = {
            'carboelectrica': 'Carboeléctrica',
            'termicaConvencional': 'Térmica Convencional',
            'combustionInterna': 'Combustión Interna',
            'turbogas': 'Turbogás',
            'cicloCombinado': 'Ciclo Combinado',
            'nucleoelectrica': 'Nucleoeléctrica',
            'cogeneracion': 'Cogeneración',
            'geotermica': 'Geotérmica',
            'eolica': 'Eólica',
            'solarFotovoltaica': 'Solar Fotovoltaica'
        };
        return nameMap[nodeKey] || nodeKey;
    }

    /**
     * Convierte nombre completo de nodo de generación a clave
     * @param {string} nodeName - Nombre completo del nodo
     * @returns {string} Clave del nodo
     */
    getGenerationNodeKey(nodeName) {
        const keyMap = {
            'Carboeléctrica': 'carboelectrica',
            'Térmica Convencional': 'termicaConvencional',
            'Combustión Interna': 'combustionInterna',
            'Turbogás': 'turbogas',
            'Ciclo Combinado': 'cicloCombinado',
            'Nucleoeléctrica': 'nucleoelectrica',
            'Cogeneración': 'cogeneracion',
            'Geotérmica': 'geotermica',
            'Eólica': 'eolica',
            'Solar Fotovoltaica': 'solarFotovoltaica'
        };
        return keyMap[nodeName] || nodeName;
    }

    /**
     * Migra el mapeo existente fuelToTechMap al sistema LinkManager
     * @param {Object|Map} legacyFuelToTechMap - Mapeo legacy a migrar
     * @param {string} mapName - Nombre del mapa de destino (por defecto 'fuel-to-generation')
     */
    migrateLegacyFuelToTechMap(legacyFuelToTechMap, mapName = 'fuel-to-generation') {
        if (!legacyFuelToTechMap) {
            console.warn('No se proporcionó mapeo legacy para migrar');
            return;
        }

        const newConnectionMap = new Map();

        // Manejar tanto objetos como Maps
        const entries = legacyFuelToTechMap instanceof Map ?
            legacyFuelToTechMap.entries() :
            Object.entries(legacyFuelToTechMap);

        for (const [fuel, targets] of entries) {
            // Convertir índices a nombres si es necesario
            const targetNames = Array.isArray(targets) ?
                targets.map(target => typeof target === 'string' ? target : this.indexToNodeName(target)) :
                [typeof targets === 'string' ? targets : this.indexToNodeName(targets)];

            newConnectionMap.set(fuel, targetNames.filter(name => name !== null));
        }

        // Registrar el nuevo mapa
        this.registerConnectionMap(mapName, newConnectionMap);

        console.log(`Migrado mapeo legacy "${mapName}" con ${newConnectionMap.size} entradas`);
    }

    /**
     * Convierte un índice de nodo a nombre (helper para migración)
     * @param {number} index - Índice del nodo
     * @returns {string|null} Nombre del nodo o null si no se puede convertir
     */
    indexToNodeName(index) {
        // Esta función necesitaría acceso al mapeo de índices a nombres
        // Por ahora retornamos null para índices
        if (typeof index === 'number') {
            console.warn(`No se puede convertir índice ${index} a nombre de nodo`);
            return null;
        }
        return index;
    }

    /**
     * Obtiene el mapeo de combustibles a tecnologías en formato legacy para compatibilidad
     * @param {Map} nodeMap - Mapa de nombres de nodos a índices
     * @returns {Object} Mapeo en formato legacy
     */
    getLegacyFuelToTechMap(nodeMap) {
        const fuelToGenMap = this.connectionMaps.get('fuel-to-generation');
        if (!fuelToGenMap) return {};

        const legacyMap = {};

        for (const [fuel, targets] of fuelToGenMap.entries()) {
            const targetIndices = [];
            for (const target of targets) {
                const index = nodeMap.get(target);
                if (index !== undefined) {
                    targetIndices.push(index);
                }
            }
            if (targetIndices.length > 0) {
                legacyMap[fuel] = targetIndices;
            }
        }

        return legacyMap;
    }

    /**
     * Registra un nuevo mapa de conexiones
     * @param {string} mapName - Nombre del mapa de conexiones
     * @param {Map} connectionMap - Mapa de conexiones (source -> [targets])
     */
    registerConnectionMap(mapName, connectionMap) {
        this.connectionMaps.set(mapName, connectionMap);
        console.log(`Mapa de conexiones "${mapName}" registrado con ${connectionMap.size} entradas`);
    }

    /**
     * Obtiene todas las conexiones posibles para un conjunto de nodos
     * @param {Array} nodeNames - Lista de nombres de nodos disponibles
     * @param {Object} options - Opciones de filtrado
     * @returns {Array} Array de conexiones válidas
     */
    getConnectionsForNodes(nodeNames, options = {}) {
        const connections = [];
        const availableNodes = new Set(nodeNames);
        const mapTypes = options.mapTypes || Array.from(this.connectionMaps.keys());

        for (const mapType of mapTypes) {
            const connectionMap = this.connectionMaps.get(mapType);
            if (!connectionMap) continue;

            for (const [source, targets] of connectionMap.entries()) {
                if (availableNodes.has(source)) {
                    for (const target of targets) {
                        if (availableNodes.has(target)) {
                            connections.push({
                                source: source,
                                target: target,
                                type: mapType,
                                valid: true,
                                confidence: 1.0
                            });
                        }
                    }
                }
            }
        }

        // Ordenar por tipo y confianza
        connections.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type.localeCompare(b.type);
            }
            return b.confidence - a.confidence;
        });

        console.log(`Generadas ${connections.length} conexiones para ${nodeNames.length} nodos`);
        return connections;
    }

    /**
     * Valida si una conexión específica es válida
     * @param {string} sourceNode - Nodo fuente
     * @param {string} targetNode - Nodo destino
     * @param {Object} options - Opciones de validación
     * @returns {Object} Resultado de validación
     */
    validateConnection(sourceNode, targetNode, options = {}) {
        const validation = {
            valid: false,
            type: null,
            confidence: 0,
            reasons: [],
            suggestions: []
        };

        // Verificar en todos los mapas de conexiones
        for (const [mapType, connectionMap] of this.connectionMaps.entries()) {
            if (connectionMap.has(sourceNode)) {
                const targets = connectionMap.get(sourceNode);
                if (targets.includes(targetNode)) {
                    validation.valid = true;
                    validation.type = mapType;
                    validation.confidence = 1.0;
                    validation.reasons.push(`Conexión válida según mapeo "${mapType}"`);
                    break;
                }
            }
        }

        // Si no es válida, buscar sugerencias
        if (!validation.valid && options.includeSuggestions) {
            validation.suggestions = this.suggestAlternativeConnections(sourceNode, targetNode);
        }

        // Validaciones adicionales
        if (validation.valid && options.validateEnergyTypes) {
            const energyValidation = this.validateEnergyTypeCompatibility(sourceNode, targetNode);
            if (!energyValidation.valid) {
                validation.valid = false;
                validation.confidence *= 0.5;
                validation.reasons.push(energyValidation.reason);
            }
        }

        return validation;
    }

    /**
     * Valida la compatibilidad de tipos de energía entre nodos
     * @param {string} sourceNode - Nodo fuente
     * @param {string} targetNode - Nodo destino
     * @returns {Object} Resultado de validación de tipos de energía
     */
    validateEnergyTypeCompatibility(sourceNode, targetNode) {
        const validation = {
            valid: true,
            reason: ''
        };

        // Reglas de incompatibilidad
        const incompatibleRules = [
            {
                condition: (src, tgt) => src === 'Energía eléctrica' && tgt.includes('eléctrica'),
                reason: 'La energía eléctrica no puede ser entrada para generación eléctrica'
            },
            {
                condition: (src, tgt) => src.includes('Nuclear') && !tgt.includes('Nuclear'),
                reason: 'Energía nuclear solo compatible con tecnología nucleoeléctrica'
            },
            {
                condition: (src, tgt) => src.includes('solar') && !tgt.includes('Solar'),
                reason: 'Energía solar solo compatible con tecnología solar'
            },
            {
                condition: (src, tgt) => src.includes('eólica') && !tgt.includes('Eólica'),
                reason: 'Energía eólica solo compatible con tecnología eólica'
            }
        ];

        for (const rule of incompatibleRules) {
            if (rule.condition(sourceNode, targetNode)) {
                validation.valid = false;
                validation.reason = rule.reason;
                break;
            }
        }

        return validation;
    }

    /**
     * Sugiere conexiones alternativas para un nodo
     * @param {string} sourceNode - Nodo fuente
     * @param {string} targetNode - Nodo destino original
     * @returns {Array} Array de sugerencias de conexiones alternativas
     */
    suggestAlternativeConnections(sourceNode, targetNode) {
        const suggestions = [];

        // Buscar conexiones similares por nombre
        for (const [mapType, connectionMap] of this.connectionMaps.entries()) {
            if (connectionMap.has(sourceNode)) {
                const validTargets = connectionMap.get(sourceNode);
                for (const validTarget of validTargets) {
                    const similarity = this.calculateNameSimilarity(targetNode, validTarget);
                    if (similarity > 0.3) {
                        suggestions.push({
                            target: validTarget,
                            type: mapType,
                            similarity: similarity,
                            reason: `Nombre similar a "${targetNode}"`
                        });
                    }
                }
            }
        }

        // Buscar por tipo de energía
        const sourceEnergyType = this.inferEnergyType(sourceNode);
        for (const [mapType, connectionMap] of this.connectionMaps.entries()) {
            for (const [source, targets] of connectionMap.entries()) {
                if (this.inferEnergyType(source) === sourceEnergyType) {
                    for (const target of targets) {
                        const similarity = this.calculateNameSimilarity(targetNode, target);
                        if (similarity > 0.2) {
                            suggestions.push({
                                target: target,
                                type: mapType,
                                similarity: similarity,
                                reason: `Tipo de energía similar (${sourceEnergyType})`
                            });
                        }
                    }
                }
            }
        }

        // Ordenar por similitud y eliminar duplicados
        const uniqueSuggestions = suggestions
            .filter((suggestion, index, self) =>
                index === self.findIndex(s => s.target === suggestion.target))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5);

        return uniqueSuggestions;
    }

    /**
     * Calcula la similitud entre dos nombres de nodos
     * @param {string} name1 - Primer nombre
     * @param {string} name2 - Segundo nombre
     * @returns {number} Índice de similitud (0-1)
     */
    calculateNameSimilarity(name1, name2) {
        const words1 = name1.toLowerCase().split(/\s+/);
        const words2 = name2.toLowerCase().split(/\s+/);

        let commonWords = 0;
        const totalWords = Math.max(words1.length, words2.length);

        for (const word1 of words1) {
            for (const word2 of words2) {
                if (word1 === word2 ||
                    word1.includes(word2) ||
                    word2.includes(word1)) {
                    commonWords++;
                    break;
                }
            }
        }

        return commonWords / totalWords;
    }

    /**
     * Infiere el tipo de energía de un nodo basado en su nombre
     * @param {string} nodeName - Nombre del nodo
     * @returns {string} Tipo de energía inferido
     */
    inferEnergyType(nodeName) {
        const energyTypePatterns = {
            'fossil-solid': ['carbón', 'coque'],
            'fossil-liquid': ['petróleo', 'diesel', 'combustóleo', 'gasolina', 'nafta'],
            'fossil-gas': ['gas natural', 'gas licuado', 'biogás'],
            'nuclear': ['nuclear'],
            'hydro': ['hidráulica', 'hidraúlica'],
            'solar': ['solar'],
            'wind': ['eólica'],
            'geothermal': ['geotérmica', 'geoenergía'],
            'biomass': ['bagazo', 'leña', 'biomasa'],
            'electricity': ['eléctrica', 'eléctrico']
        };

        const lowerName = nodeName.toLowerCase();

        for (const [type, patterns] of Object.entries(energyTypePatterns)) {
            for (const pattern of patterns) {
                if (lowerName.includes(pattern)) {
                    return type;
                }
            }
        }

        return 'unknown';
    }

    /**
     * Obtiene todas las conexiones posibles para un nodo específico
     * @param {string} nodeName - Nombre del nodo
     * @param {string} direction - Dirección ('inputs', 'outputs', 'both')
     * @returns {Object} Objeto con conexiones de entrada y salida
     */
    getNodeConnections(nodeName, direction = 'both') {
        const connections = {
            inputs: [],
            outputs: []
        };

        // Buscar conexiones de salida (nodo como fuente)
        if (direction === 'outputs' || direction === 'both') {
            for (const [mapType, connectionMap] of this.connectionMaps.entries()) {
                if (connectionMap.has(nodeName)) {
                    const targets = connectionMap.get(nodeName);
                    for (const target of targets) {
                        connections.outputs.push({
                            target: target,
                            type: mapType,
                            confidence: 1.0
                        });
                    }
                }
            }
        }

        // Buscar conexiones de entrada (nodo como destino)
        if (direction === 'inputs' || direction === 'both') {
            for (const [mapType, connectionMap] of this.connectionMaps.entries()) {
                for (const [source, targets] of connectionMap.entries()) {
                    if (targets.includes(nodeName)) {
                        connections.inputs.push({
                            source: source,
                            type: mapType,
                            confidence: 1.0
                        });
                    }
                }
            }
        }

        return connections;
    }

    /**
     * Registra una nueva regla de conexión
     * @param {string} ruleName - Nombre de la regla
     * @param {Object} ruleConfig - Configuración de la regla
     */
    registerConnectionRule(ruleName, ruleConfig) {
        this.connectionRules.set(ruleName, {
            name: ruleName,
            condition: ruleConfig.condition,
            action: ruleConfig.action,
            priority: ruleConfig.priority || 1,
            enabled: ruleConfig.enabled !== false,
            description: ruleConfig.description || ''
        });

        console.log(`Regla de conexión "${ruleName}" registrada`);
    }

    /**
     * Aplica las reglas de conexión a un conjunto de conexiones
     * @param {Array} connections - Array de conexiones a procesar
     * @returns {Array} Conexiones procesadas con reglas aplicadas
     */
    applyConnectionRules(connections) {
        let processedConnections = [...connections];

        // Ordenar reglas por prioridad
        const sortedRules = Array.from(this.connectionRules.values())
            .filter(rule => rule.enabled)
            .sort((a, b) => b.priority - a.priority);

        for (const rule of sortedRules) {
            processedConnections = processedConnections.map(connection => {
                if (rule.condition(connection)) {
                    return rule.action(connection);
                }
                return connection;
            });
        }

        return processedConnections;
    }

    /**
     * Actualiza un mapa de conexiones existente
     * @param {string} mapName - Nombre del mapa
     * @param {string} sourceNode - Nodo fuente
     * @param {Array} targetNodes - Array de nodos destino
     */
    updateConnectionMap(mapName, sourceNode, targetNodes) {
        if (!this.connectionMaps.has(mapName)) {
            console.warn(`Mapa de conexiones "${mapName}" no existe`);
            return;
        }

        const connectionMap = this.connectionMaps.get(mapName);
        connectionMap.set(sourceNode, [...targetNodes]);

        console.log(`Actualizado mapeo "${mapName}" para "${sourceNode}" con ${targetNodes.length} destinos`);
    }

    /**
     * Elimina una conexión de un mapa
     * @param {string} mapName - Nombre del mapa
     * @param {string} sourceNode - Nodo fuente
     * @param {string} targetNode - Nodo destino (opcional, si no se especifica elimina todas)
     */
    removeConnection(mapName, sourceNode, targetNode = null) {
        if (!this.connectionMaps.has(mapName)) {
            console.warn(`Mapa de conexiones "${mapName}" no existe`);
            return;
        }

        const connectionMap = this.connectionMaps.get(mapName);

        if (targetNode === null) {
            // Eliminar todas las conexiones del nodo fuente
            connectionMap.delete(sourceNode);
            console.log(`Eliminadas todas las conexiones de "${sourceNode}" en mapa "${mapName}"`);
        } else {
            // Eliminar conexión específica
            if (connectionMap.has(sourceNode)) {
                const targets = connectionMap.get(sourceNode);
                const updatedTargets = targets.filter(target => target !== targetNode);

                if (updatedTargets.length > 0) {
                    connectionMap.set(sourceNode, updatedTargets);
                } else {
                    connectionMap.delete(sourceNode);
                }

                console.log(`Eliminada conexión "${sourceNode}" -> "${targetNode}" en mapa "${mapName}"`);
            }
        }
    }

    /**
     * Obtiene estadísticas de los mapas de conexiones
     * @returns {Object} Estadísticas detalladas
     */
    getConnectionStats() {
        const stats = {
            totalMaps: this.connectionMaps.size,
            totalConnections: 0,
            connectionsByMap: {},
            nodesByRole: {
                sources: new Set(),
                targets: new Set(),
                hubs: new Set() // Nodos que son tanto fuente como destino
            },
            energyTypeDistribution: {}
        };

        // Analizar cada mapa
        for (const [mapName, connectionMap] of this.connectionMaps.entries()) {
            const mapStats = {
                sources: connectionMap.size,
                connections: 0,
                avgConnectionsPerSource: 0
            };

            for (const [source, targets] of connectionMap.entries()) {
                mapStats.connections += targets.length;
                stats.totalConnections += targets.length;

                // Registrar roles de nodos
                stats.nodesByRole.sources.add(source);
                for (const target of targets) {
                    stats.nodesByRole.targets.add(target);
                }
            }

            mapStats.avgConnectionsPerSource = mapStats.connections / mapStats.sources;
            stats.connectionsByMap[mapName] = mapStats;
        }

        // Identificar nodos hub (que son tanto fuente como destino)
        for (const source of stats.nodesByRole.sources) {
            if (stats.nodesByRole.targets.has(source)) {
                stats.nodesByRole.hubs.add(source);
            }
        }

        // Convertir Sets a números para el reporte
        stats.nodesByRole.sources = stats.nodesByRole.sources.size;
        stats.nodesByRole.targets = stats.nodesByRole.targets.size;
        stats.nodesByRole.hubs = stats.nodesByRole.hubs.size;

        return stats;
    }

    /**
     * Exporta la configuración de conexiones a un formato JSON
     * @returns {Object} Configuración exportable
     */
    exportConfiguration() {
        const config = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            connectionMaps: {},
            connectionRules: {},
            connectionConfig: this.connectionConfig
        };

        // Exportar mapas de conexiones
        for (const [mapName, connectionMap] of this.connectionMaps.entries()) {
            config.connectionMaps[mapName] = {};
            for (const [source, targets] of connectionMap.entries()) {
                config.connectionMaps[mapName][source] = [...targets];
            }
        }

        // Exportar reglas de conexión
        for (const [ruleName, rule] of this.connectionRules.entries()) {
            config.connectionRules[ruleName] = {
                name: rule.name,
                priority: rule.priority,
                enabled: rule.enabled,
                description: rule.description
                // Nota: condition y action son funciones y no se pueden serializar
            };
        }

        return config;
    }

    /**
     * Importa una configuración de conexiones desde JSON
     * @param {Object} config - Configuración a importar
     */
    importConfiguration(config) {
        if (!config.version || !config.connectionMaps) {
            throw new Error('Formato de configuración inválido');
        }

        // Limpiar configuración actual
        this.connectionMaps.clear();
        this.connectionRules.clear();

        // Importar mapas de conexiones
        for (const [mapName, mapData] of Object.entries(config.connectionMaps)) {
            const connectionMap = new Map();
            for (const [source, targets] of Object.entries(mapData)) {
                connectionMap.set(source, [...targets]);
            }
            this.connectionMaps.set(mapName, connectionMap);
        }

        // Importar configuración general
        if (config.connectionConfig) {
            this.connectionConfig = { ...this.connectionConfig, ...config.connectionConfig };
        }

        console.log(`Configuración importada: ${Object.keys(config.connectionMaps).length} mapas`);
    }

    /**
     * Reinicia el LinkManager a su estado inicial
     */
    reset() {
        this.connectionMaps.clear();
        this.connectionRules.clear();
        this.connectionHistory.clear();
        this.initializeDefaultMappings();
        console.log('LinkManager reiniciado');
    }
}

// Exportar la clase para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LinkManager;
}