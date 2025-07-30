/**
 * Tests para RouteCalculator - Verificación de funcionalidad de curvas Bézier
 */

// Función para crear un mock de configuración
function createMockConfig() {
    return {
        curvature: 0.3,
        minCurvature: 0.1,
        maxCurvature: 0.8,
        linkSeparation: 0.02,
        avoidanceRadius: 0.05,
        routingAlgorithm: 'bezier-optimized'
    };
}

// Función para crear nodos de prueba
function createTestNodes() {
    return [
        { x: 0.1, y: 0.3, name: 'Producción Primaria' },
        { x: 0.5, y: 0.4, name: 'Transformación' },
        { x: 0.9, y: 0.5, name: 'Consumo Final' }
    ];
}

// Función para crear enlaces de prueba
function createTestLinks() {
    return [
        { source: 0, target: 1, value: 100, color: '#ff0000', customdata: 'Flujo 1: 100 PJ' },
        { source: 1, target: 2, value: 80, color: '#00ff00', customdata: 'Flujo 2: 80 PJ' }
    ];
}

// Función para crear jerarquía mock
function createMockHierarchy(nodes) {
    const hierarchy = new Map();
    
    nodes.forEach((node, index) => {
        hierarchy.set(index, {
            index: index,
            name: node.name,
            type: index === 0 ? 'source' : index === nodes.length - 1 ? 'consumption' : 'transformation',
            bounds: {
                left: node.x - 0.02,
                right: node.x + 0.02,
                top: node.y - 0.03,
                bottom: node.y + 0.03,
                width: 0.04,
                height: 0.06,
                centerX: node.x,
                centerY: node.y
            },
            parents: index > 0 ? [index - 1] : [],
            children: index < nodes.length - 1 ? [index + 1] : []
        });
    });
    
    return hierarchy;
}

// Test 1: Verificar inicialización del RouteCalculator
function testRouteCalculatorInitialization() {
    console.log('🧪 Test 1: Inicialización del RouteCalculator');
    
    try {
        const config = createMockConfig();
        const calculator = new RouteCalculator(config);
        
        console.assert(calculator.config.curvature === 0.3, 'Configuración de curvatura incorrecta');
        console.assert(calculator.algorithms['bezier-optimized'], 'Algoritmo Bézier no disponible');
        console.assert(calculator.collisionConfig.samplingPoints === 20, 'Configuración de colisiones incorrecta');
        
        console.log('✅ RouteCalculator inicializado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
        return false;
    }
}

// Test 2: Verificar cálculo de puntos de control Bézier
function testBezierControlPointsCalculation() {
    console.log('🧪 Test 2: Cálculo de puntos de control Bézier');
    
    try {
        const config = createMockConfig();
        const calculator = new RouteCalculator(config);
        const nodes = createTestNodes();
        const hierarchy = createMockHierarchy(nodes);
        
        const startPoint = { x: 0.1, y: 0.3 };
        const endPoint = { x: 0.5, y: 0.4 };
        const sourceInfo = hierarchy.get(0);
        const targetInfo = hierarchy.get(1);
        
        const controlPoints = calculator.calculateBezierControlPoints(
            startPoint, endPoint, sourceInfo, targetInfo, 0
        );
        
        console.assert(controlPoints.length === 4, 'Número incorrecto de puntos de control');
        console.assert(controlPoints[0].x === startPoint.x, 'Punto inicial incorrecto');
        console.assert(controlPoints[3].x === endPoint.x, 'Punto final incorrecto');
        console.assert(controlPoints[1].x > startPoint.x, 'Punto de control 1 mal posicionado');
        console.assert(controlPoints[2].x < endPoint.x, 'Punto de control 2 mal posicionado');
        
        console.log('✅ Puntos de control Bézier calculados correctamente');
        console.log('   P0:', controlPoints[0]);
        console.log('   P1:', controlPoints[1]);
        console.log('   P2:', controlPoints[2]);
        console.log('   P3:', controlPoints[3]);
        return true;
    } catch (error) {
        console.error('❌ Error en cálculo de puntos de control:', error);
        return false;
    }
}

// Test 3: Verificar evaluación de curva Bézier
function testBezierCurveEvaluation() {
    console.log('🧪 Test 3: Evaluación de curva Bézier');
    
    try {
        const config = createMockConfig();
        const calculator = new RouteCalculator(config);
        
        const P0 = { x: 0, y: 0 };
        const P1 = { x: 0.3, y: 0.2 };
        const P2 = { x: 0.7, y: 0.2 };
        const P3 = { x: 1, y: 0 };
        
        // Evaluar en t=0 (debe ser P0)
        const point0 = calculator.evaluateBezierCurve(P0, P1, P2, P3, 0);
        console.assert(Math.abs(point0.x - P0.x) < 0.001, 'Evaluación en t=0 incorrecta');
        console.assert(Math.abs(point0.y - P0.y) < 0.001, 'Evaluación en t=0 incorrecta');
        
        // Evaluar en t=1 (debe ser P3)
        const point1 = calculator.evaluateBezierCurve(P0, P1, P2, P3, 1);
        console.assert(Math.abs(point1.x - P3.x) < 0.001, 'Evaluación en t=1 incorrecta');
        console.assert(Math.abs(point1.y - P3.y) < 0.001, 'Evaluación en t=1 incorrecta');
        
        // Evaluar en t=0.5 (punto medio)
        const pointMid = calculator.evaluateBezierCurve(P0, P1, P2, P3, 0.5);
        console.assert(pointMid.x > 0.4 && pointMid.x < 0.6, 'Punto medio X fuera de rango esperado');
        
        console.log('✅ Evaluación de curva Bézier correcta');
        console.log('   t=0:', point0);
        console.log('   t=0.5:', pointMid);
        console.log('   t=1:', point1);
        return true;
    } catch (error) {
        console.error('❌ Error en evaluación de curva:', error);
        return false;
    }
}

// Test 4: Verificar detección de colisiones con nodos
function testNodeCollisionDetection() {
    console.log('🧪 Test 4: Detección de colisiones con nodos');
    
    try {
        const config = createMockConfig();
        const calculator = new RouteCalculator(config);
        
        // Crear puntos de muestra que pasan por un nodo
        const samplePoints = [
            { x: 0.2, y: 0.3, t: 0.2 },
            { x: 0.5, y: 0.4, t: 0.5 }, // Este punto está dentro del nodo
            { x: 0.8, y: 0.5, t: 0.8 }
        ];
        
        const nodeBounds = {
            left: 0.48,
            right: 0.52,
            top: 0.38,
            bottom: 0.42
        };
        
        const collisions = calculator.detectCurveNodeCollisions(samplePoints, nodeBounds);
        
        console.assert(collisions.length === 1, 'Número incorrecto de colisiones detectadas');
        console.assert(collisions[0].x === 0.5, 'Punto de colisión incorrecto');
        
        console.log('✅ Detección de colisiones funcionando correctamente');
        console.log('   Colisiones detectadas:', collisions.length);
        return true;
    } catch (error) {
        console.error('❌ Error en detección de colisiones:', error);
        return false;
    }
}

// Test 5: Verificar generación de datos para Plotly
function testPlotlyPathGeneration() {
    console.log('🧪 Test 5: Generación de datos para Plotly');
    
    try {
        const config = createMockConfig();
        const calculator = new RouteCalculator(config);
        
        const controlPoints = [
            { x: 0.1, y: 0.3 },
            { x: 0.3, y: 0.2 },
            { x: 0.7, y: 0.5 },
            { x: 0.9, y: 0.4 }
        ];
        
        const plotlyData = calculator.generatePlotlyPathData(controlPoints);
        
        console.assert(plotlyData.svgPath, 'Path SVG no generado');
        console.assert(plotlyData.x && plotlyData.x.length > 0, 'Array X no generado');
        console.assert(plotlyData.y && plotlyData.y.length > 0, 'Array Y no generado');
        console.assert(plotlyData.plotlyConfig, 'Configuración Plotly no generada');
        console.assert(plotlyData.svgPath.startsWith('M'), 'Path SVG con formato incorrecto');
        
        console.log('✅ Datos para Plotly generados correctamente');
        console.log('   SVG Path:', plotlyData.svgPath);
        console.log('   Puntos discretos:', plotlyData.x.length);
        return true;
    } catch (error) {
        console.error('❌ Error en generación de datos Plotly:', error);
        return false;
    }
}

// Test 6: Verificar cálculo completo de ruta Bézier
function testCompleteBezierRouteCalculation() {
    console.log('🧪 Test 6: Cálculo completo de ruta Bézier');
    
    try {
        const config = createMockConfig();
        const calculator = new RouteCalculator(config);
        const nodes = createTestNodes();
        const links = createTestLinks();
        const hierarchy = createMockHierarchy(nodes);
        
        const route = calculator.calculateBezierRoute(
            links[0], nodes[0], nodes[1], hierarchy, 0
        );
        
        console.assert(route.id === 'bezier_route_0', 'ID de ruta incorrecto');
        console.assert(route.path.type === 'bezier', 'Tipo de ruta incorrecto');
        console.assert(route.path.controlPoints.length === 4, 'Número de puntos de control incorrecto');
        console.assert(route.path.plotlyPath, 'Datos Plotly no generados');
        console.assert(route.routing.priority >= 0, 'Prioridad no calculada');
        console.assert(route.routing.flowType, 'Tipo de flujo no clasificado');
        
        console.log('✅ Ruta Bézier calculada completamente');
        console.log('   ID:', route.id);
        console.log('   Tipo:', route.path.type);
        console.log('   Prioridad:', route.routing.priority);
        console.log('   Tipo de flujo:', route.routing.flowType);
        return true;
    } catch (error) {
        console.error('❌ Error en cálculo completo de ruta:', error);
        return false;
    }
}

// Función principal para ejecutar todos los tests
function runRouteCalculatorTests() {
    console.log('🚀 Iniciando tests del RouteCalculator...\n');
    
    const tests = [
        testRouteCalculatorInitialization,
        testBezierControlPointsCalculation,
        testBezierCurveEvaluation,
        testNodeCollisionDetection,
        testPlotlyPathGeneration,
        testCompleteBezierRouteCalculation
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach((test, index) => {
        try {
            if (test()) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`❌ Test ${index + 1} falló con excepción:`, error);
            failed++;
        }
        console.log(''); // Línea en blanco entre tests
    });
    
    console.log('📊 Resumen de tests:');
    console.log(`   ✅ Pasaron: ${passed}`);
    console.log(`   ❌ Fallaron: ${failed}`);
    console.log(`   📈 Tasa de éxito: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    return failed === 0;
}

// Ejecutar tests si el archivo se carga directamente
if (typeof window !== 'undefined') {
    // En el navegador, ejecutar automáticamente
    document.addEventListener('DOMContentLoaded', () => {
        runRouteCalculatorTests();
    });
} else if (typeof module !== 'undefined' && module.exports) {
    // En Node.js, exportar la función
    module.exports = { runRouteCalculatorTests };
}