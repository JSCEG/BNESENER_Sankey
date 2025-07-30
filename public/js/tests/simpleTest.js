/**
 * Simple test to verify NodeHierarchyMapper functionality
 */

const fs = require('fs');
const path = require('path');

// Load the LinkRoutingManager file
const linkRoutingPath = path.join(__dirname, '..', 'LinkRoutingManager.js');
const linkRoutingCode = fs.readFileSync(linkRoutingPath, 'utf8');

// Create a simple evaluation context
const context = {
  console: console,
  Map: Map,
  Math: Math,
  Array: Array,
  Object: Object,
  JSON: JSON,
  btoa: (str) => Buffer.from(str).toString('base64'),
  performance: { now: () => Date.now() }
};

// Execute the code in context
const vm = require('vm');
vm.createContext(context);
vm.runInContext(linkRoutingCode, context);

// Mock DataManager
class MockDataManager {
  constructor() {
    this.mockData = {
      'Producción': {
        'Nodo Padre': 'Producción',
        'Nodos Hijo': [
          { 'Nodo Hijo': 'Petróleo crudo', tipo: 'Energía Primaria', color: '#772F1A' }
        ]
      },
      'Petróleo crudo': {
        tipo: 'Energía Primaria',
        color: '#772F1A'
      }
    };
  }

  getNodeData(nodeName) {
    return this.mockData[nodeName] || null;
  }
}

// Test the NodeHierarchyMapper
console.log('Testing NodeHierarchyMapper...');

try {
  const mockDataManager = new MockDataManager();
  const mapper = new context.NodeHierarchyMapper(mockDataManager);
  
  console.log('✓ NodeHierarchyMapper created successfully');
  
  // Test extractNodeName
  const testNode = { name: 'Petróleo crudo<br>1500.00 PJ' };
  const cleanName = mapper.extractNodeName(testNode);
  console.log(`✓ extractNodeName: "${cleanName}" (expected: "Petróleo crudo")`);
  
  // Test getNodeDataFromDataManager
  const nodeData = mapper.getNodeDataFromDataManager('Producción');
  console.log(`✓ getNodeDataFromDataManager: ${nodeData ? 'found data' : 'no data'}`);
  
  // Test detectNodeType
  const sourceNode = { name: 'Producción', x: 0.1 };
  const nodeType = mapper.detectNodeType(sourceNode, [], nodeData);
  console.log(`✓ detectNodeType: "${nodeType}" (expected: "source")`);
  
  // Test classifyFlowType
  const link = { value: 1500, customdata: '1500.00 PJ flow data' };
  const sourceTestNode = { name: 'Producción' };
  const targetTestNode = { name: 'Petróleo crudo' };
  const flowType = mapper.classifyFlowType(link, sourceTestNode, targetTestNode);
  console.log(`✓ classifyFlowType: "${flowType}" (expected: "primary")`);
  
  // Test extractFlowValue
  const flowValue = mapper.extractFlowValue(link);
  console.log(`✓ extractFlowValue: ${flowValue} (expected: 1500)`);
  
  // Test mapHierarchy with simple data
  const nodes = [
    { name: 'Producción', x: 0.1, y: 0.5 },
    { name: 'Petróleo crudo', x: 0.3, y: 0.3 }
  ];
  
  const links = [
    { source: 0, target: 1, value: 1500, customdata: '1500.00 PJ' }
  ];
  
  mapper.mapHierarchy(nodes, links).then(hierarchy => {
    console.log(`✓ mapHierarchy: Created hierarchy with ${hierarchy.size} nodes`);
    
    const firstNode = hierarchy.get(0);
    console.log(`✓ First node analysis: name="${firstNode.name}", type="${firstNode.type}"`);
    
    console.log('\n=== All tests completed successfully! ===');
  }).catch(error => {
    console.error('✗ mapHierarchy failed:', error.message);
  });
  
} catch (error) {
  console.error('✗ Test failed:', error.message);
  console.error(error.stack);
}