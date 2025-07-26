/**
 * ExportManager - Clase para manejar la exportación de diagramas Plotly a PNG y SVG
 * 
 * Esta clase utiliza las capacidades nativas de Plotly para generar imágenes de alta calidad
 * con soporte para fondo transparente, resolución personalizable y formato vectorial.
 * 
 * @class ExportManager
 */
class ExportManager {
    /**
     * Constructor del ExportManager
     * @param {HTMLElement} plotlyElement - Elemento DOM que contiene el gráfico de Plotly
     * @param {Object} options - Opciones de configuración
     * @param {ColumnLabelsManager} columnLabelsManager - Gestor de etiquetas de columnas (opcional)
     */
    constructor(plotlyElement, options = {}, columnLabelsManager = null) {
        this.plotlyElement = plotlyElement;
        this.columnLabelsManager = columnLabelsManager;
        this.defaultConfig = {
            png: {
                width: 1920,
                height: 1080,
                scale: 2
            },
            svg: {
                width: 1920,
                height: 1080
            },
            transparentBg: true,
            filenamePrefix: 'sankey_energia',
            includeColumnLabels: true, // Nueva opción para incluir etiquetas
            ...options
        };
        
        // Validar que el elemento de Plotly esté disponible
        this.validatePlotlyElement();
    }

    /**
     * Valida que el elemento de Plotly esté disponible y tenga datos
     * @private
     */
    validatePlotlyElement() {
        if (!this.plotlyElement) {
            throw new Error('ExportManager: Elemento de Plotly no proporcionado');
        }
        
        if (!window.Plotly) {
            throw new Error('ExportManager: Plotly no está disponible en el contexto global');
        }
    }

    /**
     * Verifica si el diagrama está listo para exportar
     * @returns {boolean} True si el diagrama está listo
     */
    isDiagramReady() {
        return this.plotlyElement && 
               this.plotlyElement._fullLayout && 
               this.plotlyElement.data && 
               this.plotlyElement.data.length > 0;
    }

    /**
     * Actualiza la configuración de exportación
     * @param {Object} newConfig - Nueva configuración
     */
    updateConfig(newConfig) {
        this.defaultConfig = {
            ...this.defaultConfig,
            ...newConfig
        };
    }

    /**
     * Obtiene la configuración actual
     * @returns {Object} Configuración actual
     */
    getConfig() {
        return { ...this.defaultConfig };
    }

    /**
     * Establece el ColumnLabelsManager para incluir etiquetas en exportaciones
     * @param {ColumnLabelsManager} columnLabelsManager - Gestor de etiquetas de columnas
     */
    setColumnLabelsManager(columnLabelsManager) {
        this.columnLabelsManager = columnLabelsManager;
        console.log('ColumnLabelsManager configurado en ExportManager');
    }

    /**
     * Exporta el diagrama como PNG
     * @param {Object} options - Opciones específicas para PNG
     * @param {Function} progressCallback - Callback para reportar progreso
     * @returns {Promise<void>}
     */
    async exportToPNG(options = {}, progressCallback = null) {
        if (!this.isDiagramReady()) {
            throw new Error('El diagrama no está listo para exportar. Asegúrate de que esté completamente cargado.');
        }

        // Combinar opciones con configuración por defecto
        const config = {
            ...this.defaultConfig.png,
            ...options
        };

        if (progressCallback) progressCallback(10, 'Configurando exportación PNG...');

        // Guardar configuración original del layout
        const originalPaperBgColor = this.plotlyElement.layout.paper_bgcolor;
        const originalPlotBgColor = this.plotlyElement.layout.plot_bgcolor;

        try {
            // Configurar fondo temporalmente según la configuración
            if (this.defaultConfig.transparentBg) {
                await Plotly.relayout(this.plotlyElement, {
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)'
                });
            } else {
                await Plotly.relayout(this.plotlyElement, {
                    paper_bgcolor: '#ffffff',
                    plot_bgcolor: '#ffffff'
                });
            }

            if (progressCallback) progressCallback(20, 'Aplicando configuración de fondo...');

            // Preparar opciones de exportación para Plotly
            const exportOptions = {
                format: 'png',
                width: config.width,
                height: config.height,
                scale: config.scale || 2
            };

            // Configurar fondo en las opciones de exportación también
            if (this.defaultConfig.transparentBg) {
                exportOptions.setBackground = 'transparent';
            } else {
                exportOptions.setBackground = '#ffffff';
            }

            if (progressCallback) progressCallback(40, 'Generando imagen PNG...');

            // Generar imagen usando Plotly
            let imageDataURL = await Plotly.toImage(this.plotlyElement, exportOptions);

            // Incluir etiquetas de columnas si están habilitadas
            if (this.defaultConfig.includeColumnLabels && this.columnLabelsManager && this.columnLabelsManager.isEnabled()) {
                if (progressCallback) progressCallback(60, 'Agregando etiquetas de columnas...');
                imageDataURL = await this.addLabelsToImage(imageDataURL, config, 'png');
            }

            if (progressCallback) progressCallback(80, 'Preparando descarga...');

            // Generar nombre de archivo
            const filename = this.generateFilename('png', options.filename);

            // Descargar imagen
            this.downloadImage(imageDataURL, filename);

            if (progressCallback) progressCallback(100, 'PNG exportado exitosamente');

            return {
                success: true,
                filename: filename,
                format: 'png',
                dimensions: `${config.width}x${config.height}`,
                scale: config.scale,
                includesLabels: this.defaultConfig.includeColumnLabels && this.columnLabelsManager && this.columnLabelsManager.isEnabled()
            };

        } catch (error) {
            console.error('Error exportando PNG:', error);
            throw new Error(`Error al exportar PNG: ${error.message}`);
        } finally {
            // Restaurar configuración original del layout siempre
            try {
                await Plotly.relayout(this.plotlyElement, {
                    paper_bgcolor: originalPaperBgColor,
                    plot_bgcolor: originalPlotBgColor
                });
            } catch (restoreError) {
                console.warn('Error restaurando configuración original del layout:', restoreError);
            }
        }
    }

    /**
     * Exporta el diagrama como SVG
     * @param {Object} options - Opciones específicas para SVG
     * @param {Function} progressCallback - Callback para reportar progreso
     * @returns {Promise<void>}
     */
    async exportToSVG(options = {}, progressCallback = null) {
        if (!this.isDiagramReady()) {
            throw new Error('El diagrama no está listo para exportar. Asegúrate de que esté completamente cargado.');
        }

        // Combinar opciones con configuración por defecto
        const config = {
            ...this.defaultConfig.svg,
            ...options
        };

        if (progressCallback) progressCallback(10, 'Configurando exportación SVG...');

        // Guardar configuración original del layout
        const originalPaperBgColor = this.plotlyElement.layout.paper_bgcolor;
        const originalPlotBgColor = this.plotlyElement.layout.plot_bgcolor;

        try {
            // Configurar fondo para SVG si es necesario
            if (this.defaultConfig.transparentBg) {
                await Plotly.relayout(this.plotlyElement, {
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)'
                });
            } else {
                await Plotly.relayout(this.plotlyElement, {
                    paper_bgcolor: '#ffffff',
                    plot_bgcolor: '#ffffff'
                });
            }

            if (progressCallback) progressCallback(20, 'Aplicando configuración de fondo...');

            // Preparar opciones de exportación para Plotly
            const exportOptions = {
                format: 'svg',
                width: config.width,
                height: config.height
            };

            if (progressCallback) progressCallback(40, 'Generando imagen SVG...');

            // Generar SVG usando Plotly
            let svgData = await Plotly.toImage(this.plotlyElement, exportOptions);

            // Incluir etiquetas de columnas si están habilitadas
            if (this.defaultConfig.includeColumnLabels && this.columnLabelsManager && this.columnLabelsManager.isEnabled()) {
                if (progressCallback) progressCallback(60, 'Agregando etiquetas de columnas...');
                svgData = await this.addLabelsToSVG(svgData, config);
            }

            if (progressCallback) progressCallback(80, 'Preparando descarga...');

            // Generar nombre de archivo
            const filename = this.generateFilename('svg', options.filename);

            // Procesar y descargar SVG
            this.downloadSVG(svgData, filename);

            if (progressCallback) progressCallback(100, 'SVG exportado exitosamente');

            return {
                success: true,
                filename: filename,
                format: 'svg',
                dimensions: `${config.width}x${config.height}`,
                vectorial: true,
                includesLabels: this.defaultConfig.includeColumnLabels && this.columnLabelsManager && this.columnLabelsManager.isEnabled()
            };

        } catch (error) {
            console.error('Error exportando SVG:', error);
            throw new Error(`Error al exportar SVG: ${error.message}`);
        } finally {
            // Restaurar configuración original del layout siempre
            try {
                await Plotly.relayout(this.plotlyElement, {
                    paper_bgcolor: originalPaperBgColor,
                    plot_bgcolor: originalPlotBgColor
                });
            } catch (restoreError) {
                console.warn('Error restaurando configuración original del layout:', restoreError);
            }
        }
    }

    /**
     * Genera un nombre de archivo único
     * @param {string} format - Formato del archivo (png/svg)
     * @param {string} customFilename - Nombre personalizado opcional
     * @returns {string} Nombre de archivo generado
     * @private
     */
    generateFilename(format, customFilename = null) {
        if (customFilename) {
            return customFilename.endsWith(`.${format}`) ? customFilename : `${customFilename}.${format}`;
        }

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const prefix = this.defaultConfig.filenamePrefix || 'sankey_energia';
        
        return `${prefix}_${timestamp}.${format}`;
    }

    /**
     * Descarga una imagen (PNG) usando data URL
     * @param {string} dataURL - Data URL de la imagen
     * @param {string} filename - Nombre del archivo
     * @private
     */
    downloadImage(dataURL, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        
        // Agregar al DOM temporalmente para Firefox
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Descarga un archivo SVG
     * @param {string} svgData - Contenido SVG como string o data URL
     * @param {string} filename - Nombre del archivo
     * @private
     */
    downloadSVG(svgData, filename) {
        let svgContent = svgData;
        
        // Manejar diferentes formatos de datos SVG
        if (typeof svgData === 'string') {
            if (svgData.startsWith('data:image/svg+xml,')) {
                // Decodificar URL-encoded SVG content
                svgContent = decodeURIComponent(svgData.substring('data:image/svg+xml,'.length));
            } else if (svgData.startsWith('data:image/svg+xml;base64,')) {
                // Manejar base64 encoded SVG
                svgContent = atob(svgData.substring('data:image/svg+xml;base64,'.length));
            } else if (svgData.startsWith('data:image/svg+xml;charset=utf-8,')) {
                // Manejar UTF-8 encoded SVG
                svgContent = decodeURIComponent(svgData.substring('data:image/svg+xml;charset=utf-8,'.length));
            }
            // Si no es un data URL, asumir que ya es contenido SVG directo
        }
        
        // Crear blob con el contenido SVG
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        
        // Agregar al DOM temporalmente para Firefox
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL del objeto
        URL.revokeObjectURL(url);
    }

    /**
     * Agrega etiquetas de columnas a una imagen PNG
     * @param {string} imageDataURL - Data URL de la imagen base
     * @param {Object} config - Configuración de exportación
     * @param {string} format - Formato de imagen
     * @returns {Promise<string>} Data URL de la imagen con etiquetas
     * @private
     */
    async addLabelsToImage(imageDataURL, config, format) {
        return new Promise((resolve, reject) => {
            try {
                // Crear canvas para combinar imagen y etiquetas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Configurar dimensiones del canvas
                canvas.width = config.width;
                canvas.height = config.height;
                
                // Cargar imagen base
                const baseImage = new Image();
                baseImage.onload = () => {
                    try {
                        // Dibujar imagen base
                        ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
                        
                        // Obtener etiquetas del ColumnLabelsManager
                        if (this.columnLabelsManager && this.columnLabelsManager.isEnabled()) {
                            this.drawLabelsOnCanvas(ctx, canvas.width, canvas.height);
                        }
                        
                        // Convertir canvas a data URL
                        const finalDataURL = canvas.toDataURL(`image/${format}`, 1.0);
                        resolve(finalDataURL);
                        
                    } catch (error) {
                        reject(new Error(`Error dibujando etiquetas en canvas: ${error.message}`));
                    }
                };
                
                baseImage.onerror = () => {
                    reject(new Error('Error cargando imagen base'));
                };
                
                baseImage.src = imageDataURL;
                
            } catch (error) {
                reject(new Error(`Error creando canvas: ${error.message}`));
            }
        });
    }

    /**
     * Agrega etiquetas de columnas a un SVG
     * @param {string} svgData - Contenido SVG base
     * @param {Object} config - Configuración de exportación
     * @returns {Promise<string>} Contenido SVG con etiquetas
     * @private
     */
    async addLabelsToSVG(svgData, config) {
        try {
            // Decodificar SVG si es necesario
            let svgContent = svgData;
            if (typeof svgData === 'string') {
                if (svgData.startsWith('data:image/svg+xml,')) {
                    svgContent = decodeURIComponent(svgData.substring('data:image/svg+xml,'.length));
                } else if (svgData.startsWith('data:image/svg+xml;base64,')) {
                    svgContent = atob(svgData.substring('data:image/svg+xml;base64,'.length));
                } else if (svgData.startsWith('data:image/svg+xml;charset=utf-8,')) {
                    svgContent = decodeURIComponent(svgData.substring('data:image/svg+xml;charset=utf-8,'.length));
                }
            }
            
            // Obtener etiquetas del ColumnLabelsManager
            if (this.columnLabelsManager && this.columnLabelsManager.isEnabled()) {
                const labelElements = this.generateSVGLabels(config.width, config.height);
                
                // Insertar etiquetas en el SVG antes del cierre del tag svg
                const svgCloseIndex = svgContent.lastIndexOf('</svg>');
                if (svgCloseIndex !== -1) {
                    svgContent = svgContent.substring(0, svgCloseIndex) + 
                                labelElements + 
                                svgContent.substring(svgCloseIndex);
                }
            }
            
            return svgContent;
            
        } catch (error) {
            console.error('Error agregando etiquetas a SVG:', error);
            return svgData; // Retornar SVG original si hay error
        }
    }

    /**
     * Dibuja las etiquetas en un canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} canvasWidth - Ancho del canvas
     * @param {number} canvasHeight - Alto del canvas
     * @private
     */
    drawLabelsOnCanvas(ctx, canvasWidth, canvasHeight) {
        try {
            // Polyfill para roundRect si no está disponible
            if (!ctx.roundRect) {
                ctx.roundRect = function(x, y, width, height, radius) {
                    this.beginPath();
                    this.moveTo(x + radius, y);
                    this.lineTo(x + width - radius, y);
                    this.quadraticCurveTo(x + width, y, x + width, y + radius);
                    this.lineTo(x + width, y + height - radius);
                    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                    this.lineTo(x + radius, y + height);
                    this.quadraticCurveTo(x, y + height, x, y + height - radius);
                    this.lineTo(x, y + radius);
                    this.quadraticCurveTo(x, y, x + radius, y);
                    this.closePath();
                };
            }
            
            // Obtener dimensiones del contenedor original
            const containerRect = this.plotlyElement.getBoundingClientRect();
            const scaleX = canvasWidth / containerRect.width;
            const scaleY = canvasHeight / containerRect.height;
            
            // Iterar sobre todas las etiquetas visibles
            for (const [labelId, labelInfo] of this.columnLabelsManager.columnLabels.entries()) {
                if (!labelInfo.visible) continue;
                
                // Calcular posición escalada
                const x = labelInfo.x * canvasWidth;
                const y = labelInfo.y * canvasHeight;
                
                // Configurar estilos del texto
                const config = this.columnLabelsManager.labelConfig;
                const customStyle = labelInfo.customStyle || {};
                
                const fontSize = (customStyle.fontSize || config.fontSize) * Math.min(scaleX, scaleY);
                const fontFamily = customStyle.fontFamily || config.fontFamily;
                const fontWeight = customStyle.fontWeight || config.fontWeight;
                const textColor = customStyle.color || config.color;
                const bgColor = customStyle.backgroundColor || config.backgroundColor;
                
                // Configurar fuente
                ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Medir texto para el fondo
                const titleMetrics = ctx.measureText(labelInfo.title);
                const titleWidth = titleMetrics.width;
                const titleHeight = fontSize;
                
                let descWidth = 0;
                let descHeight = 0;
                if (labelInfo.description) {
                    ctx.font = `${fontWeight} ${fontSize * 0.8}px ${fontFamily}`;
                    const descMetrics = ctx.measureText(labelInfo.description);
                    descWidth = descMetrics.width;
                    descHeight = fontSize * 0.8;
                }
                
                // Calcular dimensiones del fondo
                const padding = config.padding.x * Math.min(scaleX, scaleY);
                const paddingY = config.padding.y * Math.min(scaleX, scaleY);
                const bgWidth = Math.max(titleWidth, descWidth) + (padding * 2);
                const bgHeight = titleHeight + (labelInfo.description ? descHeight + 4 : 0) + (paddingY * 2);
                
                // Dibujar fondo
                ctx.fillStyle = bgColor;
                ctx.beginPath();
                ctx.roundRect(x - bgWidth/2, y - bgHeight/2, bgWidth, bgHeight, config.borderRadius);
                ctx.fill();
                
                // Dibujar borde
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Dibujar título
                ctx.fillStyle = textColor;
                ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                const titleY = labelInfo.description ? y - descHeight/2 - 2 : y;
                ctx.fillText(labelInfo.title, x, titleY);
                
                // Dibujar descripción si existe
                if (labelInfo.description) {
                    ctx.fillStyle = textColor;
                    ctx.globalAlpha = 0.7;
                    ctx.font = `${fontWeight} ${fontSize * 0.8}px ${fontFamily}`;
                    ctx.fillText(labelInfo.description, x, y + titleHeight/2 + 2);
                    ctx.globalAlpha = 1.0;
                }
            }
            
        } catch (error) {
            console.error('Error dibujando etiquetas en canvas:', error);
        }
    }

    /**
     * Genera elementos SVG para las etiquetas
     * @param {number} svgWidth - Ancho del SVG
     * @param {number} svgHeight - Alto del SVG
     * @returns {string} Elementos SVG de las etiquetas
     * @private
     */
    generateSVGLabels(svgWidth, svgHeight) {
        try {
            let svgElements = '';
            
            // Obtener dimensiones del contenedor original
            const containerRect = this.plotlyElement.getBoundingClientRect();
            const scaleX = svgWidth / containerRect.width;
            const scaleY = svgHeight / containerRect.height;
            
            // Iterar sobre todas las etiquetas visibles
            for (const [labelId, labelInfo] of this.columnLabelsManager.columnLabels.entries()) {
                if (!labelInfo.visible) continue;
                
                // Calcular posición escalada
                const x = labelInfo.x * svgWidth;
                const y = labelInfo.y * svgHeight;
                
                // Configurar estilos
                const config = this.columnLabelsManager.labelConfig;
                const customStyle = labelInfo.customStyle || {};
                
                const fontSize = (customStyle.fontSize || config.fontSize) * Math.min(scaleX, scaleY);
                const fontFamily = customStyle.fontFamily || config.fontFamily;
                const fontWeight = customStyle.fontWeight || config.fontWeight;
                const textColor = customStyle.color || config.color;
                const bgColor = customStyle.backgroundColor || config.backgroundColor;
                
                // Calcular dimensiones aproximadas del fondo
                const padding = config.padding.x * Math.min(scaleX, scaleY);
                const paddingY = config.padding.y * Math.min(scaleX, scaleY);
                const titleWidth = labelInfo.title.length * fontSize * 0.6; // Aproximación
                const descWidth = labelInfo.description ? labelInfo.description.length * fontSize * 0.48 : 0;
                const bgWidth = Math.max(titleWidth, descWidth) + (padding * 2);
                const bgHeight = fontSize + (labelInfo.description ? fontSize * 0.8 + 4 : 0) + (paddingY * 2);
                
                // Crear grupo SVG para la etiqueta
                svgElements += `<g class="column-label" data-label-id="${labelId}">`;
                
                // Fondo de la etiqueta
                svgElements += `<rect x="${x - bgWidth/2}" y="${y - bgHeight/2}" width="${bgWidth}" height="${bgHeight}" `;
                svgElements += `fill="${bgColor}" stroke="rgba(0,0,0,0.1)" stroke-width="1" rx="${config.borderRadius}"/>`;
                
                // Título
                const titleY = labelInfo.description ? y - fontSize * 0.4 : y;
                svgElements += `<text x="${x}" y="${titleY}" text-anchor="middle" dominant-baseline="middle" `;
                svgElements += `font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${textColor}">`;
                svgElements += `${labelInfo.title}</text>`;
                
                // Descripción si existe
                if (labelInfo.description) {
                    const descY = y + fontSize * 0.4;
                    svgElements += `<text x="${x}" y="${descY}" text-anchor="middle" dominant-baseline="middle" `;
                    svgElements += `font-family="${fontFamily}" font-size="${fontSize * 0.8}" font-weight="${fontWeight}" `;
                    svgElements += `fill="${textColor}" opacity="0.7">${labelInfo.description}</text>`;
                }
                
                svgElements += '</g>';
            }
            
            return svgElements;
            
        } catch (error) {
            console.error('Error generando elementos SVG:', error);
            return '';
        }
    }

    /**
     * Exporta en ambos formatos secuencialmente
     * @param {Object} options - Opciones de exportación
     * @param {Function} progressCallback - Callback para reportar progreso
     * @returns {Promise<Array>} Array con resultados de ambas exportaciones
     */
    async exportBoth(options = {}, progressCallback = null) {
        const results = [];
        
        try {
            if (progressCallback) progressCallback(0, 'Iniciando exportación dual...');
            
            // Exportar PNG
            if (progressCallback) progressCallback(10, 'Exportando PNG...');
            const pngResult = await this.exportToPNG(options.png || {}, 
                (progress, message) => {
                    if (progressCallback) progressCallback(10 + (progress * 0.4), message);
                }
            );
            results.push(pngResult);
            
            // Exportar SVG
            if (progressCallback) progressCallback(50, 'Exportando SVG...');
            const svgResult = await this.exportToSVG(options.svg || {}, 
                (progress, message) => {
                    if (progressCallback) progressCallback(50 + (progress * 0.4), message);
                }
            );
            results.push(svgResult);
            
            if (progressCallback) progressCallback(100, 'Ambas exportaciones completadas');
            
            return results;
            
        } catch (error) {
            console.error('Error en exportación dual:', error);
            throw new Error(`Error en exportación dual: ${error.message}`);
        }
    }

    /**
     * Obtiene información sobre las capacidades de exportación
     * @returns {Object} Información sobre capacidades
     */
    getExportCapabilities() {
        return {
            formats: ['png', 'svg'],
            features: {
                transparentBackground: true,
                customResolution: true,
                vectorialSVG: true,
                highDPI: true,
                batchExport: true
            },
            maxDimensions: {
                width: 4000,
                height: 3000
            },
            supportedScales: [1, 2, 3, 4]
        };
    }

    /**
     * Valida las opciones de exportación
     * @param {Object} options - Opciones a validar
     * @returns {Object} Opciones validadas y corregidas
     */
    validateExportOptions(options) {
        const validated = { ...options };
        const capabilities = this.getExportCapabilities();
        
        // Validar dimensiones PNG
        if (validated.png) {
            if (validated.png.width > capabilities.maxDimensions.width) {
                console.warn(`Ancho PNG reducido de ${validated.png.width} a ${capabilities.maxDimensions.width}`);
                validated.png.width = capabilities.maxDimensions.width;
            }
            if (validated.png.height > capabilities.maxDimensions.height) {
                console.warn(`Alto PNG reducido de ${validated.png.height} a ${capabilities.maxDimensions.height}`);
                validated.png.height = capabilities.maxDimensions.height;
            }
            if (!capabilities.supportedScales.includes(validated.png.scale)) {
                console.warn(`Escala PNG ${validated.png.scale} no soportada, usando 2x`);
                validated.png.scale = 2;
            }
        }
        
        // Validar dimensiones SVG
        if (validated.svg) {
            if (validated.svg.width > capabilities.maxDimensions.width) {
                console.warn(`Ancho SVG reducido de ${validated.svg.width} a ${capabilities.maxDimensions.width}`);
                validated.svg.width = capabilities.maxDimensions.width;
            }
            if (validated.svg.height > capabilities.maxDimensions.height) {
                console.warn(`Alto SVG reducido de ${validated.svg.height} a ${capabilities.maxDimensions.height}`);
                validated.svg.height = capabilities.maxDimensions.height;
            }
        }
        
        return validated;
    }

    /**
     * Método de utilidad para obtener estadísticas del diagrama actual
     * @returns {Object} Estadísticas del diagrama
     */
    getDiagramStats() {
        if (!this.isDiagramReady()) {
            return { ready: false };
        }
        
        const data = this.plotlyElement.data[0]; // Asumiendo diagrama Sankey
        
        return {
            ready: true,
            nodeCount: data.node ? data.node.label.length : 0,
            linkCount: data.link ? data.link.source.length : 0,
            dimensions: {
                width: this.plotlyElement.offsetWidth,
                height: this.plotlyElement.offsetHeight
            },
            hasTransparentBg: this.defaultConfig.transparentBg
        };
    }
}

// Exportar la clase para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportManager;
}