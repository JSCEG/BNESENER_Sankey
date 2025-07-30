/**
 * LinkRoutingManager - Sistema inteligente de enrutamiento de enlaces para diagramas Sankey
 * 
 * Este módulo implementa algoritmos avanzados para calcular rutas optimizadas de enlaces
 * que minimizan cruces y crean un flujo visual ordenado similar a un circuito de tuberías.
 * 
 * Funcionalidades principales:
 * - Cálculo de rutas curvas Bézier optimizadas
 * - Detección y minimización de cruces entre enlaces
 * - Mapeo de jerarquías de nodos padre-hijo
 * - Sistema configurable de parámetros de enrutamiento
 * - Integración transparente con Plotly.js
 * - Optimizaciones de rendimiento para diagramas complejos
 * 
 * @author Kiro AI Assistant
 * @version 1.0.0
 */

class LinkRoutingManager {
    /**
     * Constructor del LinkRoutingManager
     * @param {Object} options - Opciones de configuración
     */
    constructor(options = {}) {
        // Referencias a otros managers
        this.layoutEngine = options.layoutEngine || null;
        this.styleManager = options.styleManager || null;
        this.dataManager = options.dataManager || null;

        // Configuración del sistema de enrutamiento
        this.config = {
            // Habilitación del sistema
            enableRouting: options.enableRouting !== false, // Por defecto habilitado
            
            // Parámetros de curvatura extendidos
            curvature: options.curvature || 0.3,
            minCurvature: options.minCurvature || 0.1,
            maxCurvature: options.maxCurvature || 0.8,
            adaptiveCurvature: options.adaptiveCurvature !== false,
            curvatureStep: options.curvatureStep || 0.05,
            
            // Separación entre enlaces extendida
            linkSeparation: options.linkSeparation || 0.02,
            groupSeparation: options.groupSeparation || 0.05,
            minSeparation: options.minSeparation || 0.01,
            maxSeparation: options.maxSeparation || 0.1,
            adaptiveSeparation: options.adaptiveSeparation !== false,
            separationMultiplier: options.separationMultiplier || 1.0,
            
            // Evitación de obstáculos extendida
            avoidanceRadius: options.avoidanceRadius || 0.05,
            nodeAvoidance: options.nodeAvoidance !== false,
            linkAvoidance: options.linkAvoidance !== false,
            avoidanceStrength: options.avoidanceStrength || 1.0,
            avoidanceDecay: options.avoidanceDecay || 0.8,
            smartAvoidance: options.smartAvoidance !== false,
            
            // Algoritmo de enrutamiento
            routingAlgorithm: options.routingAlgorithm || 'bezier-optimized',
            fallbackAlgorithm: options.fallbackAlgorithm || 'simple-curve',
            
            // Optimización extendida
            maxIterations: options.maxIterations || 50,
            convergenceThreshold: options.convergenceThreshold || 0.001,
            earlyTermination: options.earlyTermination !== false,
            progressiveOptimization: options.progressiveOptimization !== false,
            
            // Prioridades de flujo
            flowPriorities: {
                primary: options.flowPriorities?.primary || 1.0,
                secondary: options.flowPriorities?.secondary || 0.8,
                transformation: options.flowPriorities?.transformation || 0.6,
                distribution: options.flowPriorities?.distribution || 0.4
            },

            // Límites de rendimiento extendidos
            performanceMode: options.performanceMode || 'balanced', // 'fast', 'balanced', 'quality'
            maxCalculationTime: options.maxCalculationTime || 500, // ms
            timeoutFallback: options.timeoutFallback !== false,
            performanceMonitoring: options.performanceMonitoring !== false,
            autoOptimization: options.autoOptimization !== false,
            
            // Configuración de calidad visual
            visualQuality: options.visualQuality || 'balanced', // 'fast', 'balanced', 'high'
            smoothness: options.smoothness || 0.7,
            precision: options.precision || 0.01,
            
            // Configuración de fallback
            fallbackEnabled: options.fallbackEnabled !== false,
            fallbackThreshold: options.fallbackThreshold || 1000, // ms
            gracefulDegradation: options.gracefulDegradation !== false
        };

        // Estado interno
        this.nodeHierarchyMapper = new NodeHierarchyMapper(this.dataManager);
        this.routeCalculator = new RouteCalculator(this.config);
        this.routeCache = new Map();
        this.lastCalculationTime = 0;
        this.isCalculating = false;

        // Métricas de rendimiento
        this.performanceMetrics = {
            totalCalculations: 0,
            averageCalculationTime: 0,
            cacheHitRate: 0,
            crossingReduction: 0
        };

        console.log('LinkRoutingManager inicializado con algoritmo:', this.config.routingAlgorithm);
    }

    /**
     * Actualiza la configuración del sistema de enrutamiento
     * @param {Object} newConfig - Nueva configuración
     * @param {Object} options - Opciones de actualización
     */
    updateConfig(newConfig, options = {}) {
        const { 
            validateOnly = false, 
            forceUpdate = false, 
            preserveCache = false,
            notifyComponents = true 
        } = options;

        // Validar configuración antes de aplicar
        const validatedConfig = this.validateConfig(newConfig);
        
        if (validateOnly) {
            return { valid: Object.keys(validatedConfig).length > 0, validatedConfig };
        }

        // Verificar si hay cambios reales
        const hasChanges = this.hasConfigurationChanges(validatedConfig);
        if (!hasChanges && !forceUpdate) {
            console.log('No hay cambios en la configuración');
            return { updated: false, config: this.config };
        }

        // Guardar configuración anterior para rollback si es necesario
        const previousConfig = { ...this.config };
        
        try {
            // Aplicar cambios
            Object.assign(this.config, validatedConfig);
            
            // Actualizar componentes dependientes
            if (notifyComponents && this.routeCalculator) {
                this.routeCalculator.updateConfig(this.config);
            }

            // Limpiar caché si hay cambios significativos
            if (!preserveCache && this.hasSignificantConfigChanges(validatedConfig)) {
                this.clearCache();
            }

            // Actualizar métricas de rendimiento si el monitoreo está habilitado
            if (this.config.performanceMonitoring) {
                this.updatePerformanceSettings();
            }

            console.log('Configuración de LinkRoutingManager actualizada:', validatedConfig);
            return { updated: true, config: this.config, previous: previousConfig };

        } catch (error) {
            // Rollback en caso de error
            this.config = previousConfig;
            console.error('Error actualizando configuración, rollback aplicado:', error);
            return { updated: false, error: error.message, config: this.config };
        }
    }

    /**
     * Actualiza múltiples parámetros de configuración de forma atómica
     * @param {Object} configUpdates - Objeto con múltiples actualizaciones
     * @returns {Object} Resultado de la actualización
     */
    updateMultipleConfigParams(configUpdates) {
        const results = {};
        const validatedUpdates = {};

        // Validar todas las actualizaciones primero
        for (const [key, value] of Object.entries(configUpdates)) {
            const singleUpdate = { [key]: value };
            const validated = this.validateConfig(singleUpdate);
            
            if (Object.keys(validated).length > 0) {
                Object.assign(validatedUpdates, validated);
                results[key] = { valid: true, value: validated[key] };
            } else {
                results[key] = { valid: false, error: 'Invalid value' };
            }
        }

        // Aplicar todas las actualizaciones válidas de una vez
        if (Object.keys(validatedUpdates).length > 0) {
            const updateResult = this.updateConfig(validatedUpdates);
            return { ...results, updateResult };
        }

        return { ...results, updateResult: { updated: false, reason: 'No valid updates' } };
    }

    /**
     * Actualiza configuración de curvatura dinámicamente
     * @param {number} curvature - Nueva curvatura (0-1)
     * @param {Object} options - Opciones adicionales
     */
    updateCurvature(curvature, options = {}) {
        const { adaptive = this.config.adaptiveCurvature, step = this.config.curvatureStep } = options;
        
        const updates = { curvature };
        if (adaptive !== undefined) updates.adaptiveCurvature = adaptive;
        if (step !== undefined) updates.curvatureStep = step;

        return this.updateConfig(updates);
    }

    /**
     * Actualiza configuración de separación dinámicamente
     * @param {number} separation - Nueva separación (0-0.2)
     * @param {Object} options - Opciones adicionales
     */
    updateSeparation(separation, options = {}) {
        const { 
            group = this.config.groupSeparation,
            multiplier = this.config.separationMultiplier,
            adaptive = this.config.adaptiveSeparation 
        } = options;
        
        const updates = { linkSeparation: separation };
        if (group !== undefined) updates.groupSeparation = group;
        if (multiplier !== undefined) updates.separationMultiplier = multiplier;
        if (adaptive !== undefined) updates.adaptiveSeparation = adaptive;

        return this.updateConfig(updates);
    }

    /**
     * Actualiza configuración de evitación dinámicamente
     * @param {number} radius - Nuevo radio de evitación (0-0.3)
     * @param {Object} options - Opciones adicionales
     */
    updateAvoidance(radius, options = {}) {
        const { 
            strength = this.config.avoidanceStrength,
            decay = this.config.avoidanceDecay,
            smart = this.config.smartAvoidance,
            nodeAvoidance = this.config.nodeAvoidance,
            linkAvoidance = this.config.linkAvoidance
        } = options;
        
        const updates = { avoidanceRadius: radius };
        if (strength !== undefined) updates.avoidanceStrength = strength;
        if (decay !== undefined) updates.avoidanceDecay = decay;
        if (smart !== undefined) updates.smartAvoidance = smart;
        if (nodeAvoidance !== undefined) updates.nodeAvoidance = nodeAvoidance;
        if (linkAvoidance !== undefined) updates.linkAvoidance = linkAvoidance;

        return this.updateConfig(updates);
    }

    /**
     * Valida la configuración proporcionada
     * @param {Object} config - Configuración a validar
     * @returns {Object} Configuración validada
     */
    validateConfig(config) {
        const validated = {};

        // Validar parámetros de curvatura
        if (typeof config.curvature === 'number' && config.curvature >= 0 && config.curvature <= 1) {
            validated.curvature = config.curvature;
        }
        if (typeof config.minCurvature === 'number' && config.minCurvature >= 0 && config.minCurvature <= 1) {
            validated.minCurvature = config.minCurvature;
        }
        if (typeof config.maxCurvature === 'number' && config.maxCurvature >= 0 && config.maxCurvature <= 1) {
            validated.maxCurvature = config.maxCurvature;
        }
        if (typeof config.curvatureStep === 'number' && config.curvatureStep > 0 && config.curvatureStep <= 0.1) {
            validated.curvatureStep = config.curvatureStep;
        }

        // Validar parámetros de separación
        if (typeof config.linkSeparation === 'number' && config.linkSeparation >= 0 && config.linkSeparation <= 0.2) {
            validated.linkSeparation = config.linkSeparation;
        }
        if (typeof config.groupSeparation === 'number' && config.groupSeparation >= 0 && config.groupSeparation <= 0.2) {
            validated.groupSeparation = config.groupSeparation;
        }
        if (typeof config.minSeparation === 'number' && config.minSeparation >= 0 && config.minSeparation <= 0.1) {
            validated.minSeparation = config.minSeparation;
        }
        if (typeof config.maxSeparation === 'number' && config.maxSeparation >= 0 && config.maxSeparation <= 0.3) {
            validated.maxSeparation = config.maxSeparation;
        }
        if (typeof config.separationMultiplier === 'number' && config.separationMultiplier > 0 && config.separationMultiplier <= 3) {
            validated.separationMultiplier = config.separationMultiplier;
        }

        // Validar parámetros de evitación
        if (typeof config.avoidanceRadius === 'number' && config.avoidanceRadius >= 0 && config.avoidanceRadius <= 0.3) {
            validated.avoidanceRadius = config.avoidanceRadius;
        }
        if (typeof config.avoidanceStrength === 'number' && config.avoidanceStrength >= 0 && config.avoidanceStrength <= 2) {
            validated.avoidanceStrength = config.avoidanceStrength;
        }
        if (typeof config.avoidanceDecay === 'number' && config.avoidanceDecay >= 0 && config.avoidanceDecay <= 1) {
            validated.avoidanceDecay = config.avoidanceDecay;
        }

        // Validar booleanos
        const booleanParams = [
            'enableRouting', 'nodeAvoidance', 'linkAvoidance', 'adaptiveCurvature', 
            'adaptiveSeparation', 'smartAvoidance', 'earlyTermination', 
            'progressiveOptimization', 'timeoutFallback', 'performanceMonitoring', 
            'autoOptimization', 'fallbackEnabled', 'gracefulDegradation'
        ];
        
        booleanParams.forEach(param => {
            if (typeof config[param] === 'boolean') {
                validated[param] = config[param];
            }
        });

        // Validar algoritmos
        const validAlgorithms = ['bezier-optimized', 'spline-smooth', 'arc-minimal', 'simple-curve'];
        if (validAlgorithms.includes(config.routingAlgorithm)) {
            validated.routingAlgorithm = config.routingAlgorithm;
        }
        if (validAlgorithms.includes(config.fallbackAlgorithm)) {
            validated.fallbackAlgorithm = config.fallbackAlgorithm;
        }

        // Validar modos de rendimiento y calidad
        const validModes = ['fast', 'balanced', 'quality', 'high'];
        if (validModes.includes(config.performanceMode)) {
            validated.performanceMode = config.performanceMode;
        }
        if (validModes.includes(config.visualQuality)) {
            validated.visualQuality = config.visualQuality;
        }

        // Validar límites de tiempo y rendimiento
        if (typeof config.maxCalculationTime === 'number' && config.maxCalculationTime > 0 && config.maxCalculationTime <= 5000) {
            validated.maxCalculationTime = config.maxCalculationTime;
        }
        if (typeof config.fallbackThreshold === 'number' && config.fallbackThreshold > 0 && config.fallbackThreshold <= 10000) {
            validated.fallbackThreshold = config.fallbackThreshold;
        }
        if (typeof config.maxIterations === 'number' && config.maxIterations > 0 && config.maxIterations <= 200) {
            validated.maxIterations = config.maxIterations;
        }

        // Validar parámetros de calidad visual
        if (typeof config.smoothness === 'number' && config.smoothness >= 0 && config.smoothness <= 1) {
            validated.smoothness = config.smoothness;
        }
        if (typeof config.precision === 'number' && config.precision > 0 && config.precision <= 0.1) {
            validated.precision = config.precision;
        }

        // Validar prioridades de flujo
        if (config.flowPriorities && typeof config.flowPriorities === 'object') {
            const validatedPriorities = {};
            const priorityKeys = ['primary', 'secondary', 'transformation', 'distribution'];
            
            priorityKeys.forEach(key => {
                if (typeof config.flowPriorities[key] === 'number' && 
                    config.flowPriorities[key] >= 0 && 
                    config.flowPriorities[key] <= 2) {
                    validatedPriorities[key] = config.flowPriorities[key];
                }
            });
            
            if (Object.keys(validatedPriorities).length > 0) {
                validated.flowPriorities = validatedPriorities;
            }
        }

        return validated;
    }

    /**
     * Determina si los cambios de configuración requieren limpiar la caché
     * @param {Object} newConfig - Nueva configuración
     * @returns {boolean} True si requiere limpiar caché
     */
    hasSignificantConfigChanges(newConfig) {
        const significantKeys = [
            'routingAlgorithm', 'fallbackAlgorithm', 'curvature', 'linkSeparation', 
            'avoidanceRadius', 'performanceMode', 'visualQuality', 'maxIterations',
            'adaptiveCurvature', 'adaptiveSeparation', 'smartAvoidance'
        ];
        return significantKeys.some(key => newConfig.hasOwnProperty(key));
    }

    /**
     * Verifica si hay cambios reales en la configuración
     * @param {Object} newConfig - Nueva configuración
     * @returns {boolean} True si hay cambios
     */
    hasConfigurationChanges(newConfig) {
        for (const [key, value] of Object.entries(newConfig)) {
            if (key === 'flowPriorities' && typeof value === 'object') {
                // Comparación especial para objetos anidados
                for (const [subKey, subValue] of Object.entries(value)) {
                    if (this.config.flowPriorities[subKey] !== subValue) {
                        return true;
                    }
                }
            } else if (this.config[key] !== value) {
                return true;
            }
        }
        return false;
    }

    /**
     * Actualiza configuraciones de rendimiento basadas en el modo actual
     */
    updatePerformanceSettings() {
        const mode = this.config.performanceMode;
        const quality = this.config.visualQuality;

        // Ajustar configuraciones automáticamente según el modo
        switch (mode) {
            case 'fast':
                this.config.maxIterations = Math.min(this.config.maxIterations, 25);
                this.config.maxCalculationTime = Math.min(this.config.maxCalculationTime, 200);
                this.config.precision = Math.max(this.config.precision, 0.02);
                break;
            case 'quality':
                this.config.maxIterations = Math.max(this.config.maxIterations, 75);
                this.config.maxCalculationTime = Math.max(this.config.maxCalculationTime, 1000);
                this.config.precision = Math.min(this.config.precision, 0.005);
                break;
            case 'balanced':
            default:
                // Mantener valores por defecto
                break;
        }

        // Ajustar según calidad visual
        switch (quality) {
            case 'fast':
                this.config.smoothness = Math.min(this.config.smoothness, 0.5);
                break;
            case 'high':
                this.config.smoothness = Math.max(this.config.smoothness, 0.9);
                break;
        }
    }

    /**
     * Calcula rutas optimizadas para un conjunto de enlaces con fallbacks y monitoreo
     * @param {Array} links - Array de datos de enlaces
     * @param {Array} nodes - Array de datos de nodos
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<Array>} Array de rutas calculadas
     */
    async calculateRoutes(links, nodes, options = {}) {
        if (!this.config.enableRouting) {
            return this.createDefaultRoutes(links);
        }

        if (this.isCalculating) {
            console.warn('Cálculo de rutas ya en progreso, esperando...');
            return this.waitForCalculation();
        }

        this.isCalculating = true;
        const startTime = performance.now();
        const calculationId = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Configurar timeout si está habilitado
        let timeoutId = null;
        let timedOut = false;

        if (this.config.timeoutFallback) {
            timeoutId = setTimeout(() => {
                timedOut = true;
                console.warn(`Cálculo de rutas excedió el tiempo límite (${this.config.maxCalculationTime}ms)`);
            }, this.config.maxCalculationTime);
        }

        try {
            // Monitoreo de rendimiento inicial
            if (this.config.performanceMonitoring) {
                this.logPerformanceStart(calculationId, links.length, nodes.length);
            }

            // Generar clave de caché
            const cacheKey = this.generateCacheKey(links, nodes, options);
            
            // Verificar caché
            if (this.routeCache.has(cacheKey)) {
                this.performanceMetrics.cacheHitRate++;
                console.log('Rutas obtenidas de caché');
                return this.routeCache.get(cacheKey);
            }

            // Verificar si se excedió el tiempo antes de continuar
            if (timedOut && this.config.fallbackEnabled) {
                return this.executeFallbackRouting(links, nodes, 'timeout');
            }

            // Mapear jerarquía de nodos con timeout
            const hierarchy = await this.executeWithTimeout(
                () => this.nodeHierarchyMapper.mapHierarchy(nodes, links),
                this.config.maxCalculationTime * 0.3,
                'hierarchy-mapping'
            );

            if (!hierarchy && this.config.fallbackEnabled) {
                return this.executeFallbackRouting(links, nodes, 'hierarchy-timeout');
            }

            // Calcular rutas con timeout
            const routes = await this.executeWithTimeout(
                () => this.routeCalculator.calculateOptimizedRoutes(links, nodes, hierarchy, options),
                this.config.maxCalculationTime * 0.7,
                'route-calculation'
            );

            if (!routes && this.config.fallbackEnabled) {
                return this.executeFallbackRouting(links, nodes, 'calculation-timeout');
            }

            // Guardar en caché solo si el cálculo fue exitoso
            if (routes && routes.length > 0) {
                this.routeCache.set(cacheKey, routes);
            }

            // Actualizar métricas
            const calculationTime = performance.now() - startTime;
            this.updatePerformanceMetrics(calculationTime);

            // Monitoreo de rendimiento final
            if (this.config.performanceMonitoring) {
                this.logPerformanceEnd(calculationId, calculationTime, routes?.length || 0);
            }

            // Auto-optimización si está habilitada
            if (this.config.autoOptimization && calculationTime > this.config.fallbackThreshold * 0.8) {
                this.triggerAutoOptimization(calculationTime);
            }

            console.log(`Rutas calculadas en ${calculationTime.toFixed(2)}ms`);
            return routes || this.createDefaultRoutes(links);

        } catch (error) {
            console.error('Error calculando rutas:', error);
            
            // Intentar fallback si está habilitado
            if (this.config.fallbackEnabled) {
                return this.executeFallbackRouting(links, nodes, 'error', error);
            }
            
            return this.createDefaultRoutes(links);
        } finally {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            this.isCalculating = false;
        }
    }

    /**
     * Ejecuta una función con timeout
     * @param {Function} fn - Función a ejecutar
     * @param {number} timeout - Timeout en ms
     * @param {string} operation - Nombre de la operación para logging
     * @returns {Promise} Resultado de la función o null si timeout
     */
    async executeWithTimeout(fn, timeout, operation) {
        return new Promise(async (resolve) => {
            const timeoutId = setTimeout(() => {
                console.warn(`Timeout en operación: ${operation} (${timeout}ms)`);
                resolve(null);
            }, timeout);

            try {
                const result = await fn();
                clearTimeout(timeoutId);
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                console.error(`Error en operación ${operation}:`, error);
                resolve(null);
            }
        });
    }

    /**
     * Ejecuta routing de fallback cuando el algoritmo principal falla
     * @param {Array} links - Enlaces
     * @param {Array} nodes - Nodos
     * @param {string} reason - Razón del fallback
     * @param {Error} error - Error original (opcional)
     * @returns {Array} Rutas de fallback
     */
    async executeFallbackRouting(links, nodes, reason, error = null) {
        console.warn(`Ejecutando routing de fallback. Razón: ${reason}`);
        
        try {
            // Usar algoritmo de fallback más simple
            const fallbackConfig = {
                ...this.config,
                routingAlgorithm: this.config.fallbackAlgorithm,
                maxIterations: Math.min(this.config.maxIterations, 10),
                maxCalculationTime: this.config.maxCalculationTime * 0.5,
                adaptiveCurvature: false,
                smartAvoidance: false
            };

            // Crear una instancia temporal del calculador con configuración simplificada
            const fallbackCalculator = new RouteCalculator(fallbackConfig);
            
            // Mapeo de jerarquía simplificado
            const simpleHierarchy = this.createSimpleHierarchy(nodes, links);
            
            // Calcular rutas con algoritmo simplificado
            const fallbackRoutes = await fallbackCalculator.calculateOptimizedRoutes(
                links, nodes, simpleHierarchy, { simplified: true }
            );

            // Registrar el uso de fallback en métricas
            this.performanceMetrics.fallbackUsage = (this.performanceMetrics.fallbackUsage || 0) + 1;
            this.performanceMetrics.lastFallbackReason = reason;

            console.log(`Fallback completado: ${fallbackRoutes?.length || 0} rutas generadas`);
            return fallbackRoutes || this.createDefaultRoutes(links);

        } catch (fallbackError) {
            console.error('Error en fallback routing:', fallbackError);
            
            // Último recurso: rutas por defecto
            if (this.config.gracefulDegradation) {
                return this.createDefaultRoutes(links);
            }
            
            throw fallbackError;
        }
    }

    /**
     * Crea rutas por defecto cuando el enrutamiento falla
     * @param {Array} links - Array de enlaces
     * @returns {Array} Rutas por defecto
     */
    createDefaultRoutes(links) {
        return links.map((link, index) => ({
            id: `route_${index}`,
            sourceIndex: link.source,
            targetIndex: link.target,
            value: link.value,
            color: link.color,
            customdata: link.customdata,
            path: {
                type: 'default',
                controlPoints: [],
                curvature: 0
            },
            routing: {
                priority: 0.5,
                flowType: 'default',
                avoidanceZones: [],
                conflicts: []
            }
        }));
    }

    /**
     * Espera a que termine el cálculo actual
     * @returns {Promise<Array>} Resultado del cálculo
     */
    async waitForCalculation() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (!this.isCalculating) {
                    clearInterval(checkInterval);
                    resolve([]);
                }
            }, 50);
        });
    }

    /**
     * Genera una clave única para el caché basada en los datos de entrada
     * @param {Array} links - Enlaces
     * @param {Array} nodes - Nodos
     * @param {Object} options - Opciones
     * @returns {string} Clave de caché
     */
    generateCacheKey(links, nodes, options) {
        const linkHash = links.map(l => `${l.source}-${l.target}-${l.value}`).join('|');
        const nodeHash = nodes.map(n => `${n.x}-${n.y}`).join('|');
        const configHash = JSON.stringify(this.config);
        const optionsHash = JSON.stringify(options);
        
        return btoa(`${linkHash}:${nodeHash}:${configHash}:${optionsHash}`).slice(0, 32);
    }

    /**
     * Actualiza las métricas de rendimiento
     * @param {number} calculationTime - Tiempo de cálculo en ms
     */
    updatePerformanceMetrics(calculationTime) {
        this.performanceMetrics.totalCalculations++;
        this.lastCalculationTime = calculationTime;
        
        // Calcular promedio móvil
        const alpha = 0.1; // Factor de suavizado
        this.performanceMetrics.averageCalculationTime = 
            this.performanceMetrics.averageCalculationTime * (1 - alpha) + calculationTime * alpha;

        // Actualizar métricas extendidas
        this.performanceMetrics.maxCalculationTime = Math.max(
            this.performanceMetrics.maxCalculationTime || 0, 
            calculationTime
        );
        
        this.performanceMetrics.minCalculationTime = Math.min(
            this.performanceMetrics.minCalculationTime || Infinity, 
            calculationTime
        );

        // Calcular percentiles
        this.updatePerformancePercentiles(calculationTime);

        // Detectar degradación de rendimiento
        if (this.config.performanceMonitoring) {
            this.detectPerformanceDegradation(calculationTime);
        }
    }

    /**
     * Actualiza percentiles de rendimiento
     * @param {number} calculationTime - Tiempo de cálculo actual
     */
    updatePerformancePercentiles(calculationTime) {
        if (!this.performanceMetrics.calculationTimes) {
            this.performanceMetrics.calculationTimes = [];
        }

        this.performanceMetrics.calculationTimes.push(calculationTime);
        
        // Mantener solo los últimos 100 tiempos para cálculo de percentiles
        if (this.performanceMetrics.calculationTimes.length > 100) {
            this.performanceMetrics.calculationTimes.shift();
        }

        // Calcular percentiles
        const sorted = [...this.performanceMetrics.calculationTimes].sort((a, b) => a - b);
        const len = sorted.length;
        
        this.performanceMetrics.percentiles = {
            p50: sorted[Math.floor(len * 0.5)],
            p75: sorted[Math.floor(len * 0.75)],
            p90: sorted[Math.floor(len * 0.9)],
            p95: sorted[Math.floor(len * 0.95)]
        };
    }

    /**
     * Detecta degradación de rendimiento y toma acciones correctivas
     * @param {number} currentTime - Tiempo de cálculo actual
     */
    detectPerformanceDegradation(currentTime) {
        const threshold = this.config.fallbackThreshold;
        const avgTime = this.performanceMetrics.averageCalculationTime;

        // Detectar picos de rendimiento
        if (currentTime > threshold) {
            console.warn(`Rendimiento degradado: ${currentTime}ms > ${threshold}ms`);
            this.performanceMetrics.degradationEvents = (this.performanceMetrics.degradationEvents || 0) + 1;
            
            if (this.config.autoOptimization) {
                this.triggerAutoOptimization(currentTime);
            }
        }

        // Detectar tendencia de degradación
        if (avgTime > threshold * 0.8 && this.performanceMetrics.totalCalculations > 10) {
            console.warn(`Tendencia de degradación detectada: promedio ${avgTime.toFixed(2)}ms`);
            
            if (this.config.autoOptimization) {
                this.triggerGradualOptimization();
            }
        }
    }

    /**
     * Dispara optimización automática basada en el rendimiento
     * @param {number} triggerTime - Tiempo que disparó la optimización
     */
    triggerAutoOptimization(triggerTime) {
        console.log(`Iniciando auto-optimización (trigger: ${triggerTime}ms)`);

        // Ajustar configuración para mejorar rendimiento
        const optimizations = this.calculateOptimizations(triggerTime);
        
        if (optimizations.length > 0) {
            this.applyOptimizations(optimizations);
            this.performanceMetrics.autoOptimizations = (this.performanceMetrics.autoOptimizations || 0) + 1;
        }
    }

    /**
     * Calcula optimizaciones necesarias basadas en el rendimiento
     * @param {number} currentTime - Tiempo actual de cálculo
     * @returns {Array} Lista de optimizaciones a aplicar
     */
    calculateOptimizations(currentTime) {
        const optimizations = [];
        const severity = currentTime / this.config.fallbackThreshold;

        // Optimizaciones progresivas basadas en severidad
        if (severity > 1.5) {
            // Optimizaciones agresivas
            optimizations.push({
                type: 'performance_mode',
                value: 'fast',
                reason: 'Severe performance degradation'
            });
            
            optimizations.push({
                type: 'max_iterations',
                value: Math.max(10, Math.floor(this.config.maxIterations * 0.5)),
                reason: 'Reduce iteration count'
            });
        } else if (severity > 1.2) {
            // Optimizaciones moderadas
            optimizations.push({
                type: 'adaptive_features',
                value: false,
                reason: 'Disable adaptive features'
            });
            
            optimizations.push({
                type: 'precision',
                value: Math.min(0.02, this.config.precision * 1.5),
                reason: 'Reduce precision'
            });
        } else {
            // Optimizaciones suaves
            optimizations.push({
                type: 'early_termination',
                value: true,
                reason: 'Enable early termination'
            });
        }

        return optimizations;
    }

    /**
     * Aplica optimizaciones calculadas
     * @param {Array} optimizations - Lista de optimizaciones
     */
    applyOptimizations(optimizations) {
        const configUpdates = {};

        optimizations.forEach(opt => {
            switch (opt.type) {
                case 'performance_mode':
                    configUpdates.performanceMode = opt.value;
                    break;
                case 'max_iterations':
                    configUpdates.maxIterations = opt.value;
                    break;
                case 'adaptive_features':
                    configUpdates.adaptiveCurvature = opt.value;
                    configUpdates.adaptiveSeparation = opt.value;
                    configUpdates.smartAvoidance = opt.value;
                    break;
                case 'precision':
                    configUpdates.precision = opt.value;
                    break;
                case 'early_termination':
                    configUpdates.earlyTermination = opt.value;
                    break;
            }
            
            console.log(`Aplicando optimización: ${opt.type} = ${opt.value} (${opt.reason})`);
        });

        // Aplicar todas las optimizaciones de una vez
        this.updateConfig(configUpdates, { preserveCache: true });
    }

    /**
     * Dispara optimización gradual para tendencias de degradación
     */
    triggerGradualOptimization() {
        console.log('Iniciando optimización gradual');

        // Ajustes graduales menos agresivos
        const gradualUpdates = {};

        // Reducir ligeramente las iteraciones
        if (this.config.maxIterations > 20) {
            gradualUpdates.maxIterations = this.config.maxIterations - 5;
        }

        // Aumentar ligeramente la precisión (menos preciso = más rápido)
        if (this.config.precision < 0.015) {
            gradualUpdates.precision = this.config.precision * 1.1;
        }

        // Habilitar terminación temprana si no está habilitada
        if (!this.config.earlyTermination) {
            gradualUpdates.earlyTermination = true;
        }

        if (Object.keys(gradualUpdates).length > 0) {
            this.updateConfig(gradualUpdates, { preserveCache: true });
            this.performanceMetrics.gradualOptimizations = (this.performanceMetrics.gradualOptimizations || 0) + 1;
        }
    }

    /**
     * Registra el inicio de un cálculo de rendimiento
     * @param {string} calculationId - ID único del cálculo
     * @param {number} linkCount - Número de enlaces
     * @param {number} nodeCount - Número de nodos
     */
    logPerformanceStart(calculationId, linkCount, nodeCount) {
        if (!this.performanceMetrics.calculations) {
            this.performanceMetrics.calculations = new Map();
        }

        this.performanceMetrics.calculations.set(calculationId, {
            startTime: performance.now(),
            linkCount,
            nodeCount,
            config: { ...this.config }
        });
    }

    /**
     * Registra el final de un cálculo de rendimiento
     * @param {string} calculationId - ID único del cálculo
     * @param {number} totalTime - Tiempo total de cálculo
     * @param {number} routeCount - Número de rutas generadas
     */
    logPerformanceEnd(calculationId, totalTime, routeCount) {
        const calculation = this.performanceMetrics.calculations?.get(calculationId);
        if (!calculation) return;

        calculation.endTime = performance.now();
        calculation.totalTime = totalTime;
        calculation.routeCount = routeCount;
        calculation.efficiency = routeCount / totalTime; // rutas por ms

        // Limpiar cálculos antiguos (mantener solo los últimos 50)
        if (this.performanceMetrics.calculations.size > 50) {
            const firstKey = this.performanceMetrics.calculations.keys().next().value;
            this.performanceMetrics.calculations.delete(firstKey);
        }
    }

    /**
     * Crea una jerarquía simplificada para fallback
     * @param {Array} nodes - Nodos
     * @param {Array} links - Enlaces
     * @returns {Map} Jerarquía simplificada
     */
    createSimpleHierarchy(nodes, links) {
        const hierarchy = new Map();

        nodes.forEach((node, index) => {
            hierarchy.set(index, {
                index,
                name: node.name || `node_${index}`,
                type: 'generic',
                level: Math.floor((node.x || 0) * 5),
                parents: links.filter(l => l.target === index).map(l => l.source),
                children: links.filter(l => l.source === index).map(l => l.target),
                position: { x: node.x || 0, y: node.y || 0 }
            });
        });

        return hierarchy;
    }

    /**
     * Optimiza rutas existentes para minimizar cruces
     * @param {Array} routes - Rutas a optimizar
     * @returns {Array} Rutas optimizadas
     */
    optimizeRoutes(routes) {
        if (!routes || routes.length === 0) return routes;

        const startTime = performance.now();
        
        // Detectar cruces
        const crossings = this.detectCrossings(routes);
        const initialCrossings = crossings.length;

        if (crossings.length === 0) {
            console.log('No se detectaron cruces, no se requiere optimización');
            return routes;
        }

        // Resolver conflictos iterativamente
        let optimizedRoutes = [...routes];
        let iterations = 0;
        let currentCrossings = crossings.length;

        while (iterations < this.config.maxIterations && currentCrossings > 0) {
            optimizedRoutes = this.resolveConflicts(optimizedRoutes, this.detectCrossings(optimizedRoutes));
            currentCrossings = this.detectCrossings(optimizedRoutes).length;
            iterations++;

            // Verificar convergencia
            if (currentCrossings === 0 || 
                (initialCrossings - currentCrossings) / initialCrossings < this.config.convergenceThreshold) {
                break;
            }
        }

        const optimizationTime = performance.now() - startTime;
        const crossingReduction = ((initialCrossings - currentCrossings) / initialCrossings) * 100;
        
        this.performanceMetrics.crossingReduction = crossingReduction;

        console.log(`Optimización completada: ${crossingReduction.toFixed(1)}% reducción de cruces en ${optimizationTime.toFixed(2)}ms`);
        
        return optimizedRoutes;
    }

    /**
     * Detecta cruces entre rutas usando algoritmos avanzados de intersección
     * @param {Array} routes - Rutas a analizar
     * @returns {Array} Array de cruces detectados
     */
    detectCrossings(routes) {
        const crossings = [];
        
        for (let i = 0; i < routes.length; i++) {
            for (let j = i + 1; j < routes.length; j++) {
                const intersections = this.findRouteIntersections(routes[i], routes[j]);
                
                intersections.forEach(intersection => {
                    crossings.push({
                        route1: i,
                        route2: j,
                        point: intersection.point,
                        severity: intersection.severity,
                        type: intersection.type,
                        parameters: intersection.parameters,
                        angle: intersection.angle
                    });
                });
            }
        }

        // Detectar cruces múltiples entre los mismos nodos
        const multipleLinks = this.detectMultipleLinksBetweenNodes(routes);
        multipleLinks.forEach(group => {
            const groupCrossings = this.analyzeMultipleLinkCrossings(group, routes);
            crossings.push(...groupCrossings);
        });

        return crossings.sort((a, b) => b.severity - a.severity);
    }

    /**
     * Encuentra intersecciones entre dos rutas usando algoritmos de curvas Bézier
     * @param {Object} route1 - Primera ruta
     * @param {Object} route2 - Segunda ruta
     * @returns {Array} Array de intersecciones encontradas
     */
    findRouteIntersections(route1, route2) {
        const intersections = [];
        
        // Verificar si las rutas tienen el mismo origen o destino (no se cruzan)
        if (route1.sourceIndex === route2.sourceIndex || 
            route1.targetIndex === route2.targetIndex ||
            route1.sourceIndex === route2.targetIndex ||
            route1.targetIndex === route2.sourceIndex) {
            return intersections;
        }

        // Obtener puntos de control de ambas rutas
        const curve1 = route1.path?.controlPoints;
        const curve2 = route2.path?.controlPoints;
        
        if (!curve1 || !curve2 || curve1.length < 4 || curve2.length < 4) {
            return this.fallbackIntersectionDetection(route1, route2);
        }

        // Muestrear ambas curvas para detectar intersecciones
        const samples1 = this.sampleRouteForIntersection(curve1, 30);
        const samples2 = this.sampleRouteForIntersection(curve2, 30);

        // Buscar intersecciones entre segmentos
        for (let i = 0; i < samples1.length - 1; i++) {
            for (let j = 0; j < samples2.length - 1; j++) {
                const intersection = this.findSegmentIntersection(
                    samples1[i], samples1[i + 1],
                    samples2[j], samples2[j + 1]
                );
                
                if (intersection) {
                    const severity = this.calculateIntersectionSeverity(
                        intersection, route1, route2, samples1[i], samples2[j]
                    );
                    
                    intersections.push({
                        point: intersection,
                        severity: severity,
                        type: this.classifyIntersectionType(route1, route2),
                        parameters: {
                            t1: samples1[i].t + (intersection.t1 || 0) * (samples1[i + 1].t - samples1[i].t),
                            t2: samples2[j].t + (intersection.t2 || 0) * (samples2[j + 1].t - samples2[j].t)
                        },
                        angle: this.calculateIntersectionAngle(samples1[i], samples1[i + 1], samples2[j], samples2[j + 1])
                    });
                }
            }
        }

        return intersections;
    }

    /**
     * Muestrea una ruta para detección de intersecciones
     * @param {Array} controlPoints - Puntos de control de la curva
     * @param {number} numSamples - Número de muestras
     * @returns {Array} Puntos muestreados con parámetro t
     */
    sampleRouteForIntersection(controlPoints, numSamples) {
        const samples = [];
        const [P0, P1, P2, P3] = controlPoints;

        for (let i = 0; i <= numSamples; i++) {
            const t = i / numSamples;
            const point = this.evaluateBezierCurve(P0, P1, P2, P3, t);
            samples.push({ ...point, t });
        }

        return samples;
    }

    /**
     * Encuentra la intersección entre dos segmentos de línea
     * @param {Object} p1 - Punto inicial del primer segmento
     * @param {Object} p2 - Punto final del primer segmento
     * @param {Object} p3 - Punto inicial del segundo segmento
     * @param {Object} p4 - Punto final del segundo segmento
     * @returns {Object|null} Punto de intersección o null si no se intersectan
     */
    findSegmentIntersection(p1, p2, p3, p4) {
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        
        if (Math.abs(denom) < 1e-10) {
            return null; // Líneas paralelas
        }

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        // Verificar si la intersección está dentro de ambos segmentos
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1),
                t1: t,
                t2: u
            };
        }

        return null;
    }

    /**
     * Calcula la severidad de una intersección
     * @param {Object} intersection - Punto de intersección
     * @param {Object} route1 - Primera ruta
     * @param {Object} route2 - Segunda ruta
     * @param {Object} sample1 - Muestra de la primera ruta
     * @param {Object} sample2 - Muestra de la segunda ruta
     * @returns {number} Severidad (0-1)
     */
    calculateIntersectionSeverity(intersection, route1, route2, sample1, sample2) {
        // Factores que afectan la severidad:
        // 1. Ángulo de intersección (cruces perpendiculares son más severos)
        // 2. Posición en la curva (cruces en el centro son más severos)
        // 3. Diferencia de prioridades entre rutas
        // 4. Proximidad a nodos

        let severity = 0.5; // Severidad base

        // Factor de ángulo
        const angle = this.calculateIntersectionAngle(sample1, sample1, sample2, sample2);
        const angleFactor = Math.abs(Math.sin(angle)); // Máximo para ángulos de 90°
        severity *= (0.5 + angleFactor * 0.5);

        // Factor de posición (cruces en el centro de las curvas son más problemáticos)
        const centerDistance1 = Math.abs(sample1.t - 0.5);
        const centerDistance2 = Math.abs(sample2.t - 0.5);
        const positionFactor = 1 - (centerDistance1 + centerDistance2) / 2;
        severity *= (0.7 + positionFactor * 0.3);

        // Factor de prioridad
        const priority1 = route1.routing?.priority || 0.5;
        const priority2 = route2.routing?.priority || 0.5;
        const priorityDifference = Math.abs(priority1 - priority2);
        severity *= (0.8 + priorityDifference * 0.2);

        // Factor de valor de flujo
        const value1 = route1.value || 0;
        const value2 = route2.value || 0;
        const maxValue = Math.max(value1, value2);
        const minValue = Math.min(value1, value2);
        const valueFactor = minValue > 0 ? maxValue / minValue : 1;
        severity *= Math.min(1 + Math.log10(valueFactor) * 0.1, 1.2);

        return Math.min(severity, 1);
    }

    /**
     * Clasifica el tipo de intersección
     * @param {Object} route1 - Primera ruta
     * @param {Object} route2 - Segunda ruta
     * @returns {string} Tipo de intersección
     */
    classifyIntersectionType(route1, route2) {
        const type1 = route1.routing?.flowType || 'unknown';
        const type2 = route2.routing?.flowType || 'unknown';

        if (type1 === 'primary' && type2 === 'primary') return 'primary-primary';
        if (type1 === 'primary' || type2 === 'primary') return 'primary-secondary';
        if (type1 === 'secondary' && type2 === 'secondary') return 'secondary-secondary';
        
        return 'mixed';
    }

    /**
     * Calcula el ángulo de intersección entre dos segmentos
     * @param {Object} p1 - Punto inicial del primer segmento
     * @param {Object} p2 - Punto final del primer segmento
     * @param {Object} p3 - Punto inicial del segundo segmento
     * @param {Object} p4 - Punto final del segundo segmento
     * @returns {number} Ángulo en radianes
     */
    calculateIntersectionAngle(p1, p2, p3, p4) {
        const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
        const v2 = { x: p4.x - p3.x, y: p4.y - p3.y };

        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

        if (mag1 === 0 || mag2 === 0) return 0;

        const cosAngle = dot / (mag1 * mag2);
        return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    }

    /**
     * Detecta múltiples enlaces entre los mismos pares de nodos
     * @param {Array} routes - Rutas a analizar
     * @returns {Array} Grupos de enlaces múltiples
     */
    detectMultipleLinksBetweenNodes(routes) {
        const nodeConnections = new Map();
        const multipleLinks = [];

        // Agrupar rutas por pares de nodos
        routes.forEach((route, index) => {
            const key = `${Math.min(route.sourceIndex, route.targetIndex)}-${Math.max(route.sourceIndex, route.targetIndex)}`;
            
            if (!nodeConnections.has(key)) {
                nodeConnections.set(key, []);
            }
            nodeConnections.get(key).push({ route, index });
        });

        // Identificar grupos con múltiples enlaces
        nodeConnections.forEach((group, key) => {
            if (group.length > 1) {
                multipleLinks.push({
                    nodeKey: key,
                    routes: group,
                    count: group.length
                });
            }
        });

        return multipleLinks;
    }

    /**
     * Analiza cruces en grupos de enlaces múltiples
     * @param {Object} group - Grupo de enlaces múltiples
     * @param {Array} allRoutes - Todas las rutas
     * @returns {Array} Cruces detectados en el grupo
     */
    analyzeMultipleLinkCrossings(group, allRoutes) {
        const crossings = [];
        
        if (group.routes.length < 2) return crossings;

        // Analizar separación entre enlaces paralelos
        for (let i = 0; i < group.routes.length; i++) {
            for (let j = i + 1; j < group.routes.length; j++) {
                const route1 = group.routes[i].route;
                const route2 = group.routes[j].route;
                
                const separation = this.calculateParallelRouteSeparation(route1, route2);
                
                if (separation < this.config.linkSeparation) {
                    crossings.push({
                        route1: group.routes[i].index,
                        route2: group.routes[j].index,
                        point: this.calculateMidpoint(route1, route2),
                        severity: 1 - (separation / this.config.linkSeparation),
                        type: 'parallel-overlap',
                        parameters: { separation },
                        angle: 0 // Enlaces paralelos
                    });
                }
            }
        }

        return crossings;
    }

    /**
     * Calcula la separación entre dos rutas paralelas
     * @param {Object} route1 - Primera ruta
     * @param {Object} route2 - Segunda ruta
     * @returns {number} Separación mínima
     */
    calculateParallelRouteSeparation(route1, route2) {
        const curve1 = route1.path?.controlPoints;
        const curve2 = route2.path?.controlPoints;
        
        if (!curve1 || !curve2) return Infinity;

        const samples1 = this.sampleRouteForIntersection(curve1, 10);
        const samples2 = this.sampleRouteForIntersection(curve2, 10);

        let minSeparation = Infinity;

        samples1.forEach(p1 => {
            samples2.forEach(p2 => {
                const distance = Math.sqrt(
                    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
                );
                minSeparation = Math.min(minSeparation, distance);
            });
        });

        return minSeparation;
    }

    /**
     * Calcula el punto medio entre dos rutas
     * @param {Object} route1 - Primera ruta
     * @param {Object} route2 - Segunda ruta
     * @returns {Object} Punto medio
     */
    calculateMidpoint(route1, route2) {
        const curve1 = route1.path?.controlPoints;
        const curve2 = route2.path?.controlPoints;
        
        if (!curve1 || !curve2) {
            return { x: 0.5, y: 0.5 };
        }

        const mid1 = this.evaluateBezierCurve(curve1[0], curve1[1], curve1[2], curve1[3], 0.5);
        const mid2 = this.evaluateBezierCurve(curve2[0], curve2[1], curve2[2], curve2[3], 0.5);

        return {
            x: (mid1.x + mid2.x) / 2,
            y: (mid1.y + mid2.y) / 2
        };
    }

    /**
     * Detección de intersección de respaldo para casos simples
     * @param {Object} route1 - Primera ruta
     * @param {Object} route2 - Segunda ruta
     * @returns {Array} Intersecciones detectadas
     */
    fallbackIntersectionDetection(route1, route2) {
        // Verificar si las rutas tienen direcciones que se cruzan
        const r1StartX = route1.sourceIndex;
        const r1EndX = route1.targetIndex;
        const r2StartX = route2.sourceIndex;
        const r2EndX = route2.targetIndex;

        // Detectar cruces básicos basados en índices de nodos
        if ((r1StartX < r2StartX && r1EndX > r2EndX) || 
            (r1StartX > r2StartX && r1EndX < r2EndX)) {
            return [{
                point: { 
                    x: (r1StartX + r1EndX + r2StartX + r2EndX) / 4, 
                    y: 0.5 
                },
                severity: 0.5,
                type: 'estimated',
                parameters: { t1: 0.5, t2: 0.5 },
                angle: Math.PI / 4
            }];
        }

        return [];
    }

    /**
     * Resuelve conflictos entre rutas que se cruzan usando estrategias avanzadas
     * @param {Array} routes - Rutas con conflictos
     * @param {Array} crossings - Cruces detectados
     * @returns {Array} Rutas con conflictos resueltos
     */
    resolveConflicts(routes, crossings) {
        if (crossings.length === 0) return routes;

        const resolvedRoutes = [...routes];
        const conflictGroups = this.groupConflictsByType(crossings);

        // Resolver cada tipo de conflicto con estrategias específicas
        for (const [conflictType, conflicts] of conflictGroups) {
            switch (conflictType) {
                case 'parallel-overlap':
                    this.resolveParallelOverlaps(resolvedRoutes, conflicts);
                    break;
                case 'primary-primary':
                    this.resolvePrimaryPrimaryCrossings(resolvedRoutes, conflicts);
                    break;
                case 'primary-secondary':
                    this.resolvePrimarySecondaryCrossings(resolvedRoutes, conflicts);
                    break;
                case 'secondary-secondary':
                    this.resolveSecondarySecondaryCrossings(resolvedRoutes, conflicts);
                    break;
                default:
                    this.resolveGenericCrossings(resolvedRoutes, conflicts);
                    break;
            }
        }

        // Aplicar ajustes finales para minimizar cruces restantes
        this.applyFinalOptimizations(resolvedRoutes, crossings);

        return resolvedRoutes;
    }

    /**
     * Agrupa conflictos por tipo para aplicar estrategias específicas
     * @param {Array} crossings - Cruces detectados
     * @returns {Map} Mapa de conflictos agrupados por tipo
     */
    groupConflictsByType(crossings) {
        const groups = new Map();

        crossings.forEach(crossing => {
            const type = crossing.type || 'generic';
            if (!groups.has(type)) {
                groups.set(type, []);
            }
            groups.get(type).push(crossing);
        });

        // Ordenar cada grupo por severidad
        groups.forEach(group => {
            group.sort((a, b) => b.severity - a.severity);
        });

        return groups;
    }

    /**
     * Resuelve solapamientos entre rutas paralelas
     * @param {Array} routes - Rutas a ajustar
     * @param {Array} conflicts - Conflictos de solapamiento
     */
    resolveParallelOverlaps(routes, conflicts) {
        conflicts.forEach(conflict => {
            const route1 = routes[conflict.route1];
            const route2 = routes[conflict.route2];
            
            // Separar rutas paralelas ajustando sus puntos de control
            const separation = this.config.linkSeparation * 2;
            
            if (route1.routing.priority >= route2.routing.priority) {
                this.adjustParallelRoute(route2, separation, 'below');
            } else {
                this.adjustParallelRoute(route1, separation, 'above');
            }
        });
    }

    /**
     * Ajusta una ruta paralela para evitar solapamiento
     * @param {Object} route - Ruta a ajustar
     * @param {number} separation - Separación deseada
     * @param {string} direction - Dirección del ajuste ('above' o 'below')
     */
    adjustParallelRoute(route, separation, direction) {
        if (!route.path?.controlPoints || route.path.controlPoints.length < 4) return;

        const controlPoints = [...route.path.controlPoints];
        const multiplier = direction === 'above' ? 1 : -1;

        // Ajustar puntos de control intermedios para crear separación
        controlPoints[1].y += separation * multiplier * 0.8;
        controlPoints[2].y += separation * multiplier * 0.8;

        // Recalcular la ruta con los nuevos puntos de control
        route.path.controlPoints = controlPoints;
        route.path.curvature = this.calculateCurvatureFromControlPoints(controlPoints);
        route.path.plotlyPath = this.generatePlotlyPathData(controlPoints);
    }

    /**
     * Resuelve cruces entre flujos primarios
     * @param {Array} routes - Rutas a ajustar
     * @param {Array} conflicts - Conflictos entre flujos primarios
     */
    resolvePrimaryPrimaryCrossings(routes, conflicts) {
        conflicts.forEach(conflict => {
            const route1 = routes[conflict.route1];
            const route2 = routes[conflict.route2];

            // Para flujos primarios, usar estrategia de capas
            if (route1.value > route2.value) {
                this.adjustRouteWithLayering(route2, conflict, 'under');
            } else {
                this.adjustRouteWithLayering(route1, conflict, 'over');
            }
        });
    }

    /**
     * Resuelve cruces entre flujos primarios y secundarios
     * @param {Array} routes - Rutas a ajustar
     * @param {Array} conflicts - Conflictos mixtos
     */
    resolvePrimarySecondaryCrossings(routes, conflicts) {
        conflicts.forEach(conflict => {
            const route1 = routes[conflict.route1];
            const route2 = routes[conflict.route2];

            // Los flujos secundarios se ajustan para evitar los primarios
            const primaryRoute = route1.routing.flowType === 'primary' ? route1 : route2;
            const secondaryRoute = route1.routing.flowType === 'primary' ? route2 : route1;

            this.adjustRouteToAvoidCrossing(secondaryRoute, primaryRoute, conflict);
        });
    }

    /**
     * Resuelve cruces entre flujos secundarios
     * @param {Array} routes - Rutas a ajustar
     * @param {Array} conflicts - Conflictos entre flujos secundarios
     */
    resolveSecondarySecondaryCrossings(routes, conflicts) {
        conflicts.forEach(conflict => {
            const route1 = routes[conflict.route1];
            const route2 = routes[conflict.route2];

            // Para flujos secundarios, usar curvatura adaptativa
            if (route1.routing.priority > route2.routing.priority) {
                this.adjustRouteWithAdaptiveCurvature(route2, conflict);
            } else {
                this.adjustRouteWithAdaptiveCurvature(route1, conflict);
            }
        });
    }

    /**
     * Resuelve cruces genéricos
     * @param {Array} routes - Rutas a ajustar
     * @param {Array} conflicts - Conflictos genéricos
     */
    resolveGenericCrossings(routes, conflicts) {
        conflicts.forEach(conflict => {
            const route1 = routes[conflict.route1];
            const route2 = routes[conflict.route2];

            // Aplicar estrategia basada en prioridad
            if (route1.routing.priority > route2.routing.priority) {
                this.adjustRouteToAvoidCrossing(route2, route1, conflict);
            } else {
                this.adjustRouteToAvoidCrossing(route1, route2, conflict);
            }
        });
    }

    /**
     * Ajusta una ruta usando estrategia de capas
     * @param {Object} route - Ruta a ajustar
     * @param {Object} conflict - Información del conflicto
     * @param {string} layer - Capa ('over' o 'under')
     */
    adjustRouteWithLayering(route, conflict, layer) {
        if (!route.path?.controlPoints) return;

        const controlPoints = [...route.path.controlPoints];
        const layerOffset = this.config.avoidanceRadius * (layer === 'over' ? 1.5 : -1.5);

        // Ajustar altura de la curva según la capa
        const midIndex = Math.floor(controlPoints.length / 2);
        for (let i = 1; i < controlPoints.length - 1; i++) {
            const factor = 1 - Math.abs(i - midIndex) / midIndex;
            controlPoints[i].y += layerOffset * factor;
        }

        // Actualizar ruta
        route.path.controlPoints = controlPoints;
        route.path.curvature = this.calculateCurvatureFromControlPoints(controlPoints);
        route.path.plotlyPath = this.generatePlotlyPathData(controlPoints);

        // Marcar la ruta como ajustada por capas
        route.routing.layerAdjustment = layer;
    }

    /**
     * Ajusta una ruta con curvatura adaptativa
     * @param {Object} route - Ruta a ajustar
     * @param {Object} conflict - Información del conflicto
     */
    adjustRouteWithAdaptiveCurvature(route, conflict) {
        if (!route.path?.controlPoints) return;

        const controlPoints = [...route.path.controlPoints];
        const intersectionT = conflict.parameters?.t1 || 0.5;

        // Calcular ajuste basado en la posición de la intersección
        const curvatureIncrease = this.config.curvature * 0.3;
        const directionMultiplier = intersectionT > 0.5 ? 1 : -1;

        // Ajustar puntos de control para aumentar curvatura localmente
        if (controlPoints.length >= 4) {
            controlPoints[1].y += curvatureIncrease * directionMultiplier;
            controlPoints[2].y += curvatureIncrease * directionMultiplier * 0.8;
        }

        // Actualizar ruta
        route.path.controlPoints = controlPoints;
        route.path.curvature = this.calculateCurvatureFromControlPoints(controlPoints);
        route.path.plotlyPath = this.generatePlotlyPathData(controlPoints);

        // Marcar como ajustada adaptativamente
        route.routing.adaptiveCurvature = true;
    }

    /**
     * Ajusta una ruta para evitar cruzarse con otra (versión mejorada)
     * @param {Object} routeToAdjust - Ruta a ajustar
     * @param {Object} priorityRoute - Ruta con prioridad
     * @param {Object} crossing - Información del cruce
     * @returns {Object} Ruta ajustada
     */
    adjustRouteToAvoidCrossing(routeToAdjust, priorityRoute, crossing) {
        if (!routeToAdjust.path?.controlPoints) return routeToAdjust;

        const adjustedRoute = JSON.parse(JSON.stringify(routeToAdjust)); // Deep copy
        const controlPoints = adjustedRoute.path.controlPoints;

        // Determinar estrategia de ajuste basada en el tipo de cruce
        const adjustmentStrategy = this.selectAdjustmentStrategy(crossing, routeToAdjust, priorityRoute);

        switch (adjustmentStrategy) {
            case 'vertical-offset':
                this.applyVerticalOffset(controlPoints, crossing);
                break;
            case 'curvature-increase':
                this.applyCurvatureIncrease(controlPoints, crossing);
                break;
            case 'path-deviation':
                this.applyPathDeviation(controlPoints, crossing, priorityRoute);
                break;
            default:
                this.applyGenericAdjustment(controlPoints, crossing);
                break;
        }

        // Actualizar datos de la ruta
        adjustedRoute.path.controlPoints = controlPoints;
        adjustedRoute.path.curvature = this.calculateCurvatureFromControlPoints(controlPoints);
        adjustedRoute.path.plotlyPath = this.generatePlotlyPathData(controlPoints);

        // Añadir zona de evitación
        adjustedRoute.routing.avoidanceZones.push({
            center: crossing.point,
            radius: this.config.avoidanceRadius,
            priority: priorityRoute.routing.priority,
            type: crossing.type
        });

        // Registrar el conflicto resuelto
        adjustedRoute.routing.conflicts.push({
            type: 'resolved',
            originalCrossing: crossing,
            strategy: adjustmentStrategy,
            timestamp: Date.now()
        });

        return adjustedRoute;
    }

    /**
     * Selecciona la estrategia de ajuste más apropiada
     * @param {Object} crossing - Información del cruce
     * @param {Object} routeToAdjust - Ruta a ajustar
     * @param {Object} priorityRoute - Ruta con prioridad
     * @returns {string} Estrategia seleccionada
     */
    selectAdjustmentStrategy(crossing, routeToAdjust, priorityRoute) {
        // Estrategia basada en el ángulo de intersección
        if (crossing.angle && crossing.angle < Math.PI / 6) {
            return 'vertical-offset'; // Ángulos pequeños - offset vertical
        }

        // Estrategia basada en la posición de la intersección
        const intersectionT = crossing.parameters?.t1 || 0.5;
        if (intersectionT > 0.3 && intersectionT < 0.7) {
            return 'curvature-increase'; // Intersección en el centro - aumentar curvatura
        }

        // Estrategia basada en la diferencia de prioridades
        const priorityDiff = Math.abs(routeToAdjust.routing.priority - priorityRoute.routing.priority);
        if (priorityDiff > 0.3) {
            return 'path-deviation'; // Gran diferencia de prioridad - desviar ruta
        }

        return 'generic';
    }

    /**
     * Aplica offset vertical a los puntos de control
     * @param {Array} controlPoints - Puntos de control
     * @param {Object} crossing - Información del cruce
     */
    applyVerticalOffset(controlPoints, crossing) {
        const offset = this.config.linkSeparation * 3;
        const direction = crossing.point.y > 0.5 ? -1 : 1;

        for (let i = 1; i < controlPoints.length - 1; i++) {
            controlPoints[i].y += offset * direction;
        }
    }

    /**
     * Aplica aumento de curvatura
     * @param {Array} controlPoints - Puntos de control
     * @param {Object} crossing - Información del cruce
     */
    applyCurvatureIncrease(controlPoints, crossing) {
        const curvatureIncrease = this.config.curvature * 0.5;
        const direction = crossing.point.y > 0.5 ? -1 : 1;

        if (controlPoints.length >= 4) {
            controlPoints[1].y += curvatureIncrease * direction;
            controlPoints[2].y += curvatureIncrease * direction * 0.8;
        }
    }

    /**
     * Aplica desviación de ruta
     * @param {Array} controlPoints - Puntos de control
     * @param {Object} crossing - Información del cruce
     * @param {Object} priorityRoute - Ruta con prioridad
     */
    applyPathDeviation(controlPoints, crossing, priorityRoute) {
        const deviation = this.config.avoidanceRadius * 2;
        const intersectionPoint = crossing.point;

        // Desviar la ruta alrededor del punto de intersección
        for (let i = 1; i < controlPoints.length - 1; i++) {
            const distance = Math.sqrt(
                Math.pow(controlPoints[i].x - intersectionPoint.x, 2) +
                Math.pow(controlPoints[i].y - intersectionPoint.y, 2)
            );

            if (distance < deviation) {
                const angle = Math.atan2(
                    controlPoints[i].y - intersectionPoint.y,
                    controlPoints[i].x - intersectionPoint.x
                );
                
                controlPoints[i].x = intersectionPoint.x + Math.cos(angle) * deviation;
                controlPoints[i].y = intersectionPoint.y + Math.sin(angle) * deviation;
            }
        }
    }

    /**
     * Aplica ajuste genérico
     * @param {Array} controlPoints - Puntos de control
     * @param {Object} crossing - Información del cruce
     */
    applyGenericAdjustment(controlPoints, crossing) {
        const adjustment = this.config.linkSeparation * 2;
        const direction = Math.random() > 0.5 ? 1 : -1;

        for (let i = 1; i < controlPoints.length - 1; i++) {
            controlPoints[i].y += adjustment * direction * (0.5 + Math.random() * 0.5);
        }
    }

    /**
     * Aplica optimizaciones finales para minimizar cruces restantes
     * @param {Array} routes - Rutas ajustadas
     * @param {Array} originalCrossings - Cruces originales
     */
    applyFinalOptimizations(routes, originalCrossings) {
        // Verificar si quedan cruces después de los ajustes
        const remainingCrossings = this.detectCrossings(routes);
        
        if (remainingCrossings.length === 0) {
            console.log('Todos los cruces han sido resueltos exitosamente');
            return;
        }

        // Aplicar optimización global si quedan cruces
        const reductionPercentage = ((originalCrossings.length - remainingCrossings.length) / originalCrossings.length) * 100;
        console.log(`Optimización completada: ${reductionPercentage.toFixed(1)}% de cruces eliminados`);

        // Si quedan muchos cruces, aplicar estrategia de último recurso
        if (remainingCrossings.length > originalCrossings.length * 0.5) {
            this.applyLastResortOptimization(routes, remainingCrossings);
        }
    }

    /**
     * Aplica optimización de último recurso para casos complejos
     * @param {Array} routes - Rutas
     * @param {Array} crossings - Cruces restantes
     */
    applyLastResortOptimization(routes, crossings) {
        console.log('Aplicando optimización de último recurso...');

        // Incrementar separación global
        const originalSeparation = this.config.linkSeparation;
        this.config.linkSeparation *= 1.5;

        // Aplicar separación forzada a rutas problemáticas
        const problematicRoutes = new Set();
        crossings.forEach(crossing => {
            problematicRoutes.add(crossing.route1);
            problematicRoutes.add(crossing.route2);
        });

        problematicRoutes.forEach(routeIndex => {
            const route = routes[routeIndex];
            if (route.path?.controlPoints) {
                this.applyForcedSeparation(route.path.controlPoints, routeIndex);
            }
        });

        // Restaurar configuración original
        this.config.linkSeparation = originalSeparation;
    }

    /**
     * Aplica separación forzada a una ruta
     * @param {Array} controlPoints - Puntos de control
     * @param {number} routeIndex - Índice de la ruta
     */
    applyForcedSeparation(controlPoints, routeIndex) {
        const separationFactor = (routeIndex % 2 === 0 ? 1 : -1) * this.config.linkSeparation * 3;
        
        for (let i = 1; i < controlPoints.length - 1; i++) {
            controlPoints[i].y += separationFactor * (1 + routeIndex * 0.1);
        }
    }

    /**
     * Limpia la caché de rutas
     */
    clearCache() {
        this.routeCache.clear();
        console.log('Caché de rutas limpiada');
    }

    /**
     * Obtiene métricas de rendimiento del sistema
     * @returns {Object} Métricas de rendimiento
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            lastCalculationTime: this.lastCalculationTime,
            cacheSize: this.routeCache.size,
            isCalculating: this.isCalculating,
            config: { ...this.config },
            recommendations: this.generatePerformanceRecommendations()
        };
    }

    /**
     * Genera recomendaciones de rendimiento basadas en métricas actuales
     * @returns {Array} Lista de recomendaciones
     */
    generatePerformanceRecommendations() {
        const recommendations = [];
        const metrics = this.performanceMetrics;
        const avgTime = metrics.averageCalculationTime || 0;
        const threshold = this.config.fallbackThreshold;

        // Recomendaciones basadas en tiempo promedio
        if (avgTime > threshold * 0.8) {
            recommendations.push({
                type: 'performance',
                severity: 'high',
                message: 'Considere reducir maxIterations o habilitar earlyTermination',
                action: 'optimize_iterations'
            });
        }

        // Recomendaciones basadas en uso de caché
        const cacheHitRate = metrics.cacheHitRate / Math.max(metrics.totalCalculations, 1);
        if (cacheHitRate < 0.3 && metrics.totalCalculations > 10) {
            recommendations.push({
                type: 'cache',
                severity: 'medium',
                message: 'Baja tasa de aciertos de caché. Considere ajustar parámetros de configuración',
                action: 'review_config_stability'
            });
        }

        // Recomendaciones basadas en uso de fallback
        if (metrics.fallbackUsage > metrics.totalCalculations * 0.2) {
            recommendations.push({
                type: 'stability',
                severity: 'high',
                message: 'Alto uso de fallback. Considere ajustar configuración para mayor estabilidad',
                action: 'stabilize_config'
            });
        }

        return recommendations;
    }

    /**
     * Aplica recomendaciones de rendimiento automáticamente
     * @param {Array} recommendations - Recomendaciones a aplicar (opcional)
     * @returns {Object} Resultado de la aplicación
     */
    applyPerformanceRecommendations(recommendations = null) {
        const recs = recommendations || this.generatePerformanceRecommendations();
        const appliedActions = [];
        const configUpdates = {};

        recs.forEach(rec => {
            switch (rec.action) {
                case 'optimize_iterations':
                    configUpdates.maxIterations = Math.max(20, Math.floor(this.config.maxIterations * 0.8));
                    configUpdates.earlyTermination = true;
                    appliedActions.push('Reduced iterations and enabled early termination');
                    break;

                case 'review_config_stability':
                    // No cambios automáticos, solo logging
                    appliedActions.push('Configuration stability review recommended');
                    break;

                case 'stabilize_config':
                    configUpdates.adaptiveCurvature = false;
                    configUpdates.smartAvoidance = false;
                    configUpdates.performanceMode = 'balanced';
                    appliedActions.push('Disabled adaptive features for stability');
                    break;
            }
        });

        if (Object.keys(configUpdates).length > 0) {
            const result = this.updateConfig(configUpdates);
            return { applied: appliedActions, configResult: result };
        }

        return { applied: appliedActions, configResult: { updated: false } };
    }

    /**
     * Controles de usuario para ajuste dinámico de parámetros
     */

    /**
     * Ajusta la calidad visual del routing
     * @param {string} quality - 'fast', 'balanced', 'high'
     * @returns {Object} Resultado del ajuste
     */
    setVisualQuality(quality) {
        const qualitySettings = {
            fast: {
                visualQuality: 'fast',
                performanceMode: 'fast',
                smoothness: 0.4,
                precision: 0.02,
                maxIterations: 25
            },
            balanced: {
                visualQuality: 'balanced',
                performanceMode: 'balanced',
                smoothness: 0.7,
                precision: 0.01,
                maxIterations: 50
            },
            high: {
                visualQuality: 'high',
                performanceMode: 'quality',
                smoothness: 0.9,
                precision: 0.005,
                maxIterations: 100
            }
        };

        const settings = qualitySettings[quality];
        if (!settings) {
            return { success: false, error: 'Invalid quality setting' };
        }

        const result = this.updateConfig(settings);
        return { success: result.updated, quality, settings, result };
    }

    /**
     * Habilita o deshabilita características adaptativas
     * @param {boolean} enabled - Estado de las características adaptativas
     * @returns {Object} Resultado del ajuste
     */
    setAdaptiveFeatures(enabled) {
        const updates = {
            adaptiveCurvature: enabled,
            adaptiveSeparation: enabled,
            smartAvoidance: enabled,
            progressiveOptimization: enabled
        };

        const result = this.updateConfig(updates);
        return { success: result.updated, enabled, result };
    }

    /**
     * Configura el balance entre rendimiento y calidad
     * @param {number} balance - 0 (máximo rendimiento) a 1 (máxima calidad)
     * @returns {Object} Resultado del ajuste
     */
    setPerformanceQualityBalance(balance) {
        if (balance < 0 || balance > 1) {
            return { success: false, error: 'Balance must be between 0 and 1' };
        }

        // Interpolar configuraciones basadas en el balance
        const updates = {
            maxIterations: Math.floor(20 + balance * 80), // 20-100
            precision: 0.02 - balance * 0.015, // 0.02-0.005
            smoothness: 0.4 + balance * 0.5, // 0.4-0.9
            maxCalculationTime: 200 + balance * 800, // 200-1000ms
            adaptiveCurvature: balance > 0.3,
            smartAvoidance: balance > 0.5
        };

        const result = this.updateConfig(updates);
        return { success: result.updated, balance, updates, result };
    }

    /**
     * Resetea la configuración a valores por defecto
     * @returns {Object} Resultado del reset
     */
    resetToDefaults() {
        const defaultConfig = {
            curvature: 0.3,
            linkSeparation: 0.02,
            avoidanceRadius: 0.05,
            performanceMode: 'balanced',
            visualQuality: 'balanced',
            maxIterations: 50,
            maxCalculationTime: 500,
            adaptiveCurvature: true,
            adaptiveSeparation: true,
            smartAvoidance: true,
            earlyTermination: true,
            autoOptimization: true
        };

        this.clearCache();
        const result = this.updateConfig(defaultConfig, { forceUpdate: true });
        return { success: result.updated, result };
    }

    /**
     * Exporta la configuración actual
     * @returns {Object} Configuración actual
     */
    exportConfiguration() {
        return {
            config: { ...this.config },
            metrics: this.getPerformanceMetrics(),
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    /**
     * Importa una configuración
     * @param {Object} configData - Datos de configuración a importar
     * @returns {Object} Resultado de la importación
     */
    importConfiguration(configData) {
        try {
            if (!configData.config) {
                return { success: false, error: 'Invalid configuration data' };
            }

            const result = this.updateConfig(configData.config, { forceUpdate: true });
            return { 
                success: result.updated, 
                imported: configData.timestamp || 'unknown',
                result 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Verifica si el sistema está listo para calcular rutas
     * @returns {boolean} True si está listo
     */
    isReady() {
        return !this.isCalculating && 
               this.nodeHierarchyMapper !== null && 
               this.routeCalculator !== null;
    }

    /**
     * Reinicia el sistema de enrutamiento
     */
    reset() {
        this.clearCache();
        this.isCalculating = false;
        this.performanceMetrics = {
            totalCalculations: 0,
            averageCalculationTime: 0,
            cacheHitRate: 0,
            crossingReduction: 0
        };
        console.log('LinkRoutingManager reiniciado');
    }

    // ===== MÉTODOS PARA INTEGRACIÓN CON CONTROLES DE USUARIO =====

    /**
     * Obtiene el esquema de configuración para generar controles de UI
     * @returns {Object} Esquema de configuración con metadatos para UI
     */
    getConfigurationSchema() {
        return {
            enableRouting: {
                type: 'boolean',
                default: true,
                label: 'Habilitar Enrutamiento Inteligente',
                description: 'Activa el sistema de enrutamiento optimizado de enlaces',
                category: 'general'
            },
            curvature: {
                type: 'range',
                min: 0,
                max: 1,
                step: 0.05,
                default: 0.3,
                label: 'Curvatura',
                description: 'Controla la curvatura de los enlaces (0 = recto, 1 = muy curvo)',
                category: 'visual',
                realtime: true
            },
            linkSeparation: {
                type: 'range',
                min: 0,
                max: 0.2,
                step: 0.005,
                default: 0.02,
                label: 'Separación de Enlaces',
                description: 'Distancia mínima entre enlaces paralelos',
                category: 'visual',
                realtime: true
            },
            avoidanceRadius: {
                type: 'range',
                min: 0,
                max: 0.3,
                step: 0.01,
                default: 0.05,
                label: 'Radio de Evitación',
                description: 'Distancia de evitación alrededor de nodos y obstáculos',
                category: 'collision',
                realtime: true
            },
            routingAlgorithm: {
                type: 'select',
                options: [
                    { value: 'bezier-optimized', label: 'Bézier Optimizado' },
                    { value: 'spline-smooth', label: 'Spline Suave' },
                    { value: 'arc-minimal', label: 'Arco Mínimo' },
                    { value: 'simple-curve', label: 'Curva Simple' }
                ],
                default: 'bezier-optimized',
                label: 'Algoritmo de Enrutamiento',
                description: 'Algoritmo utilizado para calcular las rutas',
                category: 'algorithm'
            },
            performanceMode: {
                type: 'select',
                options: [
                    { value: 'fast', label: 'Rápido' },
                    { value: 'balanced', label: 'Balanceado' },
                    { value: 'quality', label: 'Calidad' }
                ],
                default: 'balanced',
                label: 'Modo de Rendimiento',
                description: 'Balance entre velocidad y calidad del enrutamiento',
                category: 'performance'
            },
            visualQuality: {
                type: 'select',
                options: [
                    { value: 'fast', label: 'Rápida' },
                    { value: 'balanced', label: 'Balanceada' },
                    { value: 'high', label: 'Alta' }
                ],
                default: 'balanced',
                label: 'Calidad Visual',
                description: 'Nivel de detalle y suavidad de las curvas',
                category: 'visual'
            },
            maxCalculationTime: {
                type: 'range',
                min: 100,
                max: 2000,
                step: 50,
                default: 500,
                label: 'Tiempo Máximo de Cálculo (ms)',
                description: 'Tiempo límite antes de usar fallback',
                category: 'performance'
            },
            adaptiveCurvature: {
                type: 'boolean',
                default: true,
                label: 'Curvatura Adaptiva',
                description: 'Ajusta automáticamente la curvatura según la densidad',
                category: 'advanced'
            },
            smartAvoidance: {
                type: 'boolean',
                default: true,
                label: 'Evitación Inteligente',
                description: 'Usa algoritmos avanzados para evitar colisiones',
                category: 'advanced'
            },
            performanceMonitoring: {
                type: 'boolean',
                default: false,
                label: 'Monitoreo de Rendimiento',
                description: 'Registra métricas detalladas de rendimiento',
                category: 'debug'
            },
            autoOptimization: {
                type: 'boolean',
                default: false,
                label: 'Auto-optimización',
                description: 'Ajusta automáticamente la configuración para mejor rendimiento',
                category: 'advanced'
            }
        };
    }

    /**
     * Obtiene los valores por defecto de configuración
     * @returns {Object} Configuración por defecto
     */
    getConfigurationDefaults() {
        const schema = this.getConfigurationSchema();
        const defaults = {};
        
        Object.keys(schema).forEach(key => {
            defaults[key] = schema[key].default;
        });
        
        return defaults;
    }

    /**
     * Valida un valor de configuración específico según su esquema
     * @param {string} key - Clave de configuración
     * @param {*} value - Valor a validar
     * @returns {Object} Resultado de validación
     */
    validateConfigurationValue(key, value) {
        const schema = this.getConfigurationSchema();
        const fieldSchema = schema[key];
        
        if (!fieldSchema) {
            return { valid: false, error: `Campo de configuración desconocido: ${key}` };
        }

        switch (fieldSchema.type) {
            case 'boolean':
                if (typeof value !== 'boolean') {
                    return { valid: false, error: 'Debe ser un valor booleano' };
                }
                break;
                
            case 'range':
                if (typeof value !== 'number') {
                    return { valid: false, error: 'Debe ser un número' };
                }
                if (value < fieldSchema.min || value > fieldSchema.max) {
                    return { 
                        valid: false, 
                        error: `Debe estar entre ${fieldSchema.min} y ${fieldSchema.max}` 
                    };
                }
                break;
                
            case 'select':
                const validValues = fieldSchema.options.map(opt => opt.value);
                if (!validValues.includes(value)) {
                    return { 
                        valid: false, 
                        error: `Debe ser uno de: ${validValues.join(', ')}` 
                    };
                }
                break;
        }

        return { valid: true, value };
    }

    /**
     * Actualiza configuración desde controles de UI
     * @param {string} key - Clave de configuración
     * @param {*} value - Nuevo valor
     * @param {Object} options - Opciones de actualización
     * @returns {Object} Resultado de la actualización
     */
    updateConfigFromUI(key, value, options = {}) {
        const { realtime = false, validate = true } = options;
        
        // Validar el valor si se solicita
        if (validate) {
            const validation = this.validateConfigurationValue(key, value);
            if (!validation.valid) {
                console.error(`Error de validación para ${key}:`, validation.error);
                return { success: false, error: validation.error };
            }
        }

        // Determinar si es una actualización en tiempo real
        const schema = this.getConfigurationSchema();
        const isRealtimeField = schema[key]?.realtime === true;
        
        if (realtime && !isRealtimeField) {
            // Solo almacenar el cambio para aplicar después
            this.pendingConfigChanges = this.pendingConfigChanges || {};
            this.pendingConfigChanges[key] = value;
            return { success: true, pending: true };
        }

        // Aplicar el cambio inmediatamente
        const updateResult = this.updateConfig({ [key]: value });
        
        if (updateResult.updated) {
            console.log(`Configuración actualizada desde UI: ${key} = ${value}`);
            
            // Disparar evento personalizado para notificar cambios
            this.dispatchConfigurationChange(key, value, updateResult.previous[key]);
            
            return { success: true, result: updateResult };
        } else {
            return { success: false, error: updateResult.error || 'No se pudo actualizar' };
        }
    }

    /**
     * Aplica cambios de configuración pendientes
     * @returns {Object} Resultado de la aplicación
     */
    applyPendingConfigChanges() {
        if (!this.pendingConfigChanges || Object.keys(this.pendingConfigChanges).length === 0) {
            return { success: true, applied: 0 };
        }

        const result = this.updateConfig(this.pendingConfigChanges);
        const appliedCount = Object.keys(this.pendingConfigChanges).length;
        
        // Limpiar cambios pendientes
        this.pendingConfigChanges = {};
        
        console.log(`Aplicados ${appliedCount} cambios de configuración pendientes`);
        return { success: result.updated, applied: appliedCount, result };
    }

    /**
     * Dispara evento personalizado cuando cambia la configuración
     * @param {string} key - Clave que cambió
     * @param {*} newValue - Nuevo valor
     * @param {*} oldValue - Valor anterior
     */
    dispatchConfigurationChange(key, newValue, oldValue) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent('linkRoutingConfigChanged', {
                detail: {
                    key,
                    newValue,
                    oldValue,
                    timestamp: Date.now(),
                    manager: this
                }
            });
            window.dispatchEvent(event);
        }
    }

    /**
     * Crea controles de UI para la configuración
     * @param {HTMLElement} container - Contenedor donde crear los controles
     * @param {Object} options - Opciones de creación
     * @returns {Object} Referencias a los controles creados
     */
    createConfigurationUI(container, options = {}) {
        const { 
            categories = ['general', 'visual', 'performance'], 
            realtime = true,
            showAdvanced = false,
            showDebug = false 
        } = options;

        const schema = this.getConfigurationSchema();
        const controls = {};
        
        // Limpiar contenedor
        container.innerHTML = '';
        
        // Crear secciones por categoría
        categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = `routing-config-category routing-config-${category}`;
            
            const categoryTitle = document.createElement('h4');
            categoryTitle.textContent = this.getCategoryTitle(category);
            categoryTitle.className = 'routing-config-category-title';
            categoryDiv.appendChild(categoryTitle);
            
            // Filtrar campos por categoría
            const categoryFields = Object.keys(schema).filter(key => {
                const field = schema[key];
                if (field.category !== category) return false;
                if (field.category === 'advanced' && !showAdvanced) return false;
                if (field.category === 'debug' && !showDebug) return false;
                return true;
            });
            
            // Crear controles para cada campo
            categoryFields.forEach(key => {
                const field = schema[key];
                const controlGroup = this.createFieldControl(key, field, realtime);
                categoryDiv.appendChild(controlGroup);
                controls[key] = controlGroup.querySelector('input, select');
            });
            
            if (categoryFields.length > 0) {
                container.appendChild(categoryDiv);
            }
        });
        
        // Añadir botones de acción
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'routing-config-actions';
        
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Restablecer Valores por Defecto';
        resetButton.className = 'routing-config-btn routing-config-reset';
        resetButton.onclick = () => this.resetToDefaults();
        
        const applyButton = document.createElement('button');
        applyButton.textContent = 'Aplicar Cambios';
        applyButton.className = 'routing-config-btn routing-config-apply';
        applyButton.onclick = () => this.applyPendingConfigChanges();
        
        actionsDiv.appendChild(resetButton);
        actionsDiv.appendChild(applyButton);
        container.appendChild(actionsDiv);
        
        return controls;
    }

    /**
     * Crea un control individual para un campo de configuración
     * @param {string} key - Clave del campo
     * @param {Object} field - Esquema del campo
     * @param {boolean} realtime - Si debe actualizar en tiempo real
     * @returns {HTMLElement} Elemento del control
     */
    createFieldControl(key, field, realtime) {
        const controlGroup = document.createElement('div');
        controlGroup.className = 'routing-config-field';
        
        const label = document.createElement('label');
        label.textContent = field.label;
        label.className = 'routing-config-label';
        label.setAttribute('for', `routing-${key}`);
        
        let control;
        const currentValue = this.config[key];
        
        switch (field.type) {
            case 'boolean':
                control = document.createElement('input');
                control.type = 'checkbox';
                control.checked = currentValue;
                control.onchange = (e) => {
                    this.updateConfigFromUI(key, e.target.checked, { realtime });
                };
                break;
                
            case 'range':
                const rangeContainer = document.createElement('div');
                rangeContainer.className = 'routing-config-range-container';
                
                control = document.createElement('input');
                control.type = 'range';
                control.min = field.min;
                control.max = field.max;
                control.step = field.step;
                control.value = currentValue;
                
                const valueDisplay = document.createElement('span');
                valueDisplay.className = 'routing-config-range-value';
                valueDisplay.textContent = currentValue;
                
                control.oninput = (e) => {
                    const value = parseFloat(e.target.value);
                    valueDisplay.textContent = value;
                    if (realtime && field.realtime) {
                        this.updateConfigFromUI(key, value, { realtime: true });
                    }
                };
                
                control.onchange = (e) => {
                    const value = parseFloat(e.target.value);
                    this.updateConfigFromUI(key, value, { realtime: false });
                };
                
                rangeContainer.appendChild(control);
                rangeContainer.appendChild(valueDisplay);
                control = rangeContainer;
                break;
                
            case 'select':
                control = document.createElement('select');
                field.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.label;
                    optionElement.selected = option.value === currentValue;
                    control.appendChild(optionElement);
                });
                
                control.onchange = (e) => {
                    this.updateConfigFromUI(key, e.target.value, { realtime });
                };
                break;
        }
        
        control.id = `routing-${key}`;
        control.className = 'routing-config-control';
        
        // Añadir descripción si existe
        if (field.description) {
            const description = document.createElement('small');
            description.textContent = field.description;
            description.className = 'routing-config-description';
            controlGroup.appendChild(label);
            controlGroup.appendChild(control);
            controlGroup.appendChild(description);
        } else {
            controlGroup.appendChild(label);
            controlGroup.appendChild(control);
        }
        
        return controlGroup;
    }

    /**
     * Obtiene el título de una categoría
     * @param {string} category - Categoría
     * @returns {string} Título de la categoría
     */
    getCategoryTitle(category) {
        const titles = {
            general: 'Configuración General',
            visual: 'Apariencia Visual',
            collision: 'Detección de Colisiones',
            algorithm: 'Algoritmo',
            performance: 'Rendimiento',
            advanced: 'Configuración Avanzada',
            debug: 'Depuración'
        };
        return titles[category] || category;
    }

    /**
     * Restablece la configuración a valores por defecto
     * @returns {Object} Resultado del restablecimiento
     */
    resetToDefaults() {
        const defaults = this.getConfigurationDefaults();
        const result = this.updateConfig(defaults, { forceUpdate: true });
        
        if (result.updated) {
            console.log('Configuración restablecida a valores por defecto');
            this.dispatchConfigurationChange('*', defaults, result.previous);
        }
        
        return result;
    }

    /**
     * Obtiene métricas de calidad de enrutamiento para mostrar al usuario
     * @returns {Object} Métricas de calidad
     */
    getRoutingQualityMetrics() {
        const metrics = this.getPerformanceMetrics();
        
        return {
            // Métricas de rendimiento
            averageCalculationTime: Math.round(metrics.averageCalculationTime || 0),
            lastCalculationTime: Math.round(this.lastCalculationTime || 0),
            totalCalculations: metrics.totalCalculations || 0,
            
            // Métricas de calidad
            crossingReduction: Math.round((metrics.crossingReduction || 0) * 100),
            cacheHitRate: Math.round((metrics.cacheHitRate || 0) * 100),
            
            // Estado del sistema
            routingEnabled: this.config.enableRouting,
            currentAlgorithm: this.config.routingAlgorithm,
            performanceMode: this.config.performanceMode,
            
            // Métricas avanzadas (si están disponibles)
            fallbackUsage: metrics.fallbackUsage || 0,
            autoOptimizations: metrics.autoOptimizations || 0,
            
            // Percentiles de rendimiento
            percentiles: metrics.percentiles || null
        };
    }
}

/**
 * NodeHierarchyMapper - Mapea relaciones jerárquicas entre nodos
 * 
 * Esta clase analiza las relaciones entre nodos basándose en los datos del DataManager
 * y clasifica los tipos de flujo para optimizar el enrutamiento de enlaces.
 */
class NodeHierarchyMapper {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.hierarchyCache = new Map();
        
        // Configuración de tipos de nodos basada en la estructura de datos
        this.nodeTypePatterns = {
            source: ['Producción', 'Importación'],
            transformation: ['Transformación', 'Refinación', 'Generación'],
            distribution: ['Distribución', 'Transporte'],
            consumption: ['Consumo', 'Usos Finales', 'Exportación', 'Consumo Propio']
        };

        // Configuración de umbrales para clasificación de flujos
        this.flowThresholds = {
            primary: 500,    // PJ - Flujos principales de energía primaria
            secondary: 100,  // PJ - Flujos de energía secundaria
            transformation: 50, // PJ - Flujos de transformación
            distribution: 10    // PJ - Flujos de distribución
        };

        console.log('NodeHierarchyMapper inicializado con DataManager');
    }

    /**
     * Mapea la jerarquía de nodos basada en los datos del DataManager
     * @param {Array} nodes - Array de nodos del diagrama Sankey
     * @param {Array} links - Array de enlaces del diagrama Sankey
     * @returns {Promise<Map>} Mapa de jerarquía con información detallada de cada nodo
     */
    async mapHierarchy(nodes, links) {
        const cacheKey = this.generateHierarchyCacheKey(nodes, links);
        
        if (this.hierarchyCache.has(cacheKey)) {
            console.log('Jerarquía obtenida de caché');
            return this.hierarchyCache.get(cacheKey);
        }

        console.log('Calculando nueva jerarquía de nodos...');
        const hierarchy = new Map();

        // Analizar cada nodo con información del DataManager
        nodes.forEach((node, index) => {
            const nodeInfo = this.analyzeNode(node, index, nodes, links);
            hierarchy.set(index, nodeInfo);
        });

        // Enriquecer con análisis de relaciones
        this.enrichWithRelationshipAnalysis(hierarchy, links);

        // Validar y optimizar la jerarquía
        this.validateHierarchy(hierarchy);

        this.hierarchyCache.set(cacheKey, hierarchy);
        console.log(`Jerarquía calculada para ${hierarchy.size} nodos`);
        
        return hierarchy;
    }

    /**
     * Analiza un nodo individual y extrae información detallada
     * @param {Object} node - Nodo a analizar
     * @param {number} index - Índice del nodo
     * @param {Array} nodes - Todos los nodos
     * @param {Array} links - Todos los enlaces
     * @returns {Object} Información detallada del nodo
     */
    analyzeNode(node, index, nodes, links) {
        const nodeName = this.extractNodeName(node);
        const nodeData = this.getNodeDataFromDataManager(nodeName);
        
        return {
            index: index,
            name: nodeName,
            originalName: node.name || nodeName,
            type: this.detectNodeType(node, links, nodeData),
            level: this.calculateNodeLevel(node, links, nodeData),
            column: this.detectNodeColumn(node),
            
            // Relaciones básicas
            parents: this.findParentNodes(index, links),
            children: this.findChildNodes(index, links),
            
            // Análisis de flujos
            incomingFlows: this.getIncomingFlows(index, links, nodes),
            outgoingFlows: this.getOutgoingFlows(index, links, nodes),
            
            // Información espacial
            position: { x: node.x || 0, y: node.y || 0 },
            bounds: this.calculateNodeBounds(node),
            
            // Metadatos del DataManager
            dataManagerInfo: nodeData,
            energyType: this.determineEnergyType(nodeData),
            isEnergeticPrimary: this.isEnergeticPrimary(nodeData),
            isEnergeticSecondary: this.isEnergeticSecondary(nodeData),
            
            // Métricas de conectividad
            connectivity: {
                inDegree: this.findParentNodes(index, links).length,
                outDegree: this.findChildNodes(index, links).length,
                totalFlow: this.calculateTotalNodeFlow(index, links)
            }
        };
    }

    /**
     * Extrae el nombre limpio del nodo removiendo etiquetas HTML y valores
     * @param {Object} node - Nodo del diagrama
     * @returns {string} Nombre limpio del nodo
     */
    extractNodeName(node) {
        if (!node) return 'unknown_node';
        if (!node.name) return `node_${node.index || 0}`;
        
        // Remover etiquetas HTML y valores en PJ
        return node.name
            .split('<br>')[0]  // Tomar solo la primera línea
            .trim()
            .replace(/\s+\d+[\.,]\d*\s*PJ$/, ''); // Remover valores en PJ al final
    }

    /**
     * Obtiene datos del nodo desde el DataManager
     * @param {string} nodeName - Nombre del nodo
     * @returns {Object|null} Datos del nodo o null si no se encuentra
     */
    getNodeDataFromDataManager(nodeName) {
        if (!this.dataManager || typeof this.dataManager.getNodeData !== 'function') {
            return null;
        }

        try {
            return this.dataManager.getNodeData(nodeName);
        } catch (error) {
            console.warn(`No se pudieron obtener datos para el nodo: ${nodeName}`, error);
            return null;
        }
    }

    /**
     * Detecta el tipo de nodo basado en su posición, conexiones y datos del DataManager
     * @param {Object} node - Nodo a analizar
     * @param {Array} links - Enlaces del diagrama
     * @param {Object} nodeData - Datos del nodo desde DataManager
     * @returns {string} Tipo de nodo
     */
    detectNodeType(node, links, nodeData) {
        const nodeName = this.extractNodeName(node);
        
        // Usar datos del DataManager si están disponibles
        if (nodeData) {
            for (const [type, patterns] of Object.entries(this.nodeTypePatterns)) {
                if (patterns.some(pattern => nodeName.includes(pattern))) {
                    return type;
                }
            }
        }

        // Análisis basado en posición y conectividad
        const inDegree = this.findParentNodes(node.index || 0, links).length;
        const outDegree = this.findChildNodes(node.index || 0, links).length;
        const x = node.x || 0;

        // Nodos fuente: sin padres, en la izquierda
        if (inDegree === 0 && x < 0.3) return 'source';
        
        // Nodos de consumo: sin hijos, en la derecha
        if (outDegree === 0 && x > 0.7) return 'consumption';
        
        // Nodos de transformación: en el centro con muchas conexiones
        if (x > 0.3 && x < 0.7 && (inDegree > 1 || outDegree > 1)) return 'transformation';
        
        // Por defecto, distribución
        return 'distribution';
    }

    /**
     * Calcula el nivel jerárquico de un nodo
     * @param {Object} node - Nodo a analizar
     * @param {Array} links - Enlaces del diagrama
     * @param {Object} nodeData - Datos del nodo desde DataManager
     * @returns {number} Nivel jerárquico (0-10)
     */
    calculateNodeLevel(node, links, nodeData) {
        // Nivel basado en posición X (0-10)
        const positionLevel = Math.floor((node.x || 0) * 10);
        
        // Ajustar nivel basado en tipo de energía
        if (nodeData) {
            if (this.isEnergeticPrimary(nodeData)) return Math.max(0, positionLevel - 1);
            if (this.isEnergeticSecondary(nodeData)) return Math.min(10, positionLevel + 1);
        }
        
        return positionLevel;
    }

    /**
     * Detecta la columna del nodo en el diagrama
     * @param {Object} node - Nodo a analizar
     * @returns {number} Número de columna (0-4)
     */
    detectNodeColumn(node) {
        return Math.floor((node.x || 0) * 5);
    }

    /**
     * Encuentra nodos padre de un nodo dado
     * @param {number} nodeIndex - Índice del nodo
     * @param {Array} links - Enlaces del diagrama
     * @returns {Array} Índices de nodos padre
     */
    findParentNodes(nodeIndex, links) {
        return links
            .filter(link => link.target === nodeIndex)
            .map(link => link.source)
            .filter((source, index, arr) => arr.indexOf(source) === index); // Remover duplicados
    }

    /**
     * Encuentra nodos hijo de un nodo dado
     * @param {number} nodeIndex - Índice del nodo
     * @param {Array} links - Enlaces del diagrama
     * @returns {Array} Índices de nodos hijo
     */
    findChildNodes(nodeIndex, links) {
        return links
            .filter(link => link.source === nodeIndex)
            .map(link => link.target)
            .filter((target, index, arr) => arr.indexOf(target) === index); // Remover duplicados
    }

    /**
     * Obtiene flujos entrantes a un nodo con análisis detallado
     * @param {number} nodeIndex - Índice del nodo
     * @param {Array} links - Enlaces del diagrama
     * @param {Array} nodes - Nodos del diagrama
     * @returns {Array} Flujos entrantes con clasificación
     */
    getIncomingFlows(nodeIndex, links, nodes) {
        return links
            .filter(link => link.target === nodeIndex)
            .map(link => {
                const sourceNode = nodes[link.source];
                const targetNode = nodes[nodeIndex];
                const flowValue = this.extractFlowValue(link);
                
                // Verificar que los nodos existan
                if (!sourceNode || !targetNode) {
                    console.warn(`Nodo no encontrado: source=${link.source}, target=${nodeIndex}`);
                    return null;
                }
                
                return {
                    source: link.source,
                    sourceName: this.extractNodeName(sourceNode),
                    value: flowValue,
                    originalValue: link.value,
                    type: this.classifyFlowType(link, sourceNode, targetNode),
                    priority: this.calculateFlowPriority(flowValue, link, sourceNode, targetNode),
                    color: link.color
                };
            })
            .filter(flow => flow !== null) // Remover flujos nulos
            .sort((a, b) => b.priority - a.priority); // Ordenar por prioridad
    }

    /**
     * Obtiene flujos salientes de un nodo con análisis detallado
     * @param {number} nodeIndex - Índice del nodo
     * @param {Array} links - Enlaces del diagrama
     * @param {Array} nodes - Nodos del diagrama
     * @returns {Array} Flujos salientes con clasificación
     */
    getOutgoingFlows(nodeIndex, links, nodes) {
        return links
            .filter(link => link.source === nodeIndex)
            .map(link => {
                const sourceNode = nodes[nodeIndex];
                const targetNode = nodes[link.target];
                const flowValue = this.extractFlowValue(link);
                
                // Verificar que los nodos existan
                if (!sourceNode || !targetNode) {
                    console.warn(`Nodo no encontrado: source=${nodeIndex}, target=${link.target}`);
                    return null;
                }
                
                return {
                    target: link.target,
                    targetName: this.extractNodeName(targetNode),
                    value: flowValue,
                    originalValue: link.value,
                    type: this.classifyFlowType(link, sourceNode, targetNode),
                    priority: this.calculateFlowPriority(flowValue, link, sourceNode, targetNode),
                    color: link.color
                };
            })
            .filter(flow => flow !== null) // Remover flujos nulos
            .sort((a, b) => b.priority - a.priority); // Ordenar por prioridad
    }

    /**
     * Extrae el valor real del flujo desde el enlace
     * @param {Object} link - Enlace del diagrama
     * @returns {number} Valor real del flujo
     */
    extractFlowValue(link) {
        // El valor en el enlace puede estar escalado logarítmicamente
        // Intentar extraer el valor real desde customdata si está disponible
        if (link.customdata && typeof link.customdata === 'string') {
            const match = link.customdata.match(/(\d+[\.,]\d*)\s*PJ/);
            if (match) {
                return parseFloat(match[1].replace(',', '.'));
            }
        }
        
        // Si no hay customdata, usar el valor del enlace (puede estar escalado)
        return link.value || 0;
    }

    /**
     * Clasifica el tipo de flujo de un enlace basado en nodos origen y destino
     * @param {Object} link - Enlace a clasificar
     * @param {Object} sourceNode - Nodo origen
     * @param {Object} targetNode - Nodo destino
     * @returns {string} Tipo de flujo
     */
    classifyFlowType(link, sourceNode, targetNode) {
        const flowValue = this.extractFlowValue(link);
        const sourceName = this.extractNodeName(sourceNode);
        const targetName = this.extractNodeName(targetNode);

        // Clasificación basada en nombres de nodos
        if (sourceName.includes('Producción') || sourceName.includes('Importación')) {
            return 'primary';
        }
        
        if (targetName.includes('Transformación') || targetName.includes('Refinación')) {
            return 'transformation';
        }
        
        if (targetName.includes('Consumo') || targetName.includes('Exportación')) {
            return 'secondary';
        }

        // Clasificación basada en valor del flujo
        if (flowValue >= this.flowThresholds.primary) return 'primary';
        if (flowValue >= this.flowThresholds.secondary) return 'secondary';
        if (flowValue >= this.flowThresholds.transformation) return 'transformation';
        
        return 'distribution';
    }

    /**
     * Calcula la prioridad de un flujo para el enrutamiento
     * @param {number} flowValue - Valor del flujo
     * @param {Object} link - Enlace
     * @returns {number} Prioridad (0-1)
     */
    calculateFlowPriority(flowValue, link, sourceNode = null, targetNode = null) {
        // Prioridad basada en valor del flujo (normalizada)
        const maxValue = 3000; // Valor máximo esperado en PJ
        const valuePriority = Math.min(flowValue / maxValue, 1);
        
        // Ajustar prioridad basada en tipo de flujo
        let flowType = 'distribution'; // Valor por defecto
        if (sourceNode && targetNode) {
            flowType = this.classifyFlowType(link, sourceNode, targetNode);
        } else {
            // Clasificación simplificada basada solo en valor
            if (flowValue >= this.flowThresholds.primary) flowType = 'primary';
            else if (flowValue >= this.flowThresholds.secondary) flowType = 'secondary';
            else if (flowValue >= this.flowThresholds.transformation) flowType = 'transformation';
        }
        
        const typeMultiplier = {
            'primary': 1.0,
            'secondary': 0.8,
            'transformation': 0.6,
            'distribution': 0.4
        };
        
        return valuePriority * (typeMultiplier[flowType] || 0.5);
    }

    /**
     * Determina el tipo de energía del nodo
     * @param {Object} nodeData - Datos del nodo desde DataManager
     * @returns {string} Tipo de energía
     */
    determineEnergyType(nodeData) {
        if (!nodeData) return 'unknown';
        
        if (nodeData['Nodos Hijo']) {
            const children = nodeData['Nodos Hijo'];
            if (children.some(child => child.tipo === 'Energía Primaria')) {
                return 'primary';
            }
            if (children.some(child => child.tipo === 'Energía Secundaria')) {
                return 'secondary';
            }
        }
        
        return 'mixed';
    }

    /**
     * Verifica si el nodo es de energía primaria
     * @param {Object} nodeData - Datos del nodo desde DataManager
     * @returns {boolean} True si es energía primaria
     */
    isEnergeticPrimary(nodeData) {
        if (!nodeData) return false;
        return nodeData.tipo === 'Energía Primaria' || 
               (nodeData['Nodos Hijo'] && 
                nodeData['Nodos Hijo'].some(child => child.tipo === 'Energía Primaria'));
    }

    /**
     * Verifica si el nodo es de energía secundaria
     * @param {Object} nodeData - Datos del nodo desde DataManager
     * @returns {boolean} True si es energía secundaria
     */
    isEnergeticSecondary(nodeData) {
        if (!nodeData) return false;
        return nodeData.tipo === 'Energía Secundaria' || 
               (nodeData['Nodos Hijo'] && 
                nodeData['Nodos Hijo'].some(child => child.tipo === 'Energía Secundaria'));
    }

    /**
     * Calcula el flujo total de un nodo
     * @param {number} nodeIndex - Índice del nodo
     * @param {Array} links - Enlaces del diagrama
     * @returns {number} Flujo total
     */
    calculateTotalNodeFlow(nodeIndex, links) {
        const incomingFlow = links
            .filter(link => link.target === nodeIndex)
            .reduce((sum, link) => sum + this.extractFlowValue(link), 0);
            
        const outgoingFlow = links
            .filter(link => link.source === nodeIndex)
            .reduce((sum, link) => sum + this.extractFlowValue(link), 0);
            
        return Math.max(incomingFlow, outgoingFlow);
    }

    /**
     * Enriquece la jerarquía con análisis de relaciones entre nodos
     * @param {Map} hierarchy - Mapa de jerarquía
     * @param {Array} links - Enlaces del diagrama
     */
    enrichWithRelationshipAnalysis(hierarchy, links) {
        // Identificar grupos de nodos relacionados
        const nodeGroups = this.identifyNodeGroups(hierarchy);
        
        // Calcular métricas de centralidad
        this.calculateCentralityMetrics(hierarchy, links);
        
        // Identificar cuellos de botella
        this.identifyBottlenecks(hierarchy, links);
        
        // Añadir información de grupos a cada nodo
        hierarchy.forEach((nodeInfo, index) => {
            nodeInfo.groups = nodeGroups.get(index) || [];
            nodeInfo.isBottleneck = nodeInfo.bottleneckScore > 0.7;
        });
    }

    /**
     * Identifica grupos de nodos relacionados
     * @param {Map} hierarchy - Mapa de jerarquía
     * @returns {Map} Mapa de grupos por nodo
     */
    identifyNodeGroups(hierarchy) {
        const groups = new Map();
        
        hierarchy.forEach((nodeInfo, index) => {
            const nodeGroups = [];
            
            // Grupo por tipo de energía
            if (nodeInfo.energyType !== 'unknown') {
                nodeGroups.push(`energy_${nodeInfo.energyType}`);
            }
            
            // Grupo por tipo de nodo
            nodeGroups.push(`type_${nodeInfo.type}`);
            
            // Grupo por columna
            nodeGroups.push(`column_${nodeInfo.column}`);
            
            groups.set(index, nodeGroups);
        });
        
        return groups;
    }

    /**
     * Calcula métricas de centralidad para cada nodo
     * @param {Map} hierarchy - Mapa de jerarquía
     * @param {Array} links - Enlaces del diagrama
     */
    calculateCentralityMetrics(hierarchy, links) {
        hierarchy.forEach((nodeInfo, index) => {
            // Centralidad de grado
            const degreeCentrality = (nodeInfo.connectivity.inDegree + nodeInfo.connectivity.outDegree) / (hierarchy.size - 1);
            
            // Centralidad de flujo
            const maxFlow = Math.max(...Array.from(hierarchy.values()).map(n => n.connectivity.totalFlow));
            const flowCentrality = maxFlow > 0 ? nodeInfo.connectivity.totalFlow / maxFlow : 0;
            
            // Centralidad de intermediación (simplificada)
            const betweennessCentrality = this.calculateBetweennessCentrality(index, hierarchy, links);
            
            nodeInfo.centrality = {
                degree: degreeCentrality,
                flow: flowCentrality,
                betweenness: betweennessCentrality,
                overall: (degreeCentrality + flowCentrality + betweennessCentrality) / 3
            };
        });
    }

    /**
     * Calcula la centralidad de intermediación simplificada
     * @param {number} nodeIndex - Índice del nodo
     * @param {Map} hierarchy - Mapa de jerarquía
     * @param {Array} links - Enlaces del diagrama
     * @returns {number} Centralidad de intermediación
     */
    calculateBetweennessCentrality(nodeIndex, hierarchy, links) {
        // Implementación simplificada basada en la posición en el flujo
        const nodeInfo = hierarchy.get(nodeIndex);
        if (!nodeInfo) return 0;
        
        const hasIncoming = nodeInfo.connectivity.inDegree > 0;
        const hasOutgoing = nodeInfo.connectivity.outDegree > 0;
        
        // Nodos que tienen tanto entrada como salida son más centrales
        if (hasIncoming && hasOutgoing) {
            return Math.min(nodeInfo.connectivity.inDegree, nodeInfo.connectivity.outDegree) / 
                   Math.max(nodeInfo.connectivity.inDegree, nodeInfo.connectivity.outDegree);
        }
        
        return 0;
    }

    /**
     * Identifica cuellos de botella en el flujo
     * @param {Map} hierarchy - Mapa de jerarquía
     * @param {Array} links - Enlaces del diagrama
     */
    identifyBottlenecks(hierarchy, links) {
        hierarchy.forEach((nodeInfo, index) => {
            // Un nodo es cuello de botella si:
            // 1. Tiene alta centralidad
            // 2. Tiene pocos enlaces pero alto flujo
            // 3. Es el único camino entre grupos de nodos
            
            const centralityScore = nodeInfo.centrality?.overall || 0;
            const connectivityRatio = nodeInfo.connectivity.totalFlow / 
                                    Math.max(nodeInfo.connectivity.inDegree + nodeInfo.connectivity.outDegree, 1);
            
            nodeInfo.bottleneckScore = (centralityScore + Math.min(connectivityRatio / 1000, 1)) / 2;
        });
    }

    /**
     * Valida la consistencia de la jerarquía calculada
     * @param {Map} hierarchy - Mapa de jerarquía
     */
    validateHierarchy(hierarchy) {
        let warnings = 0;
        
        hierarchy.forEach((nodeInfo, index) => {
            // Validar que los padres e hijos existen
            const invalidParents = nodeInfo.parents.filter(p => !hierarchy.has(p));
            const invalidChildren = nodeInfo.children.filter(c => !hierarchy.has(c));
            
            if (invalidParents.length > 0 || invalidChildren.length > 0) {
                console.warn(`Nodo ${index} (${nodeInfo.name}) tiene referencias inválidas:`, 
                           { invalidParents, invalidChildren });
                warnings++;
            }
            
            // Validar consistencia de flujos
            if (nodeInfo.incomingFlows.length !== nodeInfo.parents.length) {
                console.warn(`Inconsistencia en flujos entrantes del nodo ${index} (${nodeInfo.name})`);
                warnings++;
            }
        });
        
        if (warnings > 0) {
            console.warn(`Jerarquía validada con ${warnings} advertencias`);
        } else {
            console.log('Jerarquía validada correctamente');
        }
    }

    /**
     * Calcula los límites espaciales de un nodo
     * @param {Object} node - Nodo
     * @returns {Object} Límites del nodo
     */
    calculateNodeBounds(node) {
        // Estimar dimensiones basadas en la posición y el valor del nodo
        const baseWidth = 0.03;
        const baseHeight = 0.05;
        
        // Ajustar tamaño basado en el valor del nodo si está disponible
        let widthMultiplier = 1;
        let heightMultiplier = 1;
        
        if (node.value && node.value > 0) {
            const normalizedValue = Math.min(node.value / 1000, 3); // Normalizar a máximo 3x
            widthMultiplier = 1 + normalizedValue * 0.5;
            heightMultiplier = 1 + normalizedValue * 0.3;
        }
        
        const width = baseWidth * widthMultiplier;
        const height = baseHeight * heightMultiplier;
        const x = node.x || 0;
        const y = node.y || 0;
        
        return {
            left: x - width / 2,
            right: x + width / 2,
            top: y - height / 2,
            bottom: y + height / 2,
            width: width,
            height: height,
            centerX: x,
            centerY: y
        };
    }

    /**
     * Genera clave de caché para la jerarquía
     * @param {Array} nodes - Nodos
     * @param {Array} links - Enlaces
     * @returns {string} Clave de caché
     */
    generateHierarchyCacheKey(nodes, links) {
        const nodeHash = nodes.map(n => `${n.x || 0}-${n.y || 0}-${this.extractNodeName(n)}`).join('|');
        const linkHash = links.map(l => `${l.source}-${l.target}-${l.value || 0}`).join('|');
        return btoa(`${nodeHash}:${linkHash}`).slice(0, 32);
    }

    /**
     * Limpia la caché de jerarquía
     */
    clearCache() {
        this.hierarchyCache.clear();
        console.log('Caché de NodeHierarchyMapper limpiada');
    }

    /**
     * Obtiene estadísticas de la jerarquía actual
     * @returns {Object} Estadísticas de la jerarquía
     */
    getHierarchyStats() {
        const stats = {
            cacheSize: this.hierarchyCache.size,
            nodeTypePatterns: Object.keys(this.nodeTypePatterns).length,
            flowThresholds: this.flowThresholds
        };
        
        return stats;
    }
}

/**
 * RouteCalculator - Calcula rutas optimizadas usando algoritmos de curvas Bézier
 * 
 * Esta clase implementa algoritmos avanzados para calcular rutas curvas entre nodos
 * que minimizan cruces y evitan colisiones con los límites de los nodos.
 */
class RouteCalculator {
    constructor(config) {
        this.config = config;
        this.algorithms = {
            'bezier-optimized': this.calculateBezierRoute.bind(this),
            'spline-smooth': this.calculateSplineRoute.bind(this),
            'arc-minimal': this.calculateArcRoute.bind(this)
        };
        
        // Cache para puntos de control calculados
        this.controlPointsCache = new Map();
        
        // Configuración de detección de colisiones
        this.collisionConfig = {
            nodeMargin: 0.01,        // Margen adicional alrededor de nodos
            samplingPoints: 20,      // Puntos para muestrear la curva
            maxCollisionChecks: 100  // Máximo número de verificaciones
        };
    }

    /**
     * Actualiza la configuración del calculador
     * @param {Object} newConfig - Nueva configuración
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
    }

    /**
     * Calcula rutas optimizadas para todos los enlaces
     * @param {Array} links - Enlaces
     * @param {Array} nodes - Nodos
     * @param {Map} hierarchy - Jerarquía de nodos
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<Array>} Rutas calculadas
     */
    async calculateOptimizedRoutes(links, nodes, hierarchy, options = {}) {
        const routes = [];
        const algorithm = this.algorithms[this.config.routingAlgorithm];

        if (!algorithm) {
            throw new Error(`Algoritmo desconocido: ${this.config.routingAlgorithm}`);
        }

        // Identificar y agrupar enlaces múltiples entre los mismos nodos
        const linkGroups = this.groupLinksByNodePairs(links);
        
        // Calcular rutas considerando múltiples enlaces
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const sourceNode = nodes[link.source];
            const targetNode = nodes[link.target];
            
            if (!sourceNode || !targetNode) continue;

            // Obtener información del grupo de enlaces múltiples
            const groupInfo = this.getMultipleLinkGroupInfo(link, linkGroups, i);
            
            const route = await algorithm(link, sourceNode, targetNode, hierarchy, i, groupInfo);
            routes.push(route);
        }

        return routes;
    }

    /**
     * Agrupa enlaces por pares de nodos para manejar enlaces múltiples
     * @param {Array} links - Enlaces a agrupar
     * @returns {Map} Mapa de grupos de enlaces
     */
    groupLinksByNodePairs(links) {
        const groups = new Map();

        links.forEach((link, index) => {
            // Crear clave única para el par de nodos (ordenada para consistencia)
            const nodeA = Math.min(link.source, link.target);
            const nodeB = Math.max(link.source, link.target);
            const key = `${nodeA}-${nodeB}`;

            if (!groups.has(key)) {
                groups.set(key, {
                    nodeA,
                    nodeB,
                    links: [],
                    totalValue: 0,
                    maxValue: 0
                });
            }

            const group = groups.get(key);
            group.links.push({ link, index });
            group.totalValue += link.value || 0;
            group.maxValue = Math.max(group.maxValue, link.value || 0);
        });

        // Ordenar enlaces dentro de cada grupo por valor (mayor a menor)
        groups.forEach(group => {
            group.links.sort((a, b) => (b.link.value || 0) - (a.link.value || 0));
        });

        return groups;
    }

    /**
     * Obtiene información del grupo para un enlace específico
     * @param {Object} link - Enlace
     * @param {Map} linkGroups - Grupos de enlaces
     * @param {number} linkIndex - Índice del enlace
     * @returns {Object} Información del grupo
     */
    getMultipleLinkGroupInfo(link, linkGroups, linkIndex) {
        const nodeA = Math.min(link.source, link.target);
        const nodeB = Math.max(link.source, link.target);
        const key = `${nodeA}-${nodeB}`;
        
        const group = linkGroups.get(key);
        if (!group || group.links.length === 1) {
            return {
                isMultiple: false,
                groupSize: 1,
                positionInGroup: 0,
                totalGroupValue: link.value || 0
            };
        }

        // Encontrar la posición del enlace actual en el grupo
        const positionInGroup = group.links.findIndex(item => item.index === linkIndex);

        return {
            isMultiple: true,
            groupSize: group.links.length,
            positionInGroup: positionInGroup,
            totalGroupValue: group.totalValue,
            maxGroupValue: group.maxValue,
            groupKey: key
        };
    }

    /**
     * Calcula una ruta usando curvas Bézier optimizadas
     * @param {Object} link - Enlace
     * @param {Object} sourceNode - Nodo origen
     * @param {Object} targetNode - Nodo destino
     * @param {Map} hierarchy - Jerarquía
     * @param {number} index - Índice del enlace
     * @param {Object} groupInfo - Información del grupo de enlaces múltiples
     * @returns {Object} Ruta calculada
     */
    calculateBezierRoute(link, sourceNode, targetNode, hierarchy, index, groupInfo = {}) {
        const sourceInfo = hierarchy.get(link.source);
        const targetInfo = hierarchy.get(link.target);

        // Calcular puntos de conexión considerando enlaces múltiples
        const connectionPoints = this.calculateNodeConnectionPoints(
            sourceNode, targetNode, sourceInfo, targetInfo, groupInfo
        );
        
        // Calcular puntos de control para curva Bézier suave
        const controlPoints = this.calculateBezierControlPoints(
            connectionPoints.source, 
            connectionPoints.target, 
            sourceInfo, 
            targetInfo,
            index,
            groupInfo
        );

        // Verificar y resolver colisiones con nodos
        const optimizedControlPoints = this.resolveNodeCollisions(controlPoints, hierarchy);

        // Generar datos compatibles con Plotly
        const plotlyPath = this.generatePlotlyPathData(optimizedControlPoints);

        return {
            id: `bezier_route_${index}`,
            sourceIndex: link.source,
            targetIndex: link.target,
            value: link.value,
            color: link.color,
            customdata: link.customdata,
            path: {
                type: 'bezier',
                controlPoints: optimizedControlPoints,
                curvature: this.calculateCurvatureFromControlPoints(optimizedControlPoints),
                plotlyPath: plotlyPath
            },
            routing: {
                priority: this.calculateRoutePriority(sourceInfo, targetInfo, link.value),
                flowType: this.classifyRouteFlowType(link, sourceInfo, targetInfo),
                avoidanceZones: this.identifyAvoidanceZones(optimizedControlPoints, hierarchy),
                conflicts: [],
                multipleLinks: groupInfo
            }
        };
    }

    /**
     * Calcula puntos de conexión en los bordes de los nodos
     * @param {Object} sourceNode - Nodo origen
     * @param {Object} targetNode - Nodo destino
     * @param {Object} sourceInfo - Información del nodo origen
     * @param {Object} targetInfo - Información del nodo destino
     * @param {Object} groupInfo - Información del grupo de enlaces múltiples
     * @returns {Object} Puntos de conexión
     */
    calculateNodeConnectionPoints(sourceNode, targetNode, sourceInfo, targetInfo, groupInfo = {}) {
        // Obtener límites de los nodos
        const sourceBounds = sourceInfo?.bounds || this.estimateNodeBounds(sourceNode);
        const targetBounds = targetInfo?.bounds || this.estimateNodeBounds(targetNode);

        // Calcular dirección del enlace
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const angle = Math.atan2(dy, dx);

        // Calcular offset vertical para enlaces múltiples
        const verticalOffset = this.calculateMultipleLinkOffset(groupInfo, sourceBounds.height);

        // Punto de salida en el borde derecho del nodo origen
        const sourceConnectionPoint = {
            x: sourceBounds.right,
            y: sourceNode.y + Math.sin(angle) * (sourceBounds.height * 0.3) + verticalOffset.source
        };

        // Punto de entrada en el borde izquierdo del nodo destino
        const targetConnectionPoint = {
            x: targetBounds.left,
            y: targetNode.y - Math.sin(angle) * (targetBounds.height * 0.3) + verticalOffset.target
        };

        return {
            source: sourceConnectionPoint,
            target: targetConnectionPoint,
            multipleLinksOffset: verticalOffset
        };
    }

    /**
     * Calcula el offset vertical para enlaces múltiples entre los mismos nodos
     * @param {Object} groupInfo - Información del grupo
     * @param {number} nodeHeight - Altura del nodo
     * @returns {Object} Offsets para origen y destino
     */
    calculateMultipleLinkOffset(groupInfo, nodeHeight) {
        if (!groupInfo.isMultiple || groupInfo.groupSize <= 1) {
            return { source: 0, target: 0 };
        }

        // Calcular separación base entre enlaces múltiples
        const baseSeparation = Math.max(this.config.linkSeparation * 2, nodeHeight * 0.1);
        const totalHeight = baseSeparation * (groupInfo.groupSize - 1);
        
        // Centrar el grupo de enlaces
        const centerOffset = -totalHeight / 2;
        const linkOffset = centerOffset + (groupInfo.positionInGroup * baseSeparation);

        // Aplicar variación adicional basada en el valor del enlace
        const valueVariation = this.calculateValueBasedVariation(groupInfo);

        return {
            source: linkOffset + valueVariation * 0.5,
            target: linkOffset + valueVariation * 0.3
        };
    }

    /**
     * Calcula variación basada en el valor del enlace para enlaces múltiples
     * @param {Object} groupInfo - Información del grupo
     * @returns {number} Variación calculada
     */
    calculateValueBasedVariation(groupInfo) {
        if (!groupInfo.isMultiple || !groupInfo.maxGroupValue) return 0;

        // Enlaces con mayor valor tienden hacia el centro
        const valueRatio = (groupInfo.totalGroupValue || 0) / groupInfo.maxGroupValue;
        const centeringFactor = (1 - valueRatio) * this.config.linkSeparation;
        
        return centeringFactor * (groupInfo.positionInGroup % 2 === 0 ? 1 : -1);
    }

    /**
     * Calcula puntos de control para curva Bézier cúbica suave
     * @param {Object} startPoint - Punto de inicio
     * @param {Object} endPoint - Punto final
     * @param {Object} sourceInfo - Información del nodo origen
     * @param {Object} targetInfo - Información del nodo destino
     * @param {number} linkIndex - Índice del enlace para variación
     * @param {Object} groupInfo - Información del grupo de enlaces múltiples
     * @returns {Array} Array de puntos de control [P0, P1, P2, P3]
     */
    calculateBezierControlPoints(startPoint, endPoint, sourceInfo, targetInfo, linkIndex, groupInfo = {}) {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calcular curvatura base
        let baseCurvature = this.config.curvature;
        
        // Ajustar curvatura basada en la distancia
        const distanceMultiplier = Math.min(distance * 2, 1.5);
        baseCurvature *= distanceMultiplier;

        // Ajustar curvatura basada en el tipo de flujo
        if (sourceInfo && targetInfo) {
            const flowTypeMultiplier = this.getFlowTypeCurvatureMultiplier(sourceInfo.type, targetInfo.type);
            baseCurvature *= flowTypeMultiplier;
        }

        // Calcular variación para enlaces múltiples
        const multipleLinkVariation = this.calculateMultipleLinkCurvatureVariation(groupInfo, distance);
        
        // Añadir variación adicional basada en el índice del enlace
        const linkVariation = (linkIndex % 3 - 1) * 0.05; // Reducir variación base
        const verticalOffset = linkVariation * distance + multipleLinkVariation.vertical;

        // Calcular puntos de control con ajustes para enlaces múltiples
        const controlDistance = dx * (0.4 + multipleLinkVariation.horizontal);

        const controlPoint1 = {
            x: startPoint.x + controlDistance,
            y: startPoint.y + baseCurvature * 0.5 + verticalOffset + multipleLinkVariation.curvatureAdjustment
        };

        const controlPoint2 = {
            x: endPoint.x - controlDistance,
            y: endPoint.y - baseCurvature * 0.5 + verticalOffset + multipleLinkVariation.curvatureAdjustment * 0.8
        };

        return [
            startPoint,      // P0
            controlPoint1,   // P1
            controlPoint2,   // P2
            endPoint         // P3
        ];
    }

    /**
     * Calcula variaciones de curvatura para enlaces múltiples
     * @param {Object} groupInfo - Información del grupo
     * @param {number} distance - Distancia entre nodos
     * @returns {Object} Variaciones calculadas
     */
    calculateMultipleLinkCurvatureVariation(groupInfo, distance) {
        if (!groupInfo.isMultiple) {
            return {
                vertical: 0,
                horizontal: 0,
                curvatureAdjustment: 0
            };
        }

        const groupSize = groupInfo.groupSize;
        const position = groupInfo.positionInGroup;
        
        // Calcular patrón de curvatura para evitar solapamientos
        const curvaturePattern = this.generateCurvaturePattern(groupSize);
        const patternValue = curvaturePattern[position] || 0;

        // Variación vertical basada en la posición en el grupo
        const verticalVariation = patternValue * distance * 0.1;

        // Variación horizontal para crear separación
        const horizontalVariation = (position - (groupSize - 1) / 2) * 0.05;

        // Ajuste de curvatura para crear formas distintivas
        const curvatureAdjustment = this.calculateDistinctiveCurvature(position, groupSize, distance);

        return {
            vertical: verticalVariation,
            horizontal: horizontalVariation,
            curvatureAdjustment: curvatureAdjustment
        };
    }

    /**
     * Genera un patrón de curvatura para un grupo de enlaces
     * @param {number} groupSize - Tamaño del grupo
     * @returns {Array} Patrón de curvatura
     */
    generateCurvaturePattern(groupSize) {
        const patterns = {
            2: [0.5, -0.5],
            3: [0.7, 0, -0.7],
            4: [0.8, 0.3, -0.3, -0.8],
            5: [1, 0.5, 0, -0.5, -1]
        };

        if (patterns[groupSize]) {
            return patterns[groupSize];
        }

        // Generar patrón para grupos más grandes
        const pattern = [];
        const center = (groupSize - 1) / 2;
        
        for (let i = 0; i < groupSize; i++) {
            const offset = (i - center) / center;
            pattern.push(offset * 0.8);
        }

        return pattern;
    }

    /**
     * Calcula curvatura distintiva para cada enlace en un grupo múltiple
     * @param {number} position - Posición en el grupo
     * @param {number} groupSize - Tamaño del grupo
     * @param {number} distance - Distancia entre nodos
     * @returns {number} Ajuste de curvatura
     */
    calculateDistinctiveCurvature(position, groupSize, distance) {
        // Enlaces centrales tienen menos curvatura, enlaces externos más curvatura
        const centerDistance = Math.abs(position - (groupSize - 1) / 2);
        const maxCenterDistance = Math.floor(groupSize / 2);
        
        if (maxCenterDistance === 0) return 0;

        const curvatureFactor = centerDistance / maxCenterDistance;
        const baseCurvatureAdjustment = this.config.curvature * 0.3;

        // Alternar dirección de curvatura
        const direction = position % 2 === 0 ? 1 : -1;
        
        return baseCurvatureAdjustment * curvatureFactor * direction * (distance * 0.1);
    }

    /**
     * Obtiene multiplicador de curvatura basado en el tipo de flujo
     * @param {string} sourceType - Tipo del nodo origen
     * @param {string} targetType - Tipo del nodo destino
     * @returns {number} Multiplicador de curvatura
     */
    getFlowTypeCurvatureMultiplier(sourceType, targetType) {
        // Flujos principales (source -> transformation) requieren menos curvatura
        if (sourceType === 'source' && targetType === 'transformation') return 0.7;
        
        // Flujos de distribución requieren más curvatura para evitar cruces
        if (sourceType === 'transformation' && targetType === 'distribution') return 1.2;
        if (sourceType === 'distribution' && targetType === 'consumption') return 1.0;
        
        // Flujos de transformación pueden tener curvatura moderada
        if (targetType === 'transformation') return 0.9;
        
        return 1.0; // Curvatura por defecto
    }

    /**
     * Resuelve colisiones de la ruta con los límites de los nodos
     * @param {Array} controlPoints - Puntos de control originales
     * @param {Map} hierarchy - Jerarquía de nodos
     * @returns {Array} Puntos de control optimizados
     */
    resolveNodeCollisions(controlPoints, hierarchy) {
        const optimizedPoints = [...controlPoints];
        let hasCollisions = true;
        let iterations = 0;
        const maxIterations = this.collisionConfig.maxCollisionChecks;

        while (hasCollisions && iterations < maxIterations) {
            hasCollisions = false;
            
            // Generar puntos de muestra a lo largo de la curva
            const samplePoints = this.sampleBezierCurve(optimizedPoints, this.collisionConfig.samplingPoints);
            
            // Verificar colisiones con cada nodo
            for (const [nodeIndex, nodeInfo] of hierarchy) {
                if (!nodeInfo.bounds) continue;
                
                const collisions = this.detectCurveNodeCollisions(samplePoints, nodeInfo.bounds);
                
                if (collisions.length > 0) {
                    hasCollisions = true;
                    // Ajustar puntos de control para evitar la colisión
                    this.adjustControlPointsForCollision(optimizedPoints, nodeInfo.bounds, collisions);
                }
            }
            
            iterations++;
        }

        if (iterations >= maxIterations) {
            console.warn('Máximo número de iteraciones alcanzado en resolución de colisiones');
        }

        return optimizedPoints;
    }

    /**
     * Muestrea puntos a lo largo de una curva Bézier cúbica
     * @param {Array} controlPoints - Puntos de control [P0, P1, P2, P3]
     * @param {number} numSamples - Número de puntos a muestrear
     * @returns {Array} Puntos muestreados
     */
    sampleBezierCurve(controlPoints, numSamples) {
        const [P0, P1, P2, P3] = controlPoints;
        const samples = [];

        for (let i = 0; i <= numSamples; i++) {
            const t = i / numSamples;
            const point = this.evaluateBezierCurve(P0, P1, P2, P3, t);
            samples.push({ ...point, t });
        }

        return samples;
    }

    /**
     * Evalúa un punto en una curva Bézier cúbica
     * @param {Object} P0 - Punto de control 0
     * @param {Object} P1 - Punto de control 1
     * @param {Object} P2 - Punto de control 2
     * @param {Object} P3 - Punto de control 3
     * @param {number} t - Parámetro t (0-1)
     * @returns {Object} Punto evaluado
     */
    evaluateBezierCurve(P0, P1, P2, P3, t) {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;

        return {
            x: uuu * P0.x + 3 * uu * t * P1.x + 3 * u * tt * P2.x + ttt * P3.x,
            y: uuu * P0.y + 3 * uu * t * P1.y + 3 * u * tt * P2.y + ttt * P3.y
        };
    }

    /**
     * Detecta colisiones entre puntos de la curva y los límites de un nodo
     * @param {Array} samplePoints - Puntos muestreados de la curva
     * @param {Object} nodeBounds - Límites del nodo
     * @returns {Array} Puntos de colisión
     */
    detectCurveNodeCollisions(samplePoints, nodeBounds) {
        const collisions = [];
        const margin = this.collisionConfig.nodeMargin;

        // Expandir límites del nodo con margen
        const expandedBounds = {
            left: nodeBounds.left - margin,
            right: nodeBounds.right + margin,
            top: nodeBounds.top - margin,
            bottom: nodeBounds.bottom + margin
        };

        for (const point of samplePoints) {
            if (this.isPointInsideBounds(point, expandedBounds)) {
                collisions.push(point);
            }
        }

        return collisions;
    }

    /**
     * Verifica si un punto está dentro de los límites especificados
     * @param {Object} point - Punto a verificar
     * @param {Object} bounds - Límites
     * @returns {boolean} True si el punto está dentro
     */
    isPointInsideBounds(point, bounds) {
        return point.x >= bounds.left && 
               point.x <= bounds.right && 
               point.y >= bounds.top && 
               point.y <= bounds.bottom;
    }

    /**
     * Ajusta puntos de control para evitar colisión con un nodo
     * @param {Array} controlPoints - Puntos de control a ajustar
     * @param {Object} nodeBounds - Límites del nodo
     * @param {Array} collisions - Puntos de colisión
     */
    adjustControlPointsForCollision(controlPoints, nodeBounds, collisions) {
        if (collisions.length === 0) return;

        // Encontrar el punto de colisión más crítico (más cerca del centro de la curva)
        const criticalCollision = collisions.reduce((prev, curr) => 
            Math.abs(curr.t - 0.5) < Math.abs(prev.t - 0.5) ? curr : prev
        );

        // Determinar dirección de ajuste (arriba o abajo del nodo)
        const nodeCenterY = (nodeBounds.top + nodeBounds.bottom) / 2;
        const adjustDirection = criticalCollision.y > nodeCenterY ? 1 : -1;
        
        // Calcular magnitud del ajuste
        const nodeHeight = nodeBounds.bottom - nodeBounds.top;
        const adjustMagnitude = (nodeHeight + this.collisionConfig.nodeMargin * 2) * adjustDirection;

        // Ajustar puntos de control intermedios
        controlPoints[1].y += adjustMagnitude * 0.8;
        controlPoints[2].y += adjustMagnitude * 0.8;
    }

    /**
     * Genera datos de ruta compatibles con Plotly.js
     * @param {Array} controlPoints - Puntos de control de la curva Bézier
     * @returns {Object} Datos de ruta para Plotly
     */
    generatePlotlyPathData(controlPoints) {
        const [P0, P1, P2, P3] = controlPoints;
        
        // Generar path SVG para Plotly
        const pathString = `M ${P0.x} ${P0.y} C ${P1.x} ${P1.y} ${P2.x} ${P2.y} ${P3.x} ${P3.y}`;
        
        // Generar puntos discretos para renderizado alternativo
        const discretePoints = this.sampleBezierCurve(controlPoints, 50);
        
        return {
            // Formato SVG path para Plotly shapes
            svgPath: pathString,
            
            // Arrays de coordenadas para Plotly scatter
            x: discretePoints.map(p => p.x),
            y: discretePoints.map(p => p.y),
            
            // Información adicional para debugging
            controlPoints: controlPoints,
            
            // Configuración de estilo para Plotly
            plotlyConfig: {
                type: 'scatter',
                mode: 'lines',
                line: {
                    shape: 'spline',
                    smoothing: 1.3
                },
                hoverinfo: 'none',
                showlegend: false
            }
        };
    }

    /**
     * Calcula la curvatura efectiva de los puntos de control
     * @param {Array} controlPoints - Puntos de control
     * @returns {number} Valor de curvatura
     */
    calculateCurvatureFromControlPoints(controlPoints) {
        const [P0, P1, P2, P3] = controlPoints;
        
        // Calcular desviación de los puntos de control respecto a la línea recta
        const straightLineDistance = Math.sqrt(
            Math.pow(P3.x - P0.x, 2) + Math.pow(P3.y - P0.y, 2)
        );
        
        const controlDeviation1 = this.distancePointToLine(P1, P0, P3);
        const controlDeviation2 = this.distancePointToLine(P2, P0, P3);
        
        const maxDeviation = Math.max(controlDeviation1, controlDeviation2);
        
        return straightLineDistance > 0 ? maxDeviation / straightLineDistance : 0;
    }

    /**
     * Calcula la distancia de un punto a una línea
     * @param {Object} point - Punto
     * @param {Object} lineStart - Inicio de la línea
     * @param {Object} lineEnd - Final de la línea
     * @returns {number} Distancia
     */
    distancePointToLine(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        
        const param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Identifica zonas de evitación basadas en la ruta calculada
     * @param {Array} controlPoints - Puntos de control
     * @param {Map} hierarchy - Jerarquía de nodos
     * @returns {Array} Zonas de evitación
     */
    identifyAvoidanceZones(controlPoints, hierarchy) {
        const avoidanceZones = [];
        const samplePoints = this.sampleBezierCurve(controlPoints, 10);
        
        // Crear zonas de evitación alrededor de puntos críticos de la curva
        samplePoints.forEach((point, index) => {
            if (index % 3 === 0) { // Cada tercer punto
                avoidanceZones.push({
                    center: { x: point.x, y: point.y },
                    radius: this.config.avoidanceRadius,
                    priority: 0.5,
                    type: 'curve-protection'
                });
            }
        });

        return avoidanceZones;
    }

    /**
     * Estima los límites de un nodo cuando no están disponibles
     * @param {Object} node - Nodo
     * @returns {Object} Límites estimados
     */
    estimateNodeBounds(node) {
        const baseWidth = 0.03;
        const baseHeight = 0.05;
        
        return {
            left: node.x - baseWidth / 2,
            right: node.x + baseWidth / 2,
            top: node.y - baseHeight / 2,
            bottom: node.y + baseHeight / 2,
            width: baseWidth,
            height: baseHeight,
            centerX: node.x,
            centerY: node.y
        };
    }

    /**
     * Calcula una ruta usando splines suaves
     * @param {Object} link - Enlace
     * @param {Object} sourceNode - Nodo origen
     * @param {Object} targetNode - Nodo destino
     * @param {Map} hierarchy - Jerarquía
     * @param {number} index - Índice del enlace
     * @param {Object} groupInfo - Información del grupo de enlaces múltiples
     * @returns {Object} Ruta calculada
     */
    calculateSplineRoute(link, sourceNode, targetNode, hierarchy, index, groupInfo = {}) {
        // Usar algoritmo Bézier con curvatura aumentada para splines más suaves
        const originalCurvature = this.config.curvature;
        this.config.curvature *= 1.3; // Aumentar curvatura para splines
        
        const route = this.calculateBezierRoute(link, sourceNode, targetNode, hierarchy, index, groupInfo);
        route.id = `spline_route_${index}`;
        route.path.type = 'spline';
        
        // Restaurar curvatura original
        this.config.curvature = originalCurvature;
        
        return route;
    }

    /**
     * Calcula una ruta usando arcos mínimos
     * @param {Object} link - Enlace
     * @param {Object} sourceNode - Nodo origen
     * @param {Object} targetNode - Nodo destino
     * @param {Map} hierarchy - Jerarquía
     * @param {number} index - Índice del enlace
     * @param {Object} groupInfo - Información del grupo de enlaces múltiples
     * @returns {Object} Ruta calculada
     */
    calculateArcRoute(link, sourceNode, targetNode, hierarchy, index, groupInfo = {}) {
        // Usar algoritmo Bézier con curvatura reducida para arcos mínimos
        const originalCurvature = this.config.curvature;
        this.config.curvature *= 0.6; // Reducir curvatura para arcos mínimos
        
        const route = this.calculateBezierRoute(link, sourceNode, targetNode, hierarchy, index, groupInfo);
        route.id = `arc_route_${index}`;
        route.path.type = 'arc';
        
        // Restaurar curvatura original
        this.config.curvature = originalCurvature;
        
        return route;
    }

    /**
     * Calcula la prioridad de una ruta
     * @param {Object} sourceInfo - Información del nodo origen
     * @param {Object} targetInfo - Información del nodo destino
     * @param {number} linkValue - Valor del enlace
     * @returns {number} Prioridad de la ruta
     */
    calculateRoutePriority(sourceInfo, targetInfo, linkValue = 0) {
        // Prioridad basada en tipo de flujo y nivel jerárquico
        let priority = 0.5;

        if (sourceInfo && targetInfo) {
            // Mayor prioridad para flujos principales
            if (sourceInfo.type === 'source' && targetInfo.type === 'transformation') {
                priority = this.config.flowPriorities.primary;
            } else if (sourceInfo.type === 'transformation' && targetInfo.type === 'distribution') {
                priority = this.config.flowPriorities.secondary;
            } else if (sourceInfo.type === 'distribution' && targetInfo.type === 'consumption') {
                priority = this.config.flowPriorities.distribution;
            } else if (targetInfo.type === 'transformation') {
                priority = this.config.flowPriorities.transformation;
            }
        }

        // Ajustar prioridad basada en el valor del enlace
        if (linkValue > 0) {
            const maxExpectedValue = 3000; // PJ - valor máximo esperado
            const valueFactor = Math.min(linkValue / maxExpectedValue, 1);
            priority = priority * (0.7 + valueFactor * 0.3); // Aumentar prioridad para valores altos
        }

        return Math.min(priority, 1);
    }

    /**
     * Clasifica el tipo de flujo de una ruta
     * @param {Object} link - Enlace
     * @param {Object} sourceInfo - Información del nodo origen
     * @param {Object} targetInfo - Información del nodo destino
     * @returns {string} Tipo de flujo
     */
    classifyRouteFlowType(link, sourceInfo, targetInfo) {
        if (!sourceInfo || !targetInfo) return 'default';

        if (sourceInfo.type === 'source') return 'primary';
        if (sourceInfo.type === 'transformation') return 'secondary';
        if (targetInfo.type === 'consumption') return 'distribution';
        
        return 'transformation';
    }

    /**
     * Evalúa un punto en una curva Bézier cúbica
     * @param {Object} P0 - Punto de control 0
     * @param {Object} P1 - Punto de control 1
     * @param {Object} P2 - Punto de control 2
     * @param {Object} P3 - Punto de control 3
     * @param {number} t - Parámetro t (0-1)
     * @returns {Object} Punto evaluado
     */
    evaluateBezierCurve(P0, P1, P2, P3, t) {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;

        return {
            x: uuu * P0.x + 3 * uu * t * P1.x + 3 * u * tt * P2.x + ttt * P3.x,
            y: uuu * P0.y + 3 * uu * t * P1.y + 3 * u * tt * P2.y + ttt * P3.y
        };
    }

    /**
     * Muestrea puntos a lo largo de una curva Bézier cúbica
     * @param {Array} controlPoints - Puntos de control [P0, P1, P2, P3]
     * @param {number} numSamples - Número de puntos a muestrear
     * @returns {Array} Puntos muestreados
     */
    sampleBezierCurve(controlPoints, numSamples) {
        const [P0, P1, P2, P3] = controlPoints;
        const samples = [];

        for (let i = 0; i <= numSamples; i++) {
            const t = i / numSamples;
            const point = this.evaluateBezierCurve(P0, P1, P2, P3, t);
            samples.push({ ...point, t });
        }

        return samples;
    }

    /**
     * Calcula la separación entre dos rutas paralelas
     * @param {Object} route1 - Primera ruta
     * @param {Object} route2 - Segunda ruta
     * @returns {number} Separación mínima
     */
    calculateParallelRouteSeparation(route1, route2) {
        const curve1 = route1.path?.controlPoints;
        const curve2 = route2.path?.controlPoints;
        
        if (!curve1 || !curve2) return Infinity;

        const samples1 = this.sampleRouteForIntersection(curve1, 10);
        const samples2 = this.sampleRouteForIntersection(curve2, 10);

        let minSeparation = Infinity;

        samples1.forEach(p1 => {
            samples2.forEach(p2 => {
                const distance = Math.sqrt(
                    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
                );
                minSeparation = Math.min(minSeparation, distance);
            });
        });

        return minSeparation;
    }
}

/**
 * RouteCalculator - Calcula rutas optimizadas usando algoritmos de curvas Bézier
 * 
 * Esta clase implementa algoritmos avanzados para calcular rutas curvas entre nodos
 * que minimizan cruces y evitan colisiones con los límites de los nodos.
 */
class RouteCalculator {
    constructor(config) {
        this.config = config;
        this.algorithms = {
            'bezier-optimized': this.calculateBezierRoute.bind(this),
            'spline-smooth': this.calculateSplineRoute.bind(this),
            'arc-minimal': this.calculateArcRoute.bind(this)
        };
        
        // Cache para puntos de control calculados
        this.controlPointsCache = new Map();
        
        // Configuración de detección de colisiones
        this.collisionConfig = {
            nodeMar