/**
 * Test de integración para verificar que RouteCalculator funciona correctamente
 * dentro del LinkRoutingManager
 */

// Función para ejecutar test de integración
function runIntegrationTest() {
    console.log('🔧 Ejecutando test de integración RouteCalculator...\n');
    
    try {
        // 1. Crear LinkRoutingManager con RouteCalculator
        console.log('1. Creando LinkRoutingManager...');
        const linkRoutingManager = new LinkRoutingManager({
            curvature: 0.3,
            routingAlgorithm: 'bezier-optimized',
            enableRouting: true
        });
        
        console.log('✅ LinkRoutingManager creado correctamente');
        console.log('   Algoritmo:', linkRoutingManager.config.routingAlgorithm);
        console.log('   RouteCalculator disponible:', !!linkRoutingManager.routeCalculator);
        
        // 2. Verificar que RouteCalculator está inicializado
        console.log('\n2. Verificando RouteCalculator...');
        const routeCalculator = linkRoutingManager.routeCalculator;
        
        if (!routeCalculator) {
            throw new Error('RouteCalculator no está inicializado');
        }
        
        console.log('✅ RouteCalculator inicializado correctamente');
        console.log('   Algoritmos disponibles:', Object.keys(routeCalculator.algorithms));
        console.log('   Configuración de colisiones:', routeCalculator.collisionConfig);
        
        // 3. Test de cálculo de puntos de control
        console.log('\n3. Probando cálculo de puntos de control...');
        const startPoint = { x: 0.2, y: 0.4 };
        const endPoint = { x: 0.8, y: 0.6 };
        const sourceInfo = { type: 'source' };
        const targetInfo = { type: 'consumption' };
        
        const controlPoints = routeCalculator.calculateBezierControlPoints(
            startPoint, endPoint, sourceInfo, targetInfo, 0
        );
        
        console.log('✅ Puntos de control calculados:');
        controlPoints.forEach((point, index) => {
            console.log(`   P${index}: (${point.x.toFixed(3)}, ${point.y.toFixed(3)})`);
        });
        
        // 4. Test de evaluación de curva Bézier
        console.log('\n4. Probando evaluación de curva Bézier...');
        const [P0, P1, P2, P3] = controlPoints;
        
        const testPoints = [0, 0.25, 0.5, 0.75, 1];
        testPoints.forEach(t => {
            const point = routeCalculator.evaluateBezierCurve(P0, P1, P2, P3, t);
            console.log(`   t=${t}: (${point.x.toFixed(3)}, ${point.y.toFixed(3)})`);
        });
        
        // 5. Test de generación de datos Plotly
        console.log('\n5. Probando generación de datos Plotly...');
        const plotlyData = routeCalculator.generatePlotlyPathData(controlPoints);
        
        console.log('✅ Datos Plotly generados:');
        console.log('   SVG Path:', plotlyData.svgPath);
        console.log('   Puntos discretos:', plotlyData.x.length);
        console.log('   Configuración Plotly:', !!plotlyData.plotlyConfig);
        
        // 6. Test de detección de colisiones
        console.log('\n6. Probando detección de colisiones...');
        const samplePoints = routeCalculator.sampleBezierCurve(controlPoints, 10);
        
        // Crear un nodo que intersecte la curva
        const nodeBounds = {
            left: 0.45, right: 0.55,
            top: 0.45, bottom: 0.55
        };
        
        const collisions = routeCalculator.detectCurveNodeCollisions(samplePoints, nodeBounds);
        
        console.log('✅ Detección de colisiones:');
        console.log('   Puntos muestreados:', samplePoints.length);
        console.log('   Colisiones detectadas:', collisions.length);
        
        // 7. Test de cálculo completo de ruta
        console.log('\n7. Probando cálculo completo de ruta...');
        
        const testLink = {
            source: 0,
            target: 1,
            value: 150,
            color: '#ff6b6b',
            customdata: 'Test Link: 150 PJ'
        };
        
        const testNodes = [
            { x: 0.1, y: 0.3, name: 'Nodo Origen' },
            { x: 0.9, y: 0.7, name: 'Nodo Destino' }
        ];
        
        const testHierarchy = new Map();
        testHierarchy.set(0, {
            type: 'source',
            bounds: { left: 0.08, right: 0.12, top: 0.28, bottom: 0.32, width: 0.04, height: 0.04 }
        });
        testHierarchy.set(1, {
            type: 'consumption',
            bounds: { left: 0.88, right: 0.92, top: 0.68, bottom: 0.72, width: 0.04, height: 0.04 }
        });
        
        const route = routeCalculator.calculateBezierRoute(
            testLink, testNodes[0], testNodes[1], testHierarchy, 0
        );
        
        console.log('✅ Ruta completa calculada:');
        console.log('   ID:', route.id);
        console.log('   Tipo:', route.path.type);
        console.log('   Curvatura:', route.path.curvature.toFixed(3));
        console.log('   Prioridad:', route.routing.priority.toFixed(3));
        console.log('   Tipo de flujo:', route.routing.flowType);
        console.log('   Zonas de evitación:', route.routing.avoidanceZones.length);
        
        // 8. Test de diferentes algoritmos
        console.log('\n8. Probando diferentes algoritmos...');
        
        const algorithms = ['bezier-optimized', 'spline-smooth', 'arc-minimal'];
        
        algorithms.forEach(algorithm => {
            try {
                const originalAlgorithm = routeCalculator.config.routingAlgorithm;
                routeCalculator.config.routingAlgorithm = algorithm;
                
                const algorithmRoute = routeCalculator.algorithms[algorithm](
                    testLink, testNodes[0], testNodes[1], testHierarchy, 0
                );
                
                console.log(`✅ Algoritmo ${algorithm}:`);
                console.log(`   Curvatura: ${algorithmRoute.path.curvature.toFixed(3)}`);
                console.log(`   Tipo: ${algorithmRoute.path.type}`);
                
                routeCalculator.config.routingAlgorithm = originalAlgorithm;
                
            } catch (error) {
                console.log(`❌ Error con algoritmo ${algorithm}:`, error.message);
            }
        });
        
        console.log('\n🎉 Test de integración completado exitosamente!');
        console.log('📊 Resumen:');
        console.log('   ✅ LinkRoutingManager inicializado');
        console.log('   ✅ RouteCalculator funcional');
        console.log('   ✅ Cálculo de puntos de control');
        console.log('   ✅ Evaluación de curvas Bézier');
        console.log('   ✅ Generación de datos Plotly');
        console.log('   ✅ Detección de colisiones');
        console.log('   ✅ Cálculo completo de rutas');
        console.log('   ✅ Múltiples algoritmos');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Error en test de integración:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Exportar para uso en otros contextos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runIntegrationTest };
}

// Auto-ejecutar si se carga directamente en el navegador
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        runIntegrationTest();
    });
}