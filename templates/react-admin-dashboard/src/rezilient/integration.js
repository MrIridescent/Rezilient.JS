// REZILIENT.js integration example
import { useEffect } from 'react';
import { rezilient } from 'rezilient.js';

export function useRezilientIntegration() {
  useEffect(() => {
    // Example: Monitor network resilience
    rezilient.monitor({
      onStatusChange: (status) => {
        console.log('Network status:', status);
      },
    });
    // Example: Use carbon-aware scheduling
    rezilient.schedule({
      task: () => console.log('Scheduled task running!'),
      carbonAware: true,
    });
  }, []);
}

