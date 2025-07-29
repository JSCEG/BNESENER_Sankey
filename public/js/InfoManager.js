/**
 * InfoManager - Gestiona la información del Balance Nacional de Energía
 */
class InfoManager {
    constructor() {
        this.infoPanel = null;
        this.infoToggleBtn = null;
        this.infoCloseBtn = null;
        this.isVisible = false;
        
        this.init();
    }

    init() {
        this.infoPanel = document.getElementById('info-panel');
        this.infoToggleBtn = document.getElementById('info-toggle-btn');
        this.infoCloseBtn = document.getElementById('info-close-btn');
        
        this.setupEventListeners();
        this.loadInfoContent();
    }

    setupEventListeners() {
        if (this.infoToggleBtn) {
            this.infoToggleBtn.addEventListener('click', () => this.toggleInfo());
        }
        
        if (this.infoCloseBtn) {
            this.infoCloseBtn.addEventListener('click', () => this.hideInfo());
        }
        
        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideInfo();
            }
        });
        
        // Cerrar al hacer clic fuera del panel
        if (this.infoPanel) {
            this.infoPanel.addEventListener('click', (e) => {
                if (e.target === this.infoPanel) {
                    this.hideInfo();
                }
            });
        }
    }

    toggleInfo() {
        if (this.isVisible) {
            this.hideInfo();
        } else {
            this.showInfo();
        }
    }

    showInfo() {
        if (this.infoPanel) {
            this.infoPanel.classList.add('visible');
            this.infoPanel.setAttribute('aria-hidden', 'false');
            this.isVisible = true;
            
            // Focus en el botón de cerrar para accesibilidad
            if (this.infoCloseBtn) {
                this.infoCloseBtn.focus();
            }
        }
    }

    hideInfo() {
        if (this.infoPanel) {
            this.infoPanel.classList.remove('visible');
            this.infoPanel.setAttribute('aria-hidden', 'true');
            this.isVisible = false;
            
            // Devolver focus al botón que abrió el panel
            if (this.infoToggleBtn) {
                this.infoToggleBtn.focus();
            }
        }
    }

    loadInfoContent() {
        const infoSections = document.querySelector('.info-sections');
        if (!infoSections) return;

        const content = this.getInfoContent();
        infoSections.innerHTML = content;
    }

    getInfoContent() {
        return `
            <div class="info-section">
                <h2>¿Qué es el Balance Nacional de Energía?</h2>
                <p>El Balance Nacional de Energía es un instrumento que describe detalladamente las cifras de origen y destino de las fuentes energéticas primarias y secundarias. Su objetivo principal es facilitar la toma de decisiones informadas, coherentes y necesarias para la planeación de un desarrollo energético sustentable en el país.</p>
                
                <p>Al analizar el BNE, se pueden identificar y evaluar distintas oportunidades de mejora, así como considerar posibles cambios en el sistema energético. Este balance presenta un diagnóstico de la situación energética, identificando factores cruciales como la dependencia de combustibles fósiles, los energéticos más consumidos, el grado de importación y exportación, y la eficiencia general del sistema.</p>
            </div>

            <div class="info-section">
                <h2>Estructura del Balance Nacional de Energía</h2>
                <p>El Balance Nacional de Energía se estructura de manera que permite rastrear el flujo de cada energético a través de los distintos procesos de la cadena energética. Se representa típicamente mediante una matriz o, de forma más visual, a través de un diagrama Sankey.</p>
                
                <h3>Energéticos Primarios</h3>
                <div class="energeticos-grid">
                    <div class="energetico-item">
                        <strong>Carbón:</strong> Roca sedimentaria rica en carbono, usada como combustible fósil.
                    </div>
                    <div class="energetico-item">
                        <strong>Petróleo Crudo:</strong> Líquido natural oleaginoso e inflamable compuesto por hidrocarburos.
                    </div>
                    <div class="energetico-item">
                        <strong>Gas Natural:</strong> Mezcla de hidrocarburos parafínicos ligeros, principalmente metano.
                    </div>
                    <div class="energetico-item">
                        <strong>Nucleoenergía:</strong> Proviene de la transformación de energía nuclear a térmica mediante fisión nuclear.
                    </div>
                    <div class="energetico-item">
                        <strong>Hidroenergía:</strong> Conversión de la energía cinética o potencial del agua en electricidad.
                    </div>
                    <div class="energetico-item">
                        <strong>Energía Solar:</strong> Radiación lumínica y calorífica del sol, aprovechada como calor o electricidad.
                    </div>
                    <div class="energetico-item">
                        <strong>Energía Eólica:</strong> Derivada del movimiento de las masas de aire, transformada en electricidad.
                    </div>
                    <div class="energetico-item">
                        <strong>Biomasa:</strong> Incluye bagazo de caña, leña y biogás de materia orgánica.
                    </div>
                </div>

                <h3>Energéticos Secundarios</h3>
                <div class="energeticos-grid">
                    <div class="energetico-item">
                        <strong>Gas Licuado (GLP):</strong> Mezcla de butano y propano, principalmente de uso doméstico.
                    </div>
                    <div class="energetico-item">
                        <strong>Gasolinas:</strong> Mezcla volátil de hidrocarburos, usada como combustible para automóviles.
                    </div>
                    <div class="energetico-item">
                        <strong>Diésel:</strong> Hidrocarburo líquido empleado en transporte pesado e industria.
                    </div>
                    <div class="energetico-item">
                        <strong>Electricidad:</strong> Forma de energía muy versátil y transformable en energía mecánica, térmica y lumínica.
                    </div>
                </div>
            </div>

            <div class="info-section">
                <h2>Flujo de la Energía</h2>
                <p>El diagrama Sankey muestra visualmente el flujo de energía, donde la anchura de las flechas es proporcional a la cantidad de energía:</p>
                
                <div class="flujo-steps">
                    <div class="step">
                        <h4>1. Origen de la Energía</h4>
                        <p>Comienza con la Producción (energía primaria extraída del territorio nacional), Importaciones y Variación de Inventarios.</p>
                    </div>
                    <div class="step">
                        <h4>2. Disponibilidad Interna</h4>
                        <p>De la Oferta Total, se restan las Exportaciones y la Energía no Aprovechada, resultando en la Oferta Interna Bruta.</p>
                    </div>
                    <div class="step">
                        <h4>3. Procesos de Transformación</h4>
                        <p>Los energéticos se transforman en refinerías, plantas de gas, fraccionadoras y centrales eléctricas.</p>
                    </div>
                    <div class="step">
                        <h4>4. Consumo Final</h4>
                        <p>La energía llega a los sectores: Agropecuario, Industrial, Comercial, Residencial, Público y Transporte.</p>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <h2>Importancia del Análisis</h2>
                <div class="importancia-grid">
                    <div class="importancia-item">
                        <h4>🔍 Diagnóstico y Tendencias</h4>
                        <p>Identifica la situación actual del sector y revela tendencias energéticas.</p>
                    </div>
                    <div class="importancia-item">
                        <h4>⚡ Eficiencia del Sistema</h4>
                        <p>Resalta las pérdidas energéticas en cada etapa de la cadena.</p>
                    </div>
                    <div class="importancia-item">
                        <h4>📊 Matriz Energética</h4>
                        <p>Muestra la evolución de la mezcla de energéticos del país.</p>
                    </div>
                    <div class="importancia-item">
                        <h4>🏭 Patrones de Consumo</h4>
                        <p>Detalla qué sectores consumen más energía y qué energéticos predominan.</p>
                    </div>
                    <div class="importancia-item">
                        <h4>⚠️ Vulnerabilidades</h4>
                        <p>Identifica la dependencia energética del exterior y riesgos de suministro.</p>
                    </div>
                    <div class="importancia-item">
                        <h4>📋 Políticas Públicas</h4>
                        <p>Base sólida para formular políticas energéticas sostenibles.</p>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <h2>Cómo Usar esta Visualización</h2>
                <div class="uso-instrucciones">
                    <p><strong>Selección de Año:</strong> Use el selector para ver datos de diferentes años y comparar tendencias.</p>
                    <p><strong>Interactividad:</strong> Pase el cursor sobre los flujos para ver detalles específicos de cada energético.</p>
                    <p><strong>Exportación:</strong> Use los botones de exportación para guardar el diagrama en formato PNG o SVG.</p>
                    <p><strong>Análisis:</strong> Observe el grosor de los flujos para identificar los energéticos más importantes y las transformaciones principales.</p>
                </div>
            </div>
        `;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new InfoManager();
});