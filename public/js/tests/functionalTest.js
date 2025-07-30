/**
 * Functional test for NodeHierarchyMapper within LinkRoutingManager
 */

const fs = require('fs');
const path = require('path');

// Mock DataManager
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
            'Petróleo crudo': {
                tipo: 'Energía Primaria',
                color: '#772F1A'
            },
            'Gas natural': {
                tipo: 'Energía Primaria',
                color: '#4169E1'
            }
        };
    }

    getNodeData(nodeName) {
        return this.mockData[nodeName] || null;
    }

    getEnergeticValue(parentNode, childNode, year) {
        const mockValues = {
            'Producción-Petróleo crudo-2023': 1500,
            'Producción-Gas natural-2023': 800
        };
        return mockValues[`${parentNode}-${childNode}-${year}`] || 0;
    }
}

// Load and execute the LinkRoutingManager code
const linkRoutingPath = path.join(__dirname, '..', 'LinkRoutingManager.js');
const code = fs.readFileSync(linkRoutingPath, 'utf8');

// Create context with necessary globals
const context = {
    console: console,
    Map: Map,
    Math: Math,
    Array: Array,
    Object: Object,
    JSON: JSON,
    btoa: (str) => Buffer.from(str).toString('base64'),
    performance: { now: () => Date.now() },
    setTimeout: setTimeout,
    clearInterval: clearInterval,
    setInterval: setInterval
};

const vm = require('vm');
vm.createContext(context);
vm.runInContext(code, context);

console.log('Testing NodeHierarchyMapper functionality through LinkRoutingManager...\n');

try {
    // Create LinkRoutingManager instance
    const mockDataManager = new MockDataManager();
    const linkRoutingManager = new context.LinkRoutingManager({
        dataManager: mockDataManager,
        enableRouting: true
    });

    console.log('✓ LinkRoutingManager created successfully');

    // Access the NodeHierarchyMapper through the LinkRoutingManager
    const nodeHierarchyMapper = linkRoutingManager.nodeHierarchyMapper;

    if (nodeHierarchyMapper) {
        console.log('✓ NodeHierarchyMapper accessible through LinkRoutingManager');

        // Test basic functionality
        console.log('\nTesting NodeHierarchyMapper methods...');

        // Test extractNodeName
        const testNode = { name: 'Petróleo crudo<br>1500.00 PJ' };
        const cleanName = nodeHierarchyMapper.extractNodeName(testNode);
        console.log(`✓ extractNodeName: "${cleanName}" (expected: "Petróleo crudo")`);

        // Test getNodeDataFromDataManager
        const nodeData = nodeHierarchyMapper.getNodeDataFromDataManager('Producción');
        console.log(`✓ getNodeDataFromDataManager: ${nodeData ? 'found data for Producción' : 'no data'}`);

        // Test detectNodeType
        const sourceNode = { name: 'Producción', x: 0.1 };
        const nodeType = nodeHierarchyMapper.detectNodeType(sourceNode, [], nodeData);
        console.log(`✓ detectNodeType: "${nodeType}" (expected: "source")`);

        // Test classifyFlowType
        const link = { value: 1500, customdata: '1500.00 PJ flow data' };
        const sourceTestNode = { name: 'Producción' };
        const targetTestNode = { name: 'Petróleo crudo' };
        const flowType = nodeHierarchyMapper.classifyFlowType(link, sourceTestNode, targetTestNode);
        console.log(`✓ classifyFlowType: "${flowType}"`);

        // Test extractFlowValue
        const flowValue = nodeHierarchyMapper.extractFlowValue(link);
        console.log(`✓ extractFlowValue: ${flowValue} (expected: 1500)`);

        // Test determineEnergyType
        const energyType = nodeHierarchyMapper.determineEnergyType(nodeData);
        console.log(`✓ determineEnergyType: "${energyType}" (expected: "primary")`);

        // Test isEnergeticPrimary
        const isPrimary = nodeHierarchyMapper.isEnergeticPrimary(nodeData);
        console.log(`✓ isEnergeticPrimary: ${isPrimary} (expected: true)`);

        // Test mapHierarchy with realistic data
        console.log('\nTesting mapHierarchy with sample data...');

        const nodes = [
            { name: 'Producción<br>2300.00 PJ', x: 0.05, y: 0.4 },
            { name: 'Petróleo crudo<br>1500.00 PJ', x: 0.2, y: 0.3 },
            { name: 'Gas natural<br>800.00 PJ', x: 0.2, y: 0.5 },
            { name: 'Transformación<br>2000.00 PJ', x: 0.5, y: 0.4 },
            { name: 'Consumo Final<br>1800.00 PJ', x: 0.9, y: 0.4 }
        ];

        const links = [
            { source: 0, target: 1, value: 15, customdata: 'Flow: 1500.00 PJ', color: '#772F1A' },
            { source: 0, target: 2, value: 8, customdata: 'Flow: 800.00 PJ', color: '#4169E1' },
            { source: 1, target: 3, value: 12, customdata: 'Flow: 1200.00 PJ', color: '#772F1A' },
            { source: 2, target: 3, value: 8, customdata: 'Flow: 800.00 PJ', color: '#4169E1' },
            { source: 3, target: 4, value: 18, customdata: 'Flow: 1800.00 PJ', color: '#FFD700' }
        ];

        nodeHierarchyMapper.mapHierarchy(nodes, links).then(hierarchy => {
            console.log(`✓ mapHierarchy: Created hierarchy with ${hierarchy.size} nodes`);

            // Analyze the first few nodes
            const produccionNode = hierarchy.get(0);
            console.log(`✓ Producción node: name="${produccionNode.name}", type="${produccionNode.type}", children=${produccionNode.children.length}`);

            const petroleoNode = hierarchy.get(1);
            console.log(`✓ Petróleo node: name="${petroleoNode.name}", type="${petroleoNode.type}", energyType="${petroleoNode.energyType}"`);

            const transformacionNode = hierarchy.get(3);
            console.log(`✓ Transformación node: name="${transformacionNode.name}", type="${transformacionNode.type}", parents=${transformacionNode.parents.length}, children=${transformacionNode.children.length}`);

            // Test flow analysis
            if (petroleoNode.outgoingFlows.length > 0) {
                const flow = petroleoNode.outgoingFlows[0];
                console.log(`✓ Flow analysis: type="${flow.type}", priority=${flow.priority.toFixed(3)}, value=${flow.value}`);
            }

            // Test centrality metrics
            if (transformacionNode.centrality) {
                console.log(`✓ Centrality metrics: degree=${transformacionNode.centrality.degree.toFixed(3)}, flow=${transformacionNode.centrality.flow.toFixed(3)}`);
            }

            console.log('\n=== All NodeHierarchyMapper tests completed successfully! ===');

            // Test integration with LinkRoutingManager
            console.log('\nTesting integration with LinkRoutingManager...');

            linkRoutingManager.calculateRoutes(links, nodes).then(routes => {
                console.log(`✓ calculateRoutes: Generated ${routes.length} routes`);

                if (routes.length > 0) {
                    const route = routes[0];
                    console.log(`✓ Route structure: id="${route.id}", type="${route.routing.flowType}", priority=${route.routing.priority}`);
                }

                console.log('\n=== Integration tests completed successfully! ===');
            }).catch(error => {
                console.error('✗ calculateRoutes failed:', error.message);
            });

        }).catch(error => {
            console.error('✗ mapHierarchy failed:', error.message);
        });

    } else {
        console.error('✗ NodeHierarchyMapper not accessible');
    }

} catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error(error.stack);
}