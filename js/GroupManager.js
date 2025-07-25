/**
 * GroupManager - Módulo para gestión de agrupaciones visuales y cuadros informativos
 * 
 * Este módulo maneja la creación, posicionamiento y renderizado de cuadros
 * agrupadores y elementos informativos opcionales en el diagrama de Sankey.
 * Permite crear cuadros completamente personalizables donde el usuario decida.
 * 
 * Funcionalidades principales:
 * - Sistema completamente manual de cuadros informativos
 * - Posicionamiento personalizado con coordenadas (x, y, width, height)
 * - Estilos configurables (colores, bordes, transparencia)
 * - Contenido personalizable (título, descripción, datos)
 * - Integración con sistema de exportación
 * 
 * @author Kiro AI Assistant
 * @version 1.0.0
 */

class GroupManager {
    /**
     * Constructor del GroupManager
     * @param {Object} options - Opciones de configuración
     */
    constructor(options = {}) {
        this.enabled = options.enabled || false;
        this.styleManager = options.styleManager || null;
        
        // Configuración por defecto de cuadros
        this.groupConfig = {
            fontSize: options.fontSize || 12,
            fontFamily: options.fontFamily || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            fontWeight: options.fontWeight || '500',
            titleFontSize: options.titleFontSize || 14,
            titleFontWeight: options.titleFontWeight || '600',
            color: options.color || '#2c3e50',
            backgroundColor: options.backgroundColor || 'rgba(255, 255, 255, 0.85)',
            borderColor: options.borderColor || '#3498db',
            borderWidth: options.borderWidth || 