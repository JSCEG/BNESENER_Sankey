/**
 * Test para verificar la funcionalidad de parámetros configurables y controles de usuario
 * del LinkRoutingManager
 */

class ConfigurableRoutingTest {
    constructor() {
        this.testResults = [];
        this.manager = null;
    }

    /**
     * Ejecuta todos los tests de configuración
     */
    async runAllTests() {
        console.log('🧪 Iniciando tests de configuración de routing...');
        
        try {
            this.setupTestManager();
            
            await this.testConfigurationValidation();
            await this.testDynamicConfigUpdate();
            await this.testCurvatureControls();
            await this.testSeparationControls();
            await this.testAvoidanceControls();
            await this.testPerformanceMonitoring();
            await this.testFallbackMechanisms();
            await this.testUserControls();
            await this.testAutoOptimization();
            
            this.printResults();
            
        } catch (error) {
            console.error('❌ Error ejecutando tests:', error);
        }
    }

    /**
     * Configura el manager para testing
     */
    setupTestManager() {
        // Crear manager con configuración de test
        this.manager = new LinkRoutingManager({
            performanceMonitoring: true,
            autoOptimization: true,
            fallbackEnabled: true,
            maxCalculationTime: 100 // Tiempo corto para testing
        });
        
        this.addTestResult('Setup', 'Manager creado correctamente', true);
    }

    /**
     * Test de validación de configuración
     */
    async testConfigurationValidation() {
        console.log('Testing configuration validation...');
        
        // Test valores válidos
        const validConfig = {
            curvature: 0.5,
            linkSeparation: 0.03,
            avoidanceRadius: 0.08,
            performanceMode: 'balanced'
        };
        
        const validResult = this.manager.validateConfig(validConfig);
        this.addTestResult(
            'Config Validation - Valid',
            'Configuración válida aceptada',
            Object.keys(validResult).length === 4
        );

        // Test valores inválidos
        const invalidConfig = {
            curvature: 1.5, // Fuera de rango
            linkSeparation: -0.1, // Negativo
            performanceMode: 'invalid' // Valor no válido
        };
        
        const invalidResult = this.manager.validateConfig(invalidConfig);
        this.addTestResult(
            'Config Validation - Invalid',
            'Configuración inválida rechazada',
            Object.keys(invalidResult).length === 0
        );
    }

    /**
     * Test de actualización dinámica de configuración
     */
    async testDynamicConfigUpdate() {
        console.log('Testing dynamic configuration updates...');
        
        const originalCurvature = this.manager.config.curvature;
        
        // Test actualización simple
        const result = this.manager.updateConfig({ curvature: 0.7 });
        this.addTestResult(
            'Dynamic Update - Simple',
            'Actualización simple exitosa',
            result.updated && this.manager.config.curvature === 0.7
        );

        // Test actualización múltiple
        const multiResult = this.manager.updateMultipleConfigParams({
            curvature: 0.4,
            linkSeparation: 0.025,
            avoidanceRadius: 0.06
        });
        
        this.addTestResult(
            'Dynamic Update - Multiple',
            'Actualización múltiple exitosa',
            multiResult.updateResult.updated &&
            this.manager.config.curvature === 0.4 &&
            this.manager.config.linkSeparation === 0.025
        );

        // Restaurar valor original
        this.manager.updateConfig({ curvature: originalCurvature });
    }

    /**
     * Test de controles de curvatura
     */
    async testCurvatureControls() {
        console.log('Testing curvature controls...');
        
        const result = this.manager.updateCurvature(0.6, {
            adaptive: true,
            step: 0.03
        });
        
        this.addTestResult(
            'Curvature Controls',
            'Control de curvatura funcional',
            result.updated &&
            this.manager.config.curvature === 0.6 &&
            this.manager.config.adaptiveCurvature === true &&
            this.manager.config.curvatureStep === 0.03
        );
    }

    /**
     * Test de controles de separación
     */
    async testSeparationControls() {
        console.log('Testing separation controls...');
        
        const result = this.manager.updateSeparation(0.035, {
            group: 0.07,
            multiplier: 1.2,
            adaptive: true
        });
        
        this.addTestResult(
            'Separation Controls',
            'Control de separación funcional',
            result.updated &&
            this.manager.config.linkSeparation === 0.035 &&
            this.manager.config.groupSeparation === 0.07 &&
            this.manager.config.separationMultiplier === 1.2
        );
    }

    /**
     * Test de controles de evitación
     */
    async testAvoidanceControls() {
        console.log('Testing avoidance controls...');
        
        const result = this.manager.updateAvoidance(0.08, {
            strength: 1.3,
            decay: 0.7,
            smart: true,
            nodeAvoidance: true,
            linkAvoidance: true
        });
        
        this.addTestResult(
            'Avoidance Controls',
            'Control de evitación funcional',
            result.updated &&
            this.manager.config.avoidanceRadius === 0.08 &&
            this.manager.config.avoidanceStrength === 1.3 &&
            this.manager.config.smartAvoidance === true
        );
    }

    /**
     * Test de monitoreo de rendimiento
     */
    async testPerformanceMonitoring() {
        console.log('Testing performance monitoring...');
        
        // Simular cálculo con métricas
        const startTime = performance.now();
        this.manager.updatePerformanceMetrics(150); // 150ms simulado
        
        const metrics = this.manager.getPerformanceMetrics();
        
        this.addTestResult(
            'Performance Monitoring',
            'Monitoreo de rendimiento activo',
            metrics.totalCalculations > 0 &&
            metrics.lastCalculationTime === 150 &&
            Array.isArray(metrics.recommendations)
        );
    }

    /**
     * Test de mecanismos de fallback
     */
    async testFallbackMechanisms() {
        console.log('Testing fallback mechanisms...');
        
        // Crear datos de test simples
        const testLinks = [
            { source: 0, target: 1, value: 10 },
            { source: 1, target: 2, value: 8 }
        ];
        
        const testNodes = [
            { name: 'Node 0', x: 0, y: 0.5 },
            { name: 'Node 1', x: 0.5, y: 0.5 },
            { name: 'Node 2', x: 1, y: 0.5 }
        ];

        try {
            // Test fallback por timeout (configuración muy restrictiva)
            this.manager.updateConfig({ maxCalculationTime: 1 }); // 1ms muy restrictivo
            
            const routes = await this.manager.calculateRoutes(testLinks, testNodes);
            
            this.addTestResult(
                'Fallback Mechanisms',
                'Fallback funciona correctamente',
                Array.isArray(routes) && routes.length > 0
            );
            
            // Restaurar configuración normal
            this.manager.updateConfig({ maxCalculationTime: 500 });
            
        } catch (error) {
            this.addTestResult(
                'Fallback Mechanisms',
                'Error en fallback: ' + error.message,
                false
            );
        }
    }

    /**
     * Test de controles de usuario
     */
    async testUserControls() {
        console.log('Testing user controls...');
        
        // Test control de calidad visual
        const qualityResult = this.manager.setVisualQuality('high');
        this.addTestResult(
            'User Controls - Quality',
            'Control de calidad visual funcional',
            qualityResult.success &&
            this.manager.config.visualQuality === 'high'
        );

        // Test características adaptativas
        const adaptiveResult = this.manager.setAdaptiveFeatures(false);
        this.addTestResult(
            'User Controls - Adaptive',
            'Control de características adaptativas funcional',
            adaptiveResult.success &&
            this.manager.config.adaptiveCurvature === false
        );

        // Test balance rendimiento/calidad
        const balanceResult = this.manager.setPerformanceQualityBalance(0.7);
        this.addTestResult(
            'User Controls - Balance',
            'Control de balance rendimiento/calidad funcional',
            balanceResult.success &&
            balanceResult.balance === 0.7
        );

        // Test reset a defaults
        const resetResult = this.manager.resetToDefaults();
        this.addTestResult(
            'User Controls - Reset',
            'Reset a configuración por defecto funcional',
            resetResult.success
        );
    }

    /**
     * Test de auto-optimización
     */
    async testAutoOptimization() {
        console.log('Testing auto-optimization...');
        
        // Simular degradación de rendimiento
        const originalIterations = this.manager.config.maxIterations;
        
        // Simular tiempo alto para disparar optimización
        this.manager.triggerAutoOptimization(800); // 800ms alto
        
        this.addTestResult(
            'Auto Optimization',
            'Auto-optimización funcional',
            this.manager.config.maxIterations < originalIterations ||
            this.manager.config.performanceMode === 'fast'
        );
    }

    /**
     * Añade un resultado de test
     */
    addTestResult(testName, description, passed) {
        this.testResults.push({
            name: testName,
            description,
            passed,
            timestamp: new Date().toISOString()
        });
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${description}`);
    }

    /**
     * Imprime resumen de resultados
     */
    printResults() {
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const percentage = ((passed / total) * 100).toFixed(1);
        
        console.log('\n📊 RESUMEN DE TESTS DE CONFIGURACIÓN:');
        console.log(`✅ Pasados: ${passed}/${total} (${percentage}%)`);
        console.log(`❌ Fallidos: ${total - passed}/${total}`);
        
        if (passed === total) {
            console.log('🎉 ¡Todos los tests de configuración pasaron exitosamente!');
        } else {
            console.log('⚠️  Algunos tests fallaron. Revisar implementación.');
            
            // Mostrar tests fallidos
            const failed = this.testResults.filter(r => !r.passed);
            failed.forEach(test => {
                console.log(`❌ ${test.name}: ${test.description}`);
            });
        }
        
        return { passed, total, percentage };
    }

    /**
     * Obtiene los resultados de los tests
     */
    getResults() {
        return {
            results: this.testResults,
            summary: {
                passed: this.testResults.filter(r => r.passed).length,
                total: this.testResults.length,
                percentage: ((this.testResults.filter(r => r.passed).length / this.testResults.length) * 100).toFixed(1)
            }
        };
    }
}

// Función para ejecutar los tests
async function runConfigurableRoutingTests() {
    const tester = new ConfigurableRoutingTest();
    await tester.runAllTests();
    return tester.getResults();
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConfigurableRoutingTest, runConfigurableRoutingTests };
}