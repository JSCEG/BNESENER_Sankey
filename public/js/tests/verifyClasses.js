/**
 * Verify that classes are properly defined in LinkRoutingManager.js
 */

const fs = require('fs');
const path = require('path');

// Read the file
const linkRoutingPath = path.join(__dirname, '..', 'LinkRoutingManager.js');
const code = fs.readFileSync(linkRoutingPath, 'utf8');

// Check for class definitions
const classes = ['LinkRoutingManager', 'NodeHierarchyMapper', 'RouteCalculator'];

console.log('Checking class definitions in LinkRoutingManager.js...\n');

classes.forEach(className => {
  const classRegex = new RegExp(`class\\s+${className}\\s*{`, 'g');
  const matches = code.match(classRegex);
  
  if (matches) {
    console.log(`✓ ${className} class found (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`);
  } else {
    console.log(`✗ ${className} class NOT found`);
  }
});

// Check for proper class closing
console.log('\nChecking class structure...');

// Count opening and closing braces to verify structure
const openBraces = (code.match(/{/g) || []).length;
const closeBraces = (code.match(/}/g) || []).length;

console.log(`Opening braces: ${openBraces}`);
console.log(`Closing braces: ${closeBraces}`);

if (openBraces === closeBraces) {
  console.log('✓ Braces are balanced');
} else {
  console.log('✗ Braces are NOT balanced - syntax error likely');
}

// Try to evaluate the code
console.log('\nTesting code evaluation...');

try {
  // Create minimal context
  const context = {
    console: { log: () => {}, warn: () => {}, error: () => {} },
    Map: Map,
    Math: Math,
    performance: { now: () => Date.now() },
    btoa: (str) => Buffer.from(str).toString('base64')
  };
  
  const vm = require('vm');
  vm.createContext(context);
  vm.runInContext(code, context);
  
  console.log('✓ Code evaluated successfully');
  
  // Check if classes are available
  if (typeof context.LinkRoutingManager === 'function') {
    console.log('✓ LinkRoutingManager is available as constructor');
  } else {
    console.log('✗ LinkRoutingManager is not available');
  }
  
  if (typeof context.NodeHierarchyMapper === 'function') {
    console.log('✓ NodeHierarchyMapper is available as constructor');
  } else {
    console.log('✗ NodeHierarchyMapper is not available');
  }
  
} catch (error) {
  console.log('✗ Code evaluation failed:', error.message);
  
  // Try to find the line where the error occurs
  const lines = code.split('\n');
  if (error.stack) {
    const lineMatch = error.stack.match(/:(\d+):/);
    if (lineMatch) {
      const lineNum = parseInt(lineMatch[1]);
      console.log(`Error near line ${lineNum}: ${lines[lineNum - 1]}`);
    }
  }
}