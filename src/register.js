// src/register.js

/**
 * Registers the Aether.js Service Worker Kernel.
 * This function should be called once in the application's entry point.
 * @param {string} kernelPath - The path to the service worker kernel file.
 * Defaults to '/kernel.js'.
 */
export async function registerAetherKernel(kernelPath = '/kernel.js') {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(kernelPath);
      console.log('Aether.js Kernel registered with scope:', registration.scope);

      // Check for background sync capabilities
      if ('sync' in registration) {
        // Request a background sync registration.
        // This allows the browser to run our sync process
        // even if the user navigates away or closes the tab.
        await registration.sync.register('aether-sync');
        console.log('Aether.js background sync registered.');
      }
    } catch (error) {
      console.error('Aether.js Kernel registration failed:', error);
    }
  } else {
    console.warn('Service Workers are not supported in this browser. Aether.js resilience features will be limited.');
  }
}
