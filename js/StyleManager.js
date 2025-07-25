/**
 * StyleManager - Módulo para gestión centralizada de colores y estilos del diagrama de Sankey
 * 
 * Este módulo encapsula toda la lógica relacionada con la gestión de colores,
 * temas visuales y estilos consistentes para el diagrama de Sankey.
 * 
 * Funcionalidades principales:
 * - Paleta de colores profesional y consistente
 * - Sistema de temas intercambiables
 * - Gestión automática de colores para nuevos energéticos
 * - Validación y normalización de colores
 * - Generación de variaciones de color para diferentes estados
 * 
 * @author Kiro AI Assistant
 * @version 1.0.0
 */

class StyleManager {
    /**
     * Constructor del StyleManager
     * @param {Object} options - Opciones de configuración
     */
    constructor(options = {}) {
        this.currentTheme = options.theme || 'professional';
        this.colorPalette = new Map();
        this.energyTypeColors = new Map();
        this.customColors = new Map();
        this.colorIndex = 0;

        // Configuración de temas
        this.themes = {
            professional: {
                name: 'Profesional',
                background: '#ffffff',
                text: '#2c3e50',
                accent: '#3498db',
                success: '#27ae60',
                warning: '#f39c12',
                error: '#e74c3c'
            },
            dark: {
                name: 'Oscuro',
                background: '#2c3e50',
                text: '#ecf0f1',
                accent: '#3498db',
                success: '#27ae60',
                warning: '#f39c12',
                error: '#e74c3c'
            },
            energy: {
                name: 'Energético',
                background: '#f8f9fa',
                text: '#343a40',
                accent: '#007bff',
                success: '#28a745',
                warning: '#ffc107',
                error: '#dc3545'
            }
        };

        // Paleta de colores profesional y elegante para energéticos
        // Diseñada para máximo contraste y legibilidad en diagramas de Sankey
        this.baseEnergyColors = [
            // --- Energéticos Primarios ---
            '#000000ff', // Carbón mineral
            '#696969', // Petróleo crudo
            '#6A5ACD', // Condensados
            '#1E6091', // Gas natural
            '#CD853F', // Nuclear
            '#4682B4', // Hidráulica
            '#DC143C', // Geotérmica
            '#FF8C00', // Solar
            '#228B22', // Eólica
            '#D2691E', // Bagazo de caña
            '#8B4513', // Leña
            '#9ACD32', // Biogás

            // --- Energéticos Secundarios ---
            '#2F4F4F', // Coque de carbón
            '#36454F', // Coque de petróleo
            '#FF6347', // Gas licuado
            '#FF4500', // Gasolinas y naftas
            '#FFD700', // Querosenos
            '#B22222', // Diesel
            '#8B0000', // Combustóleo
            '#708090', // Otros energéticos
            '#20B2AA', // Gas natural seco
            '#FFD700'  // Energía eléctrica
        ];

        // === Degradados para tipos de nodos ===
        // Elegantes, con contraste y semántica visual clara
        this.nodeTypeGradients = {
            importacion:    ['#065084', '#B0E0E6'], // Azul cielo → Azul hielo
            variacion:    ['#87CEEB', '#B0E0E6'], // Azul cielo → Azul hielo
            produccion:     ['#065084', '#FFE082'], // Dorado → Dorado claro
            oferta:         ['#2E8B57', '#3CB371'], // Verde mar → Verde medio
            transformacion: ['#CD5C5C', '#E57373'], // Rojo indio → Rosa suave
            consumo:        ['#4169E1', '#5F9EA0'], // Azul royal → Azul cadete
            hub:            ['#483D8B', '#6A5ACD'], // Azul pizarra → Lavanda
            generacion:     ['#FFD700', '#FFF59D'], // Amarillo → Amarillo pálido
            distribucion:   ['#607D8B', '#90A4AE'], // Gris azulado → Plata
            perdidas:       ['#8B4513', '#D2B48C'], // Marrón → Tostado
            noAprovechada:  ['#778899', '#B0C4DE'], // Gris pizarra claro → Acero claro
            exportacion:    ['#8FBC8F', '#C1E1C1'], // Verde gris → Verde nieve
            default:        ['#696969', '#A9A9A9']  // Gris → Gris claro
        };
        
        
        this.initializeColorPalette();


    }

    /**
     * Inicializa la paleta de colores con los valores por defecto
     */
    initializeColorPalette() {
        // Mapear energéticos específicos a colores profesionales mejorados
        const energyMappings = {
            // === ENERGÉTICOS PRIMARIOS ===y
    'Carbón mineral':     '#696969',  // Gris acero profundo – sólido y sobrio
    'Petróleo crudo':     '#2C3E50',  // Azul petróleo – fuerza, elegancia y estabilidad
    'Condensados':        '#065084',  // Púrpura slate – sofisticado y técnico
    'Gas natural':        '#78B9B5',  // Azul océano – limpio y confiable
    'Energía Nuclear':    '#932F67',  // Bronce dorado – poder y control
    'Energía Hidráulica': '#00809D',  // Azul acero – agua, fluidez y equilibrio
    'Energia Hidraúlica': '#00809D',  // Variante repetida para consistencia semántica
    'Geoenergía':         '#DC143C',  // Rojo carmesí – energía del interior de la Tierra
    'Energía solar':      '#FFD700',  // Naranja vibrante – radiación solar intensa
    'Energía eólica':     '#437057',  // Verde bosque – aire limpio y naturaleza
    'Bagazo de caña':     '#97B067',  // Marrón claro – biomasa de origen vegetal
    'Leña':               '#B1AB86',  // Marrón silla – recurso tradicional
    'Biogás':             '#9ACD32',  // Verde lima – gas renovable y biológico

            // === ENERGÉTICOS SECUNDARIOS - TONOS INDUSTRIALES REFINADOS ===
            'Coque de carbón': '#2F4F4F',       // Gris pizarra oscuro - industrial pero elegante
            'Coque de petróleo': '#36454F',     // Gris carbón - producto refinado
            'Gas licuado de petróleo': '#FF6347', // Tomate - gas presurizado distintivo
            'Gasolinas y naftas': '#FF4500',    // Rojo naranja - combustible refinado
            'Querosenos': '#FFD700',            // Dorado - combustible de aviación premium
            'Diesel': '#B22222',                // Rojo ladrillo - combustible pesado robusto
            'Combustóleo': '#8B0000',           // Rojo oscuro - combustible industrial pesado
            'Otros energéticos': '#708090',     // Gris pizarra - categoría general
            'Gas natural seco': '#20B2AA',      // Verde azulado claro - gas procesado limpio
            'Energía eléctrica': '#FFD700'      // Dorado eléctrico - energía transformada
        };

        // Registrar colores de energéticos
        for (const [energy, color] of Object.entries(energyMappings)) {
            this.energyTypeColors.set(energy, color);
        }

        console.log('StyleManager inicializado con', this.energyTypeColors.size, 'colores de energéticos');
    }

    /**
     * Obtiene el color para un energético específico
     * @param {string} energyName - Nombre del energético
     * @param {string} fallbackType - Tipo de nodo para color de respaldo
     * @returns {string} Color hexadecimal
     */
    getEnergyColor(energyName, fallbackType = 'default') {
        // Verificar si ya tenemos un color asignado
        if (this.energyTypeColors.has(energyName)) {
            return this.energyTypeColors.get(energyName);
        }

        // Verificar colores personalizados
        if (this.customColors.has(energyName)) {
            return this.customColors.get(energyName);
        }

        // Asignar un nuevo color de la paleta base
        const newColor = this.assignNewColor(energyName);
        if (newColor) {
            return newColor;
        }

        // Usar color por tipo de nodo como último recurso
        return this.getNodeTypeColor(fallbackType);
    }

    /**
     * Obtiene el color para un tipo de nodo específico
     * @param {string} nodeType - Tipo de nodo
     * @returns {string} Color hexadecimal
     */
    getNodeTypeColor(nodeType) {
        const gradient = this.nodeTypeGradients[nodeType] || this.nodeTypeGradients.default;
        return gradient[0]; // Devolver el color principal del degradado
    }

    /**
     * Asigna un nuevo color de la paleta base a un energético
     * @param {string} energyName - Nombre del energético
     * @returns {string|null} Color asignado o null si no hay más colores
     */
    assignNewColor(energyName) {
        if (this.colorIndex >= this.baseEnergyColors.length) {
            // Generar un color aleatorio si se agotó la paleta
            const randomColor = this.generateRandomColor();
            this.customColors.set(energyName, randomColor);
            console.warn(`Color aleatorio asignado a "${energyName}": ${randomColor}`);
            return randomColor;
        }

        const newColor = this.baseEnergyColors[this.colorIndex];
        this.energyTypeColors.set(energyName, newColor);
        this.colorIndex++;

        console.log(`Nuevo color asignado a "${energyName}": ${newColor}`);
        return newColor;
    }

    /**
     * Genera un color aleatorio en formato hexadecimal
     * @returns {string} Color hexadecimal
     */
    generateRandomColor() {
        // Generar colores con buena saturación y brillo
        const hue = Math.floor(Math.random() * 360);
        const saturation = 60 + Math.floor(Math.random() * 40); // 60-100%
        const lightness = 40 + Math.floor(Math.random() * 20);  // 40-60%

        return this.hslToHex(hue, saturation, lightness);
    }

    /**
     * Convierte HSL a hexadecimal
     * @param {number} h - Matiz (0-360)
     * @param {number} s - Saturación (0-100)
     * @param {number} l - Luminosidad (0-100)
     * @returns {string} Color hexadecimal
     */
    hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    /**
     * Valida y normaliza un color
     * @param {string} color - Color a validar
     * @returns {string} Color normalizado
     */
    validateColor(color) {
        if (!color || typeof color !== 'string') {
            return this.nodeTypeGradients.default[0];
        }

        // Verificar formato hexadecimal
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (hexRegex.test(color)) {
            return color.toUpperCase();
        }

        // Verificar nombres de colores CSS básicos
        const cssColors = {
            'red': '#FF0000', 'green': '#008000', 'blue': '#0000FF',
            'yellow': '#FFFF00', 'orange': '#FFA500', 'purple': '#800080',
            'pink': '#FFC0CB', 'brown': '#A52A2A', 'black': '#000000',
            'white': '#FFFFFF', 'gray': '#808080', 'grey': '#808080'
        };

        const lowerColor = color.toLowerCase();
        if (cssColors[lowerColor]) {
            return cssColors[lowerColor];
        }

        console.warn(`Color inválido "${color}", usando color por defecto`);
        return this.nodeTypeGradients.default[0];
    }

    /**
     * Genera una variación más clara de un color
     * @param {string} color - Color base
     * @param {number} factor - Factor de aclarado (0-1)
     * @returns {string} Color aclarado
     */
    lightenColor(color, factor = 0.2) {
        const validColor = this.validateColor(color);
        const rgb = this.hexToRgb(validColor);

        if (!rgb) return validColor;

        const lighten = (value) => Math.min(255, Math.round(value + (255 - value) * factor));

        const newRgb = {
            r: lighten(rgb.r),
            g: lighten(rgb.g),
            b: lighten(rgb.b)
        };

        return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    }

    /**
     * Genera una variación más oscura de un color
     * @param {string} color - Color base
     * @param {number} factor - Factor de oscurecimiento (0-1)
     * @returns {string} Color oscurecido
     */
    darkenColor(color, factor = 0.2) {
        const validColor = this.validateColor(color);
        const rgb = this.hexToRgb(validColor);

        if (!rgb) return validColor;

        const darken = (value) => Math.max(0, Math.round(value * (1 - factor)));

        const newRgb = {
            r: darken(rgb.r),
            g: darken(rgb.g),
            b: darken(rgb.b)
        };

        return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    }

    /**
     * Convierte hexadecimal a RGB
     * @param {string} hex - Color hexadecimal
     * @returns {Object|null} Objeto RGB o null si es inválido
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Convierte RGB a hexadecimal
     * @param {number} r - Rojo (0-255)
     * @param {number} g - Verde (0-255)
     * @param {number} b - Azul (0-255)
     * @returns {string} Color hexadecimal
     */
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    /**
     * Establece un color personalizado para un energético
     * @param {string} energyName - Nombre del energético
     * @param {string} color - Color a asignar
     */
    setCustomColor(energyName, color) {
        const validColor = this.validateColor(color);
        this.customColors.set(energyName, validColor);
        console.log(`Color personalizado establecido para "${energyName}": ${validColor}`);
    }

    /**
     * Obtiene todos los colores registrados
     * @returns {Object} Objeto con todos los colores
     */
    getAllColors() {
        const allColors = {};

        // Colores de energéticos
        for (const [energy, color] of this.energyTypeColors.entries()) {
            allColors[energy] = color;
        }

        // Colores personalizados (sobrescriben los por defecto)
        for (const [energy, color] of this.customColors.entries()) {
            allColors[energy] = color;
        }

        return allColors;
    }

    /**
     * Cambia el tema actual
     * @param {string} themeName - Nombre del tema
     */
    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            console.log(`Tema cambiado a: ${this.themes[themeName].name}`);
        } else {
            console.warn(`Tema "${themeName}" no encontrado`);
        }
    }

    /**
     * Obtiene la configuración del tema actual
     * @returns {Object} Configuración del tema
     */
    getCurrentTheme() {
        return this.themes[this.currentTheme];
    }

    /**
     * Obtiene todos los temas disponibles
     * @returns {Object} Todos los temas
     */
    getAvailableThemes() {
        return Object.keys(this.themes).map(key => ({
            key: key,
            name: this.themes[key].name
        }));
    }

    /**
     * Genera CSS personalizado para el tema actual
     * @returns {string} CSS generado
     */
    generateThemeCSS() {
        const theme = this.getCurrentTheme();

        return `
            :root {
                --theme-background: ${theme.background};
                --theme-text: ${theme.text};
                --theme-accent: ${theme.accent};
                --theme-success: ${theme.success};
                --theme-warning: ${theme.warning};
                --theme-error: ${theme.error};
            }
            
            body {
                background-color: var(--theme-background);
                color: var(--theme-text);
            }
            
            .theme-accent {
                color: var(--theme-accent);
            }
            
            .theme-success {
                color: var(--theme-success);
            }
            
            .theme-warning {
                color: var(--theme-warning);
            }
            
            .theme-error {
                color: var(--theme-error);
            }
        `;
    }

    /**
     * Aplica el tema actual al documento
     */
    applyTheme() {
        const css = this.generateThemeCSS();

        // Remover hoja de estilos anterior si existe
        const existingStyle = document.getElementById('theme-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        // Crear nueva hoja de estilos
        const style = document.createElement('style');
        style.id = 'theme-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    /**
     * Obtiene un color optimizado para enlaces/flujos en el diagrama de Sankey
     * @param {string} energyName - Nombre del energético
     * @param {number} opacity - Opacidad del enlace (0-1)
     * @returns {string} Color con opacidad para enlaces
     */
    getLinkColor(energyName, opacity = 0.6) {
        const baseColor = this.getEnergyColor(energyName);
        const rgb = this.hexToRgb(baseColor);

        if (!rgb) return baseColor;

        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    }

    /**
     * Obtiene un color con mayor contraste para mejorar la legibilidad
     * @param {string} energyName - Nombre del energético
     * @param {number} contrastFactor - Factor de contraste (0-1)
     * @returns {string} Color con mayor contraste
     */
    getHighContrastColor(energyName, contrastFactor = 0.3) {
        const baseColor = this.getEnergyColor(energyName);

        // Determinar si el color es claro u oscuro
        const rgb = this.hexToRgb(baseColor);
        if (!rgb) return baseColor;

        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

        // Si es claro, oscurecer; si es oscuro, aclarar
        if (brightness > 128) {
            return this.darkenColor(baseColor, contrastFactor);
        } else {
            return this.lightenColor(baseColor, contrastFactor);
        }
    }

    /**
     * Genera una paleta armoniosa de colores complementarios
     * @param {string} baseColor - Color base
     * @param {number} count - Número de colores a generar
     * @returns {Array} Array de colores complementarios
     */
    generateComplementaryPalette(baseColor, count = 5) {
        const rgb = this.hexToRgb(baseColor);
        if (!rgb) return [baseColor];

        const colors = [baseColor];
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

        for (let i = 1; i < count; i++) {
            const newHue = (hsl.h + (360 / count) * i) % 360;
            const newColor = this.hslToHex(newHue, hsl.s * 100, hsl.l * 100);
            colors.push(newColor);
        }

        return colors;
    }

    /**
     * Convierte RGB a HSL
     * @param {number} r - Rojo (0-255)
     * @param {number} g - Verde (0-255)
     * @param {number} b - Azul (0-255)
     * @returns {Object} Objeto HSL
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h * 360, s: s, l: l };
    }

    /**
     * Obtiene colores específicos para diferentes categorías de nodos
     * @param {string} category - Categoría del nodo
     * @returns {string} Color específico para la categoría
     */
    getCategoryColor(category) {
        const categoryColors = {
            // Fuentes de energía primaria
            'fossil': '#8B4513',        // Marrón para combustibles fósiles
            'renewable': '#228B22',     // Verde para renovables
            'nuclear': '#CD853F',       // Dorado para nuclear

            // Procesos de transformación
            'refining': '#CD5C5C',      // Rojo suave para refinación
            'generation': '#DAA520',    // Dorado para generación eléctrica
            'processing': '#708090',    // Gris para procesamiento

            // Destinos finales
            'residential': '#4682B4',   // Azul para residencial
            'industrial': '#2F4F4F',    // Gris oscuro para industrial
            'transport': '#FF6347',     // Naranja para transporte
            'commercial': '#9ACD32',    // Verde claro para comercial

            // Flujos del sistema
            'import': '#87CEEB',        // Azul cielo para importaciones
            'export': '#8FBC8F',        // Verde gris para exportaciones
            'losses': '#A0522D',        // Marrón para pérdidas
            'storage': '#DDA0DD'        // Púrpura claro para almacenamiento
        };

        return categoryColors[category] || this.nodeTypeColors.default;
    }

    /**
     * Aplica un filtro de color para mejorar la accesibilidad
     * @param {string} color - Color base
     * @param {string} filterType - Tipo de filtro ('protanopia', 'deuteranopia', 'tritanopia')
     * @returns {string} Color ajustado para accesibilidad
     */
    applyAccessibilityFilter(color, filterType = 'none') {
        if (filterType === 'none') return color;

        const rgb = this.hexToRgb(color);
        if (!rgb) return color;

        let newRgb = { ...rgb };

        switch (filterType) {
            case 'protanopia': // Dificultad con el rojo
                newRgb.r = Math.round(0.567 * rgb.r + 0.433 * rgb.g);
                newRgb.g = Math.round(0.558 * rgb.r + 0.442 * rgb.g);
                break;

            case 'deuteranopia': // Dificultad con el verde
                newRgb.r = Math.round(0.625 * rgb.r + 0.375 * rgb.g);
                newRgb.g = Math.round(0.7 * rgb.r + 0.3 * rgb.g);
                break;

            case 'tritanopia': // Dificultad con el azul
                newRgb.g = Math.round(0.95 * rgb.g + 0.05 * rgb.b);
                newRgb.b = Math.round(0.433 * rgb.g + 0.567 * rgb.b);
                break;
        }

        return this.rgbToHex(
            Math.max(0, Math.min(255, newRgb.r)),
            Math.max(0, Math.min(255, newRgb.g)),
            Math.max(0, Math.min(255, newRgb.b))
        );
    }

    /**
     * Obtiene estadísticas de la paleta de colores actual
     * @returns {Object} Estadísticas de colores
     */
    getColorStats() {
        const stats = {
            totalEnergyColors: this.energyTypeColors.size,
            totalCustomColors: this.customColors.size,
            totalNodeTypeColors: Object.keys(this.nodeTypeGradients).length,
            currentTheme: this.currentTheme,
            availableThemes: this.getAvailableThemes().length,
            colorDistribution: {
                primary: 0,
                secondary: 0,
                nodeTypes: 0
            }
        };

        // Analizar distribución de colores
        for (const [energy, color] of this.energyTypeColors.entries()) {
            if (energy.includes('Energía') || energy.includes('Carbón') ||
                energy.includes('Petróleo') || energy.includes('Gas natural')) {
                stats.colorDistribution.primary++;
            } else {
                stats.colorDistribution.secondary++;
            }
        }

        stats.colorDistribution.nodeTypes = Object.keys(this.nodeTypeGradients).length;

        return stats;
    }

    /**
     * Reinicia el StyleManager a su estado inicial
     */
    reset() {
        this.colorPalette.clear();
        this.customColors.clear();
        this.colorIndex = 0;
        this.currentTheme = 'professional';
        this.initializeColorPalette();
        console.log('StyleManager reiniciado');
    }
}

// Exportar la clase para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StyleManager;
}