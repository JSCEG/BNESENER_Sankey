/**
 * Unit Tests for NodeHierarchyMapper
 * 
 * Tests the functionality of the NodeHierarchyMapper class including:
 * - Node relationship mapping
 * - Flow type detection
 * - Hierarchy analysis
 * - Data integration with DataManager
 */

// Mock DataManager for testing
class MockDataManager {
    constructor() {
        this.mockData = {
            'Producción': {
                'Nodo Padre': 'Producción',
                'Nodos Hijo': [
                    { 'Nodo Hijo': 'Petróleo crudo', tipo: 'Energía Primaria', color: '#772F1A' },
                    { 'Nodo Hijo': 'Gas natural', tipo: 'Energía Primaria', color: '#4169E1' }
                ]
            },
            'Transformación': {
                'Nodo Padre': 'Transformación',
                'Nodos Hijo': [
                    { 'Nodo Hijo': 'Gasolinas', tipo: 'Energía Secundaria', color: '#FF6347' },
                    { 'Nodo Hijo': 'Electricidad', tipo: 'Energía Secundaria', color: '#FFD700' }
                ]
            },
            'Petróleo crudo': {
                tipo: 'Energía Primaria',
                color: '#772F1A'
            },
            'Gasolinas': {
                tipo: 'Energía Secundaria',
                color: '#FF6347'
            }
        };
    }

    getNodeData(nodeName) {
        return this.mockData[nodeName] || null;
    }

    getEnergeticValue(parentNode, childNode, year) {
        // Mock values for testing
        const mockValues = {
            'Producción-Petróleo crudo-2023': 1500,
            'Producción-Gas natural-2023': 800,
            'Transformación-Gasolinas-2023': 600,
            'Transformación-Electricidad-2023': 400
        };
        
        return mockValues[`${parentNode}-${childNode}-${year}`] || 0;
    }
}

// Test suite for NodeHierarchyMapper
describe('NodeHierarchyMapper', () => {
    let nodeHierarchyMapper;
    let mockDataManager;

    beforeEach(() => {
        mockDataManager = new MockDataManager();
        nodeHierarchyMapper = new NodeHierarchyMapper(mockDataManager);
    });

    describe('Constructor', () => {
        test('should initialize with DataManager', () => {
            expect(nodeHierarchyMapper.dataManager).toBe(mockDataManager);
            expect(nodeHierarchyMapper.hierarchyCache).toBeInstanceOf(Map);
            expect(nodeHierarchyMapper.nodeTypePatterns).toBeDefined();
            expect(nodeHierarchyMapper.flowThresholds).toBeDefined();
        });

        test('should have correct node type patterns', () => {
            const patterns = nodeHierarchyMapper.nodeTypePatterns;
            expect(patterns.source).toContain('Producción');
            expect(patterns.source).toContain('Importación');
            expect(patterns.transformation).toContain('Transformación');
            expect(patterns.consumption).toContain('Consumo');
        });

        test('should have correct flow thresholds', () => {
            const thresholds = nodeHierarchyMapper.flowThresholds;
            expect(thresholds.primary).toBe(500);
            expect(thresholds.secondary).toBe(100);
            expect(thresholds.transformation).toBe(50);
            expect(thresholds.distribution).toBe(10);
        });
    });

    describe('extractNodeName', () => {
        test('should extract clean node name from simple name', () => {
            const node = { name: 'Petróleo crudo' };
            const result = nodeHierarchyMapper.extractNodeName(node);
            expect(result).toBe('Petróleo crudo');
        });

        test('should extract clean node name from HTML formatted name', () => {
            const node = { name: 'Petróleo crudo<br>1500.00 PJ' };
            const result = nodeHierarchyMapper.extractNodeName(node);
            expect(result).toBe('Petróleo crudo');
        });

        test('should handle node without name', () => {
            const node = { index: 5 };
            const result = nodeHierarchyMapper.extractNodeName(node);
            expect(result).toBe('node_5');
        });

        test('should remove PJ values from node name', () => {
            const node = { name: 'Gas natural 800.50 PJ' };
            const result = nodeHierarchyMapper.extractNodeName(node);
            expect(result).toBe('Gas natural');
        });
    });

    describe('getNodeDataFromDataManager', () => {
        test('should retrieve node data successfully', () => {
            const result = nodeHierarchyMapper.getNodeDataFromDataManager('Producción');
            expect(result).toBeDefined();
            expect(result['Nodo Padre']).toBe('Producción');
        });

        test('should return null for non-existent node', () => {
            const result = nodeHierarchyMapper.getNodeDataFromDataManager('NonExistent');
            expect(result).toBeNull();
        });

        test('should handle DataManager without getNodeData method', () => {
            nodeHierarchyMapper.dataManager = {};
            const result = nodeHierarchyMapper.getNodeDataFromDataManager('Producción');
            expect(result).toBeNull();
        });
    });

    describe('detectNodeType', () => {
        test('should detect source node type', () => {
            const node = { name: 'Producción', x: 0.1 };
            const links = [];
            const nodeData = mockDataManager.getNodeData('Producción');
            
            const result = nodeHierarchyMapper.detectNodeType(node, links, nodeData);
            expect(result).toBe('source');
        });

        test('should detect transformation node type', () => {
            const node = { name: 'Transformación de Energía', x: 0.5 };
            const links = [];
            const nodeData = mockDataManager.getNodeData('Transformación');
            
            const result = nodeHierarchyMapper.detectNodeType(node, links, nodeData);
            expect(result).toBe('transformation');
        });

        test('should detect consumption node type', () => {
            const node = { name: 'Consumo Final', x: 0.9 };
            const links = [];
            const nodeData = null;
            
            const result = nodeHierarchyMapper.detectNodeType(node, links, nodeData);
            expect(result).toBe('consumption');
        });

        test('should detect node type based on connectivity', () => {
            const node = { name: 'Unknown Node', x: 0.5, index: 1 };
            const links = [
                { source: 0, target: 1 },
                { source: 1, target: 2 },
                { source: 1, target: 3 }
            ];
            
            const result = nodeHierarchyMapper.detectNodeType(node, links, null);
            expect(result).toBe('transformation');
        });
    });

    describe('classifyFlowType', () => {
        test('should classify primary flow', () => {
            const link = { value: 1500, customdata: '1500.00 PJ flow data' };
            const sourceNode = { name: 'Producción' };
            const targetNode = { name: 'Petróleo crudo' };
            
            const result = nodeHierarchyMapper.classifyFlowType(link, sourceNode, targetNode);
            expect(result).toBe('primary');
        });

        test('should classify transformation flow', () => {
            const link = { value: 75, customdata: '75.00 PJ flow data' };
            const sourceNode = { name: 'Petróleo crudo' };
            const targetNode = { name: 'Transformación' };
            
            const result = nodeHierarchyMapper.classifyFlowType(link, sourceNode, targetNode);
            expect(result).toBe('transformation');
        });

        test('should classify secondary flow', () => {
            const link = { value: 150, customdata: '150.00 PJ flow data' };
            const sourceNode = { name: 'Transformación' };
            const targetNode = { name: 'Consumo Final' };
            
            const result = nodeHierarchyMapper.classifyFlowType(link, sourceNode, targetNode);
            expect(result).toBe('secondary');
        });

        test('should classify distribution flow for small values', () => {
            const link = { value: 5, customdata: '5.00 PJ flow data' };
            const sourceNode = { name: 'Distribution Hub' };
            const targetNode = { name: 'Local Consumer' };
            
            const result = nodeHierarchyMapper.classifyFlowType(link, sourceNode, targetNode);
            expect(result).toBe('distribution');
        });
    });

    describe('extractFlowValue', () => {
        test('should extract value from customdata', () => {
            const link = { 
                value: 10, 
                customdata: 'Flow: 1500.50 PJ from Source to Target' 
            };
            
            const result = nodeHierarchyMapper.extractFlowValue(link);
            expect(result).toBe(1500.50);
        });

        test('should extract value with comma decimal separator', () => {
            const link = { 
                value: 10, 
                customdata: 'Flow: 1500,75 PJ from Source to Target' 
            };
            
            const result = nodeHierarchyMapper.extractFlowValue(link);
            expect(result).toBe(1500.75);
        });

        test('should fallback to link value when no customdata', () => {
            const link = { value: 250 };
            
            const result = nodeHierarchyMapper.extractFlowValue(link);
            expect(result).toBe(250);
        });

        test('should handle missing values', () => {
            const link = {};
            
            const result = nodeHierarchyMapper.extractFlowValue(link);
            expect(result).toBe(0);
        });
    });

    describe('calculateFlowPriority', () => {
        test('should calculate high priority for large primary flows', () => {
            const flowValue = 2000;
            const link = { source: 0, target: 1 };
            
            // Mock classifyFlowType to return 'primary'
            jest.spyOn(nodeHierarchyMapper, 'classifyFlowType').mockReturnValue('primary');
            
            const result = nodeHierarchyMapper.calculateFlowPriority(flowValue, link);
            expect(result).toBeGreaterThan(0.6);
        });

        test('should calculate lower priority for small distribution flows', () => {
            const flowValue = 10;
            const link = { source: 0, target: 1 };
            
            // Mock classifyFlowType to return 'distribution'
            jest.spyOn(nodeHierarchyMapper, 'classifyFlowType').mockReturnValue('distribution');
            
            const result = nodeHierarchyMapper.calculateFlowPriority(flowValue, link);
            expect(result).toBeLessThan(0.2);
        });
    });

    describe('determineEnergyType', () => {
        test('should determine primary energy type', () => {
            const nodeData = mockDataManager.getNodeData('Producción');
            const result = nodeHierarchyMapper.determineEnergyType(nodeData);
            expect(result).toBe('primary');
        });

        test('should determine secondary energy type', () => {
            const nodeData = mockDataManager.getNodeData('Transformación');
            const result = nodeHierarchyMapper.determineEnergyType(nodeData);
            expect(result).toBe('secondary');
        });

        test('should return unknown for null nodeData', () => {
            const result = nodeHierarchyMapper.determineEnergyType(null);
            expect(result).toBe('unknown');
        });
    });

    describe('isEnergeticPrimary', () => {
        test('should identify primary energetic node', () => {
            const nodeData = mockDataManager.getNodeData('Petróleo crudo');
            const result = nodeHierarchyMapper.isEnergeticPrimary(nodeData);
            expect(result).toBe(true);
        });

        test('should identify parent node with primary children', () => {
            const nodeData = mockDataManager.getNodeData('Producción');
            const result = nodeHierarchyMapper.isEnergeticPrimary(nodeData);
            expect(result).toBe(true);
        });

        test('should return false for secondary energetic', () => {
            const nodeData = mockDataManager.getNodeData('Gasolinas');
            const result = nodeHierarchyMapper.isEnergeticPrimary(nodeData);
            expect(result).toBe(false);
        });
    });

    describe('mapHierarchy', () => {
        test('should map complete hierarchy for simple network', async () => {
            const nodes = [
                { name: 'Producción', x: 0.1, y: 0.5 },
                { name: 'Petróleo crudo', x: 0.3, y: 0.3 },
                { name: 'Transformación', x: 0.5, y: 0.5 },
                { name: 'Gasolinas', x: 0.7, y: 0.7 }
            ];
            
            const links = [
                { source: 0, target: 1, value: 1500 },
                { source: 1, target: 2, value: 1200 },
                { source: 2, target: 3, value: 600 }
            ];
            
            const hierarchy = await nodeHierarchyMapper.mapHierarchy(nodes, links);
            
            expect(hierarchy.size).toBe(4);
            
            // Check first node (Producción)
            const produccionNode = hierarchy.get(0);
            expect(produccionNode.name).toBe('Producción');
            expect(produccionNode.type).toBe('source');
            expect(produccionNode.children).toEqual([1]);
            expect(produccionNode.parents).toEqual([]);
            
            // Check intermediate node (Petróleo crudo)
            const petroleoNode = hierarchy.get(1);
            expect(petroleoNode.name).toBe('Petróleo crudo');
            expect(petroleoNode.parents).toEqual([0]);
            expect(petroleoNode.children).toEqual([2]);
        });

        test('should use cache for repeated calls', async () => {
            const nodes = [{ name: 'Test Node', x: 0.5, y: 0.5 }];
            const links = [];
            
            // First call
            const hierarchy1 = await nodeHierarchyMapper.mapHierarchy(nodes, links);
            
            // Second call should use cache
            const hierarchy2 = await nodeHierarchyMapper.mapHierarchy(nodes, links);
            
            expect(hierarchy1).toBe(hierarchy2);
            expect(nodeHierarchyMapper.hierarchyCache.size).toBe(1);
        });
    });

    describe('analyzeNode', () => {
        test('should analyze node with complete information', () => {
            const node = { name: 'Producción<br>2000.00 PJ', x: 0.1, y: 0.5 };
            const nodes = [node];
            const links = [];
            
            const result = nodeHierarchyMapper.analyzeNode(node, 0, nodes, links);
            
            expect(result.index).toBe(0);
            expect(result.name).toBe('Producción');
            expect(result.type).toBe('source');
            expect(result.position).toEqual({ x: 0.1, y: 0.5 });
            expect(result.dataManagerInfo).toBeDefined();
            expect(result.connectivity).toBeDefined();
        });
    });

    describe('Cache Management', () => {
        test('should clear cache', () => {
            nodeHierarchyMapper.hierarchyCache.set('test', 'value');
            expect(nodeHierarchyMapper.hierarchyCache.size).toBe(1);
            
            nodeHierarchyMapper.clearCache();
            expect(nodeHierarchyMapper.hierarchyCache.size).toBe(0);
        });

        test('should generate consistent cache keys', () => {
            const nodes = [{ name: 'Test', x: 0.5, y: 0.5 }];
            const links = [{ source: 0, target: 1, value: 100 }];
            
            const key1 = nodeHierarchyMapper.generateHierarchyCacheKey(nodes, links);
            const key2 = nodeHierarchyMapper.generateHierarchyCacheKey(nodes, links);
            
            expect(key1).toBe(key2);
            expect(typeof key1).toBe('string');
            expect(key1.length).toBe(32);
        });
    });

    describe('Statistics and Metrics', () => {
        test('should return hierarchy statistics', () => {
            const stats = nodeHierarchyMapper.getHierarchyStats();
            
            expect(stats).toHaveProperty('cacheSize');
            expect(stats).toHaveProperty('nodeTypePatterns');
            expect(stats).toHaveProperty('flowThresholds');
            expect(typeof stats.cacheSize).toBe('number');
        });
    });

    describe('Error Handling', () => {
        test('should handle null DataManager gracefully', () => {
            const mapper = new NodeHierarchyMapper(null);
            const result = mapper.getNodeDataFromDataManager('Test');
            expect(result).toBeNull();
        });

        test('should handle malformed node data', () => {
            const node = { name: null, x: 'invalid', y: undefined };
            const result = nodeHierarchyMapper.extractNodeName(node);
            expect(result).toBe('node_0');
        });

        test('should handle empty arrays', async () => {
            const hierarchy = await nodeHierarchyMapper.mapHierarchy([], []);
            expect(hierarchy.size).toBe(0);
        });
    });
});

// Integration tests with mock Plotly data structure
describe('NodeHierarchyMapper Integration', () => {
    let nodeHierarchyMapper;
    let mockDataManager;

    beforeEach(() => {
        mockDataManager = new MockDataManager();
        nodeHierarchyMapper = new NodeHierarchyMapper(mockDataManager);
    });

    test('should handle realistic Sankey diagram data', async () => {
        // Simulate realistic Sankey data structure
        const nodes = [
            { name: 'Producción<br>2500.00 PJ', x: 0.05, y: 0.4 },
            { name: 'Petróleo crudo<br>1500.00 PJ', x: 0.2, y: 0.3 },
            { name: 'Gas natural<br>800.00 PJ', x: 0.2, y: 0.5 },
            { name: 'Transformación<br>2000.00 PJ', x: 0.5, y: 0.4 },
            { name: 'Gasolinas<br>600.00 PJ', x: 0.7, y: 0.3 },
            { name: 'Electricidad<br>400.00 PJ', x: 0.7, y: 0.5 },
            { name: 'Consumo Final<br>1000.00 PJ', x: 0.9, y: 0.4 }
        ];

        const links = [
            { source: 0, target: 1, value: 15, customdata: 'Flow: 1500.00 PJ', color: '#772F1A' },
            { source: 0, target: 2, value: 8, customdata: 'Flow: 800.00 PJ', color: '#4169E1' },
            { source: 1, target: 3, value: 12, customdata: 'Flow: 1200.00 PJ', color: '#772F1A' },
            { source: 2, target: 3, value: 8, customdata: 'Flow: 800.00 PJ', color: '#4169E1' },
            { source: 3, target: 4, value: 6, customdata: 'Flow: 600.00 PJ', color: '#FF6347' },
            { source: 3, target: 5, value: 4, customdata: 'Flow: 400.00 PJ', color: '#FFD700' },
            { source: 4, target: 6, value: 6, customdata: 'Flow: 600.00 PJ', color: '#FF6347' },
            { source: 5, target: 6, value: 4, customdata: 'Flow: 400.00 PJ', color: '#FFD700' }
        ];

        const hierarchy = await nodeHierarchyMapper.mapHierarchy(nodes, links);

        // Verify hierarchy structure
        expect(hierarchy.size).toBe(7);

        // Check source node
        const sourceNode = hierarchy.get(0);
        expect(sourceNode.type).toBe('source');
        expect(sourceNode.children.length).toBe(2);
        expect(sourceNode.parents.length).toBe(0);

        // Check transformation node
        const transformationNode = hierarchy.get(3);
        expect(transformationNode.type).toBe('transformation');
        expect(transformationNode.children.length).toBe(2);
        expect(transformationNode.parents.length).toBe(2);

        // Check consumption node
        const consumptionNode = hierarchy.get(6);
        expect(consumptionNode.type).toBe('consumption');
        expect(consumptionNode.children.length).toBe(0);
        expect(consumptionNode.parents.length).toBe(2);

        // Verify flow classifications
        const petroleoNode = hierarchy.get(1);
        expect(petroleoNode.outgoingFlows[0].type).toBe('primary');

        const gasolinasNode = hierarchy.get(4);
        expect(gasolinasNode.outgoingFlows[0].type).toBe('secondary');
    });

    test('should handle complex network with multiple paths', async () => {
        const nodes = Array.from({ length: 10 }, (_, i) => ({
            name: `Node ${i}`,
            x: (i % 5) * 0.2,
            y: Math.floor(i / 5) * 0.5 + 0.25
        }));

        const links = [
            { source: 0, target: 1, value: 100 },
            { source: 0, target: 2, value: 80 },
            { source: 1, target: 3, value: 60 },
            { source: 2, target: 3, value: 40 },
            { source: 3, target: 4, value: 90 },
            { source: 1, target: 5, value: 30 },
            { source: 5, target: 6, value: 25 }
        ];

        const hierarchy = await nodeHierarchyMapper.mapHierarchy(nodes, links);

        // Verify complex relationships
        const node3 = hierarchy.get(3);
        expect(node3.parents.length).toBe(2);
        expect(node3.children.length).toBe(1);
        expect(node3.centrality.betweenness).toBeGreaterThan(0);
    });
});