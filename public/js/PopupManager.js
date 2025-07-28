/**
 * PopupManager - Módulo para gestión estandarizada de popups informativos
 * 
 * Este módulo centraliza la creación y formateo de popups para nodos y enlaces
 * del diagrama de Sankey, proporcionando templates consistentes y información
 * detallada con formato profesional.
 * 
 * Funcionalidades principales:
 * - Templates consistentes para diferentes tipos de nodos
 * - Formato estándar para valores numéricos con separadores de miles
 * - Descripciones detalladas y unidades claras
 * - Sistema extensible para nuevos tipos de popups
 * 
 * @author Kiro AI Assistant
 * @version 1.0.0
 */

class PopupManager {
    /**
     * Constructor del PopupManager
     * @param {Object} options - Opciones de configuración
     */
    constructor(options = {}) {
        this.dataManager = options.dataManager || null;
        this.styleManager = options.styleManager || null;
        this.nodeFactory = options.nodeFactory || null;

        // Configuración de formato
        this.formatConfig = {
            locale: 'en-US', // Cambio temporal para debugging
            currency: 'MXN',
            numberFormat: {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
                useGrouping: true
            },
            units: {
                energy: 'PJ',
                power: 'MW',
                percentage: '%',
                currency: 'MXN'
            }
        };

        // Templates de popup por tipo de nodo
        this.nodeTemplates = new Map();
        this.linkTemplates = new Map();

        // Inicializar templates por defecto
        this.initializeDefaultTemplates();

        console.log('PopupManager inicializado');
    }

    /**
     * Inicializa los templates por defecto para diferentes tipos de nodos
     */
    initializeDefaultTemplates() {
        // === TEMPLATE PARA NODOS DE GENERACIÓN ELÉCTRICA ===
        const generationTemplate = {
            type: 'generation'
        };

        // === TEMPLATE DINÁMICO UNIVERSAL ===
        // Template que se adapta automáticamente según el tipo de energía del nodo
        const dynamicTemplate = {
            title: '%{label}',
            sections: [
                {
                    title: 'Descripción',
                    fields: [
                        { key: 'description', label: '', value: '%{description}', showLabel: false }
                    ]
                },
                {
                    title: 'Flujos Energéticos',
                    fields: [
                        // Campos dinámicos que se mostrarán según el tipo de energía
                        { key: 'input_total', label: 'Entradas', value: '%{input_total}', format: 'number', unit: 'PJ', condition: 'hasInputs' },
                        { key: 'output_total', label: 'Salidas', value: '%{output_total}', format: 'number', unit: 'PJ', condition: 'hasOutputs' },
                        { key: 'input_primaria', label: 'Entradas (Primaria)', value: '%{input_primaria}', format: 'number', unit: 'PJ', condition: 'hasPrimaryInputs' },
                        { key: 'output_primaria', label: 'Salidas (Primaria)', value: '%{output_primaria}', format: 'number', unit: 'PJ', condition: 'hasPrimaryOutputs' },
                        { key: 'input_secundaria', label: 'Entradas (Secundaria)', value: '%{input_secundaria}', format: 'number', unit: 'PJ', condition: 'hasSecondaryInputs' },
                        { key: 'output_secundaria', label: 'Salidas (Secundaria)', value: '%{output_secundaria}', format: 'number', unit: 'PJ', condition: 'hasSecondaryOutputs' },
                        { key: 'total', label: 'Total', value: '%{total}', format: 'number', unit: 'PJ', highlight: true, condition: 'hasTotal' }
                    ]
                }
            ],
            footer: 'Tipos de energía: %{energy_types_text} • Año: %{year}'
        };

        // === TEMPLATE PARA VARIACIÓN DE INVENTARIOS ===
        const inventoryVariationTemplate = {
            type: 'inventory_variation'
        };

        // === TEMPLATE SIMPLIFICADO PARA HUBS ===
        const hubTemplate = {
            title: '%{label}',
            sections: [
                {
                    title: '',
                    fields: [
                        { key: 'total_input', label: 'Total', value: '%{total_input}', format: 'number', unit: 'PJ', highlight: true }
                    ]
                }
            ],
            footer: 'Año: %{year}'
        };

        // === TEMPLATE SIMPLIFICADO PARA ENERGÉTICOS SECUNDARIOS ===
        const secondaryEnergyTemplate = {
            type: 'secondary_energy'
        };

        // Usar el mismo template dinámico para todos los tipos
        this.nodeTemplates.set('primary_energy', dynamicTemplate);
        this.nodeTemplates.set('transformation', dynamicTemplate);
        this.nodeTemplates.set('generation', generationTemplate);
        this.nodeTemplates.set('hub', hubTemplate); // Usar el nuevo template para hubs
        this.nodeTemplates.set('inventory_variation', inventoryVariationTemplate);
        this.nodeTemplates.set('consumption', dynamicTemplate);
        this.nodeTemplates.set('secondary_energy', secondaryEnergyTemplate); // Nuevo template para energéticos secundarios
        this.nodeTemplates.set('default', dynamicTemplate);

        // Template simple para nodos de fuente (solo es un marcador)
        this.nodeTemplates.set('simple_source', { type: 'simple_source' });

        console.log(`Inicializados ${this.nodeTemplates.size} templates de nodos`);
    }

    /**
     * Genera el popup para un nodo específico
     * @param {string} nodeName - Nombre del nodo
     * @param {Object} nodeData - Datos del nodo
     * @param {string} year - Año actual
     * @param {Object} additionalData - Datos adicionales para el popup
     * @param {string} format - Formato del popup ('html' o 'text')
     * @param {string|null} energyTypeToInclude - Tipo de energía a incluir
     * @param {string|null} explicitTemplateType - Permite especificar directamente el tipo de plantilla a usar (ej. 'simple_source', 'inventory_variation').
     * @returns {string} Popup formateado
     */
    generateNodePopup(nodeName, nodeData, year, additionalData = {}, format = 'text', energyTypeToInclude = null, explicitTemplateType = null) {
        try {
            // Determinar el tipo de template a usar
            const templateType = explicitTemplateType || this.determineNodeTemplateType(nodeName, nodeData);
            const template = this.nodeTemplates.get(templateType);

            if (!template) {
                console.warn(`Template "${templateType}" no encontrado, usando template por defecto`);
                return this.generateDefaultNodePopup(nodeName, nodeData, year, additionalData, format, energyTypeToInclude);
            }

            // Preparar datos para el template
            const templateData = this.prepareNodeTemplateData(nodeName, nodeData, year, additionalData, energyTypeToInclude);

            // Generar popup según el formato solicitado
            if (format === 'html') {
                return this.renderNodeTemplate(template, templateData);
            } else {
                return this.renderNodeTemplateAsText(template, templateData);
            }

        } catch (error) {
            console.error('Error generando popup para nodo:', error);
            return this.generateErrorPopup(nodeName, error.message, format);
        }
    }

    /**
     * Determina qué tipo de template usar para un nodo
     * @param {string} nodeName - Nombre del nodo
     * @param {Object} nodeData - Datos del nodo
     * @returns {string} Tipo de template
     */
    determineNodeTemplateType(nodeName, nodeData) {
        // Lista de nodos de generación eléctrica
        const generationNodes = [
            'Carboeléctrica',
            'Térmica Convencional',
            'Combustión Interna',
            'Turbogás',
            'Ciclo Combinado',
            'Nucleoeléctrica',
            'Cogeneración',
            'Geotérmica',
            'Eólica',
            'Solar Fotovoltaica'
        ];

        if (generationNodes.includes(nodeName)) {
            return 'generation';
        }

        // Lista de nodos que usarán el popup simplificado
        const simpleSourceNodes = [
            // 'Producción',
            // 'Importación',
            'Oferta Interna Bruta',
            'Consumo Propio del Sector',
            'Coquizadoras y Hornos',
            'Refinerías y Despuntadoras',
            'Plantas de Gas y Fraccionadoras',
            'Centrales Eléctricas',
            'Carbón mineral', 'Petróleo crudo', 'Condensados', 'Gas natural',
            'Energía Nuclear', 'Energia Hidraúlica', 'Energía Hidráulica',
            'Geoenergía', 'Energía solar', 'Energía eólica', 'Bagazo de caña',
            'Leña', 'Biogás'
        ];

        // Mapeo de nombres de nodos a tipos de template
        const nodeTypeMapping = {
            // Nodos de transformación

            // Nodos hub
            'Oferta Total': 'hub',

            // Nodos de consumo
            'Consumo Final': 'consumption',

            // Nodos de flujo
            'Importación': 'simple_source',
            'Producción': 'simple_source',
            'Variación de Inventarios': 'inventory_variation',
            'Oferta Interna Bruta': 'simple_source',
            'Exportación': 'simple_source',
            'Energía No Aprovechada': 'simple_source'
        };

        // Verificar mapeo directo
        if (nodeTypeMapping[nodeName]) {
            return nodeTypeMapping[nodeName];
        }

        // Detectar energéticos secundarios por additionalData
        if (nodeData && nodeData.tipo === 'Energía Secundaria') {
            return 'secondary_energy';
        }

        // Inferir tipo basado en características del nodo
        if (nodeData && nodeData['Nodos Hijo']) {
            const children = nodeData['Nodos Hijo'];
            const hasOnlyPrimaryEnergy = children.every(child => child.tipo === 'Energía Primaria');

            if (hasOnlyPrimaryEnergy) {
                return 'primary_energy';
            }
        }

        // Inferir por nombre
        if (nodeName.includes('Generación') || nodeName.includes('Eléctrica')) {
            return 'generation';
        }

        if (nodeName.includes('Transformación') || nodeName.includes('Refinería') || nodeName.includes('Planta')) {
            return 'transformation';
        }

        if (nodeName.includes('Consumo')) {
            return 'consumption';
        }

        if (nodeName.includes('Hub') || nodeName.includes('Total')) {
            return 'hub';
        }

        return 'default';
    }

    /**
     * Prepara los datos necesarios para renderizar un template
     * @param {string} nodeName - Nombre del nodo
     * @param {Object} nodeData - Datos del nodo
     * @param {string} year - Año actual
     * @param {Object} additionalData - Datos adicionales
     * @param {string|null} energyTypeToInclude - Tipo de energía a incluir
     * @returns {Object} Datos preparados para el template
     */
    prepareNodeTemplateData(nodeName, nodeData, year, additionalData, energyTypeToInclude = null) {
        const templateData = {
            label: nodeName,
            year: year,
            unit: 'PJ', // Siempre usar PJ para valores energéticos
            description: nodeData?.descripcion || additionalData.description || 'Sin descripción disponible',
            ...additionalData
        };

        // Añadir condiciones para el template de variación de inventarios.
        // Se hace aquí para que aplique sin importar si el nodo tiene hijos o no,
        // ya que los datos relevantes vienen en `additionalData`.
        if (additionalData.variacion_positiva !== undefined) {
            templateData.hasPositiveVariation = additionalData.variacion_positiva > 0;
        }
        if (additionalData.variacion_negativa !== undefined) {
            templateData.hasNegativeVariation = additionalData.variacion_negativa < 0;
        }

        // Añadir condiciones para energéticos secundarios
        if (additionalData.total_consumption !== undefined) {
            templateData.hasConsumption = additionalData.total_consumption > 0;
        }
        if (additionalData.efficiency !== undefined) {
            templateData.hasEfficiency = parseFloat(additionalData.efficiency) > 0;
        }
        // Procesar datos específicos según el tipo de nodo
        if (nodeData && nodeData['Nodos Hijo']) {
            // Si ya se proporcionó un desglose precalculado en additionalData, usarlo
            // Esto es crucial para nodos como Importación/Producción/Variación donde ya filtramos los hijos
            const breakdown = additionalData.total !== undefined || additionalData.input_total !== undefined || additionalData.output_total !== undefined
                ? additionalData // Si ya tiene totales, asumimos que es un desglose precalculado
                : this.calculateNodeBreakdown(nodeData, year, energyTypeToInclude);

            Object.assign(templateData, breakdown);

            // Agregar condiciones para mostrar campos dinámicamente
            templateData.hasInputs = breakdown.input_total > 0;
            templateData.hasOutputs = breakdown.output_total > 0;
            templateData.hasPrimaryInputs = breakdown.input_primaria > 0;
            templateData.hasPrimaryOutputs = breakdown.output_primaria > 0;
            templateData.hasSecondaryInputs = breakdown.input_secundaria > 0;
            templateData.hasSecondaryOutputs = breakdown.output_secundaria > 0;
            templateData.hasTotal = breakdown.total !== 0;

            // Crear texto descriptivo de tipos de energía
            if (breakdown.energy_types && breakdown.energy_types.length > 0) {
                templateData.energy_types_text = breakdown.energy_types.join(', ');
            } else {
                templateData.energy_types_text = 'No especificado';
            }
        } else {
            // Para nodos sin hijos, pero con datos en additionalData (ej. Variación de Inventarios que ya tiene variacion_positiva/negativa)
            if (additionalData.total !== undefined || additionalData.input_total !== undefined || additionalData.output_total !== undefined) {
                // Si additionalData tiene totales, asignarlos directamente
                Object.assign(templateData, additionalData);
                templateData.hasInputs = additionalData.input_total > 0;
                templateData.hasOutputs = additionalData.output_total > 0;
                templateData.hasTotal = additionalData.total !== 0;

                // Asegurarse de que energy_types_text no sea indefinido si no hay hijos para calcularlo
                if (!templateData.energy_types_text) {
                    templateData.energy_types_text = 'No especificado';
                }
            } else {
                // Para nodos sin hijos y sin totales en additionalData, establecer condiciones por defecto
                templateData.hasInputs = false;
                templateData.hasOutputs = false;
                templateData.hasPrimaryInputs = false;
                templateData.hasPrimaryOutputs = false;
                templateData.hasSecondaryInputs = false;
                templateData.hasSecondaryOutputs = false;
                templateData.hasTotal = false;
                templateData.energy_types_text = 'No especificado';
            }
        }

        return templateData;
    }

    /**
     * Calcula el desglose de un nodo basado en sus hijos
     * @param {Object} nodeData - Datos del nodo
     * @param {string} year - Año a procesar
     * @param {string|null} energyTypeToInclude - Opcional. Si se especifica, solo incluye este tipo de energía ('Energía Primaria', 'Energía Secundaria')
     * @returns {Object} Desglose calculado
     */
    calculateNodeBreakdown(nodeData, year, energyTypeToInclude = null) {
        const breakdown = {
            // Totales por tipo de energía
            energia_primaria: 0,
            energia_secundaria: 0,
            total: 0,

            // Flujos de entrada (valores positivos)
            input_total: 0,
            input_primaria: 0,
            input_secundaria: 0,

            // Flujos de salida (valores negativos convertidos a positivos)
            output_total: 0,
            output_primaria: 0,
            output_secundaria: 0,

            // Clasificación tradicional (para compatibilidad)
            importacion: 0,
            produccion: 0,
            variacion: 0,

            // Información de los hijos
            children: [],
            energy_types: new Set(),
            has_primary: false,
            has_secondary: false
        };

        if (!nodeData['Nodos Hijo']) {
            return breakdown;
        }

        for (const child of nodeData['Nodos Hijo']) {
            const value = child[year];
            if (value !== undefined && value !== 0) {
                const childName = child['Nodo Hijo'];
                const childType = child.tipo || 'Unknown';
                const absValue = Math.abs(value);

                // APLICAR FILTRO DE TIPO DE ENERGÍA AQUÍ
                if (energyTypeToInclude && childType !== energyTypeToInclude) {
                    continue; // Saltar si el tipo de energía no coincide con el filtro
                }

                // Sumar al total general
                breakdown.total += value;

                // Clasificar por tipo de energía
                if (childType === 'Energía Primaria') {
                    breakdown.energia_primaria += value;
                    breakdown.has_primary = true;
                    breakdown.energy_types.add('Primaria');

                    // Clasificar como entrada o salida
                    if (value > 0) {
                        breakdown.input_total += absValue;
                        breakdown.input_primaria += absValue;
                    } else {
                        breakdown.output_total += absValue;
                        breakdown.output_primaria += absValue;
                    }
                } else if (childType === 'Energía Secundaria') {
                    breakdown.energia_secundaria += value;
                    breakdown.has_secondary = true;
                    breakdown.energy_types.add('Secundaria');

                    // Clasificar como entrada o salida
                    if (value > 0) {
                        breakdown.input_total += absValue;
                        breakdown.input_secundaria += absValue;
                    } else {
                        breakdown.output_total += absValue;
                        breakdown.output_secundaria += absValue;
                    }
                }

                // Clasificación tradicional por nombre (para compatibilidad)
                if (childName.includes('Importación') || child.tipo === 'Importación') {
                    breakdown.importacion += value;
                } else if (childName.includes('Producción') || child.tipo === 'Producción') {
                    breakdown.produccion += value;
                } else if (childName.includes('Variación') || child.tipo === 'Variación') {
                    breakdown.variacion += value;
                }

                breakdown.children.push({
                    name: childName,
                    value: value,
                    absValue: absValue,
                    type: childType,
                    color: child.color,
                    isInput: value > 0,
                    isOutput: value < 0
                });
            }
        }

        // Convertir Set a Array para facilitar el uso
        breakdown.energy_types = Array.from(breakdown.energy_types);

        return breakdown;
    }

    /**
     * Renderiza un template de nodo con los datos proporcionados (formato HTML)
     * @param {Object} template - Template a renderizar
     * @param {Object} data - Datos para el template
     * @returns {string} HTML renderizado
     */
    renderNodeTemplate(template, data) {
        let html = `<div class="popup-container">`;

        // Título del popup
        html += `<div class="popup-title">${this.interpolateTemplate(template.title, data)}</div>`;

        // Renderizar secciones
        for (const section of template.sections) {
            html += `<div class="popup-section">`;

            if (section.title) {
                html += `<div class="popup-section-title">${section.title}</div>`;
            }

            html += `<div class="popup-fields">`;

            for (const field of section.fields) {
                // Evaluar condición si existe
                if (field.condition && !data[field.condition]) {
                    continue; // Saltar este campo si la condición no se cumple
                }

                const value = this.getFieldValue(field, data);
                if (value === undefined || value === null || value === '' || value === 'N/A' || value === 0) {
                    continue; // Saltar campos vacíos
                }

                const formattedValue = this.formatFieldValue(value, field.format, field.unit);
                const fieldClass = field.highlight ? 'popup-field highlight' : 'popup-field';

                html += `<div class="${fieldClass}">`;
                if (field.showLabel !== false) {
                    html += `<span class="popup-field-label">${field.label}:</span> `;
                }
                html += `<span class="popup-field-value">${formattedValue}</span>`;
                html += `</div>`;
            }

            html += `</div></div>`;
        }

        // Footer del popup
        if (template.footer) {
            html += `<div class="popup-footer">${this.interpolateTemplate(template.footer, data)}</div>`;
        }

        html += `</div>`;

        return html;
    }

    /**
     * Renderiza un template de nodo como texto plano (para Plotly)
     * @param {Object} template - Template a renderizar
     * @param {Object} data - Datos para el template
     * @returns {string} Texto plano renderizado
     */
    renderNodeTemplateAsText(template, data) {
        // Lógica especial para el template simplificado de nodos fuente
        if (template.type === 'simple_source') {
            console.log(`[DEBUG - PopupManager - SimpleSource] Data recibida:`, data);
            const totalValue = data.total_input ?? data.total ?? 0;
            return `${data.label}: ${this.formatNumber(totalValue)} ${data.unit || 'PJ'}`;
        }

        // Lógica especial para nodos de generación eléctrica
        if (template.type === 'generation') {
            const entrada = this.formatNumber(data.input_total || 0);
            const salida = this.formatNumber(data.output_total || 0);
            const eficiencia = data.efficiency ? this.formatNumber(data.efficiency) : 'N/A';
            return `${data.label}\n↓${entrada}PJ ↑${salida}PJ ⚡${eficiencia}%`;
        }

        // Lógica especial para energéticos secundarios
        if (template.type === 'secondary_energy') {
            const totalValue = this.formatNumber(data.total_production || 0);
            return `${data.label}: ${totalValue} PJ`;
        }

        // Lógica especial para Variación de Inventarios (reintroducida y corregida)
        if (template.type === 'inventory_variation') {
            let text = `${data.label}\n`; // Título del nodo
            if (data.variacion_positiva) {
                text += `↑ ${this.formatNumber(data.variacion_positiva)} PJ\n`;
            }
            if (data.variacion_negativa) {
                text += `↓ ${this.formatNumber(data.variacion_negativa)} PJ\n`;
            }
            // Se eliminan las líneas para el Total y el Año
            // if (data.total !== undefined && data.total !== 0) {
            //     text += `Total: ${this.formatNumber(data.total)} PJ\n`;
            // }
            // text += `\nAño: ${data.year}`;
            return text;
        }

        let text = `${this.interpolateTemplate(template.title, data)}\n`;

        // Renderizar secciones
        for (const section of template.sections) {
            if (section.title) {
                text += `\n${section.title}:\n`;
            }

            for (const field of section.fields) {
                // Evaluar condición si existe
                if (field.condition && !data[field.condition]) {
                    continue; // Saltar este campo si la condición no se cumple
                }

                const value = this.getFieldValue(field, data);
                // Solo saltar si el valor es estrictamente undefined, null, '', o 'N/A'
                // No saltar si el valor es 0, ya que 0 puede ser un flujo válido.
                if (value === undefined || value === null || value === '' || value === 'N/A') {
                    continue; // Saltar campos vacíos
                }

                const formattedValue = this.formatFieldValue(value, field.format, field.unit);
                const prefix = field.highlight ? '• ' : '  ';
                const label = field.label ? `${field.label}: ` : '';

                // Lógica especial para la descripción, mostrarla sin etiqueta si no hay un label explícito
                if (field.key === 'description' && data.description && data.description.trim() !== '' && data.description !== 'Sin descripción disponible') {
                    text += `\n${data.description}\n`; // La descripción va sin prefijo/label en una línea separada
                } else {
                    // Para todos los demás campos, aplicar el formato estándar
                    text += `${prefix}${label}${formattedValue}\n`;
                }
            }
        }

        // Footer del popup
        if (template.footer) {
            text += `\n${this.interpolateTemplate(template.footer, data)}`;
        }

        return text;
    }

    /**
     * Obtiene el valor de un campo del template
     * @param {Object} field - Definición del campo
     * @param {Object} data - Datos disponibles
     * @returns {*} Valor del campo
     */
    getFieldValue(field, data) {
        // Si el valor es una cadena y empieza con '%{', es un placeholder a interpolar
        if (typeof field.value === 'string' && field.value.startsWith('%{')) {
            return this.interpolateTemplate(field.value, data);
        } else if (typeof field.value === 'string' && data.hasOwnProperty(field.value)) {
            // Si es una cadena y coincide con una propiedad directa en data
            return data[field.value];
        } else {
            return field.value; // Devolver el valor literal si no es un placeholder ni una clave directa
        }
    }

    /**
     * Formatea un valor según el tipo especificado
     * @param {*} value - Valor a formatear
     * @param {string} format - Tipo de formato ('number', 'percentage', 'currency')
     * @param {string} unit - Unidad adicional
     * @returns {string} Valor formateado
     */
    formatFieldValue(value, format, unit) {
        if (value === undefined || value === null || value === '') {
            return 'N/A';
        }

        switch (format) {
            case 'number':
                const formattedNumber = this.formatNumber(value);
                return unit ? `${formattedNumber} ${unit}` : formattedNumber;

            case 'percentage':
                return `${this.formatNumber(value)}%`;

            case 'currency':
                return this.formatCurrency(value);

            default:
                return String(value);
        }
    }

    /**
     * Formatea un número con separadores de miles
     * @param {number} value - Número a formatear
     * @returns {string} Número formateado
     */
    formatNumber(value) {
        if (typeof value !== 'number') {
            const parsed = parseFloat(value);
            if (isNaN(parsed)) return String(value);
            value = parsed;
        }

        return value.toLocaleString(this.formatConfig.locale, this.formatConfig.numberFormat);
    }

    /**
     * Formatea un valor como moneda
     * @param {number} value - Valor a formatear
     * @returns {string} Valor formateado como moneda
     */
    formatCurrency(value) {
        if (typeof value !== 'number') {
            const parsed = parseFloat(value);
            if (isNaN(parsed)) return String(value);
            value = parsed;
        }

        return value.toLocaleString(this.formatConfig.locale, {
            style: 'currency',
            currency: this.formatConfig.currency
        });
    }

    /**
     * Interpola variables en un template string
     * @param {string} template - Template con variables
     * @param {Object} data - Datos para interpolación
     * @returns {string} String interpolado
     */
    interpolateTemplate(template, data) {
        return template.replace(/%\{([^}]+)\}/g, (match, key) => {
            const keys = key.split('.');
            let value = data;

            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return match; // Mantener el placeholder si no se encuentra
                }
            }

            return String(value);
        });
    }

    /**
     * Genera un popup por defecto cuando no hay template específico
     * @param {string} nodeName - Nombre del nodo
     * @param {Object} nodeData - Datos del nodo
     * @param {string} year - Año actual
     * @param {Object} additionalData - Datos adicionales
     * @param {string} format - Formato del popup ('html' o 'text')
     * @returns {string} Popup por defecto formateado
     */
    generateDefaultNodePopup(nodeName, nodeData, year, additionalData, format = 'text', energyTypeToInclude = null) {
        const breakdown = nodeData ? this.calculateNodeBreakdown(nodeData, year, energyTypeToInclude) : {};

        if (format === 'html') {
            let html = `<div class="popup-container">`;
            html += `<div class="popup-title">${nodeName}</div>`;

            if (breakdown.total !== 0) {
                html += `<div class="popup-section">`;
                html += `<div class="popup-section-title">Información Energética</div>`;
                html += `<div class="popup-fields">`;

                if (breakdown.importacion !== 0) {
                    html += `<div class="popup-field">`;
                    html += `<span class="popup-field-label">Importación:</span> `;
                    html += `<span class="popup-field-value">${this.formatNumber(breakdown.importacion)} PJ</span>`;
                    html += `</div>`;
                }

                if (breakdown.produccion !== 0) {
                    html += `<div class="popup-field">`;
                    html += `<span class="popup-field-label">Producción:</span> `;
                    html += `<span class="popup-field-value">${this.formatNumber(breakdown.produccion)} PJ</span>`;
                    html += `</div>`;
                }

                if (breakdown.variacion !== 0) {
                    html += `<div class="popup-field">`;
                    html += `<span class="popup-field-label">Variación:</span> `;
                    html += `<span class="popup-field-value">${this.formatNumber(breakdown.variacion)} PJ</span>`;
                    html += `</div>`;
                }

                html += `<div class="popup-field highlight">`;
                html += `<span class="popup-field-label">Total:</span> `;
                html += `<span class="popup-field-value">${this.formatNumber(Math.abs(breakdown.total))} PJ</span>`;
                html += `</div>`;

                html += `</div></div>`;
            }

            html += `<div class="popup-footer">Año: ${year}</div>`;
            html += `</div>`;

            return html;
        } else {
            // Formato texto plano
            let text = `${nodeName}\n`;

            if (breakdown.total !== 0) {
                text += `\nInformación Energética:\n`;

                if (breakdown.importacion !== 0) {
                    text += `  Importación: ${this.formatNumber(breakdown.importacion)} PJ\n`;
                }

                if (breakdown.produccion !== 0) {
                    text += `  Producción: ${this.formatNumber(breakdown.produccion)} PJ\n`;
                }

                if (breakdown.variacion !== 0) {
                    text += `  Variación: ${this.formatNumber(breakdown.variacion)} PJ\n`;
                }

                text += `• Total: ${this.formatNumber(Math.abs(breakdown.total))} PJ\n`;
            }

            text += `\nAño: ${year}`;

            return text;
        }
    }

    /**
     * Genera un popup de error
     * @param {string} nodeName - Nombre del nodo
     * @param {string} errorMessage - Mensaje de error
     * @param {string} format - Formato del popup ('html' o 'text')
     * @returns {string} Popup de error formateado
     */
    generateErrorPopup(nodeName, errorMessage, format = 'text') {
        if (format === 'html') {
            return `<div class="popup-container error">
                <div class="popup-title">${nodeName}</div>
                <div class="popup-section">
                    <div class="popup-field">
                        <span class="popup-field-label">Error:</span>
                        <span class="popup-field-value">${errorMessage}</span>
                    </div>
                </div>
            </div>`;
        } else {
            return `${nodeName}\n\nError: ${errorMessage}`;
        }
    }

    /**
     * Genera el popup para un enlace específico
     * @param {string} energyType - Tipo de energético del enlace
     * @param {number} value - Valor del flujo energético
     * @param {string} sourceNode - Nodo origen del enlace
     * @param {string} targetNode - Nodo destino del enlace
     * @param {string} color - Color del enlace
     * @param {string} year - Año actual
     * @param {Object} additionalData - Datos adicionales para el popup
     * @param {string} format - Formato del popup ('html' o 'text')
     * @returns {string} Popup formateado para el enlace
     */
    generateLinkPopup(energyType, value, sourceNode, targetNode, color, year, additionalData = {}, format = 'text') {
        try {
            // Preparar datos para el template del enlace
            const templateData = this.prepareLinkTemplateData(energyType, value, sourceNode, targetNode, color, year, additionalData);

            // Generar popup según el formato solicitado
            if (format === 'html') {
                return this.renderLinkTemplateAsHTML(templateData);
            } else {
                return this.renderLinkTemplateAsText(templateData);
            }

        } catch (error) {
            console.error('Error generando popup para enlace:', error);
            return this.generateErrorLinkPopup(energyType, value, error.message, format);
        }
    }

    /**
     * Prepara los datos necesarios para renderizar un template de enlace
     * @param {string} energyType - Tipo de energético
     * @param {number} value - Valor del flujo
     * @param {string} sourceNode - Nodo origen
     * @param {string} targetNode - Nodo destino
     * @param {string} color - Color del enlace
     * @param {string} year - Año actual
     * @param {Object} additionalData - Datos adicionales
     * @returns {Object} Datos preparados para el template
     */
    prepareLinkTemplateData(energyType, value, sourceNode, targetNode, color, year, additionalData) {
        // Log para debugging
        if (energyType === 'Carbón mineral') {
            console.log('PopupManager prepareLinkTemplateData recibió:', { energyType, value, sourceNode, targetNode });
        }

        const absValue = Math.abs(value);
        const isNegative = value < 0;

        // Determinar el tipo de flujo basado en el contexto
        const flowType = this.determineLinkFlowType(sourceNode, targetNode, energyType);

        // Crear descripción del flujo
        const flowDescription = this.generateFlowDescription(energyType, sourceNode, targetNode, flowType);

        const templateData = {
            energyType: energyType, // Usar el energyType pasado como primer argumento
            value: value,
            absValue: absValue,
            formattedValue: this.formatNumber(absValue),
            isNegative: isNegative,
            sourceNode: sourceNode,
            targetNode: targetNode,
            color: color,
            year: year,
            unit: 'PJ',
            flowType: flowType,
            flowDescription: flowDescription,
            direction: isNegative ? 'salida' : 'entrada',
            ...additionalData
        };

        return templateData;
    }

    /**
     * Determina el tipo de flujo energético basado en los nodos origen y destino
     * @param {string} sourceNode - Nodo origen
     * @param {string} targetNode - Nodo destino
     * @param {string} energyType - Tipo de energético
     * @returns {string} Tipo de flujo
     */
    determineLinkFlowType(sourceNode, targetNode, energyType) {
        // Mapeo de patrones de flujo
        const flowPatterns = {
            'primary_supply': {
                sources: ['Producción', 'Importación de energéticos primarios', 'Variación de inventarios de Energéticos primarios'],
                targets: ['Oferta Total'],
                description: 'Suministro de energía primaria'
            },
            'hub_distribution': {
                sources: ['Oferta Total'],
                targets: ['Oferta Interna Bruta', 'Exportación', 'Energía No Aprovechada'],
                description: 'Distribución desde hub central'
            },
            'transformation_input': {
                sources: ['Oferta Interna Bruta'],
                targets: ['Refinerías y Despuntadoras', 'Plantas de Gas y Fraccionadoras', 'Coquizadoras y Hornos', 'Consumo Propio del Sector'],
                description: 'Entrada a procesos de transformación'
            },
            'fuel_to_generation': {
                sources: [], // Se determina dinámicamente por tipo de energético
                targets: ['Carboeléctrica', 'Térmica Convencional', 'Combustión Interna', 'Turbogás', 'Ciclo Combinado', 'Nucleoeléctrica', 'Cogeneración', 'Geotérmica', 'Eólica', 'Solar Fotovoltaica'],
                description: 'Combustible para generación eléctrica'
            },
            'generation_to_grid': {
                sources: ['Carboeléctrica', 'Térmica Convencional', 'Combustión Interna', 'Turbogás', 'Ciclo Combinado', 'Nucleoeléctrica', 'Cogeneración', 'Geotérmica', 'Eólica', 'Solar Fotovoltaica'],
                targets: ['Centrales Eléctricas'],
                description: 'Generación eléctrica'
            }
        };

        // Verificar cada patrón
        for (const [flowType, pattern] of Object.entries(flowPatterns)) {
            if (flowType === 'fuel_to_generation') {
                // Para fuel_to_generation, verificar si el target es una tecnología de generación
                if (pattern.targets.includes(targetNode)) {
                    return flowType;
                }
            } else {
                // Para otros patrones, verificar coincidencia exacta
                if (pattern.sources.includes(sourceNode) && pattern.targets.includes(targetNode)) {
                    return flowType;
                }
            }
        }

        return 'generic_flow';
    }

    /**
     * Genera una descripción detallada del flujo energético
     * @param {string} energyType - Tipo de energético
     * @param {string} sourceNode - Nodo origen
     * @param {string} targetNode - Nodo destino
     * @param {string} flowType - Tipo de flujo
     * @returns {string} Descripción del flujo
     */
    generateFlowDescription(energyType, sourceNode, targetNode, flowType) {
        const flowDescriptions = {
            'primary_supply': `Suministro de ${energyType} desde ${sourceNode}`,
            'hub_distribution': `Distribución de ${energyType} hacia ${targetNode}`,
            'transformation_input': `${energyType} como insumo para ${targetNode}`,
            'fuel_to_generation': `${energyType} utilizado en ${targetNode}`,
            'generation_to_grid': `Electricidad generada por ${sourceNode}`,
            'generic_flow': `Flujo de ${energyType} de ${sourceNode} a ${targetNode}`
        };

        return flowDescriptions[flowType] || flowDescriptions['generic_flow'];
    }

    /**
     * Renderiza un template de enlace como HTML
     * @param {Object} data - Datos del enlace
     * @returns {string} HTML renderizado
     */
    renderLinkTemplateAsHTML(data) {
        let html = `<div class="popup-container link-popup">`;

        // Título con color del enlace
        html += `<div class="popup-title" style="border-bottom-color: ${data.color};">`;
        html += `<span class="energy-type">${data.energyType}</span>`;
        html += `</div>`;

        // Información del flujo
        html += `<div class="popup-section">`;
        html += `<div class="popup-section-title">Información del Flujo</div>`;
        html += `<div class="popup-fields">`;

        // Valor del flujo
        html += `<div class="popup-field highlight">`;
        html += `<span class="popup-field-label">Valor:</span> `;
        html += `<span class="popup-field-value">${data.formattedValue} ${data.unit}</span>`;
        if (data.isNegative) {
            html += ` <span class="flow-indicator negative">(${data.direction})</span>`;
        }
        html += `</div>`;

        // Descripción del flujo
        html += `<div class="popup-field">`;
        html += `<span class="popup-field-label">Tipo:</span> `;
        html += `<span class="popup-field-value">${data.flowDescription}</span>`;
        html += `</div>`;

        // Origen y destino
        html += `<div class="popup-field">`;
        html += `<span class="popup-field-label">Origen:</span> `;
        html += `<span class="popup-field-value">${data.sourceNode}</span>`;
        html += `</div>`;

        html += `<div class="popup-field">`;
        html += `<span class="popup-field-label">Destino:</span> `;
        html += `<span class="popup-field-value">${data.targetNode}</span>`;
        html += `</div>`;

        html += `</div></div>`;

        // Footer
        html += `<div class="popup-footer">Año: ${data.year}</div>`;
        html += `</div>`;

        return html;
    }

    /**
     * Renderiza un template de enlace como texto plano
     * @param {Object} data - Datos del enlace
     * @returns {string} Texto plano renderizado
     */
    renderLinkTemplateAsText(data) {
        // Log para debugging
        if (data.energyType === 'Carbón mineral') {
            console.log('PopupManager renderLinkTemplateAsText:', data);
            console.log('Valor final del popup:', `${data.energyType}: ${this.formatNumber(data.value)} ${data.unit}`);
        }

        // Formato simplificado: Nombre del flujo y su valor.
        // Usar formattedValue para asegurar consistencia
        return `${data.energyType}: ${data.formattedValue} ${data.unit}`;
    }

    /**
     * Genera un popup de error para enlaces
     * @param {string} energyType - Tipo de energético
     * @param {number} value - Valor del flujo
     * @param {string} errorMessage - Mensaje de error
     * @param {string} format - Formato del popup
     * @returns {string} Popup de error formateado
     */
    generateErrorLinkPopup(energyType, value, errorMessage, format = 'text') {
        if (format === 'html') {
            return `<div class="popup-container error">
                <div class="popup-title">${energyType || 'Enlace'}</div>
                <div class="popup-section">
                    <div class="popup-field">
                        <span class="popup-field-label">Valor:</span>
                        <span class="popup-field-value">${this.formatNumber(Math.abs(value || 0))} PJ</span>
                    </div>
                    <div class="popup-field">
                        <span class="popup-field-label">Error:</span>
                        <span class="popup-field-value">${errorMessage}</span>
                    </div>
                </div>
            </div>`;
        } else {
            return `${energyType || 'Enlace'}\n\n• Valor: ${this.formatNumber(Math.abs(value || 0))} PJ\n• Error: ${errorMessage}`;
        }
    }

    /**
     * Registra un nuevo template de nodo
     * @param {string} templateType - Tipo de template
     * @param {Object} template - Definición del template
     */
    registerNodeTemplate(templateType, template) {
        this.nodeTemplates.set(templateType, template);
        console.log(`Template de nodo "${templateType}" registrado`);
    }

    /**
     * Obtiene todos los templates disponibles
     * @returns {Array} Array con tipos de templates disponibles
     */
    getAvailableTemplates() {
        return Array.from(this.nodeTemplates.keys());
    }

    /**
     * Genera CSS para los estilos de popup
     * @returns {string} CSS para popups
     */
    generatePopupCSS() {
        return `
            .popup-container {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #2c3e50;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                padding: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                max-width: 280px;
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid rgba(0, 0, 0, 0.1);
                word-wrap: break-word;
                overflow-wrap: break-word;
            }
            
            .popup-container.error {
                border-color: #e74c3c;
                background: rgba(255, 235, 235, 0.95);
            }
            
            .popup-title {
                font-weight: 600;
                font-size: 13px;
                color: #34495e;
                margin-bottom: 8px;
                padding-bottom: 6px;
                border-bottom: 2px solid #3498db;
                word-wrap: break-word;
                line-height: 1.3;
            }
            
            .popup-section {
                margin-bottom: 10px;
            }
            
            .popup-section:last-child {
                margin-bottom: 0;
            }
            
            .popup-section-title {
                font-weight: 500;
                font-size: 11px;
                color: #7f8c8d;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 6px;
                padding-bottom: 2px;
                border-bottom: 1px solid #ecf0f1;
            }
            
            .popup-fields {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .popup-field {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding: 2px 0;
                min-height: 18px;
            }
            
            .popup-field.highlight {
                font-weight: 600;
                background: rgba(52, 152, 219, 0.1);
                padding: 4px 6px;
                border-radius: 4px;
            }
            
            /* Estilos específicos para popups de enlaces */
            .popup-container.link-popup {
                border-left: 4px solid #3498db;
            }
            
            .popup-container.link-popup .popup-title {
                border-bottom-width: 2px;
                border-bottom-style: solid;
            }
            
            .energy-type {
                font-weight: 600;
                color: #2c3e50;
            }
            
            .flow-indicator {
                font-size: 10px;
                font-weight: 500;
                padding: 1px 4px;
                border-radius: 3px;
                margin-left: 4px;
            }
            
            .flow-indicator.negative {
                background: rgba(231, 76, 60, 0.1);
                color: #e74c3c;
            }
            
            .flow-indicator.positive {
                background: rgba(39, 174, 96, 0.1);
                color: #27ae60;
            }
                border-left: 3px solid #3498db;
            }
            
            .popup-field-label {
                color: #7f8c8d;
                font-weight: 500;
                flex-shrink: 0;
                margin-right: 8px;
                min-width: 60px;
            }
            
            .popup-field-value {
                color: #2c3e50;
                font-weight: 500;
                text-align: right;
                flex-grow: 1;
                word-wrap: break-word;
                overflow-wrap: break-word;
                max-width: 180px;
            }
            
            .popup-description {
                color: #2c3e50;
                font-size: 11px;
                line-height: 1.4;
                margin: 6px 0;
                padding: 6px;
                background: rgba(52, 152, 219, 0.05);
                border-radius: 4px;
                word-wrap: break-word;
                overflow-wrap: break-word;
            }
            
            .popup-footer {
                margin-top: 8px;
                padding-top: 6px;
                border-top: 1px solid #ecf0f1;
                font-size: 10px;
                color: #95a5a6;
                text-align: center;
                font-style: italic;
            }
            
            /* Scrollbar personalizado para webkit browsers */
            .popup-container::-webkit-scrollbar {
                width: 6px;
            }
            
            .popup-container::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.1);
                border-radius: 3px;
            }
            
            .popup-container::-webkit-scrollbar-thumb {
                background: rgba(52, 152, 219, 0.3);
                border-radius: 3px;
            }
            
            .popup-container::-webkit-scrollbar-thumb:hover {
                background: rgba(52, 152, 219, 0.5);
            }
        `;
    }

    /**
     * Aplica los estilos CSS de popup al documento
     */
    applyPopupStyles() {
        const css = this.generatePopupCSS();

        // Remover estilos anteriores si existen
        const existingStyle = document.getElementById('popup-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        // Crear nueva hoja de estilos
        const style = document.createElement('style');
        style.id = 'popup-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    /**
     * Formatea el valor de un campo según su tipo
     * @param {*} value - Valor a formatear
     * @param {string} format - Tipo de formato ('number', 'percentage', 'breakdown', etc.)
     * @param {string} unit - Unidad del valor
     * @returns {string} Valor formateado
     */
    formatFieldValue(value, format = 'text', unit = '') {
        if (value === undefined || value === null) {
            return 'N/A';
        }

        switch (format) {
            case 'number':
                return this.formatNumber(value);

            case 'percentage':
                return `${this.formatNumber(value)}%`;

            case 'breakdown':
                if (Array.isArray(value)) {
                    return value.map(item =>
                        `${item.name}: ${this.formatNumber(item.value)} ${unit} (${item.percentage}%)`
                    ).join('\n  ');
                }
                return value.toString();

            case 'currency':
                return new Intl.NumberFormat(this.formatConfig.locale, {
                    style: 'currency',
                    currency: this.formatConfig.currency
                }).format(value);

            default:
                return value.toString();
        }
    }

    /**
     * Formatea un número con separadores de miles
     * @param {number} value - Número a formatear
     * @returns {string} Número formateado
     */
    formatNumber(value) {
        if (typeof value !== 'number' || isNaN(value)) {
            return '0';
        }

        return new Intl.NumberFormat(this.formatConfig.locale, this.formatConfig.numberFormat).format(value);
    }

    /**
     * Obtiene la lista de templates disponibles
     * @returns {Object} Templates disponibles
     */
    getAvailableTemplates() {
        return {
            nodeTemplates: Array.from(this.nodeTemplates.keys()),
            linkTemplates: Array.from(this.linkTemplates.keys())
        };
    }

    /**
     * Obtiene estadísticas del PopupManager
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            nodeTemplates: this.nodeTemplates.size,
            linkTemplates: this.linkTemplates.size,
            formatConfig: this.formatConfig,
            availableTemplates: this.getAvailableTemplates()
        };
    }

    /**
     * Reinicia el PopupManager
     */
    reset() {
        this.nodeTemplates.clear();
        this.linkTemplates.clear();
        this.initializeDefaultTemplates();
        console.log('PopupManager reiniciado');
    }
}

// Exportar la clase para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PopupManager;
}