// Native MediaPipe libraries are often IIFEs and not proper ES modules.
// This shim satisfies the build-time requirements of @tensorflow-models/body-segmentation
// while the actual logic is loaded via CDN at runtime.

// We export the class name that the build tool is looking for.
// In the browser, it attaches to window.SelfieSegmentation.
export const SelfieSegmentation = window.SelfieSegmentation || class {
  constructor() {}
  onResults() {}
  send() {}
  close() {}
  setOptions() {}
};

export const VERSION = '0.1.1675465747';
