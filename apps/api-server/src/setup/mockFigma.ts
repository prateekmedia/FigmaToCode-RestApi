// Set up figma global before any other imports
(globalThis as any).figma = {
  ui: {
    postMessage: () => {}, // No-op for API mode
  },
  currentPage: {
    selection: [],
  },
  clientStorage: {
    getAsync: () => Promise.resolve({}),
    setAsync: () => Promise.resolve(),
  },
  getSelectionColors: () => [], // Return empty colors array for API mode
  getLocalVariables: () => [], // Return empty variables array for API mode
};

// Also make it available as global for compatibility
if (typeof (globalThis as any).global !== 'undefined') {
  (globalThis as any).global.figma = (globalThis as any).figma;
}