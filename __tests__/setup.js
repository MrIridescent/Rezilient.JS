// __tests__/setup.js

// Global test setup for Aether.js

// Set test environment
process.env.NODE_ENV = 'test';

// Mock IndexedDB for testing
import 'fake-indexeddb/auto';

// Polyfill for structuredClone (Node.js < 17)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Mock Service Worker APIs
global.self = global;

// Mock Background Sync API
global.registration = {
  sync: {
    register: jest.fn().mockResolvedValue(undefined)
  }
};

// Mock Clients API
global.clients = {
  claim: jest.fn().mockResolvedValue(undefined)
};

// Mock skipWaiting
global.skipWaiting = jest.fn().mockResolvedValue(undefined);

// Mock caches API
global.caches = {
  open: jest.fn().mockResolvedValue({
    match: jest.fn().mockResolvedValue(undefined),
    put: jest.fn().mockResolvedValue(undefined)
  })
};

// Mock fetch for service worker tests
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  clone: jest.fn().mockReturnThis(),
  json: jest.fn().mockResolvedValue({})
});

// Mock URL constructor
global.URL = class URL {
  constructor(url) {
    this.pathname = url.split('?')[0];
    this.search = url.includes('?') ? url.split('?')[1] : '';
  }
};

// Console error suppression for expected errors in tests
const originalError = console.error;
console.error = (...args) => {
  // Suppress specific expected errors
  if (
    args[0] && 
    typeof args[0] === 'string' && 
    args[0].includes('Failed to sync mutation:')
  ) {
    return;
  }
  originalError.apply(console, args);
};

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to create mock mutations
  createMockMutation: (type = 'TEST', payload = {}) => ({
    type,
    payload,
    timestamp: Date.now()
  }),
  
  // Helper to simulate network events
  simulateNetworkEvent: (eventType) => {
    const event = new Event(eventType);
    window.dispatchEvent(event);
  }
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Reset navigator.onLine
  Object.defineProperty(global.navigator, 'onLine', {
    value: true,
    writable: true
  });

  // Reset window object only if it doesn't exist
  // Don't override if a test has explicitly set it to undefined
  if (typeof global.window === 'undefined') {
    global.window = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    };
  }
});
