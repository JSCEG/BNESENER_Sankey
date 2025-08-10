/**
 * ParticleAnimationManager - Manages animated particles flowing through Sankey diagram links
 * 
 * This class creates and manages animated particles that flow along the Sankey diagram links,
 * respecting energy type colors and maintaining synchronization with diagram transformations.
 */
class ParticleAnimationManager {
    constructor(sankeyContainer, options = {}) {
        this.sankeyContainer = sankeyContainer;
        this.options = {
            particleCount: 100,
            particleSize: 3,
            animationSpeed: 1,
            enabled: false,
            particleOpacity: 0.8,
            respawnDelay: 50, // ms between particle spawns
            ...options
        };
        
        this.particles = [];
        this.linkPaths = [];
        this.animationId = null;
        this.isAnimating = false;
        this.lastSpawnTime = 0;
        
        // SVG overlay for particles
        this.svgOverlay = null;
        this.particleGroup = null;
        
        this.init();
    }
    
    init() {
        console.log('ParticleAnimationManager: Inicializando...');
        this.createSVGOverlay();
        this.bindEvents();
    }
    
    createSVGOverlay() {
        // Create SVG overlay that matches the Plotly container
        this.svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgOverlay.style.position = 'absolute';
        this.svgOverlay.style.top = '0';
        this.svgOverlay.style.left = '0';
        this.svgOverlay.style.width = '100%';
        this.svgOverlay.style.height = '100%';
        this.svgOverlay.style.pointerEvents = 'none';
        this.svgOverlay.style.zIndex = '10';
        
        // Create particle group
        this.particleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.particleGroup.setAttribute('class', 'sankey-particles');
        this.svgOverlay.appendChild(this.particleGroup);
        
        // Add overlay to the sankey container
        this.sankeyContainer.style.position = 'relative';
        this.sankeyContainer.appendChild(this.svgOverlay);
        
        console.log('ParticleAnimationManager: SVG overlay creado');
    }
    
    bindEvents() {
        // Listen for Plotly events
        this.sankeyContainer.on('plotly_afterplot', () => {
            console.log('ParticleAnimationManager: plotly_afterplot evento detectado');
            setTimeout(() => this.extractLinkPaths(), 100);
        });
        
        this.sankeyContainer.on('plotly_relayout', () => {
            console.log('ParticleAnimationManager: plotly_relayout evento detectado');
            this.updateOverlayTransform();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateOverlaySize();
        });
    }
    
    extractLinkPaths() {
        console.log('ParticleAnimationManager: Extrayendo rutas de enlaces...');
        this.linkPaths = [];
        
        // Find all Sankey link paths directly in the sankeyContainer
        const svg = this.sankeyContainer.querySelector('svg');
        if (!svg) {
            console.warn('ParticleAnimationManager: No se encontró elemento SVG');
            return;
        }
        
        const sankeyElement = svg.querySelector('.sankey');
        if (!sankeyElement) {
            console.warn('ParticleAnimationManager: No se encontró elemento .sankey');
            return;
        }
        
        // Get all paths - Plotly uses style-based fills, not fill attributes
        const allPaths = sankeyElement.querySelectorAll('path');
        console.log(`ParticleAnimationManager: Encontrados ${allPaths.length} elementos path`);
        
        allPaths.forEach((pathElement, index) => {
            const pathData = pathElement.getAttribute('d');
            const style = pathElement.getAttribute('style') || pathElement.style.cssText;
            
            if (pathData && style) {
                // Extract fill color from style
                let fillColor = '#999'; // default
                const fillMatch = style.match(/fill:\s*([^;]+)/);
                if (fillMatch) {
                    fillColor = fillMatch[1].trim();
                }
                
                // Skip if fill is none
                if (fillColor === 'none') {
                    return;
                }
                
                // Calculate path length for animation
                try {
                    const pathLength = pathElement.getTotalLength();
                    
                    this.linkPaths.push({
                        element: pathElement,
                        pathData: pathData,
                        color: fillColor,
                        strokeColor: fillColor,
                        length: pathLength,
                        index: index
                    });
                } catch (error) {
                    console.warn(`ParticleAnimationManager: Error calculando longitud del path ${index}:`, error);
                }
            }
        });
        
        console.log(`ParticleAnimationManager: ${this.linkPaths.length} rutas de enlaces extraídas`);
        
        // Start animation if enabled
        if (this.options.enabled && this.linkPaths.length > 0) {
            this.startAnimation();
        }
    }
    
    updateOverlayTransform() {
        // Sync overlay with Plotly's transform
        const svg = this.sankeyContainer.querySelector('svg');
        if (!svg) return;
        
        const sankeyLayer = svg.querySelector('.sankey');
        if (sankeyLayer) {
            const transform = sankeyLayer.getAttribute('transform');
            if (transform) {
                this.particleGroup.setAttribute('transform', transform);
            }
        }
    }
    
    updateOverlaySize() {
        const rect = this.sankeyContainer.getBoundingClientRect();
        this.svgOverlay.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
        this.svgOverlay.style.width = rect.width + 'px';
        this.svgOverlay.style.height = rect.height + 'px';
    }
    
    createParticle(linkPath) {
        const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        particle.setAttribute('r', this.options.particleSize);
        particle.setAttribute('fill', linkPath.color);
        particle.setAttribute('opacity', this.options.particleOpacity);
        particle.setAttribute('class', 'sankey-particle');
        
        // Add glow effect
        particle.setAttribute('filter', 'url(#particle-glow)');
        
        return {
            element: particle,
            linkPath: linkPath,
            progress: 0,
            speed: (Math.random() * 0.5 + 0.5) * this.options.animationSpeed,
            id: Math.random().toString(36).substr(2, 9)
        };
    }
    
    createGlowFilter() {
        // Create SVG filter for particle glow effect
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'particle-glow');
        filter.setAttribute('x', '-50%');
        filter.setAttribute('y', '-50%');
        filter.setAttribute('width', '200%');
        filter.setAttribute('height', '200%');
        
        const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        feGaussianBlur.setAttribute('stdDeviation', '2');
        feGaussianBlur.setAttribute('result', 'coloredBlur');
        
        const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
        const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        feMergeNode1.setAttribute('in', 'coloredBlur');
        const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        feMergeNode2.setAttribute('in', 'SourceGraphic');
        
        feMerge.appendChild(feMergeNode1);
        feMerge.appendChild(feMergeNode2);
        filter.appendChild(feGaussianBlur);
        filter.appendChild(feMerge);
        defs.appendChild(filter);
        this.svgOverlay.appendChild(defs);
    }
    
    spawnParticle() {
        if (this.linkPaths.length === 0) return;
        
        // Choose a random link path weighted by value/width
        const linkPath = this.linkPaths[Math.floor(Math.random() * this.linkPaths.length)];
        const particle = this.createParticle(linkPath);
        
        this.particles.push(particle);
        this.particleGroup.appendChild(particle.element);
    }
    
    updateParticle(particle, deltaTime) {
        // Update particle progress along the path
        particle.progress += particle.speed * deltaTime * 0.001; // Convert to seconds
        
        if (particle.progress >= 1) {
            // Particle reached the end, remove it
            this.removeParticle(particle);
            return false;
        }
        
        // Calculate position along the path
        const point = particle.linkPath.element.getPointAtLength(
            particle.progress * particle.linkPath.length
        );
        
        particle.element.setAttribute('cx', point.x);
        particle.element.setAttribute('cy', point.y);
        
        return true;
    }
    
    removeParticle(particle) {
        const index = this.particles.indexOf(particle);
        if (index > -1) {
            this.particles.splice(index, 1);
            if (particle.element.parentNode) {
                particle.element.parentNode.removeChild(particle.element);
            }
        }
    }
    
    animate(currentTime) {
        if (!this.isAnimating) return;
        
        const deltaTime = currentTime - (this.lastFrameTime || currentTime);
        this.lastFrameTime = currentTime;
        
        // Spawn new particles
        if (currentTime - this.lastSpawnTime > this.options.respawnDelay) {
            if (this.particles.length < this.options.particleCount) {
                this.spawnParticle();
                this.lastSpawnTime = currentTime;
            }
        }
        
        // Update existing particles
        this.particles = this.particles.filter(particle => 
            this.updateParticle(particle, deltaTime)
        );
        
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }
    
    startAnimation() {
        if (this.isAnimating) return;
        
        console.log('ParticleAnimationManager: Iniciando animación...');
        this.isAnimating = true;
        this.lastFrameTime = null;
        this.lastSpawnTime = 0;
        
        // Create glow filter if not exists
        if (!this.svgOverlay.querySelector('#particle-glow')) {
            this.createGlowFilter();
        }
        
        // Update overlay to match current state
        this.updateOverlaySize();
        this.updateOverlayTransform();
        
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }
    
    stopAnimation() {
        console.log('ParticleAnimationManager: Deteniendo animación...');
        this.isAnimating = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clear all particles
        this.particles.forEach(particle => {
            if (particle.element.parentNode) {
                particle.element.parentNode.removeChild(particle.element);
            }
        });
        this.particles = [];
    }
    
    toggleAnimation() {
        this.options.enabled = !this.options.enabled;
        
        if (this.options.enabled) {
            if (this.linkPaths.length > 0) {
                this.startAnimation();
            } else {
                // Extract paths first
                this.extractLinkPaths();
            }
        } else {
            this.stopAnimation();
        }
        
        return this.options.enabled;
    }
    
    setAnimationSpeed(speed) {
        this.options.animationSpeed = Math.max(0.1, Math.min(5, speed));
        console.log(`ParticleAnimationManager: Velocidad de animación establecida a ${this.options.animationSpeed}`);
    }
    
    setParticleCount(count) {
        this.options.particleCount = Math.max(10, Math.min(500, count));
        console.log(`ParticleAnimationManager: Cantidad de partículas establecida a ${this.options.particleCount}`);
    }
    
    isEnabled() {
        return this.options.enabled;
    }
    
    getStats() {
        return {
            enabled: this.options.enabled,
            particleCount: this.particles.length,
            maxParticles: this.options.particleCount,
            linkPaths: this.linkPaths.length,
            animationSpeed: this.options.animationSpeed
        };
    }
    
    destroy() {
        console.log('ParticleAnimationManager: Destruyendo...');
        this.stopAnimation();
        
        if (this.svgOverlay && this.svgOverlay.parentNode) {
            this.svgOverlay.parentNode.removeChild(this.svgOverlay);
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.updateOverlaySize);
    }
}

// Export for use in other modules
window.ParticleAnimationManager = ParticleAnimationManager;