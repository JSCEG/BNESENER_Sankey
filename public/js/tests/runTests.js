/**
 * Simple test runner for NodeHierarchyMapper
 */

const fs = require('fs');
const path = require('path');

// Mock Jest functions
global.describe = (name, fn) => {
  console.log(`\n=== ${name} ===`);
  try {
    fn();
  } catch (error) {
    console.log(`Error in test suite ${name}: ${error.message}`);
  }
};

global.test = (name, fn) => {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.log(`✗ ${name}: ${error.message}`);
  }
};

global.beforeEach = (fn) => {
  try {
    fn();
  } catch (error) {
    console.log(`Error in beforeEach: ${error.message}`);
  }
};

global.expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
  },
  toEqual: (expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) 
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  },
  toBeDefined: () => {
    if (actual === undefined) throw new Error('Expected value to be defined');
  },
  toBeInstanceOf: (constructor) => {
    if (!(actual instanceof constructor)) throw new Error(`Expected instance of ${constructor.name}`);
  },
  toContain: (item) => {
    if (!actual.includes(item)) throw new Error(`Expected array to contain ${item}`);
  },
  toBeGreaterThan: (value) => {
    if (actual <= value) throw new Error(`Expected ${actual} to be greater than ${value}`);
  },
  toBeLessThan: (value) => {
    if (actual >= value) throw new Error(`Expected ${actual} to be less than ${value}`);
  },
  toBeNull: () => {
    if (actual !== null) throw new Error('Expected value to be null');
  },
  toHaveProperty: (prop) => {
    if (!(prop in actual)) throw new Error(`Expected object to have property ${prop}`);
  }
});

global.jest = {
  spyOn: (obj, method) => ({
    mockReturnValue: (value) => {
      const original = obj[method];
      obj[method] = () => value;
      return {
        mockRestore: () => { obj[method] = original; }
      };
    }
  })
};

try {
  // Load the LinkRoutingManager file
  const linkRoutingPath = path.join(__dirname, '..', 'LinkRoutingManager.js');
  const linkRoutingCode = fs.readFileSync(linkRoutingPath, 'utf8');
  eval(linkRoutingCode);

  // Load and run the tests
  const testPath = path.join(__dirname, 'NodeHierarchyMapper.test.js');
  const testCode = fs.readFileSync(testPath, 'utf8');
  eval(testCode);

  console.log('\n=== Test execution completed ===');
} catch (error) {
  console.error('Error running tests:', error.message);
}